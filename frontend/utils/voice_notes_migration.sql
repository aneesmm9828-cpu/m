-- 1. Create voice_notes table
CREATE TABLE IF NOT EXISTS public.voice_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    context_type TEXT NOT NULL CHECK (context_type IN ('dm', 'comment', 'post_caption')),
    context_id UUID, -- messages.id / comments.id / posts.id
    audio_url TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    transcript_text TEXT,
    transcript_language TEXT DEFAULT 'or', -- 'or' for Odia
    transcript_status TEXT DEFAULT 'pending' CHECK (transcript_status IN ('pending', 'done', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add indexes
CREATE INDEX IF NOT EXISTS idx_voice_notes_context ON public.voice_notes(context_type, context_id);
CREATE INDEX IF NOT EXISTS idx_voice_notes_owner ON public.voice_notes(owner_id);

-- 3. Enable RLS
ALTER TABLE public.voice_notes ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
-- Owners can manage their own voice notes
CREATE POLICY "Users can manage their own voice notes"
ON public.voice_notes FOR ALL
USING (auth.uid() = owner_id);

-- Select policy based on context
CREATE POLICY "Users can view relevant voice notes"
ON public.voice_notes FOR SELECT
USING (
    auth.uid() = owner_id OR
    (context_type = 'dm' AND EXISTS (
        SELECT 1 FROM public.messages
        WHERE public.messages.id = context_id
        AND (public.messages.sender_id = auth.uid() OR public.messages.receiver_id = auth.uid())
    )) OR
    (context_type = 'comment' AND EXISTS (
        SELECT 1 FROM public.comments
        WHERE public.comments.id = context_id
        -- Typically comments are public or visible to post owner
    )) OR
    (context_type = 'post_caption' AND EXISTS (
        SELECT 1 FROM public.posts
        WHERE public.posts.id = context_id
    ))
);

-- 5. Update existing tables to link voice notes
-- Update messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'voice'));
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS voice_note_id UUID REFERENCES public.voice_notes(id) ON DELETE SET NULL;

-- Update comments table
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS voice_note_id UUID REFERENCES public.voice_notes(id) ON DELETE SET NULL;

-- Update posts table (for voice captions)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS voice_note_id UUID REFERENCES public.voice_notes(id) ON DELETE SET NULL;
