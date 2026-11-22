-- Corrige achado do Devin Review (PR #516, mesmo padrão aplicado a
-- catalogo_cclasstrib): PK só pelo código não permite guardar múltiplas
-- vigências. Idempotente — já foi aplicado como parte da migration
-- 20261122023500 nesta sessão; este arquivo deixa o histórico do PR #517
-- (catalogo_ncm/catalogo_nbs) consistente com o que está em produção.

alter table public.catalogo_ncm drop constraint catalogo_ncm_pkey;
alter table public.catalogo_ncm add primary key (ncm, inicio_vigencia);

alter table public.catalogo_nbs drop constraint catalogo_nbs_pkey;
alter table public.catalogo_nbs add primary key (nbs, inicio_vigencia);
