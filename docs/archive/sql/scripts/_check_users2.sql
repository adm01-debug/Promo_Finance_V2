SELECT DISTINCT bd.usuario_id, p.id AS profile_exists, p.full_name
FROM public.bloqueios_duplicidade bd
LEFT JOIN public.profiles p ON p.id = bd.usuario_id
WHERE bd.usuario_id IS NOT NULL;
