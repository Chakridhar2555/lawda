import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Since we're using JWT tokens, we don't need to do anything server-side
    // The client should remove the token from local storage
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
} 