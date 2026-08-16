-- OPTIMIZATION FOR SHORT-FORM CONTENT (REELS)

-- 1. Add resolution columns to reels for better filtering/sorting
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS width INTEGER;
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE public.reels ADD COLUMN IF NOT EXISTS aspect_ratio TEXT DEFAULT '9:16';

-- 2. Create index on created_at for faster feed loading
CREATE INDEX IF NOT EXISTS idx_reels_created_at_desc ON public.reels(created_at DESC);

-- 3. Add constraint to encourage 9:16 format (informative)
-- Note: This is a soft constraint, but good for data integrity
COMMENT ON COLUMN public.reels.aspect_ratio IS 'Target ratio is 9:16 (1080x1920)';
