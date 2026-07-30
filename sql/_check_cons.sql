SELECT con.conname, con.contype, pg_get_constraintdef(con.oid) AS def
FROM pg_constraint con JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'bloqueios_duplicidade';
