-- ===============================================================================
--  ZEGA AI — MIGRATION 20260729000004: NEWSLETTER SUBSCRIPTIONS TABLE & RLS
--  OWASP & GDPR Compliance: Public opt-in, unique email index & RLS policies
-- ===============================================================================

-- 1. Create newsletter_subscriptions Table
CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed')),
    source TEXT DEFAULT 'landing_page_banner',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Performance Index on Email and Status
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_email ON public.newsletter_subscriptions (email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_status ON public.newsletter_subscriptions (status);

-- 3. Automatic updated_at Trigger
CREATE OR REPLACE FUNCTION update_newsletter_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_newsletter_subscriptions_updated_at ON public.newsletter_subscriptions;
CREATE TRIGGER trg_newsletter_subscriptions_updated_at
BEFORE UPDATE ON public.newsletter_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_newsletter_subscriptions_updated_at();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Allow public / anon users to subscribe (INSERT)
DROP POLICY IF EXISTS "Allow public newsletter subscription insert" ON public.newsletter_subscriptions;
CREATE POLICY "Allow public newsletter subscription insert"
ON public.newsletter_subscriptions
FOR INSERT
WITH CHECK (true);

-- Allow admins & service role full access
DROP POLICY IF EXISTS "Allow service role full access to newsletter subscriptions" ON public.newsletter_subscriptions;
CREATE POLICY "Allow service role full access to newsletter subscriptions"
ON public.newsletter_subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6. Comment for Documentation
COMMENT ON TABLE public.newsletter_subscriptions IS 'Stores public newsletter opt-in subscriptions for ZEGA AI enterprise updates.';
