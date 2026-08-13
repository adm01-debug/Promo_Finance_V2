-- ============================================================================
-- Gap #33 — Defesa em profundidade: eliminar a superfície de privilégio `anon`
-- ----------------------------------------------------------------------------
-- Diagnóstico: 260 tabelas e 22 views de `public` possuíam GRANT SELECT para
-- `anon`, embora NENHUMA tivesse policy permissiva para esse papel. Ou seja:
-- hoje o retorno é sempre vazio (RLS default-deny), mas o privilégio de tabela
-- estava aberto. Isso transforma qualquer erro futuro — uma policy `TO public`,
-- uma policy `USING (true)`, uma tabela criada sem RLS — em vazamento público
-- imediato, sem nenhuma segunda barreira.
--
-- Correção: revogar TODOS os privilégios de `anon` sobre tabelas/views/sequências
-- de `public`, exceto uma allowlist explícita e justificada; e ajustar os
-- DEFAULT PRIVILEGES para que objetos futuros não nasçam expostos.
-- ============================================================================

-- 1) Revogação em massa (tabelas, views, materialized views, sequências).
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- 2) Allowlist explícita — única exceção legítima do produto.
--    `frontend_error_logs` recebe telemetria de erro de JS que ocorre ANTES do
--    login (tela de auth, boot da aplicação). É append-only para o cliente: a
--    policy correspondente permite apenas INSERT, nunca SELECT, e um trigger
--    (`frontend_error_logs_sanitize`) higieniza o payload. Sem SELECT não há
--    leitura possível, e sem o GRANT o INSERT anônimo falharia com 403.
GRANT INSERT ON public.frontend_error_logs TO anon;

-- 3) DEFAULT PRIVILEGES: impedir que tabelas criadas por migrations futuras
--    voltem a nascer com GRANT para `anon`. Cobre os papéis que efetivamente
--    criam objetos no schema.
DO $$
DECLARE
  v_role text;
BEGIN
  FOREACH v_role IN ARRAY ARRAY['postgres', 'supabase_admin', 'service_role'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = v_role)
       AND pg_has_role(current_user, v_role, 'MEMBER') THEN
      EXECUTE format(
        'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE ALL ON TABLES FROM anon',
        v_role);
      EXECUTE format(
        'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon',
        v_role);
    END IF;
  END LOOP;
END $$;

-- 4) Verificação imediata dentro da própria migration: falha o deploy se algo
--    fora da allowlist continuar acessível a `anon`.
DO $$
DECLARE
  v_txt text;
BEGIN
  SELECT string_agg(format('%s(%s)', c.relname, g.privilege_type), ', ')
    INTO v_txt
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  CROSS JOIN LATERAL (
    SELECT unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) AS privilege_type
  ) g
  WHERE n.nspname = 'public'
    AND c.relkind IN ('r','v','m','p','f')
    AND has_table_privilege('anon', c.oid, g.privilege_type)
    AND NOT (c.relname = 'frontend_error_logs' AND g.privilege_type = 'INSERT');

  IF v_txt IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: privilégio residual de anon em public: %', v_txt;
  END IF;

  RAISE NOTICE 'PASS: superfície de privilégio de anon reduzida ao mínimo (apenas INSERT em frontend_error_logs).';
END $$;