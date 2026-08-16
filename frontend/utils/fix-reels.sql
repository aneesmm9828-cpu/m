-- 1. ENSURE REELS TABLE EXISTS WITH CORRECT COLUMNS
CREATE TABLE IF NOT EXISTS public.reels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    caption TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ENABLE RLS
ALTER TABLE public.reels ENABLE ROW LEVEL SECURITY;

-- 3. DROP EXISTING POLICIES TO AVOID CONFLICTS
DROP POLICY IF EXISTS "Allow public read access to reels" ON public.reels;
DROP POLICY IF EXISTS "Users can manage their own reels" ON public.reels;

-- 4. CREATE NEW POLICIES
CREATE POLICY "Allow public read access to reels" ON public.reels FOR SELECT USING (true);
CREATE POLICY "Users can manage their own reels" ON public.reels FOR ALL USING (auth.uid() = user_id);

-- 5. ENSURE EXTENSIONS ARE ENABLED
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
