import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET - Fetch FAFSA checklist
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    let checklist = await prisma.fafsaChecklist.findUnique({
      where: { userId },
    });
    
    // Create if doesn't exist
    if (!checklist) {
      checklist = await prisma.fafsaChecklist.create({
        data: { userId },
      });
    }
    
    return NextResponse.json({ checklist });
  } catch (error) {
    console.error('Error fetching FAFSA checklist:', error);
    return NextResponse.json({ error: 'Failed to fetch checklist' }, { status: 500 });
  }
}

/**
 * PUT - Update FAFSA checklist item
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, field, value } = body;
    
    if (!userId || !field) {
      return NextResponse.json({ error: 'User ID and field required' }, { status: 400 });
    }
    
    const checklist = await prisma.fafsaChecklist.upsert({
      where: { userId },
      update: { [field]: value },
      create: { userId, [field]: value },
    });
    
    return NextResponse.json({ checklist });
  } catch (error) {
    console.error('Error updating FAFSA checklist:', error);
    return NextResponse.json({ error: 'Failed to update checklist' }, { status: 500 });
  }
}
