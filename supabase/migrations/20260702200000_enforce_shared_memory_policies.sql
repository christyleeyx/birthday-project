-- Re-apply shared-memory RLS policies for databases that still have
-- the original owner-only update policy.

ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own memories" ON public.memories;
DROP POLICY IF EXISTS "Users can insert their own memories" ON public.memories;
DROP POLICY IF EXISTS "Users can update their own memories" ON public.memories;
DROP POLICY IF EXISTS "Users can delete their own memories" ON public.memories;

DROP POLICY IF EXISTS "Authenticated users can view all memories" ON public.memories;
DROP POLICY IF EXISTS "Authenticated users can insert memories" ON public.memories;
DROP POLICY IF EXISTS "Authenticated users can update any memory" ON public.memories;
DROP POLICY IF EXISTS "Authenticated users can delete their own memories" ON public.memories;

CREATE POLICY "Authenticated users can view all memories"
  ON public.memories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert memories"
  ON public.memories
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update any memory"
  ON public.memories
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete their own memories"
  ON public.memories
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
