import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Get notifications for a specific user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    const notifications = await db.collection("notifications")
      .find({
        userId: userId,
        read: false
      })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json(notifications)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}

// Create a new notification
export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase()
    const data = await request.json()

    // If sending to all users with role "User"
    if (data.sendToAllUsers) {
      // Find all users with role "User"
      const users = await db.collection("users")
        .find({ role: { $ne: "Administrator" } })
        .toArray()

      // Create notifications for each user
      const notifications = users.map(user => ({
        userId: user._id.toString(),
        message: data.message,
        type: data.type || "info",
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))

      if (notifications.length > 0) {
        await db.collection("notifications").insertMany(notifications)
      }

      return NextResponse.json({
        success: true,
        message: `Notification sent to ${users.length} users`
      })
    }

    // If sending to specific user
    if (data.userId) {
      const notification = {
        userId: data.userId,
        message: data.message,
        type: data.type || "info",
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await db.collection("notifications").insertOne(notification)

      return NextResponse.json({
        success: true,
        message: "Notification sent successfully"
      })
    }

    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    )
  }
}

// Mark notification as read
export async function PUT(request: Request) {
  try {
    const { db } = await connectToDatabase()
    const data = await request.json()

    if (!data.notificationId) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      )
    }

    await db.collection("notifications").updateOne(
      { _id: new ObjectId(data.notificationId) },
      {
        $set: {
          read: true,
          updatedAt: new Date().toISOString()
        }
      }
    )

    return NextResponse.json({
      success: true,
      message: "Notification marked as read"
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    )
  }
} 