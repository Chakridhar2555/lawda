import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const callSid = formData.get("CallSid")
    const callStatus = formData.get("CallStatus")
    const duration = formData.get("CallDuration")
    const recordingUrl = formData.get("RecordingUrl")

    const { db } = await connectToDatabase()
    
    // Update the call record with duration and recording URL
    await db.collection("leads").updateOne(
      { "callHistory.twilioCallSid": callSid },
      {
        $set: {
          "callHistory.$.duration": parseInt(duration as string) || 0,
          "callHistory.$.recording": recordingUrl,
          "callHistory.$.status": callStatus,
        }
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
} 