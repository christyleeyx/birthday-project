-- Allow authenticated users to view and collaborate on all memories.
-- Shared reading and editing; only creators can delete.

ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS image_captions text[];

ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS image_timestamps text[];

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Users can view their own memories" ON public.memories;
DROP POLICY IF EXISTS "Users can insert their own memories" ON public.memories;
DROP POLICY IF EXISTS "Users can update their own memories" ON public.memories;
DROP POLICY IF EXISTS "Users can delete their own memories" ON public.memories;

-- Enable RLS if not already enabled
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view all memories (shared reading)
CREATE POLICY "Authenticated users can view all memories"
  ON public.memories
  FOR SELECT
  TO authenticated
  USING (true);

-- Only the creator can insert new memories
CREATE POLICY "Authenticated users can insert memories"
  ON public.memories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Any authenticated user can update any memory (for adding reflections/edits)
CREATE POLICY "Authenticated users can update any memory"
  ON public.memories
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Only the creator can delete their own memories
CREATE POLICY "Authenticated users can delete their own memories"
  ON public.memories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
