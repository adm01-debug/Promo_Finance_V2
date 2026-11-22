create table public.notas_fiscais_itens (
  id uuid primary key default gen_random_uuid(),
  nota_fiscal_id uuid not null references public.notas_fiscais(id) on delete cascade,
  n_item integer not null,
  c_prod text not null,
  ncm character varying(8) not null,
  cfop character varying(4) not null,
  q_com numeric(15,4) not null default 0,
  v_un_com numeric(15,4) not null default 0,
  v_prod numeric(15,2) not null default 0,
  created_at timestamptz not null default now(),
  constraint notas_fiscais_itens_nota_item_uk unique (nota_fiscal_id, n_item)
);

create index notas_fiscais_itens_nota_fiscal_id_idx
  on public.notas_fiscais_itens (nota_fiscal_id);

alter table public.notas_fiscais_itens enable row level security;

create policy notas_fiscais_itens_empresa_acesso
  on public.notas_fiscais_itens
  for all
  using (
    exists (
      select 1 from public.notas_fiscais nf
      where nf.id = notas_fiscais_itens.nota_fiscal_id
        and public.empresa_acessivel(nf.empresa_id)
    )
  )
  with check (
    exists (
      select 1 from public.notas_fiscais nf
      where nf.id = notas_fiscais_itens.nota_fiscal_id
        and public.empresa_acessivel(nf.empresa_id)
    )
  );
