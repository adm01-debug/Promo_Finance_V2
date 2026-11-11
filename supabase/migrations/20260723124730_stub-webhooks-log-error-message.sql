-- Shim: adiciona error_message ao webhooks_log que existe em produção
-- mas nunca foi adicionado por migration anterior (a coluna original era erro_mensagem).
-- Necessário para o replay do Preview. ADD COLUMN IF NOT EXISTS é no-op em produção.
ALTER TABLE public.webhooks_log
  ADD COLUMN IF NOT EXISTS error_message text;
