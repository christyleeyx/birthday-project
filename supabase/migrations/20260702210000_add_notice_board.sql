CREATE TABLE IF NOT EXISTS public.notice_boards (
  board_key text PRIMARY KEY,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notice_boards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view notice boards" ON public.notice_boards;
DROP POLICY IF EXISTS "Authenticated users can insert notice boards" ON public.notice_boards;
DROP POLICY IF EXISTS "Authenticated users can update notice boards" ON public.notice_boards;

CREATE POLICY "Authenticated users can view notice boards"
  ON public.notice_boards
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert notice boards"
  ON public.notice_boards
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update notice boards"
  ON public.notice_boards
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
