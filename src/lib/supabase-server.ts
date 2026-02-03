import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Type alias for convenience
export type TypedSupabaseClient = SupabaseClient<Database>;

// Server-side client for API routes and server components
export async function createServerClient(): Promise<TypedSupabaseClient> {
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
