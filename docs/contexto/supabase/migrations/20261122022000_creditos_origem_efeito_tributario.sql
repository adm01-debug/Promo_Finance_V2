create type public.origem_credito_tributario as enum ('xml_destacado', 'estimado', 'manual');

alter table public.creditos_tributarios
  add column origem public.origem_credito_tributario not null default 'estimado',
  add column efeito_tributario boolean not null default false,
  add column ano_fato_gerador integer;
