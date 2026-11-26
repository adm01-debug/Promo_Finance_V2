-- Etapa 82 do plano RT/RFB: espelho local das fundamentacoes legais por
-- cClassTrib/CST publicadas na API publica de dados abertos da RFB
-- (`/fundamentacoes-legais?data=`).
--
-- Por que existe: `catalogo_cclasstrib` diz **quanto** cada cClassTrib reduz
-- (p_red_*), nao **por que**. Sem a fundamentacao, o alerta fiscal do item
-- aponta a divergencia e nao a norma, e o contribuinte nao tem como conferir a
-- classificacao que o sistema questionou.
--
-- Chave natural (cclasstrib, cst, conjunto_tributo, inicio_vigencia): a mesma
-- combinacao cClassTrib/CST se repete por conjunto de tributos ("CBS e IBS" e
-- os conjuntos de um tributo so) e muda de vigencia. Sem `conjunto_tributo` na
-- chave, a segunda linha do mesmo par sobrescreveria a primeira.
--
-- `inicio_vigencia` fixo em 2026-01-01, como os demais catalogos (etapas
-- 79-81): a API nao publica desde quando o texto vale, e gravar uma linha por
-- ano faria o recorte de vigencia casar duas linhas do mesmo codigo.
--
-- REGRA 8: DDL de producao. Merge do arquivo nao aplica nada; a aplicacao passa
-- pelo prod-migrate.

create table public.catalogo_fundamentacao (
  cclasstrib character(6) not null,
  cst character(3) not null,
  conjunto_tributo text not null,
  descricao_cclasstrib text,
  descricao_cst text,
  texto text,
  texto_curto text,
  referencia_normativa text,
  inicio_vigencia date not null,
  fim_vigencia date,
  versao_it text not null,
  created_at timestamptz not null default now(),
  constraint catalogo_fundamentacao_pkey
    primary key (cclasstrib, cst, conjunto_tributo, inicio_vigencia)
)

-- Recorte por vigencia: e assim que `buscarFundamentosLegais` (etapa 82) e o
-- encerramento por ausencia do sync leem a tabela.
create index catalogo_fundamentacao_vigencia_idx
  on public.catalogo_fundamentacao (inicio_vigencia, fim_vigencia)

alter table public.catalogo_fundamentacao enable row level security

create policy catalogo_fundamentacao_select_authenticated
  on public.catalogo_fundamentacao
  for select
  to authenticated
  using (true)

create policy catalogo_fundamentacao_service_role_all
  on public.catalogo_fundamentacao
  for all
  to service_role
  using (true)
  with check (true)
