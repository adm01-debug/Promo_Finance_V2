

## Plano — Modo Bulk no Sandbox SSO

### Diagnóstico

Hoje a aba **Simular** do `SSOSandboxPanel` testa 1 conjunto de claims por vez. Para validar mudanças de `claim_mapping`/`role_mappings` contra todo o time, o admin precisa rodar N simulações manuais. A edge `sso-test-login` já é idempotente e devolve um `preview` rico — falta um runner em lote no front + uma visão agregada.

### Comportamento

Nova terceira aba **"Lote"** ao lado de Simular / Histórico, com:

1. **Entrada de usuários** (qualquer um destes):
   - Editor JSON: array de objetos de claims (`[{email,name,groups}, ...]`).
   - Importar CSV (cabeçalho na 1ª linha, vírgula `;` ou `,`; coluna `groups` separada por `|`).
   - Botão "Carregar exemplo" (12 usuários sintéticos cobrindo: admin, financeiro, sem grupo, domínio bloqueado, e-mail malformado, grupos múltiplos).
   - Validador inline: contagem de linhas válidas / erros de parsing.

2. **Configuração** reaproveita os mesmos controles da aba Simular:
   - Provider + `useProviderConfig`, OU bloco manual (claim_mapping, allowed_domains, role_mappings, default_role).
   - Limite hard-coded: máx **200 usuários** por execução (proteção contra abuso da edge).

3. **Execução**:
   - Botão "Executar lote" dispara chamadas paralelas à `sso-test-login` em **batches de 5** (concurrency limit) com barra de progresso `processados/total`.
   - Cada chamada reusa o mesmo `payload` exceto `mock_claims`.
   - Falhas HTTP/network viram linha com `outcome='erro_rede'` no resumo (não derrubam o lote).
   - Botão "Cancelar" interrompe próximos batches (in-flight terminam).

4. **Resumo agregado** (cards no topo + tabela detalhada):
   - **KPIs**: Total · Seriam criados (JIT) · Já existem · Bloqueados · Sem e-mail · Erros de rede.
   - **Gráfico de barras horizontais** por motivo de bloqueio (ex.: domínio fora da allowlist, `auto_provision_users=false`, e-mail inválido, sem claim de e-mail).
   - **Distribuição de papéis resolvidos** (mini-bars: admin/financeiro/operacional/visualizador).
   - **Cobertura de grupos**: lista de `idp_group` que casou X usuários e regras que ficaram em 0 (sinaliza regra "morta").

5. **Tabela detalhada por usuário**:
   - Colunas: linha #, email mascarado, domínio, grupos, papel resolvido, grupo casado, outcome (badge), motivo (se bloqueado).
   - Filtro por outcome (chips) + busca por email/domínio.
   - Ações por linha: "Abrir no Simular" (envia esse usuário pra aba Simular preenchendo claims/config) e "Ver detalhes" (sheet com JSON completo, reusa `SandboxRunDetailSheet`).

6. **Persistência (opcional, fire-and-forget)**:
   - Toggle "Salvar runs no histórico" (default OFF para não poluir): quando ON, cada usuário do lote vira uma `sso_sandbox_runs` marcada com `batch_id` (uuid gerado no client) — permite filtrar o lote inteiro depois no Histórico.
   - **Migration leve**: adicionar coluna `batch_id uuid NULL` + índice em `sso_sandbox_runs`. Sem mudança em RLS.

7. **Exportar resumo**:
   - Botão "Exportar CSV" baixa `lote-sandbox-{YYYYMMDD-HHmm}.csv` com email mascarado, outcome, papel, grupo casado, motivo — útil pra anexar em ticket/auditoria.

### Critérios de aceite

1. Aba "Lote" carrega exemplo de 12 usuários e executa o lote em <8s (concurrency=5).
2. KPIs batem com a soma das linhas da tabela detalhada.
3. Filtros por outcome reduzem a tabela sem refetch.
4. Cancelar interrompe batches pendentes; barra de progresso reflete corretamente.
5. CSV exportado abre no Excel/Sheets em UTF-8 (com BOM) sem quebrar acentos.
6. Quando "Salvar no histórico" ON, todas as runs aparecem em Histórico filtráveis pelo `batch_id` (novo chip de filtro).
7. Lote acima de 200 usuários é rejeitado com mensagem clara.
8. Erros HTTP de uma linha não impedem o restante do lote.
9. "Abrir no Simular" preenche provider, config e claims daquele usuário e troca de aba — sem auto-simular.

### Detalhes técnicos

- **Runner**: `src/lib/sso/sandbox-bulk-runner.ts` — função `runBulk(users, basePayload, { concurrency, signal, onProgress })` retorna `Promise<BulkResult[]>`. Usa `AbortController` p/ cancelamento. Concurrency via fila simples (sem `p-limit`).
- **CSV**: parser próprio simples (`papaparse` não está no projeto e CSV aqui é trivial — header fixo `email,name,groups,...`).
- **Aggregator**: `src/lib/sso/sandbox-bulk-aggregator.ts` — recebe `BulkResult[]` e devolve `{ counts, byBlockReason, byRole, groupCoverage }`.
- **Histórico filter**: `useSSOSandboxRuns` ganha `batchId?` (filtro `eq('batch_id', ...)`).

### Não-escopo

- Sem mudanças na edge `sso-test-login` (ela já entrega tudo necessário).
- Sem rate-limit server-side novo — a edge já valida admin por chamada.
- Sem testes E2E; só unit no aggregator e no parser CSV.

### Arquivos

- ➕ migration `sso_sandbox_runs.batch_id` (coluna + índice).
- ➕ `src/lib/sso/sandbox-bulk-runner.ts`
- ➕ `src/lib/sso/sandbox-bulk-aggregator.ts`
- ➕ `src/lib/sso/__tests__/sandbox-bulk-aggregator.test.ts`
- ➕ `src/lib/sso/sandbox-csv.ts` (parse + export)
- ➕ `src/lib/sso/__tests__/sandbox-csv.test.ts`
- ➕ `src/components/admin/sso/sandbox/SandboxBulkPanel.tsx` (entrada + execução + cancelamento)
- ➕ `src/components/admin/sso/sandbox/SandboxBulkSummary.tsx` (KPIs + barras + cobertura)
- ➕ `src/components/admin/sso/sandbox/SandboxBulkTable.tsx` (tabela + filtros + ações)
- ✏️ `src/components/admin/sso/SSOSandboxPanel.tsx` (nova aba "Lote", handler `applyClaims` p/ "Abrir no Simular")
- ✏️ `src/hooks/useSSOSandboxRuns.ts` (suporte a `batchId` no filtro + persistência opcional)

