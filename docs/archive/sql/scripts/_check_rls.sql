SELECT COUNT(*) AS has_rls, relrowsecurity, relforcerowsecurity
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname IN ('profiles','bloqueios_duplicidade')
GROUP BY relrowsecurity, relforcerowsecurity;

SELECT polname, polcmd, pg_get_expr(polqual, polrelid) AS qual
FROM pg_policy pol JOIN pg_class rel ON rel.oid = pol.polrelid
JOIN pg_namespace n ON n.oid = rel.relnamespace
WHERE n.nspname='public' AND rel.relname='profiles';
