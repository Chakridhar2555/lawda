import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/mongodb";
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    // Get the current user from cookies
    const cookieStore = cookies();
    const userCookie = cookieStore.get('user');
    
    if (!userCookie) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }
    
    const user = JSON.parse(userCookie.value);
    const userId = user._id || user.id;
    
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }
    
    // Connect to database and fetch the user profile
    const { db } = await connectToDatabase();
    
    // Query for the user - handle both ObjectId and string ID formats
    let userDoc;
    try {
      userDoc = await db.collection("users").findOne(
        { _id: new ObjectId(userId) },
        { projection: { password: 0 } } // Exclude password from the result
      );
    } catch (error) {
      // If ObjectId conversion fails, try searching by string id
      userDoc = await db.collection("users").findOne(
        { id: userId },
        { projection: { password: 0 } }
      );
    }
    
    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json(userDoc);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    // Get the current user from cookies
    const cookieStore = cookies();
    const userCookie = cookieStore.get('user');
    
    if (!userCookie) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }
    
    const user = JSON.parse(userCookie.value);
    const userId = user._id || user.id;
    
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }
    
    // Get the updated profile data from request
    const { name, username, phone } = await request.json();
    
    // Basic validation
    if (!name || !username) {
      return NextResponse.json(
        { error: "Name and username are required" },
        { status: 400 }
      );
    }
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // If username changed, check if it already exists
    if (username !== user.username) {
      const existingUser = await db.collection("users").findOne({
        username: { $regex: new RegExp(`^${username}$`, 'i') },
        _id: { $ne: new ObjectId(userId) }
      });
      
      if (existingUser) {
        return NextResponse.json(
          { error: "Username already exists" },
          { status: 400 }
        );
      }
    }
    
    // Prepare update data
    const updateData = {
      name,
      username,
      phone,
      updatedAt: new Date().toISOString()
    };
    
    // Update the user in database
    let result;
    try {
      result = await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        { $set: updateData }
      );
    } catch (error) {
      // If ObjectId conversion fails, try updating by string id
      result = await db.collection("users").updateOne(
        { id: userId },
        { $set: updateData }
      );
    }
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Update the user cookie with new information
    const updatedUser = {
      ...user,
      name,
      username,
      phone
    };
    
    cookieStore.set('user', JSON.stringify(updatedUser), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });
    
    return NextResponse.json({ 
      success: true,
      message: "Profile updated successfully"
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
} 