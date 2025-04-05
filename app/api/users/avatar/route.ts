import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/mongodb";
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';

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
    
    // Get the avatar URL from request
    const { avatarUrl } = await request.json();
    
    if (!avatarUrl) {
      return NextResponse.json(
        { error: "Avatar URL is required" },
        { status: 400 }
      );
    }
    
    // Connect to database
    const { db } = await connectToDatabase();
    
    // Update the user's avatar in database
    let result;
    try {
      result = await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        { $set: { 
          avatar: avatarUrl,
          updatedAt: new Date().toISOString()
        } }
      );
    } catch (error) {
      // If ObjectId conversion fails, try updating by string id
      result = await db.collection("users").updateOne(
        { id: userId },
        { $set: { 
          avatar: avatarUrl,
          updatedAt: new Date().toISOString()
        } }
      );
    }
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Update the user cookie with new avatar
    const updatedUser = {
      ...user,
      avatar: avatarUrl
    };
    
    cookieStore.set('user', JSON.stringify(updatedUser), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });
    
    return NextResponse.json({ 
      success: true,
      message: "Avatar updated successfully",
      avatar: avatarUrl
    });
  } catch (error) {
    console.error("Error updating user avatar:", error);
    return NextResponse.json(
      { error: "Failed to update avatar" },
      { status: 500 }
    );
  }
} 