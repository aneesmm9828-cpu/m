-- 1. Explicitly enable RLS and add DELETE policy
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Drop existing to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own stories" ON public.stories;
DROP POLICY IF EXISTS "Users can delete their own stories" ON public.stories;

-- Comprehensive policy for all actions
CREATE POLICY "Users can manage their own stories" ON public.stories
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 2. Storage Deletion Policy
-- Enable RLS on storage.objects if not already
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow users to delete objects in the 'media' bucket if they 'own' them
-- MARB filenames start with 'story_USERID_'
DROP POLICY IF EXISTS "Users can delete their own media" ON storage.objects;
CREATE POLICY "Users can delete their own media"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'media'
    AND (
        (auth.uid())::text = (storage.foldername(name))[1] -- Folder-based (userId/file.jpg)
        OR
        name LIKE 'story_' || (auth.uid())::text || '%' -- Filename-based (story_userId_timestamp.jpg)
    )
);
