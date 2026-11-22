-- Corrige achado do Devin Review (PR #517): unique (ano, tributo, uf,
-- municipio_ibge) não deduplica CBS/IBS-UF porque NULL ≠ NULL em
-- constraints únicos do Postgres — permitia múltiplas linhas de CBS
-- nacional (uf e municipio_ibge nulos) para o mesmo ano. Substitui por
-- 3 índices únicos parciais, um por granularidade de tributo.

alter table public.catalogo_aliquota_referencia
  drop constraint catalogo_aliquota_referencia_uk;

create unique index catalogo_aliquota_referencia_cbs_uk
  on public.catalogo_aliquota_referencia (ano)
  where tributo = 'cbs';

create unique index catalogo_aliquota_referencia_ibs_uf_uk
  on public.catalogo_aliquota_referencia (ano, uf)
  where tributo = 'ibs_uf';

create unique index catalogo_aliquota_referencia_ibs_mun_uk
  on public.catalogo_aliquota_referencia (ano, municipio_ibge)
  where tributo = 'ibs_mun';
