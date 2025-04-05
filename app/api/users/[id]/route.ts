import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const { id } = params;

    const user = await db.collection('users')
      .findOne(
        { _id: new ObjectId(id) },
        { projection: { password: 0 } }
      );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const { id } = params;
    const updates = await request.json();

    // If email is being updated, check if it already exists
    if (updates.email) {
      const existingUser = await db.collection('users').findOne({
        email: updates.email,
        _id: { $ne: new ObjectId(id) }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    // If password is being updated, hash it
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const { id } = params;
    const updates = await request.json();

    // If role is being updated to Administrator, set all permissions to true
    if (updates.role === "Administrator" || updates.role === "admin") {
      updates.role = "Administrator";
      updates.permissions = {
        dashboard: true,
        leads: true,
        calendar: true,
        email: true,
        settings: true,
        inventory: true,
        favorites: true,
        mls: true
      };
    }

    // If permissions are being updated, ensure all fields are present
    if (updates.permissions) {
      const currentUser = await db.collection("users").findOne({
        _id: new ObjectId(id)
      });

      if (!currentUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Merge existing permissions with updates
      updates.permissions = {
        ...currentUser.permissions,
        ...updates.permissions,
        // Explicitly handle MLS permission
        mls: updates.permissions.mls ?? currentUser.permissions?.mls ?? false
      };

      // If user is Administrator, ensure all permissions are true
      if (updates.role === "Administrator" || currentUser.role === "Administrator") {
        Object.keys(updates.permissions).forEach(key => {
          updates.permissions[key] = true;
        });
      }
    }

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { db } = await connectToDatabase();
    const { id } = params;

    // Validate id
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.collection("users").findOne({
      _id: new ObjectId(id),
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Delete the user
    const result = await db.collection("users").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Failed to delete user" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
} 