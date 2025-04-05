import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Check password strength
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const strength = {
      isStrong: hasMinLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      hasMinLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar
    };

    return NextResponse.json(strength);
  } catch (error) {
    console.error('Error checking password:', error);
    return NextResponse.json(
      { error: 'Failed to check password' },
      { status: 500 }
    );
  }
} 