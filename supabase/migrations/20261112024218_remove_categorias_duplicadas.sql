-- Remove categorias duplicadas (mesma empresa + nome + tipo). Mantém a que tem
-- mais uso (desempate: a mais antiga), repassa todas as referências para ela e
-- apaga a cópia. Idempotente.
CREATE TEMP TABLE _cat_map ON COMMIT DROP AS
WITH uso AS (
  SELECT c.id, c.empresa_id, c.nome, c.tipo, c.created_at,
         (SELECT count(*) FROM public.contas_pagar   WHERE categoria_id = c.id)
       + (SELECT count(*) FROM public.contas_receber WHERE categoria_id = c.id)
       + (SELECT count(*) FROM public.regras_contabilizacao_automatica WHERE categoria_id = c.id) AS refs
  FROM public.categorias c
), rank AS (
  SELECT *, first_value(id) OVER (PARTITION BY empresa_id, nome, tipo
                                  ORDER BY refs DESC, created_at, id) AS manter
  FROM uso
)
SELECT id AS remover, manter FROM rank WHERE id <> manter;

UPDATE public.contas_pagar t SET categoria_id = m.manter FROM _cat_map m WHERE t.categoria_id = m.remover;
UPDATE public.contas_receber t SET categoria_id = m.manter FROM _cat_map m WHERE t.categoria_id = m.remover;
UPDATE public.regras_contabilizacao_automatica t SET categoria_id = m.manter FROM _cat_map m WHERE t.categoria_id = m.remover;
UPDATE public.categorias k SET plano_conta_id = COALESCE(k.plano_conta_id, d.plano_conta_id)
  FROM _cat_map m JOIN public.categorias d ON d.id = m.remover WHERE k.id = m.manter;
DELETE FROM public.categorias c USING _cat_map m WHERE c.id = m.remover;
