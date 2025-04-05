import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import bcrypt from 'bcryptjs';

const defaultPermissions = {
  dashboard: false,
  leads: false,
  calendar: false,
  email: false,
  settings: false,
  inventory: false,
  favorites: false,
  mls: false
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const { db } = await connectToDatabase();
    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const total = await db.collection('users').countDocuments(query);
    const users = await db.collection('users')
      .find(query)
      .project({ password: 0 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const { name, email, password, role = 'user' } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await db.collection('users').insertOne({
      name,
      email,
      password: hashedPassword,
      role,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({
      id: result.insertedId,
      name,
      email,
      role
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const { id, ...updateData } = await request.json();

    // Validate user exists
    const existingUser = await db.collection("users").findOne({
      _id: new ObjectId(id)
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // If password is provided, hash it
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    } else {
      // Remove password field if not provided to keep existing password
      delete updateData.password;
    }

    // Update timestamp
    updateData.updatedAt = new Date().toISOString();

    // Handle role changes and permissions
    if (updateData.role) {
      // Normalize role to proper case
      updateData.role = updateData.role.toLowerCase();
      console.log("Role update requested:", { newRole: updateData.role });
      
      if (updateData.role === "admin" || updateData.role === "administrator") {
        updateData.role = "Administrator";
        // Set admin permissions - always full permissions for admin
        updateData.permissions = {
          dashboard: true,
          leads: true,
          calendar: true,
          email: true,
          settings: true,
          inventory: true,
          favorites: true,
          mls: true
        };
        console.log("Updated to admin role:", { role: updateData.role, permissions: updateData.permissions });
      } else {
        updateData.role = updateData.role.charAt(0).toUpperCase() + updateData.role.slice(1); // Capitalize first letter
        // Keep existing permissions if not explicitly provided in update
        if (updateData.permissions) {
          updateData.permissions = {
            dashboard: updateData.permissions.dashboard ?? existingUser.permissions?.dashboard ?? defaultPermissions.dashboard,
            leads: updateData.permissions.leads ?? existingUser.permissions?.leads ?? defaultPermissions.leads,
            calendar: updateData.permissions.calendar ?? existingUser.permissions?.calendar ?? defaultPermissions.calendar,
            email: updateData.permissions.email ?? existingUser.permissions?.email ?? defaultPermissions.email,
            settings: updateData.permissions.settings ?? existingUser.permissions?.settings ?? defaultPermissions.settings,
            inventory: updateData.permissions.inventory ?? existingUser.permissions?.inventory ?? defaultPermissions.inventory,
            favorites: updateData.permissions.favorites ?? existingUser.permissions?.favorites ?? defaultPermissions.favorites,
            mls: updateData.permissions.mls ?? existingUser.permissions?.mls ?? defaultPermissions.mls
          };
        }
      }
    } else if (updateData.permissions) {
      // Handle permission updates without role change
      updateData.permissions = {
        dashboard: updateData.permissions.dashboard ?? existingUser.permissions?.dashboard ?? defaultPermissions.dashboard,
        leads: updateData.permissions.leads ?? existingUser.permissions?.leads ?? defaultPermissions.leads,
        calendar: updateData.permissions.calendar ?? existingUser.permissions?.calendar ?? defaultPermissions.calendar,
        email: updateData.permissions.email ?? existingUser.permissions?.email ?? defaultPermissions.email,
        settings: updateData.permissions.settings ?? existingUser.permissions?.settings ?? defaultPermissions.settings,
        inventory: updateData.permissions.inventory ?? existingUser.permissions?.inventory ?? defaultPermissions.inventory,
        favorites: updateData.permissions.favorites ?? existingUser.permissions?.favorites ?? defaultPermissions.favorites,
        mls: updateData.permissions.mls ?? existingUser.permissions?.mls ?? defaultPermissions.mls
      };
    }

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }

    // Return updated user without password
    const updatedUser = await db.collection("users").findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0 } }
    );

    return NextResponse.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
} 