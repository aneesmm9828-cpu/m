-- 1. EXTEND MESSAGES
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'delivered';

-- 2. CREATE NOTES TABLE
CREATE TABLE IF NOT EXISTS public.user_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '24 hours'),
    UNIQUE(user_id)
);

-- 3. ENABLE RLS
ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notes read" ON public.user_notes FOR SELECT USING (true);
CREATE POLICY "Notes manage" ON public.user_notes FOR ALL USING (auth.uid() = user_id);
