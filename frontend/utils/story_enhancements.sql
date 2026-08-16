-- STORY ENHANCEMENTS: Views & Engagement

-- 1. STORY VIEWS TRACKING
CREATE TABLE IF NOT EXISTS public.story_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(story_id, viewer_id) -- One view per person
);

-- 2. STORY REPLIES (COMMENTS)
-- We will reuse the existing messages table for replies, but add a reference
ALTER TABLE public.live_chat_messages ADD COLUMN IF NOT EXISTS story_id UUID REFERENCES public.stories(id);
-- OR better, ensure the main messages table can handle it
-- For now, let's assume we send replies as Direct Messages (DMs) to the creator.

-- RLS POLICIES
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see views for their own stories" ON public.story_views
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.stories WHERE id = story_id));
CREATE POLICY "Authenticated users can record a view" ON public.story_views
    FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- INDEXES
CREATE INDEX idx_story_views_story ON public.story_views(story_id);
