import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createServerClient } from '@/lib/supabase';
import { categorizeTransaction, normalizeAmount } from '@/lib/categorize';

/**
 * GET - Fetch user's transactions
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    // Map to expected format
    const mappedTransactions = (transactions || []).map(t => ({
      id: t.id,
      userId: t.user_id,
      date: t.date,
      description: t.description,
      amount: t.amount,
      category: t.category,
      merchantGuess: t.merchant_guess,
      source: t.source,
      createdAt: t.created_at,
    }));

    return NextResponse.json({ transactions: mappedTransactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

/**
 * POST - Import transactions from CSV data
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();
    const { userId, transactions, amountConvention = 'positive-spend' } = body as {
      userId: string;
      transactions: Array<{
        date: string;
        description: string;
        amount: number;
      }>;
      amountConvention?: 'positive-spend' | 'negative-spend';
    };

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ error: 'No transactions provided' }, { status: 400 });
    }

    // Process and create transactions
    const processedTransactions = transactions.map(t => {
      const amount = normalizeAmount(t.amount, amountConvention);
      const category = categorizeTransaction(t.description);

      return {
        user_id: userId,
        date: new Date(t.date).toISOString().split('T')[0],
        description: t.description,
        amount,
        category,
        merchant_guess: t.description.substring(0, 50),
        source: 'csv',
      };
    });

    const { data, error } = await supabase
      .from('transactions')
      .insert(processedTransactions as any)
      .select();

    if (error) {
      console.error('Error importing transactions:', error);
      return NextResponse.json({ error: 'Failed to import transactions' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      message: `Imported ${data?.length || 0} transactions`,
    });
  } catch (error) {
    console.error('Error importing transactions:', error);
    return NextResponse.json({ error: 'Failed to import transactions' }, { status: 500 });
  }
}

/**
 * PUT - Update a transaction (e.g., change category)
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();
    const { transactionId, category } = body;

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 });
    }

    const { data: transaction, error } = await supabase
      .from('transactions')
      .update({ category } as any)
      .eq('id', transactionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating transaction:', error);
      return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
    }

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}

/**
 * DELETE - Delete a transaction
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('id');

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);

    if (error) {
      console.error('Error deleting transaction:', error);
      return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
