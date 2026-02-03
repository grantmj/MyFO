import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Simple Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET - Get current session user
 */
export async function GET() {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('user_id')?.value;

        if (!userId) {
            return NextResponse.json({ user: null });
        }

        // Get user from database
        const { data: user, error } = await supabase
            .from('users')
            .select('id, email')
            .eq('id', userId)
            .single();

        if (error || !user) {
            return NextResponse.json({ user: null });
        }

        return NextResponse.json({ user: { id: user.id, email: user.email } });
    } catch (error) {
        console.error('Session check error:', error);
        return NextResponse.json({ user: null });
    }
}
