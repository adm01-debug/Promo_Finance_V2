-- 11_pii_mask.sql — Gate #32: mascaramento LGPD de chave PIX em visões.
--
-- `chave_pix` é dado pessoal (frequentemente CPF/telefone/e-mail) e habilita
-- fraude de desvio de pagamento. Papéis operacionais/visualizadores não têm
-- necessidade legítima de ver o valor íntegro: as views devem entregar o valor
-- via CASE WHEN pode_ver_dado_sensivel() ... ELSE mascarar_chave_pix(...) END.
\pset format unaligned
\pset tuples_only on
\pset fieldsep '\t'

WITH viola AS (
  SELECT objeto FROM public.gate_32_pii_sem_mascara()
),
agg AS (
  SELECT count(*) AS n, string_agg(objeto, ', ' ORDER BY objeto) AS list FROM viola
)
SELECT 'pii.mask',
       CASE WHEN n = 0 THEN 'pass' ELSE 'fail' END,
       '0', n::text,
       CASE WHEN n = 0
            THEN 'nenhuma view expõe chave_pix sem mascaramento por papel'
            ELSE 'views com PII sem máscara: ' || COALESCE(list, '') END
FROM agg;
