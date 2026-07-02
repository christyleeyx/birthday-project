ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS timeline_order text[];
