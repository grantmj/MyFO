import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Simple Supabase client (no auth needed for table access)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST - Register new user (simple table-based)
 */
export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
        }

        // Check if user already exists
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        // Create user with plain text password (hackathon only!)
        const { data: user, error } = await supabase
            .from('users')
            .insert({
                email,
                password, // Plain text for hackathon simplicity
            } as any)
            .select()
            .single();

        if (error) {
            console.error('Error creating user:', error);
            return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
        }

        // Set session cookie
        const cookieStore = await cookies();
        cookieStore.set('user_id', user.id, {
            httpOnly: true,
            secure: false, // Allow http for local dev
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        return NextResponse.json({
            success: true,
            user: { id: user.id, email: user.email }
        });
    } catch (error) {
        console.error('Register error:', error);
        return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
    }
}
