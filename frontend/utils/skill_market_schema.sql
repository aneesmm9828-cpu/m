-- SKILL MARKET SCHEMA MIGRATION

-- 1. SKILL PROFILES
-- Extends the base profiles table with seller-specific data
CREATE TABLE IF NOT EXISTS public.skill_profiles (
    profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT false,
    bio TEXT,
    categories TEXT[], -- e.g., ['Tutoring', 'Design']
    skills TEXT[], -- Specific tags
    location_name TEXT, -- Human readable location
    location_coords GEOGRAPHY(POINT), -- For hyperlocal search
    availability_json JSONB, -- Working hours/days
    is_verified BOOLEAN DEFAULT false,
    rating_avg DECIMAL(3, 2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. GIGS
CREATE TABLE IF NOT EXISTS public.gigs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    tags TEXT[],

    -- Pricing Tiers
    price_basic DECIMAL(12, 2) NOT NULL,
    price_standard DECIMAL(12, 2),
    price_premium DECIMAL(12, 2),

    -- Delivery Details
    delivery_days_basic INTEGER DEFAULT 1,
    delivery_days_standard INTEGER,
    delivery_days_premium INTEGER,

    location_name TEXT,
    location_coords GEOGRAPHY(POINT),

    status TEXT DEFAULT 'active', -- 'active', 'paused', 'deleted'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. GIG MEDIA
CREATE TABLE IF NOT EXISTS public.gig_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID REFERENCES public.gigs(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT DEFAULT 'image', -- 'image' or 'video'
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID REFERENCES public.gigs(id) ON DELETE SET NULL,
    buyer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

    package_tier TEXT DEFAULT 'basic', -- 'basic', 'standard', 'premium'
    amount DECIMAL(12, 2) NOT NULL,
    platform_fee DECIMAL(12, 2) DEFAULT 0.00,

    status TEXT DEFAULT 'requested', -- 'requested', 'accepted', 'rejected', 'in_progress', 'delivered', 'completed', 'cancelled', 'disputed'
    escrow_status TEXT DEFAULT 'pending', -- 'pending', 'held', 'released', 'refunded'

    requirements_data JSONB, -- Data provided by buyer

    deadline_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ORDER MESSAGES (ZegoCloud fallback or internal tracking)
CREATE TABLE IF NOT EXISTS public.order_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT,
    media_url TEXT,
    is_system_message BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reviewee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    direction TEXT NOT NULL, -- 'buyer_to_seller' or 'seller_to_buyer'

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(order_id, direction)
);

-- 7. PAYOUTS
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    amount DECIMAL(12, 2) NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'processed', 'failed'
    razorpay_payout_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. DISPUTES
CREATE TABLE IF NOT EXISTS public.disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    raised_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    evidence_urls TEXT[],
    status TEXT DEFAULT 'open', -- 'open', 'resolved', 'closed'
    admin_notes TEXT,
    resolution_type TEXT, -- 'refund', 'release', 'partial'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS POLICIES

-- Skill Profiles
ALTER TABLE public.skill_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read skill profiles" ON public.skill_profiles FOR SELECT USING (true);
CREATE POLICY "Sellers manage own skill profile" ON public.skill_profiles FOR ALL USING (auth.uid() = profile_id);

-- Gigs
ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active gigs" ON public.gigs FOR SELECT USING (status = 'active');
CREATE POLICY "Sellers manage own gigs" ON public.gigs FOR ALL USING (auth.uid() = seller_id);

-- Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants view orders" ON public.orders FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Buyers create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Participants update orders" ON public.orders FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Participants create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
