create table public.catalogo_ncm (
  ncm character varying(8) primary key,
  descricao text not null,
  inicio_vigencia date not null,
  fim_vigencia date,
  fonte text not null default 'RFB',
  carregado_em timestamptz not null default now()
);

create table public.catalogo_nbs (
  nbs text primary key,
  descricao text not null,
  inicio_vigencia date not null,
  fim_vigencia date,
  fonte text not null default 'RFB',
  carregado_em timestamptz not null default now()
);

create table public.catalogo_aliquota_referencia (
  id uuid primary key default gen_random_uuid(),
  ano integer not null,
  tributo text not null check (tributo in ('cbs', 'ibs_uf', 'ibs_mun')),
  uf character(2),
  municipio_ibge character varying(7),
  aliquota numeric(5,4) not null,
  fonte text not null default 'RFB',
  carregado_em timestamptz not null default now(),
  constraint catalogo_aliquota_referencia_uk unique (ano, tributo, uf, municipio_ibge)
);

alter table public.catalogo_ncm enable row level security;
alter table public.catalogo_nbs enable row level security;
alter table public.catalogo_aliquota_referencia enable row level security;

create policy catalogo_ncm_select_authenticated
  on public.catalogo_ncm for select to authenticated using (true);
create policy catalogo_ncm_service_role_all
  on public.catalogo_ncm for all to service_role using (true) with check (true);

create policy catalogo_nbs_select_authenticated
  on public.catalogo_nbs for select to authenticated using (true);
create policy catalogo_nbs_service_role_all
  on public.catalogo_nbs for all to service_role using (true) with check (true);

create policy catalogo_aliquota_referencia_select_authenticated
  on public.catalogo_aliquota_referencia for select to authenticated using (true);
create policy catalogo_aliquota_referencia_service_role_all
  on public.catalogo_aliquota_referencia for all to service_role using (true) with check (true);
