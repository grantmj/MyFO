import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createServerClient } from '@/lib/supabase';

// GET all income sources for a user
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }

        const { data: incomeSources, error } = await supabase
            .from('income_sources')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching income sources:', error);
            return NextResponse.json({ error: 'Failed to fetch income sources' }, { status: 500 });
        }

        // Map to frontend format
        const mapped = (incomeSources || []).map(s => ({
            id: s.id,
            userId: s.user_id,
            type: s.type,
            name: s.name,
            amount: s.amount,
            frequency: s.frequency,
            startDate: s.start_date,
            endDate: s.end_date,
            isLoan: s.is_loan,
            interestRate: s.interest_rate,
            notes: s.notes,
            createdAt: s.created_at,
        }));

        return NextResponse.json({ incomeSources: mapped });
    } catch (error) {
        console.error('Error fetching income sources:', error);
        return NextResponse.json({ error: 'Failed to fetch income sources' }, { status: 500 });
    }
}

// POST create new income source
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const body = await request.json();
        const { userId, type, name, amount, frequency, startDate, endDate, isLoan, interestRate, notes } = body;

        if (!userId || !type || !name || amount === undefined || !frequency) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data: incomeSource, error } = await supabase
            .from('income_sources')
            .insert({
                user_id: userId,
                type,
                name,
                amount: parseFloat(amount),
                frequency,
                start_date: startDate ? new Date(startDate).toISOString().split('T')[0] : null,
                end_date: endDate ? new Date(endDate).toISOString().split('T')[0] : null,
                is_loan: isLoan || false,
                interest_rate: interestRate ? parseFloat(interestRate) : null,
                notes: notes || null,
            } as any)
            .select()
            .single();

        if (error) {
            console.error('Error creating income source:', error);
            return NextResponse.json({ error: 'Failed to create income source' }, { status: 500 });
        }

        return NextResponse.json({ incomeSource });
    } catch (error) {
        console.error('Error creating income source:', error);
        return NextResponse.json({ error: 'Failed to create income source' }, { status: 500 });
    }
}

// PUT update income source
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const body = await request.json();
        const { id, type, name, amount, frequency, startDate, endDate, isLoan, interestRate, notes } = body;

        if (!id) {
            return NextResponse.json({ error: 'id required' }, { status: 400 });
        }

        const updateData: Record<string, unknown> = {};
        if (type !== undefined) updateData.type = type;
        if (name !== undefined) updateData.name = name;
        if (amount !== undefined) updateData.amount = parseFloat(amount);
        if (frequency !== undefined) updateData.frequency = frequency;
        if (startDate !== undefined) updateData.start_date = startDate ? new Date(startDate).toISOString().split('T')[0] : null;
        if (endDate !== undefined) updateData.end_date = endDate ? new Date(endDate).toISOString().split('T')[0] : null;
        if (isLoan !== undefined) updateData.is_loan = isLoan;
        if (interestRate !== undefined) updateData.interest_rate = interestRate ? parseFloat(interestRate) : null;
        if (notes !== undefined) updateData.notes = notes;

        const { data: incomeSource, error } = await supabase
            .from('income_sources')
            .update(updateData as any)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating income source:', error);
            return NextResponse.json({ error: 'Failed to update income source' }, { status: 500 });
        }

        return NextResponse.json({ incomeSource });
    } catch (error) {
        console.error('Error updating income source:', error);
        return NextResponse.json({ error: 'Failed to update income source' }, { status: 500 });
    }
}

// DELETE income source
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('income_sources')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting income source:', error);
            return NextResponse.json({ error: 'Failed to delete income source' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting income source:', error);
        return NextResponse.json({ error: 'Failed to delete income source' }, { status: 500 });
    }
}