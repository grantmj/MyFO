import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Simple single-user mode
 * Gets or creates a default user
 */
export async function GET() {
  try {
    // Check if any user exists
    let user = await prisma.user.findFirst();
    
    // Create default user if none exists
    if (!user) {
      user = await prisma.user.create({
        data: {},
      });
    }
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
