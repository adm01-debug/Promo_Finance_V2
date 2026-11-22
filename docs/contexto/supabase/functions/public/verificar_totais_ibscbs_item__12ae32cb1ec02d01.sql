CREATE OR REPLACE FUNCTION public.verificar_totais_ibscbs_item()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.verificar_totais_ibscbs_por_id(new.nota_fiscal_id);
  end if;
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and old.nota_fiscal_id <> new.nota_fiscal_id) then
    perform public.verificar_totais_ibscbs_por_id(old.nota_fiscal_id);
  end if;
  return coalesce(new, old);
end;
$function$
