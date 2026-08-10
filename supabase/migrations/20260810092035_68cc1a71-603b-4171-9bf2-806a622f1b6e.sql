-- 1) Remove blanket privileges from the anonymous (signed-out) role.
REVOKE ALL ON public.applications FROM anon;

-- 2) Explicit, least-privilege grants.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;

-- 3) Re-assert row-level ownership rules (idempotent rewrite).
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Applications: own select or admin" ON public.applications;
DROP POLICY IF EXISTS "Applications: own insert" ON public.applications;
DROP POLICY IF EXISTS "Applications: own update" ON public.applications;
DROP POLICY IF EXISTS "Applications: own delete" ON public.applications;

CREATE POLICY "Applications: own select or admin"
  ON public.applications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Applications: own insert"
  ON public.applications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Applications: own update"
  ON public.applications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Applications: own delete"
  ON public.applications FOR DELETE TO authenticated
  USING (user_id = auth.uid());
