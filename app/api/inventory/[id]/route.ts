import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase()
    const { id } = params

    // Validate ID
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid item ID" },
        { status: 400 }
      )
    }

    // Check if item exists
    const item = await db.collection("inventory").findOne({
      _id: new ObjectId(id),
    })

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      )
    }

    // Delete the item
    const result = await db.collection("inventory").deleteOne({
      _id: new ObjectId(id),
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Failed to delete item" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting inventory item:", error)
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase()
    const { id } = params

    // Validate ID
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid item ID" },
        { status: 400 }
      )
    }

    // Get the item
    const item = await db.collection("inventory").findOne({
      _id: new ObjectId(id),
    })

    if (!item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error("Error fetching inventory item:", error)
    return NextResponse.json(
      { error: "Failed to fetch inventory item" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase()
    const { id } = params
    const updates = await request.json()

    const result = await db.collection("inventory").updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating inventory item:", error)
    return NextResponse.json(
      { error: "Failed to update inventory item" },
      { status: 500 }
    )
  }
} 