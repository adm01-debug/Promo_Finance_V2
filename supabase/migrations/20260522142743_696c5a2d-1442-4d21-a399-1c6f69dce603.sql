-- Fix remaining Security Definer Views (change to SECURITY INVOKER)
ALTER VIEW public.drivers_safe_view SET (security_invoker = on);
ALTER VIEW public.orders_operator_view SET (security_invoker = on);
ALTER VIEW public.orders_safe_view SET (security_invoker = on);