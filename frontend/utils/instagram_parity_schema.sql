-- Instagram Parity Features Schema Migration

-- 1. CAROUSEL POSTS
-- Modify posts to handle multiple media items
CREATE TABLE IF NOT EXISTS public.post_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT DEFAULT 'image', -- image, video
    position INTEGER DEFAULT 0,
    caption TEXT, -- per-slide caption
    alt_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. STORY HIGHLIGHTS
CREATE TABLE IF NOT EXISTS public.highlights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    cover_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.highlight_items (
    highlight_id UUID REFERENCES public.highlights(id) ON DELETE CASCADE,
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
    PRIMARY KEY (highlight_id, story_id)
);

-- 3. INTERACTIVE STICKERS (STORY)
-- Store sticker interactions
CREATE TABLE IF NOT EXISTS public.story_sticker_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    sticker_type TEXT, -- poll, quiz, question
    response_data JSONB, -- { option_index: 0 } or { answer: "..." }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CLOSE FRIENDS
CREATE TABLE IF NOT EXISTS public.close_friends (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, friend_id)
);

-- 5. SAVED COLLECTIONS
CREATE TABLE IF NOT EXISTS public.saved_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cover_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.collection_items (
    collection_id UUID REFERENCES public.saved_collections(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    PRIMARY KEY (collection_id, post_id)
);

-- 6. CHAT ENHANCEMENTS
-- Add message reactions and vanishing mode to existing messages if needed
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reaction TEXT; -- simple emoji
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_vanishing BOOLEAN DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS voice_url TEXT;

-- 7. PROFESSIONAL DASHBOARD
-- This is mostly aggregated from existing views/likes/reels_views
-- We can add a dedicated analytics cache table for speed
CREATE TABLE IF NOT EXISTS public.user_analytics (
    user_id UUID REFERENCES public.profiles(id) PRIMARY KEY,
    total_reach BIGINT DEFAULT 0,
    total_engagement BIGINT DEFAULT 0,
    profile_visits BIGINT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
