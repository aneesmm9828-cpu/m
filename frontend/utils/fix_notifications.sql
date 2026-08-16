-- 1. NOTIFICATIONS TABLE (Ensure it matches requirements)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- Recipient
    actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- Performer
    type TEXT NOT NULL CHECK (type IN ('follow', 'like', 'comment', 'reply', 'mention', 'tip', 'live', 'system')),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    reel_id UUID REFERENCES public.reels(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    text TEXT, -- Comment preview, message preview, or system message
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. ENABLE REALTIME
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.comments REPLICA IDENTITY FULL;

-- 3. RLS POLICIES
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- 4. AUTOMATIC NOTIFICATION FUNCTIONS

-- Follow Notification
CREATE OR REPLACE FUNCTION public.handle_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.following_id != NEW.follower_id) THEN
        INSERT INTO public.notifications (user_id, actor_id, type)
        VALUES (NEW.following_id, NEW.follower_id, 'follow');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_follow_notification ON public.follows;
CREATE TRIGGER on_follow_notification
    AFTER INSERT ON public.follows
    FOR EACH ROW EXECUTE FUNCTION public.handle_follow_notification();

-- Like Notification
CREATE OR REPLACE FUNCTION public.handle_like_notification()
RETURNS TRIGGER AS $$
DECLARE
    target_owner_id UUID;
BEGIN
    -- Get post or reel owner
    IF (NEW.target_type = 'post') THEN
        SELECT user_id INTO target_owner_id FROM public.posts WHERE id = NEW.target_id;
    ELSIF (NEW.target_type = 'reel') THEN
        SELECT user_id INTO target_owner_id FROM public.reels WHERE id = NEW.target_id;
    END IF;

    IF (target_owner_id IS NOT NULL AND target_owner_id != NEW.user_id) THEN
        INSERT INTO public.notifications (user_id, actor_id, type, post_id)
        VALUES (target_owner_id, NEW.user_id, 'like', NEW.target_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_like_notification ON public.likes;
CREATE TRIGGER on_like_notification
    AFTER INSERT ON public.likes
    FOR EACH ROW EXECUTE FUNCTION public.handle_like_notification();

-- Comment Notification
CREATE OR REPLACE FUNCTION public.handle_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
    target_owner_id UUID;
BEGIN
    -- Get post or reel owner
    IF (NEW.target_type = 'post') THEN
        SELECT user_id INTO target_owner_id FROM public.posts WHERE id = NEW.target_id;
    ELSIF (NEW.target_type = 'reel') THEN
        SELECT user_id INTO target_owner_id FROM public.reels WHERE id = NEW.target_id;
    END IF;

    IF (target_owner_id IS NOT NULL AND target_owner_id != NEW.user_id) THEN
        INSERT INTO public.notifications (user_id, actor_id, type, post_id, comment_id, text)
        VALUES (target_owner_id, NEW.user_id, 'comment', NEW.target_id, NEW.id, left(NEW.content, 100));
    END IF;

    -- If it's a reply, notify the parent comment owner too
    IF (NEW.parent_comment_id IS NOT NULL) THEN
        SELECT user_id INTO target_owner_id FROM public.comments WHERE id = NEW.parent_comment_id;
        IF (target_owner_id IS NOT NULL AND target_owner_id != NEW.user_id) THEN
            INSERT INTO public.notifications (user_id, actor_id, type, post_id, comment_id, text)
            VALUES (target_owner_id, NEW.user_id, 'reply', NEW.target_id, NEW.id, left(NEW.content, 100));
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_notification ON public.comments;
CREATE TRIGGER on_comment_notification
    AFTER INSERT ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.handle_comment_notification();
