-- Etapa 36 do plano RT/RFB: origem e efeito tributário dos créditos.
-- Backfill dos 12 créditos existentes (contados antes desta migration) é
-- implícito: ADD COLUMN ... NOT NULL DEFAULT já preenche as linhas atuais
-- (Postgres 11+), sem precisar de UPDATE separado.

create type public.origem_credito_tributario as enum ('xml_destacado', 'estimado', 'manual');

alter table public.creditos_tributarios
  add column origem public.origem_credito_tributario not null default 'estimado',
  add column efeito_tributario boolean not null default false,
  add column ano_fato_gerador integer;
