-- Restrict direct EXECUTE on the SECURITY DEFINER trigger function `handle_new_user`.
-- It should only be invoked by the `on_auth_user_created` trigger, never directly
-- by anon or authenticated clients, to prevent any privilege-escalation surface.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- `has_role(uuid, app_role)` stays callable by authenticated because RLS policies
-- on profiles/applications/user_roles call it; it only returns a boolean and
-- exposes no data beyond what RLS already implies. Explicitly re-grant for clarity.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;