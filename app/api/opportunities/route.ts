import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface Opportunity {
    id: string;
    user_id: string;
    type: 'job' | 'scholarship' | 'grant' | 'gig' | 'work_study';
    name: string;
    organization?: string;
    amount?: number;
    frequency?: 'hourly' | 'weekly' | 'biweekly' | 'monthly' | 'semester' | 'one_time';
    hours_per_week?: number;
    deadline?: string;
    apply_url?: string;
    status: 'discovered' | 'applied' | 'interviewing' | 'received' | 'rejected' | 'saved';
    applied_date?: string;
    decision_date?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

// GET - Fetch all opportunities for a user
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const status = searchParams.get('status');

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        let query = supabase
            .from('opportunities')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching opportunities:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ opportunities: data || [] });
    } catch (error) {
        console.error('Error in opportunities GET:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Create a new opportunity
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, ...opportunityData } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        if (!opportunityData.name || !opportunityData.type) {
            return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('opportunities')
            .insert({
                user_id: userId,
                type: opportunityData.type,
                name: opportunityData.name,
                organization: opportunityData.organization,
                amount: opportunityData.amount,
                frequency: opportunityData.frequency,
                hours_per_week: opportunityData.hours_per_week,
                deadline: opportunityData.deadline,
                apply_url: opportunityData.apply_url,
                status: opportunityData.status || 'discovered',
                applied_date: opportunityData.applied_date,
                notes: opportunityData.notes,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating opportunity:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ opportunity: data });
    } catch (error) {
        console.error('Error in opportunities POST:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT - Update an opportunity (mainly for status changes)
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, userId, ...updates } = body;

        if (!id || !userId) {
            return NextResponse.json({ error: 'ID and User ID required' }, { status: 400 });
        }

        // If updating status to 'applied', set applied_date if not provided
        if (updates.status === 'applied' && !updates.applied_date) {
            updates.applied_date = new Date().toISOString().split('T')[0];
        }

        // If updating status to 'received' or 'rejected', set decision_date if not provided
        if ((updates.status === 'received' || updates.status === 'rejected') && !updates.decision_date) {
            updates.decision_date = new Date().toISOString().split('T')[0];
        }

        const { data, error } = await supabase
            .from('opportunities')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error updating opportunity:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // If status changed to 'received', auto-create an income source
        if (updates.status === 'received' && data) {
            const opp = data as Opportunity;

            // Map opportunity type to income source type
            const incomeTypeMap: Record<string, string> = {
                'job': 'job',
                'work_study': 'work_study',
                'scholarship': 'scholarship',
                'grant': 'grant',
                'gig': 'job',
            };

            // Map opportunity frequency to income source frequency
            const frequencyMap: Record<string, string> = {
                'hourly': 'monthly', // Estimate monthly income for hourly jobs
                'weekly': 'weekly',
                'biweekly': 'biweekly',
                'monthly': 'monthly',
                'semester': 'semester',
                'one_time': 'one_time',
            };

            // Calculate monthly amount for hourly jobs
            let amount = opp.amount || 0;
            if (opp.frequency === 'hourly' && opp.hours_per_week) {
                amount = opp.amount! * opp.hours_per_week * 4; // ~4 weeks/month
            }

            const incomeData = {
                user_id: userId,
                name: opp.name,
                amount: amount,
                type: incomeTypeMap[opp.type] || 'other',
                frequency: frequencyMap[opp.frequency || 'monthly'] || 'monthly',
                notes: `Auto-added from application (${opp.organization || 'unknown'})`,
            };

            const { error: incomeError } = await supabase
                .from('income_sources')
                .insert(incomeData);

            if (incomeError) {
                console.error('Error creating income source:', incomeError);
                // Don't fail the whole request, just log the error
            }

            return NextResponse.json({
                opportunity: data,
                incomeCreated: !incomeError,
                message: incomeError ? 'Status updated but failed to create income' : 'Status updated and income source created!'
            });
        }

        return NextResponse.json({ opportunity: data });
    } catch (error) {
        console.error('Error in opportunities PUT:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Remove an opportunity
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const userId = searchParams.get('userId');

        if (!id || !userId) {
            return NextResponse.json({ error: 'ID and User ID required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('opportunities')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) {
            console.error('Error deleting opportunity:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in opportunities DELETE:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
