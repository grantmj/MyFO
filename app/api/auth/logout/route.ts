import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST - Logout user (clear session cookie)
 */
export async function POST() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('user_id');

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
    }
}
