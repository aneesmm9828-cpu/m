-- SECTION 12: CREATOR & ANALYTICS TOOLS SCHEMA

-- 1. CREATOR ANALYTICS (Aggregated stats)
CREATE TABLE IF NOT EXISTS public.creator_stats (
    user_id UUID REFERENCES public.profiles(id) PRIMARY KEY,
    reach BIGINT DEFAULT 0,
    impressions BIGINT DEFAULT 0,
    profile_visits BIGINT DEFAULT 0,
    followers_gained INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. MONETIZATION & WALLET
CREATE TABLE IF NOT EXISTS public.wallets (
    user_id UUID REFERENCES public.profiles(id) PRIMARY KEY,
    total_balance DECIMAL(12,2) DEFAULT 0.00,
    available_balance DECIMAL(12,2) DEFAULT 0.00,
    pending_balance DECIMAL(12,2) DEFAULT 0.00,
    currency TEXT DEFAULT 'INR',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'tip', 'badge', 'deal', 'withdrawal', 'subscription'
    amount DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed'
    description TEXT,
    reference_id UUID, -- post_id, deal_id, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    subscriber_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'active',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(creator_id, subscriber_id)
);

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_exclusive BOOLEAN DEFAULT false;

-- 4. SKILL MARKETPLACE
CREATE TABLE IF NOT EXISTS public.creator_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    category TEXT,
    hourly_rate DECIMAL(10,2),
    starting_price DECIMAL(10,2),
    delivery_days INTEGER,
    orders_completed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. BRAND DEALS
CREATE TABLE IF NOT EXISTS public.brand_deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_name TEXT NOT NULL,
    brand_logo TEXT,
    title TEXT NOT NULL,
    description TEXT,
    offer_amount DECIMAL(12,2),
    deliverables TEXT, -- JSON or string
    deadline TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'open', -- 'open', 'active', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.deal_applications (
    deal_id UUID REFERENCES public.brand_deals(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    PRIMARY KEY (deal_id, creator_id)
);

-- 6. SCHEDULED POSTS
CREATE TABLE IF NOT EXISTS public.scheduled_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_data JSONB NOT NULL, -- caption, media_urls, type
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'posted', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. CONTENT TOPICS
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    icon TEXT,
    post_count BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.post_topics (
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, topic_id)
);

-- RLS POLICIES
ALTER TABLE public.creator_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

-- Select policies
CREATE POLICY "Stats visible to owner" ON public.creator_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Wallet visible to owner" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Transactions visible to owner" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Deals visible to all" ON public.brand_deals FOR SELECT USING (true);
CREATE POLICY "Topics visible to all" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Scheduled visible to owner" ON public.scheduled_posts FOR SELECT USING (auth.uid() = user_id);
