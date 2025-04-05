import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase()
    const { id } = params
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    const inventory = await db.collection("inventory").findOne({ _id: new ObjectId(id) })
    if (!inventory) {
      return NextResponse.json(
        { error: "Inventory item not found" },
        { status: 404 }
      )
    }

    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) })
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const favorites = user.favorites || []
    const isFavorite = favorites.some((favId: ObjectId) => favId.toString() === id)

    if (isFavorite) {
      await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        { $pull: { favorites: new ObjectId(id) } as any }
      )
    } else {
      await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        { $push: { favorites: new ObjectId(id) } as any }
      )
    }

    return NextResponse.json({ success: true, isFavorite: !isFavorite })
  } catch (error) {
    console.error("Error updating favorite status:", error)
    return NextResponse.json(
      { error: "Failed to update favorite status" },
      { status: 500 }
    )
  }
} 