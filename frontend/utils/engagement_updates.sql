-- EXTEND POSTS AND REELS WITH ENGAGEMENT METRICS
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS remixes_count INTEGER DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS saves_count INTEGER DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS tips_total DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS original_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_add_yours BOOLEAN DEFAULT false;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS add_yours_prompt TEXT;

ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS remixes_count INTEGER DEFAULT 0;
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS saves_count INTEGER DEFAULT 0;
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS tips_total DECIMAL(12,2) DEFAULT 0.00;

-- SHARES TABLE
CREATE TABLE IF NOT EXISTS public.shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_id UUID NOT NULL,
    target_type TEXT NOT NULL, -- 'post' or 'reel'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ENABLE RLS ON SHARES
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own shares" ON public.shares FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can view shares" ON public.shares FOR SELECT USING (true);
