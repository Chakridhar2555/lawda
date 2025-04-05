import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import { cookies } from 'next/headers'

// For demo purposes, we'll use a simple credential check
const VALID_CREDENTIALS = {
  email: "admin@gmail.com",
  password: "admin123",
  name: "Admin User",
  role: "Administrator", // Exact match for Administrator role
  permissions: {
    dashboard: true,
    leads: true,
    calendar: true,
    email: true,
    settings: true,
    inventory: true,
    favorites: true,
    mls: true
  },
  id: "1",
  status: "active"
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    
    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    console.log("Login attempt for:", email) // Debug log

    // Check for hardcoded admin credentials first
    if (email === VALID_CREDENTIALS.email && password === VALID_CREDENTIALS.password) {
      console.log("Using hardcoded admin credentials") // Debug log
      
      // Set cookie with user data
      const cookieStore = cookies()
      cookieStore.set('user', JSON.stringify(VALID_CREDENTIALS), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      })

      return NextResponse.json({
        success: true,
        user: VALID_CREDENTIALS,
        redirectPath: "/dashboard",
        message: "Login successful"
      })
    }

    // If not admin, proceed with database check
    const user = await db.collection("users").findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') }
    })
    
    console.log("User found:", user ? "Yes" : "No") // Debug log

    if (!user) {
      console.log("User not found") // Debug log
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Check if user is active
    if (user.status === "inactive") {
      console.log("User account is inactive") // Debug log
      return NextResponse.json(
        { error: "Account is inactive. Please contact administrator." },
        { status: 401 }
      )
    }

    // Compare password
    const isValidPassword = await bcrypt.compare(password, user.password)
    console.log("Password valid:", isValidPassword) // Debug log

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Remove sensitive data from response
    const { password: _, ...userWithoutPassword } = user

    // Debug log for role check
    console.log("User role check:", {
      actualRole: userWithoutPassword.role,
      roleType: typeof userWithoutPassword.role,
      isExactMatch: userWithoutPassword.role === "Administrator"
    })

    // Determine redirect based on role - case sensitive check for Administrator
    const isAdmin = userWithoutPassword.role === "Administrator"
    const redirectPath = isAdmin ? "/dashboard" : "/user/dashboard"

    // Set cookie with user data
    const cookieStore = cookies()
    cookieStore.set('user', JSON.stringify(userWithoutPassword), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    })

    console.log("Login successful for:", email, "Role:", userWithoutPassword.role, "Redirect:", redirectPath) // Debug log

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      redirectPath,
      message: "Login successful"
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Authentication failed. Please try again." },
      { status: 500 }
    )
  }
}

