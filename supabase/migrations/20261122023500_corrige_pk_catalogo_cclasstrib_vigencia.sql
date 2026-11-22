-- Corrige achado do Devin Review (PR #516): PK só por cclasstrib não
-- permite guardar múltiplas vigências do mesmo código ao longo do tempo,
-- mas o sync (etapa 79) faz upsert por (código, início de vigência).

alter table public.catalogo_cclasstrib drop constraint catalogo_cclasstrib_pkey;
alter table public.catalogo_cclasstrib add primary key (cclasstrib, inicio_vigencia);
