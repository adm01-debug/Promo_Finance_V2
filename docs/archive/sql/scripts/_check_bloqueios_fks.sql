SELECT con.conname AS constraint_name,
       con.confdeltype AS on_delete,
       c.relname AS ref_table,
       a.attname AS ref_column
FROM pg_constraint con
JOIN pg_class c ON c.oid = con.confrelid
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = con.confkey[1]
WHERE con.conrelid = 'public.bloqueios_duplicidade'::regclass
  AND con.contype = 'f';
