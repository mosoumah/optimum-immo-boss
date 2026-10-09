
-- Fix Security Definer views: set them as SECURITY INVOKER so RLS of underlying tables applies to the querying user
ALTER VIEW public.v_dashboard_simple SET (security_invoker = true);
ALTER VIEW public.v_dashboard_advanced_finance SET (security_invoker = true);
ALTER VIEW public.v_dashboard_advanced_property SET (security_invoker = true);
ALTER VIEW public.v_dashboard_alerts SET (security_invoker = true);
