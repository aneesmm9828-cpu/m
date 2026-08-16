-- Run this in Supabase SQL Editor to see why deletes might fail
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'stories';

-- Check if story_views has a constraint blocking deletion
SELECT
    conname AS constraint_name,
    confrelid::regclass AS referenced_table,
    confdeltype AS on_delete_action
FROM pg_constraint
WHERE conrelid = 'story_views'::regclass;
-- on_delete_action: 'a' = no action, 'r' = restrict, 'c' = cascade, 'n' = set null, 'd' = set default
