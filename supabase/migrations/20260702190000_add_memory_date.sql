ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS memory_date date DEFAULT CURRENT_DATE;

UPDATE public.memories
SET memory_date = COALESCE(memory_date, created_at::date)
WHERE memory_date IS NULL;
