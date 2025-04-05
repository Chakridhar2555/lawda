import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function PUT(
  request: Request,
  { params }: { params: { leadId: string } }
) {
  try {
    const { db } = await connectToDatabase()
    const { tasks } = await request.json()

    const result = await db.collection("leads").findOneAndUpdate(
      { _id: new ObjectId(params.leadId) },
      { $set: { tasks } },
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
    console.error("Update tasks error:", error)
    return NextResponse.json(
      { error: "Failed to update tasks" },
      { status: 500 }
    )
  }
} 