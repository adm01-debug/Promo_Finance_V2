-- Etapa 34 do plano RT/RFB: grupo IS (Imposto Seletivo) por item.
-- p_is em fração decimal (0-1), mesmo padrão das colunas p_* da etapa 33.

alter table public.notas_fiscais_itens
  add column cst_is character(3),
  add column cclasstrib_is character(6),
  add column v_bc_is numeric(15,2),
  add column p_is numeric(5,4),
  add column ad_rem_is numeric(15,4),
  add column v_is numeric(15,2);
