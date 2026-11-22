alter table public.notas_fiscais
  add column v_bc_ibscbs numeric(15,2),
  add column v_ibs numeric(15,2),
  add column v_ibs_uf numeric(15,2),
  add column v_ibs_mun numeric(15,2),
  add column v_cbs numeric(15,2),
  add column v_is numeric(15,2);

create or replace function public.verificar_totais_ibscbs_nota()
returns trigger
language plpgsql
set search_path to 'public'
as $$
declare
  v_soma record;
begin
  if new.v_bc_ibscbs is null and new.v_ibs is null and new.v_ibs_uf is null
     and new.v_ibs_mun is null and new.v_cbs is null and new.v_is is null then
    return new;
  end if;

  select
    coalesce(sum(v_bc_ibscbs), 0) as v_bc_ibscbs,
    coalesce(sum(v_ibs), 0) as v_ibs,
    coalesce(sum(v_ibs_uf), 0) as v_ibs_uf,
    coalesce(sum(v_ibs_mun), 0) as v_ibs_mun,
    coalesce(sum(v_cbs), 0) as v_cbs,
    coalesce(sum(v_is), 0) as v_is
  into v_soma
  from public.notas_fiscais_itens
  where nota_fiscal_id = new.id;

  if coalesce(new.v_bc_ibscbs, 0) <> v_soma.v_bc_ibscbs
     or coalesce(new.v_ibs, 0) <> v_soma.v_ibs
     or coalesce(new.v_ibs_uf, 0) <> v_soma.v_ibs_uf
     or coalesce(new.v_ibs_mun, 0) <> v_soma.v_ibs_mun
     or coalesce(new.v_cbs, 0) <> v_soma.v_cbs
     or coalesce(new.v_is, 0) <> v_soma.v_is
  then
    raise exception 'rejeicao_1091_total_divergente_dos_itens'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

create trigger notas_fiscais_verifica_totais_ibscbs
  before insert or update of v_bc_ibscbs, v_ibs, v_ibs_uf, v_ibs_mun, v_cbs, v_is
  on public.notas_fiscais
  for each row
  execute function public.verificar_totais_ibscbs_nota();
