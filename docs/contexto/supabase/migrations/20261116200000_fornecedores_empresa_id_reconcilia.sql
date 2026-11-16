-- fornecedores.empresa_id: a coluna que o repositorio declara e producao nao tem.
--
-- 20260317000844_6d9ca04a-...sql:80 ja traz
--   ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS empresa_id UUID
--     REFERENCES public.empresas(id);
-- mas o banco canonico bwwbeyolnnzppeuhgkcd NAO tem a coluna (20 colunas em
-- information_schema.columns, nenhuma e empresa_id). Divergencia repositorio x
-- producao, nao mudanca de modelo: esta migration faz producao chegar onde a
-- cadeia ja diz que ela deveria estar.
--
-- BUG EM PRODUCAO que isso conserta. A funcao nfe_create_conta_pagar_from_nfe,
-- que existe em producao, faz nas linhas 39-40 do seu corpo:
--   INSERT INTO public.fornecedores (razao_social, cnpj, empresa_id, user_id)
--   VALUES (coalesce(v_nfe.razao_emitente, v_cnpj), v_cnpj, v_nfe.empresa_id, auth.uid())
-- PL/pgSQL planeja statement na primeira execucao, entao a funcao foi criada
-- sem erro e falha em tempo de execucao. Provado em transacao revertida:
--   ERROR 42703: column "empresa_id" of relation "fornecedores" does not exist
-- Consequencia pratica: transformar NF-e em conta a pagar funciona quando o
-- fornecedor ja esta cadastrado (o SELECT da linha 34 acha e pula o INSERT) e
-- FALHA para todo emitente novo. Ha 31 NF-e em nfe_recebidas.
--
-- Coluna NULLABLE de proposito: as linhas existentes ficam com NULL e seguem
-- visiveis pelas 4 policies owner-based que producao tem hoje
-- (fornecedores_owner_select/insert/update/delete, todas (SELECT auth.uid()) = user_id).
-- NENHUMA policy e criada ou alterada aqui: a policy por tenant
-- ("Operacional+ podem ver fornecedores" com empresa_acessivel(empresa_id),
-- 20260902210000_fix_rls_cross_tenant_leak_grupo_b1.sql:127) tambem nao existe
-- em producao, e criar passaria a mostrar fornecedor de colega — mudanca de
-- quem ve o que, decisao do dono, fora do escopo deste conserto.

ALTER TABLE public.fornecedores
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES public.empresas(id)

CREATE INDEX IF NOT EXISTS idx_fornecedores_empresa_id
  ON public.fornecedores(empresa_id)
