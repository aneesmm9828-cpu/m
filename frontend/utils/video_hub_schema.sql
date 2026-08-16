-- PHASE 1: MARB Video Hub Schema Migration

-- 1. Video Meta Extensions (Extending existing posts logic or creating a dedicated videos table)
-- We will use a dedicated table for better organization of long-form content
CREATE TABLE IF NOT EXISTS public.videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_seconds INTEGER,
    visibility TEXT DEFAULT 'public', -- public, unlisted, private
    category TEXT,
    is_short BOOLEAN DEFAULT false,
    view_count BIGINT DEFAULT 0,
    like_count BIGINT DEFAULT 0,
    comment_count BIGINT DEFAULT 0,
    status TEXT DEFAULT 'published', -- processing, published, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Analytics: Watch Time
CREATE TABLE IF NOT EXISTS public.video_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    watched_seconds INTEGER DEFAULT 0,
    device TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Reactions
CREATE TABLE IF NOT EXISTS public.video_reactions (
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('like', 'dislike')),
    PRIMARY KEY (video_id, user_id)
);

-- 4. Playlists
CREATE TABLE IF NOT EXISTS public.playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.playlist_items (
    playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE,
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
    position INTEGER,
    PRIMARY KEY (playlist_id, video_id)
);

-- 5. Subscriptions Enhancement (Add to existing or new)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_level TEXT DEFAULT 'personalized'; -- all, personalized, none

-- 6. Live Streaming
CREATE TABLE IF NOT EXISTS public.live_streams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    host_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'scheduled', -- scheduled, live, ended
    stream_key TEXT,
    playback_url TEXT,
    title TEXT NOT NULL,
    thumbnail_url TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    is_vertical BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.live_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stream_id UUID REFERENCES public.live_streams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'text', -- text, super_chat, super_sticker, membership
    amount DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Search & Discovery signals
CREATE TABLE IF NOT EXISTS public.search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.suppressed_content (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
    reason TEXT, -- not_interested, dont_recommend_channel
    PRIMARY KEY (user_id, video_id)
);

-- RLS POLICIES (Example)
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public videos are viewable by everyone" ON public.videos FOR SELECT USING (visibility = 'public');
CREATE POLICY "Users can manage their own videos" ON public.videos FOR ALL USING (auth.uid() = uploader_id);

-- INDEXES
CREATE INDEX idx_videos_uploader ON public.videos(uploader_id);
CREATE INDEX idx_videos_created ON public.videos(created_at DESC);
CREATE INDEX idx_live_chat_stream ON public.live_chat_messages(stream_id, created_at);
