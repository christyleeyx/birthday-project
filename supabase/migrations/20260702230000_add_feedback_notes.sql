CREATE TABLE IF NOT EXISTS public.feedback_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author text NOT NULL DEFAULT 'Someone',
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view feedback notes" ON public.feedback_notes;
DROP POLICY IF EXISTS "Authenticated users can insert feedback notes" ON public.feedback_notes;

CREATE POLICY "Authenticated users can view feedback notes"
  ON public.feedback_notes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert feedback notes"
  ON public.feedback_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
