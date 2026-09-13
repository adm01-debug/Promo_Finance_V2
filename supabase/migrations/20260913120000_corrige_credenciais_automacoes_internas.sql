-- Corrige tres automacoes internas que falhavam em silencio e remove as anon
-- keys literais das definicoes versionadas (Etapa 13 do plano de 50 etapas).
--
-- Diagnostico, verificado em supabase/config.toml e em
-- supabase/functions/_shared/auth-guard.ts. `exigirChamadaInterna` aceita
-- somente (a) a service_role key em Authorization/apikey ou (b) o header
-- x-cron-secret / x-internal-secret conferido contra integration_secrets.
-- Anon key nao satisfaz nenhum dos dois.
--
-- 1. notify_performance_alert_trigger (20260712194415, 20260905130000) enviava
--    `Authorization: Bearer <anon>`. A funcao notify-performance-alert tem
--    verify_jwt=false, entao o gateway deixava passar, mas o guard interno
--    respondia 401. net.http_post e assincrono: o 401 fica em
--    net._http_response, o bloco EXCEPTION do trigger nunca dispara e nenhum
--    alerta critical/warning chegou a ser notificado. A 20260905130000 corrigiu
--    a URL e o projeto da chave; o TIPO da credencial continuou errado.
--
-- 2. cron 'digest-silenciamentos-erro' (20260728183119) envia apenas `apikey`.
--    verify_jwt=false, mesmo 401 do guard interno, pelo mesmo motivo.
--
-- 3. cron 'enviar-digest-conformidade-horario' (20260726180529) envia o
--    x-cron-secret correto, mas a `apikey` e a anon key do projeto
--    lszcmoymovkpckehlagr, nao deste. Como essa funcao tem verify_jwt=true, o
--    gateway rejeita a assinatura e a funcao nunca chega a executar.
--
-- Correcoes aplicadas:
--  - a credencial passa a ser o x-cron-secret que as funcoes de fato conferem;
--  - a anon key desaparece de (1) e (2), onde verify_jwt=false a torna inutil;
--  - em (3), onde verify_jwt=true a exige, ela vem do Vault em tempo de chamada,
--    rotacionavel sem migration, em vez de literal no arquivo;
--  - a linha do cron deixa de carregar segredo, seguindo o padrao de
--    invocar_regua_cobranca (20260822115000): quem resolve credencial e uma
--    funcao SECURITY DEFINER que falha fechada e cujo erro aparece em
--    cron.job_run_details.

-- ---------------------------------------------------------------------------
-- Segredo compartilhado das automacoes internas
-- ---------------------------------------------------------------------------
-- `valor` tem DEFAULT encode(gen_random_bytes(32),'hex'): a linha nasce com um
-- segredo forte e aleatorio, identico para o lado SQL e para `segredoInterno()`
-- no Deno, sem nunca aparecer neste arquivo.
INSERT INTO public.integration_secrets (chave, descricao)
VALUES (
  'internal_jobs',
  'Segredo x-cron-secret das automacoes internas (exigirChamadaInterna, chave padrao)'
)
ON CONFLICT (chave) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Resolvedores de credencial (fail-closed)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.segredo_cron(p_chave text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_valor text;
BEGIN
  SELECT valor INTO v_valor
    FROM public.integration_secrets
   WHERE chave = p_chave
   LIMIT 1;

  IF v_valor IS NULL OR length(v_valor) < 16 THEN
    RAISE EXCEPTION 'Segredo interno "%" ausente ou fraco em integration_secrets', p_chave;
  END IF;

  RETURN v_valor;
END;
$$;

COMMENT ON FUNCTION public.segredo_cron(text) IS
  'Le o x-cron-secret de integration_secrets. Falha fechada: segredo ausente nunca vira chamada sem credencial.';

REVOKE ALL ON FUNCTION public.segredo_cron(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.segredo_cron(text) TO service_role;

CREATE OR REPLACE FUNCTION public.chave_anon_vault()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, pg_catalog
AS $$
DECLARE
  v_chave text;
BEGIN
  SELECT decrypted_secret INTO v_chave
    FROM vault.decrypted_secrets
   WHERE name = 'anon_key'
   LIMIT 1;

  IF v_chave IS NULL OR v_chave = '' THEN
    RAISE EXCEPTION
      'Secret "anon_key" ausente no Vault. Crie-o em Project Settings > Vault com a anon key de bwwbeyolnnzppeuhgkcd.';
  END IF;

  RETURN v_chave;
END;
$$;

COMMENT ON FUNCTION public.chave_anon_vault() IS
  'Anon key publica lida do Vault em tempo de chamada, para funcoes com verify_jwt=true. Rotacionavel sem migration.';

REVOKE ALL ON FUNCTION public.chave_anon_vault() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.chave_anon_vault() TO service_role;

-- ---------------------------------------------------------------------------
-- 1. Trigger de alerta de performance
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_performance_alert_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, extensions
AS $$
DECLARE
  v_segredo text;
  v_payload jsonb;
BEGIN
  IF NEW.severity NOT IN ('critical','warning') THEN
    RETURN NEW;
  END IF;

  -- Sem RAISE: o contrato deste trigger e nunca bloquear o INSERT do alerta.
  -- Mas tambem nao pode emudecer: o WARNING vai para o log do Postgres.
  SELECT valor INTO v_segredo
    FROM public.integration_secrets
   WHERE chave = 'internal_jobs'
   LIMIT 1;

  IF v_segredo IS NULL THEN
    RAISE WARNING
      'notify_performance_alert_trigger: segredo internal_jobs ausente, alerta % nao notificado', NEW.id;
    RETURN NEW;
  END IF;

  v_payload := jsonb_build_object(
    'alert', jsonb_build_object(
      'id', NEW.id,
      'source', NEW.source,
      'alert_key', NEW.alert_key,
      'severity', NEW.severity,
      'reason', NEW.reason,
      'current_value', NEW.current_value,
      'baseline_value', NEW.baseline_value,
      'ratio', NEW.ratio,
      'sample_count', NEW.sample_count,
      'query_snippet', NEW.query_snippet,
      'created_at', NEW.created_at
    )
  );

  -- verify_jwt=false nesta funcao: o x-cron-secret e a unica credencial que
  -- exigirChamadaInterna confere. Nao ha apikey a enviar.
  PERFORM net.http_post(
    url := 'https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/notify-performance-alert',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', v_segredo
    ),
    body := v_payload,
    timeout_milliseconds := 15000
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING
    'notify_performance_alert_trigger falhou para o alerta %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.notify_performance_alert_trigger() IS
  'Notifica alertas critical/warning via notify-performance-alert usando x-cron-secret. Nunca bloqueia o INSERT; falhas viram WARNING no log em vez de silencio.';

DROP TRIGGER IF EXISTS performance_alerts_notify_trigger ON public.performance_alerts;
CREATE TRIGGER performance_alerts_notify_trigger
AFTER INSERT ON public.performance_alerts
FOR EACH ROW
EXECUTE FUNCTION public.notify_performance_alert_trigger();

-- ---------------------------------------------------------------------------
-- 2. Digest de silenciamentos (verify_jwt=false: so x-cron-secret)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.invocar_digest_silenciamentos()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, extensions
AS $$
DECLARE
  v_request_id bigint;
BEGIN
  SELECT net.http_post(
    url := 'https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/digest-silenciamentos-erro',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', public.segredo_cron('internal_jobs')
    ),
    body := jsonb_build_object('janelaHoras', 168, 'minIntervaloHoras', 144),
    timeout_milliseconds := 30000
  ) INTO v_request_id;

  RETURN v_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.invocar_digest_silenciamentos() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.invocar_digest_silenciamentos() TO service_role;

DO $do$
BEGIN
  PERFORM cron.unschedule('digest-silenciamentos-erro')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'digest-silenciamentos-erro');

  PERFORM cron.schedule(
    'digest-silenciamentos-erro',
    '0 11 * * 1',
    'SELECT public.invocar_digest_silenciamentos();'
  );
END
$do$;

-- ---------------------------------------------------------------------------
-- 3. Digest de conformidade (verify_jwt=true: apikey valida E x-cron-secret)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.invocar_digest_conformidade()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, extensions
AS $$
DECLARE
  v_request_id bigint;
BEGIN
  SELECT net.http_post(
    url := 'https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/enviar-digest-conformidade',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      -- apikey so atravessa o gateway (verify_jwt=true); quem autoriza de fato
      -- e o x-cron-secret conferido dentro da funcao.
      'apikey', public.chave_anon_vault(),
      'x-cron-secret', public.segredo_cron('conformidade_cron')
    ),
    body := jsonb_build_object('severidadeMinima', 'baixa', 'limite', 300),
    timeout_milliseconds := 30000
  ) INTO v_request_id;

  RETURN v_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.invocar_digest_conformidade() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.invocar_digest_conformidade() TO service_role;

DO $do$
BEGIN
  PERFORM cron.unschedule('enviar-digest-conformidade-horario')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'enviar-digest-conformidade-horario');

  PERFORM cron.schedule(
    'enviar-digest-conformidade-horario',
    '30 * * * *',
    'SELECT public.invocar_digest_conformidade();'
  );
END
$do$;

-- ---------------------------------------------------------------------------
-- Pre-requisito operacional, avisado sem bloquear
-- ---------------------------------------------------------------------------
-- Nao usamos RAISE EXCEPTION aqui de proposito: as correcoes (1) e (2) nao
-- dependem do Vault e devem entrar mesmo que o secret ainda nao exista. Se
-- faltar, apenas o cron de conformidade falha, de forma visivel, em
-- cron.job_run_details.
DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'anon_key') THEN
    RAISE WARNING
      'Secret "anon_key" ausente no Vault: o cron enviar-digest-conformidade-horario falhara ate ele ser criado.';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Nao foi possivel inspecionar o Vault (%): confira o secret "anon_key" manualmente.', SQLERRM;
END
$do$;

-- ---------------------------------------------------------------------------
-- 4. Push de alerta critico (fn_notificar_alerta_critico_push, 20260418151247)
-- ---------------------------------------------------------------------------
-- Mesma classe de defeito, encontrada na auditoria desta etapa. Tres quebras
-- independentes na mesma chamada, nenhuma tocada desde 2026-04-18:
--
--  a) URL '/functions/v1/enviar-push-notification' — essa funcao nao existe.
--     A real chama-se send-push-notification (supabase/functions/). 404.
--  b) credencial 'Bearer ' || COALESCE(v_key,'') onde v_key vem de
--     current_setting('app.settings.service_role_key', true). Supabase Cloud
--     nao define esse GUC, entao v_key e NULL e o header vai vazio.
--  c) corpo {titulo, mensagem, user_id, url}, mas o schema zod da funcao exige
--     {title, body} (min 1) e {userId}. Seria 400 mesmo se chegasse.
--
-- E o `EXCEPTION WHEN OTHERS THEN NULL` garantia que nada disso aparecesse.
-- Nenhum push de prioridade critica foi entregue desde entao.
INSERT INTO public.integration_secrets (chave, descricao)
VALUES (
  'send_push_notification',
  'Segredo x-cron-secret do trigger de push para alertas criticos (exigirInternaOuUsuario)'
)
ON CONFLICT (chave) DO NOTHING;

CREATE OR REPLACE FUNCTION public.fn_notificar_alerta_critico_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog, extensions
AS $$
DECLARE
  v_segredo text;
BEGIN
  IF NEW.prioridade IS DISTINCT FROM 'critica' THEN
    RETURN NEW;
  END IF;

  -- A funcao exige destinatario e textos nao vazios; sem eles a chamada
  -- voltaria 422/400. Melhor avisar aqui do que gastar a requisicao.
  IF NEW.user_id IS NULL OR COALESCE(NEW.titulo,'') = '' OR COALESCE(NEW.mensagem,'') = '' THEN
    RAISE WARNING
      'fn_notificar_alerta_critico_push: alerta % sem user_id/titulo/mensagem, push nao enviado', NEW.id;
    RETURN NEW;
  END IF;

  SELECT valor INTO v_segredo
    FROM public.integration_secrets
   WHERE chave = 'send_push_notification'
   LIMIT 1;

  IF v_segredo IS NULL THEN
    RAISE WARNING
      'fn_notificar_alerta_critico_push: segredo send_push_notification ausente, alerta % nao notificado', NEW.id;
    RETURN NEW;
  END IF;

  -- send-push-notification tem verify_jwt=false e usa
  -- exigirInternaOuUsuario(req,'send_push_notification'): x-cron-secret basta.
  PERFORM net.http_post(
    url := 'https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', v_segredo
    ),
    body := jsonb_build_object(
      'userId', NEW.user_id,
      'title', NEW.titulo,
      'body', NEW.mensagem,
      'prioridade', NEW.prioridade,
      'data', jsonb_build_object('url', NEW.acao_url)
    ),
    timeout_milliseconds := 15000
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING
    'fn_notificar_alerta_critico_push falhou para o alerta %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.fn_notificar_alerta_critico_push() IS
  'Envia push para alertas de prioridade critica via send-push-notification usando x-cron-secret. Nunca bloqueia o INSERT; falhas viram WARNING em vez de NULL silencioso.';

DROP TRIGGER IF EXISTS trg_notificar_alerta_critico_push ON public.alertas;
CREATE TRIGGER trg_notificar_alerta_critico_push
AFTER INSERT ON public.alertas
FOR EACH ROW
EXECUTE FUNCTION public.fn_notificar_alerta_critico_push();

-- ---------------------------------------------------------------------------
-- 5. Trigger de analise de WhatsApp (trigger_whatsapp_ai_analysis, 20260509153155)
-- ---------------------------------------------------------------------------
-- Tres problemas na versao de 2026-05:
--  a) le `SELECT value FROM vault.decrypted_secrets`. A coluna exposta por essa
--     view e `decrypted_secret` — e o que as duas outras migrations do repo
--     usam (20260822115000). Com o nome errado a consulta levanta erro.
--  b) SECURITY DEFINER sem `SET search_path`, deixando a resolucao de nomes a
--     merce do search_path do chamador.
--  c) nenhum EXCEPTION: (a) ou (b) abortam o INSERT em
--     historico_cobranca_whatsapp, derrubando o registro da mensagem junto com
--     a analise.
-- whatsapp-ai-analyzer tem verify_jwt=true e nenhum guard proprio, entao a
-- service_role key em Authorization continua sendo a credencial correta; muda
-- so o nome da coluna de onde ela e lida.
CREATE OR REPLACE FUNCTION public.trigger_whatsapp_ai_analysis()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, pg_catalog, extensions
AS $$
DECLARE
  v_chave text;
BEGIN
  SELECT decrypted_secret INTO v_chave
    FROM vault.decrypted_secrets
   WHERE name = 'service_role_key'
   LIMIT 1;

  IF v_chave IS NULL OR v_chave = '' THEN
    RAISE WARNING
      'trigger_whatsapp_ai_analysis: secret service_role_key ausente no Vault, mensagem % nao analisada', NEW.id;
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://bwwbeyolnnzppeuhgkcd.supabase.co/functions/v1/whatsapp-ai-analyzer',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_chave
    ),
    body := jsonb_build_object('record', row_to_json(NEW)),
    timeout_milliseconds := 15000
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING
    'trigger_whatsapp_ai_analysis falhou para a mensagem %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.trigger_whatsapp_ai_analysis() IS
  'Dispara whatsapp-ai-analyzer com a service_role key do Vault (coluna decrypted_secret). search_path fixo e falha nao bloqueante: o historico da mensagem nunca se perde por erro de analise.';

-- Recriado aqui tambem: CREATE OR REPLACE FUNCTION sozinho depende de o trigger
-- da 20260509153155 continuar existindo. As outras correcoes desta migration
-- recriam o seu; esta segue a mesma regra e fica idempotente por conta propria.
DROP TRIGGER IF EXISTS on_whatsapp_message_inserted ON public.historico_cobranca_whatsapp;
CREATE TRIGGER on_whatsapp_message_inserted
AFTER INSERT ON public.historico_cobranca_whatsapp
FOR EACH ROW
EXECUTE FUNCTION public.trigger_whatsapp_ai_analysis();
