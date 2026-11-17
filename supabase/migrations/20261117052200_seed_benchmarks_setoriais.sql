-- Semeia o catalogo setorial, que estava VAZIO em producao.
--
-- O unico seed existente (20260417155857_...sql:79-90) nunca rodou contra a
-- tabela atual: ele insere em `margem_media_pct` e `ano_referencia`, colunas que
-- a tabela de producao nao tem. Resultado: 0 linhas, e as duas funcoes que
-- consultam o catalogo caiam sempre na faixa de referencia interna.
--
-- Os valores sao os daquele seed (fonte IBPT 2024), remapeados para o
-- vocabulario que o CHECK da tabela exige:
--   simples -> simples_nacional | presumido -> lucro_presumido | real -> lucro_real
--
-- `carga_p25_pct`, `carga_p75_pct` e `mediana` ficam NULAS de proposito: a fonte
-- original nao traz percentis, e inventar faixa em volta da media seria
-- exatamente o tipo de numero fabricado que as PRs #403 e #408 removeram.
-- Consequencia conhecida e aceita: `comparar-benchmark-setorial` exige os tres
-- percentis para usar a linha da tabela, entao o CARD do dashboard continua
-- declarando faixa de referencia interna; `gerar-alertas-tributarios`, que usa
-- so `carga_media_pct`, passa a comparar com dado setorial de verdade.
--
-- `indicador` e obrigatorio na tabela de producao (NOT NULL herdado do schema
-- antigo) e recebe o que a linha mede.
--
-- Idempotente pela chave `benchmark_unico (cnae_prefix, regime, vigencia_inicio)`.
-- Aplicado em producao antes deste arquivo (AGENTS.md secao 4). Verificado: 8
-- linhas, todas com fonte 'IBPT 2024' e vigencia 2026-01-01.
INSERT INTO public.benchmarks_setoriais
  (indicador, cnae_prefix, setor, regime, carga_media_pct, fonte, vigencia_inicio)
VALUES
  ('carga_tributaria_total', '47', 'Comércio Varejista', 'simples_nacional', 6.5, 'IBPT 2024', '2026-01-01'),
  ('carga_tributaria_total', '47', 'Comércio Varejista', 'lucro_presumido', 11.3, 'IBPT 2024', '2026-01-01'),
  ('carga_tributaria_total', '47', 'Comércio Varejista', 'lucro_real', 14.8, 'IBPT 2024', '2026-01-01'),
  ('carga_tributaria_total', '10', 'Indústria de Alimentos', 'lucro_presumido', 13.5, 'IBPT 2024', '2026-01-01'),
  ('carga_tributaria_total', '10', 'Indústria de Alimentos', 'lucro_real', 16.2, 'IBPT 2024', '2026-01-01'),
  ('carga_tributaria_total', '62', 'Tecnologia / Software', 'simples_nacional', 8.7, 'IBPT 2024', '2026-01-01'),
  ('carga_tributaria_total', '62', 'Tecnologia / Software', 'lucro_presumido', 13.3, 'IBPT 2024', '2026-01-01'),
  ('carga_tributaria_total', '69', 'Atividades Jurídicas/Contábeis', 'simples_nacional', 12.5, 'IBPT 2024', '2026-01-01')
ON CONFLICT (cnae_prefix, regime, vigencia_inicio) DO NOTHING;
