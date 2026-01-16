-- Set-Clip Web Database Schema
-- Run this in the Supabase SQL editor to set up the database

-- Venues table
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    city TEXT,
    state TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shows table
CREATE TABLE shows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venue_id UUID REFERENCES venues(id) ON DELETE CASCADE,
    show_date DATE NOT NULL,
    show_name TEXT, -- e.g., "Thursday Open Mic", "Friday Showcase"
    stagetime_show_id INTEGER, -- Link to stagetime if available
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(venue_id, show_date, show_name)
);

-- Performers table (for name normalization/matching)
CREATE TABLE performers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL, -- lowercase, no special chars for searching
    email TEXT,
    stagetime_user_id INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_performers_normalized_name ON performers(normalized_name);

-- Clips table (the main product)
CREATE TABLE clips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    show_id UUID REFERENCES shows(id) ON DELETE CASCADE,
    performer_id UUID REFERENCES performers(id) ON DELETE SET NULL,
    performer_name TEXT NOT NULL, -- Denormalized for display
    set_number INTEGER NOT NULL,
    duration_seconds INTEGER,

    -- File paths (relative to storage root)
    original_path TEXT, -- Full quality original
    social_path TEXT, -- 9:16 vertical version
    social_subtitled_path TEXT, -- 9:16 with burned subtitles
    preview_path TEXT, -- Small preview file
    srt_path TEXT, -- Subtitle file

    -- Metadata
    intro_timestamp REAL, -- When the intro starts in original recording
    confidence REAL, -- Detection confidence

    -- Pricing/availability
    price_cents INTEGER DEFAULT 500,
    is_available BOOLEAN DEFAULT true,
    promo_allowed BOOLEAN DEFAULT false, -- From stagetime

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clips_performer_id ON clips(performer_id);
CREATE INDEX idx_clips_show_id ON clips(show_id);
CREATE INDEX idx_clips_performer_name ON clips(performer_name);

-- Purchases table
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clip_id UUID REFERENCES clips(id) ON DELETE SET NULL,

    -- Stripe info
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_checkout_session_id TEXT,

    -- Buyer info
    buyer_email TEXT NOT NULL,
    buyer_name TEXT,

    -- Purchase details
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'usd',
    status TEXT DEFAULT 'pending', -- pending, completed, refunded, failed

    -- Download tracking
    download_token TEXT UNIQUE, -- For generating secure download links
    download_expires_at TIMESTAMPTZ,
    download_count INTEGER DEFAULT 0,
    max_downloads INTEGER DEFAULT 5,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_purchases_clip_id ON purchases(clip_id);
CREATE INDEX idx_purchases_buyer_email ON purchases(buyer_email);
CREATE INDEX idx_purchases_download_token ON purchases(download_token);
CREATE INDEX idx_purchases_stripe_payment_intent ON purchases(stripe_payment_intent_id);

-- Download logs (for analytics)
CREATE TABLE download_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
    clip_id UUID REFERENCES clips(id) ON DELETE SET NULL,
    ip_address TEXT,
    user_agent TEXT,
    file_type TEXT, -- 'original', 'social', 'social_subtitled', 'preview'
    downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helper function to normalize performer names for searching
CREATE OR REPLACE FUNCTION normalize_performer_name(name TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s]', '', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to auto-set normalized_name on performers
CREATE OR REPLACE FUNCTION set_normalized_name()
RETURNS TRIGGER AS $$
BEGIN
    NEW.normalized_name := normalize_performer_name(NEW.name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER performers_normalize_name
    BEFORE INSERT OR UPDATE ON performers
    FOR EACH ROW
    EXECUTE FUNCTION set_normalized_name();

-- View for easy clip searching
CREATE VIEW clip_search AS
SELECT
    c.id,
    c.performer_name,
    c.set_number,
    c.duration_seconds,
    c.price_cents,
    c.is_available,
    c.promo_allowed,
    c.social_subtitled_path,
    c.preview_path,
    s.show_date,
    s.show_name,
    v.name as venue_name,
    v.slug as venue_slug,
    normalize_performer_name(c.performer_name) as search_name
FROM clips c
JOIN shows s ON c.show_id = s.id
JOIN venues v ON s.venue_id = v.id
WHERE c.is_available = true;

-- Row Level Security (RLS) policies
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE performers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clips ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Public read access to venues, shows, clips (for searching)
CREATE POLICY "Public can view venues" ON venues FOR SELECT USING (true);
CREATE POLICY "Public can view shows" ON shows FOR SELECT USING (true);
CREATE POLICY "Public can view available clips" ON clips FOR SELECT USING (is_available = true);

-- Purchases are private - only accessible via service role or by download token
CREATE POLICY "Purchases viewable by email" ON purchases
    FOR SELECT USING (auth.jwt() ->> 'email' = buyer_email);

-- Insert your default venue
INSERT INTO venues (name, slug, city, state)
VALUES ('The Comedy Corner Underground', 'ccu', 'Minneapolis', 'MN');
