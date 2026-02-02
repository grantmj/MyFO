import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { categorizeTransaction, normalizeAmount } from '@/lib/categorize';
import { CATEGORIES } from '@/lib/constants';

/**
 * GET - Fetch user's transactions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
    
    return NextResponse.json({ transactions });
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
        userId,
        date: new Date(t.date),
        description: t.description,
        amount,
        category,
        merchantGuess: t.description.substring(0, 50),
        source: 'csv',
      };
    });
    
    const result = await prisma.transaction.createMany({
      data: processedTransactions,
    });
    
    return NextResponse.json({ 
      success: true, 
      count: result.count,
      message: `Imported ${result.count} transactions`,
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
    const body = await request.json();
    const { transactionId, category } = body;
    
    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 });
    }
    
    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: { category },
    });
    
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
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('id');
    
    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 });
    }
    
    await prisma.transaction.delete({
      where: { id: transactionId },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
