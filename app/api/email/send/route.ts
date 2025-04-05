import { NextResponse } from "next/server";
import { emailService } from "@/lib/email-service";

export async function POST(request: Request) {
  try {
    const { to, subject, text, html, cc, bcc } = await request.json();

    if (!to || !subject || !text) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await emailService.sendEmail(
      Array.isArray(to) ? to : [to],
      subject,
      text,
      html,
      cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
      bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
} 