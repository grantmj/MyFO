import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createServerClient } from '@/lib/supabase';

/**
 * GET - Fetch user's planned items
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { data: plannedItems, error } = await supabase
      .from('planned_items')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching planned items:', error);
      return NextResponse.json({ error: 'Failed to fetch planned items' }, { status: 500 });
    }

    // Map to expected format
    const mapped = (plannedItems || []).map(item => ({
      id: item.id,
      userId: item.user_id,
      name: item.name,
      date: item.date,
      amount: item.amount,
      category: item.category,
      notes: item.notes,
      createdAt: item.created_at,
    }));

    return NextResponse.json({ plannedItems: mapped });
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
    const supabase = await createServerClient();
    const body = await request.json();
    const { userId, name, date, amount, category, notes } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { data: plannedItem, error } = await supabase
      .from('planned_items')
      .insert({
        user_id: userId,
        name,
        date: new Date(date).toISOString().split('T')[0],
        amount,
        category,
        notes,
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating planned item:', error);
      return NextResponse.json({ error: 'Failed to create planned item' }, { status: 500 });
    }

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
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('planned_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting planned item:', error);
      return NextResponse.json({ error: 'Failed to delete planned item' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting planned item:', error);
    return NextResponse.json({ error: 'Failed to delete planned item' }, { status: 500 });
  }
}
