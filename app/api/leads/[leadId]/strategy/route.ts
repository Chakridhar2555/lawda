// This file can be deleted as we're consolidating tasks into the new system

import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: Request, { params }: { params: { leadId: string } }) {
  try {
    const { db } = await connectToDatabase()
    const updates = await request.json()

    const result = await db.collection("leads").findOneAndUpdate(
      { _id: new ObjectId(params.leadId) },
      { $set: updates },
      { returnDocument: 'after' }
    )

    if (!result?.value) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(result.value)
  } catch (error) {
    console.error("Update strategy error:", error)
    return NextResponse.json(
      { error: "Failed to update strategy" },
      { status: 500 }
    )
  }
}

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

    return NextResponse.json(lead)
  } catch (error) {
    console.error("Fetch strategy error:", error)
    return NextResponse.json(
      { error: "Failed to fetch strategy" },
      { status: 500 }
    )
  }
}

