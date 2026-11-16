-- Preenche partidas_contabeis.empresa_id a partir do lancamento pai.
--
-- Estado encontrado no canonico bwwbeyolnnzppeuhgkcd: 42 das 102 partidas
-- estavam com empresa_id NULL. Sao legado — a ultima NULL e de 2026-07-29 e a
-- primeira preenchida e de 2026-11-12; supabase/functions/contabilizar-evento/
-- index.ts:233 ja grava a coluna, logo o caminho de escrita atual nao produz
-- mais linha sem empresa.
--
-- Por que importa: as policies de partidas_contabeis dependem dessa coluna —
-- partidas_select, partidas_insert, partidas_update e partidas_delete usam
-- empresa_acessivel(empresa_id), e empresa_acessivel(NULL) devolve false
-- (conferido). Enquanto 41% das linhas estiver NULL a coluna nao serve como
-- chave de isolamento por empresa, e qualquer leitura ou relatorio que passe a
-- filtrar partidas por empresa_id perde essas linhas.
--
-- A empresa vem do proprio lancamento, nao de inferencia: conferido que as 42
-- NULL tem lancamento com empresa_id preenchido, e que ZERO partida ja
-- preenchida divergia da empresa do seu lancamento. O UPDATE abaixo nao amplia
-- a visibilidade de ninguem: a policy permissiva "Partidas scoped by
-- lancamento" ja concedia acesso por lc.empresa_id IN (empresas do usuario),
-- que e exatamente o valor copiado.
--
-- Aplicado em producao em 2026-11-16, com dry-run em transacao revertida antes:
--   null_antes=42 atualizadas=42 null_depois=0
--   partidas_divergentes_do_lancamento=0
-- Estado conferido depois: ainda_null=0 total=102 divergentes=0.
--
-- Idempotente: o WHERE empresa_id IS NULL faz dele no-op em qualquer reexecucao,
-- e em ambiente reconstruido (sem dados) tambem.
-- Guard de coluna: em ambiente reconstruido partidas_contabeis.empresa_id so
-- nasce em 20260825130000_fixes_phd_validation.sql:25, arquivo que hoje ainda
-- aborta no replay. Sem o guard, este UPDATE levantava
--   ERROR: column p.empresa_id does not exist
-- e virava o 14o bloqueio da cadeia — um que EU introduzi. Medido no replay.
DO $bf$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'partidas_contabeis'
       AND column_name = 'empresa_id'
  ) THEN
    RAISE NOTICE 'partidas_contabeis.empresa_id ausente: backfill ignorado';
    RETURN;
  END IF;

  UPDATE public.partidas_contabeis p
     SET empresa_id = l.empresa_id
    FROM public.lancamentos_contabeis l
   WHERE l.id = p.lancamento_id
     AND p.empresa_id IS NULL
     AND l.empresa_id IS NOT NULL;
END
$bf$;
