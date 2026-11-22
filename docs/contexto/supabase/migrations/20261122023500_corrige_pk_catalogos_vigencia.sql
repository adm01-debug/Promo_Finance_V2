-- Corrige achado do Devin Review (PR #516): PK só por código não permite
-- guardar múltiplas vigências do mesmo cclasstrib/ncm/nbs ao longo do
-- tempo, mas o sync (etapa 79) faz upsert por (código, início de
-- vigência). Troca a PK para o par em todos os 3 catálogos.

alter table public.catalogo_cclasstrib drop constraint catalogo_cclasstrib_pkey;
alter table public.catalogo_cclasstrib add primary key (cclasstrib, inicio_vigencia);

alter table public.catalogo_ncm drop constraint catalogo_ncm_pkey;
alter table public.catalogo_ncm add primary key (ncm, inicio_vigencia);

alter table public.catalogo_nbs drop constraint catalogo_nbs_pkey;
alter table public.catalogo_nbs add primary key (nbs, inicio_vigencia);
