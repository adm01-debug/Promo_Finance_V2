-- Responde achados não-segurança do Devin Review na PR #511:
-- 1) v_un_com em numeric(15,4) truncava o vUnCom do XML da NF-e (NT
--    2025.002 permite até 10 casas decimais) — amplia para numeric(21,10).
-- 2) índice separado em (nota_fiscal_id) era redundante com o índice do
--    constraint único (nota_fiscal_id, n_item), que já serve para busca
--    só por nota_fiscal_id — remove.

alter table public.notas_fiscais_itens
  alter column v_un_com type numeric(21,10);

drop index if exists public.notas_fiscais_itens_nota_fiscal_id_idx;
