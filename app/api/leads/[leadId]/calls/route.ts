import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: Request, { params }: { params: { leadId: string } }) {
  try {
    const { db } = await connectToDatabase()
    const lead = await db.collection("leads").findOne({ 
      _id: new ObjectId(params.leadId)
    })

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(lead.calls || [])
  } catch (error) {
    console.error("Fetch calls error:", error)
    return NextResponse.json(
      { error: "Failed to fetch calls" },
      { status: 500 }
    )
  }
}

