-- 1. ENSURE FOLLOWS TABLE EXISTS WITH CORRECT COLUMNS
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (follower_id, following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can see follows" ON public.follows;
CREATE POLICY "Anyone can see follows" ON public.follows FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can manage own follows" ON public.follows;
CREATE POLICY "Users can manage own follows" ON public.follows FOR ALL USING (auth.uid() = follower_id);

-- 2. ENSURE NOTIFICATIONS TABLE EXISTS WITH PRECISE COLUMNS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    target_id UUID,
    target_type TEXT,
    text TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ENABLE REALTIME
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- 4. RLS POLICIES FOR NOTIFICATIONS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = recipient_id);
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = recipient_id);
DROP POLICY IF EXISTS "System/Internal insert" ON public.notifications;
CREATE POLICY "System/Internal insert" ON public.notifications FOR INSERT WITH CHECK (true);

-- 5. NOTIFICATION TRIGGERS (UPDATED WITH CORRECT COLUMN NAMES)

-- Follow Trigger
CREATE OR REPLACE FUNCTION public.handle_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.following_id != NEW.follower_id) THEN
        INSERT INTO public.notifications (recipient_id, actor_id, type)
        VALUES (NEW.following_id, NEW.follower_id, 'follow');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_follow_notification ON public.follows;
CREATE TRIGGER on_follow_notification
    AFTER INSERT ON public.follows
    FOR EACH ROW EXECUTE FUNCTION public.handle_follow_notification();

-- Like Trigger
CREATE OR REPLACE FUNCTION public.handle_like_notification()
RETURNS TRIGGER AS $$
DECLARE
    target_owner_id UUID;
BEGIN
    IF (NEW.target_type = 'post') THEN
        SELECT user_id INTO target_owner_id FROM public.posts WHERE id = NEW.target_id;
    ELSIF (NEW.target_type = 'reel') THEN
        SELECT user_id INTO target_owner_id FROM public.reels WHERE id = NEW.target_id;
    END IF;

    IF (target_owner_id IS NOT NULL AND target_owner_id != NEW.user_id) THEN
        INSERT INTO public.notifications (recipient_id, actor_id, type, target_id, target_type)
        VALUES (target_owner_id, NEW.user_id, 'like', NEW.target_id, NEW.target_type);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_like_notification ON public.likes;
CREATE TRIGGER on_like_notification
    AFTER INSERT ON public.likes
    FOR EACH ROW EXECUTE FUNCTION public.handle_like_notification();

-- Comment Trigger
CREATE OR REPLACE FUNCTION public.handle_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
    target_owner_id UUID;
BEGIN
    IF (NEW.target_type = 'post') THEN
        SELECT user_id INTO target_owner_id FROM public.posts WHERE id = NEW.target_id;
    ELSIF (NEW.target_type = 'reel') THEN
        SELECT user_id INTO target_owner_id FROM public.reels WHERE id = NEW.target_id;
    END IF;

    IF (target_owner_id IS NOT NULL AND target_owner_id != NEW.user_id) THEN
        INSERT INTO public.notifications (recipient_id, actor_id, type, target_id, target_type, text)
        VALUES (target_owner_id, NEW.user_id, 'comment', NEW.target_id, NEW.target_type, left(NEW.content, 100));
    END IF;

    IF (NEW.parent_comment_id IS NOT NULL) THEN
        SELECT user_id INTO target_owner_id FROM public.comments WHERE id = NEW.parent_comment_id;
        IF (target_owner_id IS NOT NULL AND target_owner_id != NEW.user_id) THEN
            INSERT INTO public.notifications (recipient_id, actor_id, type, target_id, target_type, text)
            VALUES (target_owner_id, NEW.user_id, 'reply', NEW.target_id, NEW.target_type, left(NEW.content, 100));
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_notification ON public.comments;
CREATE TRIGGER on_comment_notification
    AFTER INSERT ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.handle_comment_notification();
