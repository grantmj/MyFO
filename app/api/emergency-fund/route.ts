import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createServerClient } from '@/lib/supabase';

// GET emergency fund for a user
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }

        let { data: emergencyFund, error } = await supabase
            .from('emergency_fund')
            .select('*')
            .eq('user_id', userId)
            .single();

        // Create default if doesn't exist
        if (!emergencyFund && (!error || error.code === 'PGRST116')) {
            const { data: newFund, error: createError } = await supabase
                .from('emergency_fund')
                .insert({
                    user_id: userId,
                    target_amount: 500,
                    current_amount: 0,
                    weekly_contribution: 0,
                } as any)
                .select()
                .single();

            if (createError) {
                console.error('Error creating emergency fund:', createError);
                return NextResponse.json({ error: 'Failed to create emergency fund' }, { status: 500 });
            }
            emergencyFund = newFund;
        } else if (error && error.code !== 'PGRST116') {
            console.error('Error fetching emergency fund:', error);
            return NextResponse.json({ error: 'Failed to fetch emergency fund' }, { status: 500 });
        }

        const fund = emergencyFund as any;

        const percentComplete = fund && fund.target_amount > 0
            ? Math.min(100, (fund.current_amount / fund.target_amount) * 100)
            : 0;

        return NextResponse.json({
            emergencyFund: {
                id: fund?.id,
                userId: fund?.user_id,
                targetAmount: fund?.target_amount,
                currentAmount: fund?.current_amount,
                weeklyContribution: fund?.weekly_contribution,
                percentComplete,
                updatedAt: fund?.updated_at,
            }
        });
    } catch (error) {
        console.error('Error fetching emergency fund:', error);
        return NextResponse.json({ error: 'Failed to fetch emergency fund' }, { status: 500 });
    }
}

// PUT update emergency fund
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const body = await request.json();
        const { userId, targetAmount, currentAmount, weeklyContribution } = body;

        if (!userId) {
            return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }

        // Check if exists
        const { data: existing } = await supabase
            .from('emergency_fund')
            .select('id')
            .eq('user_id', userId)
            .single();

        let emergencyFund;
        const updateData: Record<string, number> = {};
        if (targetAmount !== undefined) updateData.target_amount = parseFloat(targetAmount);
        if (currentAmount !== undefined) updateData.current_amount = parseFloat(currentAmount);
        if (weeklyContribution !== undefined) updateData.weekly_contribution = parseFloat(weeklyContribution);

        if (existing) {
            const { data, error } = await (supabase
                .from('emergency_fund') as any)
                .update(updateData as any)
                .eq('user_id', userId)
                .select()
                .single();
            if (error) throw error;
            emergencyFund = data;
        } else {
            const { data, error } = await (supabase
                .from('emergency_fund') as any)
                .insert({
                    user_id: userId,
                    target_amount: targetAmount ? parseFloat(targetAmount) : 500,
                    current_amount: currentAmount ? parseFloat(currentAmount) : 0,
                    weekly_contribution: weeklyContribution ? parseFloat(weeklyContribution) : 0,
                })
                .select()
                .single();
            if (error) throw error;
            emergencyFund = data;
        }

        const percentComplete = emergencyFund && emergencyFund.target_amount > 0
            ? Math.min(100, (emergencyFund.current_amount / emergencyFund.target_amount) * 100)
            : 0;

        return NextResponse.json({
            emergencyFund: {
                id: emergencyFund?.id,
                userId: emergencyFund?.user_id,
                targetAmount: emergencyFund?.target_amount,
                currentAmount: emergencyFund?.current_amount,
                weeklyContribution: emergencyFund?.weekly_contribution,
                percentComplete,
                updatedAt: emergencyFund?.updated_at,
            }
        });
    } catch (error) {
        console.error('Error updating emergency fund:', error);
        return NextResponse.json({ error: 'Failed to update emergency fund' }, { status: 500 });
    }
}

// POST add to emergency fund (convenience endpoint)
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerClient();
        const body = await request.json();
        const { userId, depositAmount } = body;

        if (!userId || depositAmount === undefined) {
            return NextResponse.json({ error: 'userId and depositAmount required' }, { status: 400 });
        }

        const { data: existing } = await supabase
            .from('emergency_fund')
            .select('*')
            .eq('user_id', userId)
            .single();

        const existingFund = existing as any;
        const newAmount = (existingFund?.current_amount || 0) + parseFloat(depositAmount);

        let emergencyFund;
        if (existing) {
            const { data, error } = await (supabase
                .from('emergency_fund') as any)
                .update({ current_amount: newAmount } as any)
                .eq('user_id', userId)
                .select()
                .single();
            if (error) throw error;
            emergencyFund = data;
        } else {
            const { data, error } = await (supabase
                .from('emergency_fund') as any)
                .insert({
                    user_id: userId,
                    target_amount: 500, // Default
                    current_amount: parseFloat(depositAmount),
                    weekly_contribution: 0
                } as any)
                .select()
                .single();
            if (error) throw error;
            emergencyFund = data;
        }

        const percentComplete = emergencyFund && emergencyFund.target_amount > 0
            ? Math.min(100, (emergencyFund.current_amount / emergencyFund.target_amount) * 100)
            : 0;

        return NextResponse.json({
            emergencyFund: {
                id: emergencyFund?.id,
                userId: emergencyFund?.user_id,
                targetAmount: emergencyFund?.target_amount,
                currentAmount: emergencyFund?.current_amount,
                weeklyContribution: emergencyFund?.weekly_contribution,
                percentComplete,
                updatedAt: emergencyFund?.updated_at,
            }
        });
    } catch (error) {
        console.error('Error depositing to emergency fund:', error);
        return NextResponse.json({ error: 'Failed to deposit' }, { status: 500 });
    }
}