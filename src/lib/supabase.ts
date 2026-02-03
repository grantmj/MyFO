import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server-side client for API routes (uses cookies for auth)
export async function createServerClient() {
    const cookieStore = await cookies();

    return createSupabaseServerClient<Database>(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                } catch {
                    // Server Component - ignore
                }
            },
        },
    });
}

// Helper to get current user ID (from auth or creates anonymous user)
export async function getCurrentUserId(): Promise<string | null> {
    const supabase = await createServerClient();

    // Try to get authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        // Check if we have a users table entry
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single();

        if (existingUser) {
            return existingUser.id;
        }

        // Create user entry if doesn't exist
        const { data: newUser, error } = await supabase
            .from('users')
            .insert({ auth_id: user.id, email: user.email })
            .select('id')
            .single();

        if (newUser) {
            return newUser.id;
        }
    }

    return null;
}
