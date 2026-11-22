-- Corrige achado do Devin Review (PR #514, bug): o trigger de conferência de
-- totais IBS/CBS/IS (etapa 35) só disparava ao gravar as colunas de totais
-- na própria nota (notas_fiscais). Um INSERT/UPDATE/DELETE feito só em
-- notas_fiscais_itens não revalidava a nota, deixando um total divergente
-- persistido até a próxima gravação no cabeçalho.

create or replace function public.verificar_totais_ibscbs_por_id(p_nota_id uuid)
returns void
language plpgsql
set search_path to 'public'
as $$
declare
  v_nota record;
  v_soma record;
begin
  select v_bc_ibscbs, v_ibs, v_ibs_uf, v_ibs_mun, v_cbs, v_is
    into v_nota
    from public.notas_fiscais
    where id = p_nota_id;

  if v_nota is null then
    return;
  end if;

  if v_nota.v_bc_ibscbs is null and v_nota.v_ibs is null and v_nota.v_ibs_uf is null
     and v_nota.v_ibs_mun is null and v_nota.v_cbs is null and v_nota.v_is is null then
    return;
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
  where nota_fiscal_id = p_nota_id;

  if coalesce(v_nota.v_bc_ibscbs, 0) <> v_soma.v_bc_ibscbs
     or coalesce(v_nota.v_ibs, 0) <> v_soma.v_ibs
     or coalesce(v_nota.v_ibs_uf, 0) <> v_soma.v_ibs_uf
     or coalesce(v_nota.v_ibs_mun, 0) <> v_soma.v_ibs_mun
     or coalesce(v_nota.v_cbs, 0) <> v_soma.v_cbs
     or coalesce(v_nota.v_is, 0) <> v_soma.v_is
  then
    raise exception 'rejeicao_1091_total_divergente_dos_itens'
      using errcode = '22023';
  end if;
end;
$$;

create or replace function public.verificar_totais_ibscbs_item()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.verificar_totais_ibscbs_por_id(new.nota_fiscal_id);
  end if;
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and old.nota_fiscal_id <> new.nota_fiscal_id) then
    perform public.verificar_totais_ibscbs_por_id(old.nota_fiscal_id);
  end if;
  return coalesce(new, old);
end;
$$;

create trigger notas_fiscais_itens_verifica_totais_ibscbs
  after insert or update or delete
  on public.notas_fiscais_itens
  for each row
  execute function public.verificar_totais_ibscbs_item();
