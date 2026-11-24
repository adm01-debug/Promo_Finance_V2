-- Amplia a escala das aliquotas em fracao guardadas por item.
--
-- `20261122020500_grupo_ibscbs_por_item.sql` criou `p_ibs_uf/p_ibs_mun/p_cbs/
-- p_red_aliq/p_aliq_efet` como numeric(5,4) e `20261122021000_grupo_is_por_item`
-- criou `p_is` com a mesma escala. Quatro casas decimais em fracao significam
-- duas casas em percentual (0,0001 = 0,01%), e o leiaute do IBS/CBS tem
-- aliquota efetiva com mais precisao que isso: o IBS estadual de 0,05% previsto
-- para 2027-2028 com reducao de 30% resulta em 0,035%, isto e, fracao 0,00035.
--
-- O efeito era silencioso: a nota destacava 0,035% (R$ 3,50 sobre R$ 10.000,00)
-- e o item era gravado com 0,04% (R$ 4,00 sobre a mesma base), enquanto
-- `v_ibs_uf` continuava com o valor declarado pelo emitente. Item e nota
-- divergiam sem nenhum gate acusar, e o credito por item saia da aliquota
-- arredondada.
--
-- numeric(7,6) acomoda fracao com seis casas (0,000001 = 0,0001%) mantendo
-- folga no inteiro (limite 9,999999) para aliquota cheia de 2033.
--
-- A troca de tipo reescreve a tabela sob ACCESS EXCLUSIVE. Em producao a tabela
-- esta vazia: ela nasceu em 20261122020000 (#511) e os dois unicos caminhos de
-- escrita — 20261122160000 e 20261124095500 — entram no mesmo deploy, sempre
-- depois deste horario; o trigger de totais (20261122021500) apenas le. Ainda
-- assim o ALTER nao pode virar fila de bloqueio do app: lock_timeout curto faz
-- a migration falhar rapido (e o deploy parar) em vez de segurar a tabela.
SET lock_timeout = '5s';

ALTER TABLE public.notas_fiscais_itens
  ALTER COLUMN p_ibs_uf   TYPE numeric(7,6),
  ALTER COLUMN p_ibs_mun  TYPE numeric(7,6),
  ALTER COLUMN p_cbs      TYPE numeric(7,6),
  ALTER COLUMN p_red_aliq TYPE numeric(7,6),
  ALTER COLUMN p_aliq_efet TYPE numeric(7,6),
  ALTER COLUMN p_is       TYPE numeric(7,6);
