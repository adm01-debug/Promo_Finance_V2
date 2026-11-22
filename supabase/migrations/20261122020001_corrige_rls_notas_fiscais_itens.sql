-- Corrige achado de segurança do Devin Review na PR #511: a policy única
-- FOR ALL usava empresa_acessivel() (nível de leitura, qualquer membro
-- ativo) para autorizar também INSERT/UPDATE/DELETE. notas_fiscais exige
-- role admin/financeiro/operacional para escrever; itens deve exigir o
-- mesmo, não só ser membro da empresa. Esquema final de
-- notas_fiscais_itens (após esta migration + a 20261122020002, que remove
-- o índice redundante): SELECT por qualquer membro ativo; escrita só com
-- role admin/financeiro/operacional; único índice extra além da PK é o do
-- constraint (nota_fiscal_id, n_item), que já cobre busca por nota.

drop policy if exists notas_fiscais_itens_empresa_acesso on public.notas_fiscais_itens;

create policy notas_fiscais_itens_select
  on public.notas_fiscais_itens
  for select
  using (
    exists (
      select 1 from public.notas_fiscais nf
      where nf.id = notas_fiscais_itens.nota_fiscal_id
        and public.empresa_acessivel(nf.empresa_id)
    )
  );

create policy notas_fiscais_itens_mutate
  on public.notas_fiscais_itens
  for all
  using (
    exists (
      select 1 from public.notas_fiscais nf
      where nf.id = notas_fiscais_itens.nota_fiscal_id
        and public.has_any_role(auth.uid(), array['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role])
        and public.empresa_membro_ativo(nf.empresa_id)
    )
  )
  with check (
    exists (
      select 1 from public.notas_fiscais nf
      where nf.id = notas_fiscais_itens.nota_fiscal_id
        and public.has_any_role(auth.uid(), array['admin'::app_role, 'financeiro'::app_role, 'operacional'::app_role])
        and public.empresa_membro_ativo(nf.empresa_id)
    )
  );
