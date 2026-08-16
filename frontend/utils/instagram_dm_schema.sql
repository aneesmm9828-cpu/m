-- INSTAGRAM-STYLE DM SCHEMA ENHANCEMENTS

-- 1. EXTEND MESSAGES TABLE
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS media_type TEXT; -- 'image', 'video', 'voice'
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.messages(id);
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS reaction TEXT; -- emoji string
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false;

-- 2. INSTAGRAM NOTES (Top of DM list)
CREATE TABLE IF NOT EXISTS public.user_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    music_url TEXT,
    music_title TEXT,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '24 hours'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id) -- One active note per user
);

-- 3. MESSAGE REQUESTS (For non-followers)
-- (Simplified for now: we'll handle this with a status column)
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'delivered'; -- 'delivered', 'seen', 'request'

-- RLS POLICIES
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notes are viewable by everyone" ON public.user_notes FOR SELECT USING (true);
CREATE POLICY "Users can manage their own notes" ON public.user_notes FOR ALL USING (auth.uid() = user_id);

-- INDEXES
CREATE INDEX idx_user_notes_expires ON public.user_notes(expires_at);
