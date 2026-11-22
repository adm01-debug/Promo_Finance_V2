-- Etapa 37 do plano RT/RFB: espelho local da tabela CLASSIFICACAO_TRIBUTARIA
-- da RFB (IT 2025.002+). p_red_* em fração decimal (0-1), mesmo padrão das
-- etapas 33-34.

create table public.catalogo_cclasstrib (
  cclasstrib character(6) primary key,
  cst character(3) not null,
  descricao text not null,
  p_red_cbs numeric(5,4) not null default 0,
  p_red_ibs_uf numeric(5,4) not null default 0,
  p_red_ibs_mun numeric(5,4) not null default 0,
  exige_gibscbs boolean not null default false,
  ind_dir smallint,
  inicio_vigencia date not null,
  fim_vigencia date,
  versao_it text not null,
  created_at timestamptz not null default now()
);

alter table public.catalogo_cclasstrib enable row level security;

create policy catalogo_cclasstrib_select_authenticated
  on public.catalogo_cclasstrib
  for select
  to authenticated
  using (true);

create policy catalogo_cclasstrib_service_role_all
  on public.catalogo_cclasstrib
  for all
  to service_role
  using (true)
  with check (true);
