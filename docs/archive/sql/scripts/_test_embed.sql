SELECT bd.id, bd.usuario_id,
       (SELECT row_to_json(p) FROM (SELECT id, full_name, avatar_url FROM public.profiles WHERE id = bd.usuario_id) p) AS perfil
FROM public.bloqueios_duplicidade bd
LIMIT 2;
