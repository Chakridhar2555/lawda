import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Get the 'To' parameter from the request URL
    const url = new URL(request.url)
    const to = url.searchParams.get('To')

    if (!to) {
      throw new Error('No "To" number provided')
    }

    const twiml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say>Hello, would you like to know more about this property? Please wait while we connect you with our agent.</Say>
        <Dial callerId="${process.env.TWILIO_PHONE_NUMBER}" record="record-from-answer">
          ${to}
        </Dial>
      </Response>
    `

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    console.error("TwiML error:", error)
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
       <Response>
         <Say>An error occurred while processing your call.</Say>
       </Response>`,
      {
        headers: {
          "Content-Type": "text/xml",
        },
        status: 500,
      }
    )
  }
} 