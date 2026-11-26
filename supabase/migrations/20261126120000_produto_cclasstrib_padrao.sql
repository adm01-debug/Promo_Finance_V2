-- Etapa 86 do plano RT/RFB: cClassTrib padrao por produto.
--
-- Por que existe: o item de NF-e sem enquadramento escolhido assume tributacao
-- integral (`000001`) so por ter NCM de 8 digitos. Para produto com reducao
-- (cesta basica, brinde, regime especifico) isso sai errado em todo item
-- emitido: aliquota cheia no lugar da reduzida. Gravar o enquadramento por
-- produto decide isso uma vez, no cadastro, em vez de em cada nota.
--
-- O catalogo de produtos vive no Bling (e replicado), aqui fica so o
-- enquadramento; `ncm` e gravado junto para a sugestao "outro produto deste NCM
-- ja usa este cClassTrib", que e o unico criterio de sugestao honesto enquanto a
-- RFB nao publicar tabela NCM -> cClassTrib.
--
-- Chave: `produto_id` (id do Bling). Bling e uma conexao por conta, como
-- `bling_tokens`, entao a tabela segue o mesmo modelo de acesso: sem tenant por
-- empresa, com policy de admin/financeiro.
--
-- `codigo` e o SKU do produto no Bling: e o que o operador digita no item da
-- NF-e (o id interno nao aparece na tela). Sem ele gravado aqui o padrao nunca
-- era encontrado na emissao, porque a busca era feita pelo id.
--
-- REGRA 8: DDL de producao. Merge do arquivo nao aplica nada; a aplicacao passa
-- pelo prod-migrate.

create table public.produto_cclasstrib_padrao (
  produto_id text primary key,
  codigo text,
  ncm character(8),
  cst character(3) not null,
  cclasstrib character(6) not null,
  atualizado_em timestamptz not null default now(),
  atualizado_por uuid default auth.uid(),
  constraint produto_cclasstrib_padrao_cst_chk check (cst ~ '^[0-9]{3}$'),
  constraint produto_cclasstrib_padrao_cclasstrib_chk check (cclasstrib ~ '^[0-9]{6}$'),
  constraint produto_cclasstrib_padrao_ncm_chk check (ncm is null or ncm ~ '^[0-9]{8}$')
);

-- Sugestao por NCM: le os padroes do mesmo NCM de uma vez.
create index produto_cclasstrib_padrao_ncm_idx
  on public.produto_cclasstrib_padrao (ncm);

-- Enquadramento pelo SKU informado no item da NF-e.
create index produto_cclasstrib_padrao_codigo_idx
  on public.produto_cclasstrib_padrao (codigo);

grant select, insert, update, delete on public.produto_cclasstrib_padrao to authenticated;
grant all on public.produto_cclasstrib_padrao to service_role;

alter table public.produto_cclasstrib_padrao enable row level security;

create policy produto_cclasstrib_padrao_admin
  on public.produto_cclasstrib_padrao
  for all
  to authenticated
  using (public.has_any_role(auth.uid(), array['admin'::public.app_role, 'financeiro'::public.app_role]))
  with check (public.has_any_role(auth.uid(), array['admin'::public.app_role, 'financeiro'::public.app_role]));