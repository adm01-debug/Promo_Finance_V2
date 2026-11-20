-- Versiona a coluna `servico` em slo_metrics_diarias.
--
-- Produção já tem essa coluna (drift não versionado): ela é NOT NULL sem
-- default e é usada pela edge `calcular-slo-metrics-diario` há meses. Nenhuma
-- migration do repositório cria `slo_metrics_diarias.servico`, então um banco
-- reconstruído só pelas migrations não tem a coluna — e o upsert da edge
-- retornava 500 (coluna inexistente) nesses ambientes apesar de gravar OK em
-- produção.
--
-- Apontado por Codex (P2) e Devin (P2) na #478.
--
-- Esta migration é a fonte de verdade: compatível com produção (JÁ TEM a coluna,
-- IF NOT EXISTS é no-op) e habilita bancos versionados a aceitar o mesmo payload.
-- `DEFAULT 'geral'` garante que linhas históricas migradas ganhem o valor do
-- único escritor (a edge fixa `servico: 'geral'`), desnecessário em prod mas
-- correto em bancos recém-criados.
ALTER TABLE public.slo_metrics_diarias
  ADD COLUMN IF NOT EXISTS servico TEXT NOT NULL DEFAULT 'geral';
