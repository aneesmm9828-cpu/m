-- 1. Fix missing ON DELETE CASCADE for story replies in live_chat_messages
DO $$
BEGIN
    -- Check if story_id column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_chat_messages' AND column_name = 'story_id') THEN
        -- Find the constraint name (Postgres usually names them like table_column_fkey)
        -- We'll just drop and recreate if we can find it, or use a generic approach.

        -- Better: Drop existing constraint if it exists
        ALTER TABLE public.live_chat_messages DROP CONSTRAINT IF EXISTS live_chat_messages_story_id_fkey;

        -- Add it back with CASCADE
        ALTER TABLE public.live_chat_messages
        ADD CONSTRAINT live_chat_messages_story_id_fkey
        FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Check highlight_items just in case (though it seemed ok in grep)
ALTER TABLE public.highlight_items DROP CONSTRAINT IF EXISTS highlight_items_story_id_fkey;
ALTER TABLE public.highlight_items
ADD CONSTRAINT highlight_items_story_id_fkey
FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE;

-- 3. Check story_sticker_responses
ALTER TABLE public.story_sticker_responses DROP CONSTRAINT IF EXISTS story_sticker_responses_story_id_fkey;
ALTER TABLE public.story_sticker_responses
ADD CONSTRAINT story_sticker_responses_story_id_fkey
FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE;

-- 4. Check story_views
ALTER TABLE public.story_views DROP CONSTRAINT IF EXISTS story_views_story_id_fkey;
ALTER TABLE public.story_views
ADD CONSTRAINT story_views_story_id_fkey
FOREIGN KEY (story_id) REFERENCES public.stories(id) ON DELETE CASCADE;
