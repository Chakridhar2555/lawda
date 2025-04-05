import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import type { Lead } from "@/lib/types"

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase()
    const { leads } = await request.json()

    // Insert all leads into MongoDB
    const result = await db.collection("leads").insertMany(leads)

    return NextResponse.json({ 
      success: true, 
      insertedCount: result.insertedCount,
      insertedIds: result.insertedIds 
    })
  } catch (error) {
    console.error("Bulk import error:", error)
    return NextResponse.json(
      { error: "Failed to import leads" }, 
      { status: 500 }
    )
  }
} 