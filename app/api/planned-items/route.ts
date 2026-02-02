import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET - Fetch user's planned items
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    const plannedItems = await prisma.plannedItem.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });
    
    return NextResponse.json({ plannedItems });
  } catch (error) {
    console.error('Error fetching planned items:', error);
    return NextResponse.json({ error: 'Failed to fetch planned items' }, { status: 500 });
  }
}

/**
 * POST - Add a new planned item
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, date, amount, category, notes } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    const plannedItem = await prisma.plannedItem.create({
      data: {
        userId,
        name,
        date: new Date(date),
        amount,
        category,
        notes,
      },
    });
    
    return NextResponse.json({ plannedItem });
  } catch (error) {
    console.error('Error creating planned item:', error);
    return NextResponse.json({ error: 'Failed to create planned item' }, { status: 500 });
  }
}

/**
 * DELETE - Remove a planned item
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');
    
    if (!itemId) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }
    
    await prisma.plannedItem.delete({
      where: { id: itemId },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting planned item:', error);
    return NextResponse.json({ error: 'Failed to delete planned item' }, { status: 500 });
  }
}
