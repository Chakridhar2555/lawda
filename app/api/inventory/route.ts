import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Get all inventory items
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const sort = searchParams.get('sort') || 'createdAt'
    const order = searchParams.get('order') || 'desc'

    const { db } = await connectToDatabase()
    const query = search
      ? {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ]
        }
      : {}

    const total = await db.collection('inventory').countDocuments(query)
    const items = await db.collection('inventory')
      .find(query)
      .sort({ [sort]: order === 'desc' ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()

    return NextResponse.json({
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}

// Create a new inventory item
export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase()
    const item = await request.json()

    const result = await db.collection('inventory').insertOne({
      ...item,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    return NextResponse.json({ id: result.insertedId })
  } catch (error) {
    console.error('Error creating inventory item:', error)
    return NextResponse.json(
      { error: 'Failed to create inventory item' },
      { status: 500 }
    )
  }
}

// Update an inventory item
export async function PUT(request: Request) {
  try {
    const { db } = await connectToDatabase()
    const data = await request.json()
    const { id, ...updateData } = data

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid item ID" },
        { status: 400 }
      )
    }

    // Add timestamps
    const now = new Date().toISOString()
    updateData.updatedAt = now
    updateData.lastUpdated = now

    const result = await db.collection("inventory").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      )
    }

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "No changes were made to the item" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Item updated successfully"
    })
  } catch (error) {
    console.error("Error updating inventory item:", error)
    return NextResponse.json(
      { error: "Failed to update inventory item" },
      { status: 500 }
    )
  }
} 