import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client (uses service role key for admin operations)
export function createServerClient() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(supabaseUrl, serviceRoleKey);
}

// Types based on our schema
export interface Venue {
    id: string;
    name: string;
    slug: string;
    city: string | null;
    state: string | null;
}

export interface Show {
    id: string;
    venue_id: string;
    show_date: string;
    show_name: string | null;
    stagetime_show_id: number | null;
    processed_at: string | null;
}

export interface Performer {
    id: string;
    name: string;
    normalized_name: string;
    email: string | null;
    stagetime_user_id: number | null;
}

export interface Clip {
    id: string;
    show_id: string;
    performer_id: string | null;
    performer_name: string;
    set_number: number;
    duration_seconds: number | null;
    original_path: string | null;
    social_path: string | null;
    social_subtitled_path: string | null;
    preview_path: string | null;
    srt_path: string | null;
    intro_timestamp: number | null;
    confidence: number | null;
    price_cents: number;
    is_available: boolean;
    promo_allowed: boolean;
    created_at: string;
}

export interface ClipSearchResult {
    id: string;
    performer_name: string;
    set_number: number;
    duration_seconds: number | null;
    price_cents: number;
    is_available: boolean;
    promo_allowed: boolean;
    social_subtitled_path: string | null;
    preview_path: string | null;
    show_date: string;
    show_name: string | null;
    venue_name: string;
    venue_slug: string;
    search_name: string;
}

export interface Purchase {
    id: string;
    clip_id: string | null;
    stripe_payment_intent_id: string | null;
    stripe_checkout_session_id: string | null;
    buyer_email: string;
    buyer_name: string | null;
    amount_cents: number;
    currency: string;
    status: 'pending' | 'completed' | 'refunded' | 'failed';
    download_token: string | null;
    download_expires_at: string | null;
    download_count: number;
    max_downloads: number;
    created_at: string;
    completed_at: string | null;
}
