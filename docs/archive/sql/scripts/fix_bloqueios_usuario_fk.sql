-- Garante que bloqueios_duplicidade.usuario_id referencia public.profiles (não auth.users)
-- Necessário para o embed PostgREST: profiles!bloqueios_duplicidade_usuario_id_fkey(...)

ALTER TABLE public.bloqueios_duplicidade
  DROP CONSTRAINT IF EXISTS bloqueios_duplicidade_usuario_id_fkey;

ALTER TABLE public.bloqueios_duplicidade
  ADD CONSTRAINT bloqueios_duplicidade_usuario_id_fkey
  FOREIGN KEY (usuario_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

NOTIFY pgrst, 'reload schema';
