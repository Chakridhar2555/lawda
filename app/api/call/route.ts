import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import twilio from "twilio"

interface CallRecord {
  date: Date
  duration: number
  recording: null
  twilioCallSid: string
  status: string
}

interface Lead {
  _id: ObjectId
  callHistory: CallRecord[]
  // ... other lead fields
}

export async function POST(request: Request) {
  try {
    // Initialize Twilio client inside the route handler
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )

    const { leadId, phoneNumber } = await request.json()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

    if (!baseUrl) {
      throw new Error("NEXT_PUBLIC_APP_URL is not configured")
    }

    if (!twilioPhoneNumber) {
      throw new Error("TWILIO_PHONE_NUMBER is not configured")
    }

    // Format the phone number to E.164 format
    const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '') // Remove everything except digits and +
    let e164Number = ''

    // Handle different phone number formats
    if (cleanNumber.startsWith('+')) {
      // Already in E.164 format (+1XXXXXXXXXX or +91XXXXXXXXXX)
      e164Number = cleanNumber
    } else if (cleanNumber.startsWith('91') && cleanNumber.length === 12) {
      // Format: 91XXXXXXXXXX
      e164Number = '+' + cleanNumber
    } else if (cleanNumber.length === 10) {
      // Add +91 prefix to 10-digit number
      e164Number = '+91' + cleanNumber
    } else {
      console.error('Invalid phone number format:', {
        original: phoneNumber,
        cleaned: cleanNumber,
        length: cleanNumber.length
      })
      throw new Error('Invalid phone number format. Please check the number and try again.')
    }

    console.log('Formatted number:', {
      original: phoneNumber,
      cleaned: cleanNumber,
      e164: e164Number
    })

    console.log('Initiating call with:', {
      to: e164Number,
      from: twilioPhoneNumber,
      baseUrl
    })

    try {
      // Make the call using Twilio with direct TwiML
      const call = await client.calls.create({
        twiml: `<?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Say>Hello, would you like to know more about this property? Please wait while we connect you with our agent.</Say>
            <Dial callerId="${twilioPhoneNumber}" record="record-from-answer">${e164Number}</Dial>
          </Response>`,
        to: e164Number,
        from: twilioPhoneNumber,
        record: true,
        statusCallback: `${baseUrl}/api/twilio/webhook`,
        statusCallbackEvent: ['completed'],
        statusCallbackMethod: 'POST'
      })

      console.log('Call initiated:', call.sid)

      // Create call record
      const callRecord: CallRecord = {
        date: new Date(),
        duration: 0,
        recording: null,
        twilioCallSid: call.sid,
        status: 'initiated'
      }

      // Save call record to database
      const { db } = await connectToDatabase()
      const result = await db.collection<Lead>("leads").findOneAndUpdate(
        { _id: new ObjectId(leadId) },
        { $push: { callHistory: callRecord } },
        { returnDocument: "after" }
      )

      if (!result) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 })
      }

      return NextResponse.json({ success: true, call, lead: result })

    } catch (twilioError: any) {
      console.error('Twilio error:', {
        code: twilioError.code,
        message: twilioError.message,
        details: twilioError.details
      })

      if (twilioError.code === 21219) {
        return NextResponse.json({ 
          error: "This number needs to be verified in your Twilio account first.",
          code: "UNVERIFIED_NUMBER"
        }, { status: 400 })
      }

      return NextResponse.json({ 
        error: "Twilio error", 
        details: twilioError.message,
        code: twilioError.code
      }, { status: 400 })
    }

  } catch (error) {
    console.error("Call error:", error)
    return NextResponse.json({ 
      error: "Failed to initiate call", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

