-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- Recipient
    actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- Performer
    type TEXT NOT NULL CHECK (type IN ('follow', 'like', 'comment', 'mention', 'tip', 'live', 'system', 'message', 'story_reply', 'story_question')),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    reel_id UUID REFERENCES public.reels(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    message_id UUID, -- Link to messages.id if needed
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
    amount NUMERIC(12,2), -- For tips
    text TEXT, -- Comment preview, message preview, or system message
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read) WHERE is_read = false;

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true); -- Usually inserted via triggers or edge functions
