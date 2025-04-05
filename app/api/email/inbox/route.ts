import { NextResponse } from "next/server";
import { emailService } from "@/lib/email-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const emails = await emailService.getLatestEmails(limit);
    
    return NextResponse.json(emails);
  } catch (error) {
    console.error("Fetch emails error:", error);
    return NextResponse.json(
      { error: "Failed to fetch emails" },
      { status: 500 }
    );
  }
} 