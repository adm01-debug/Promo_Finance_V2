

## Plano — Métrica de "Provisionamentos JIT" no SSOMetricsPanel

### Diagnóstico

Hoje o `SSOMetricsPanel` (`src/components/admin/sso/SSOMetricsPanel.tsx`) calcula 4 KPIs sobre `sso_login_attempts` dos últimos 7 dias: total, taxa de sucesso, usuários únicos e latência média. Não há visibilidade de quantos desses logins efetivamente **criaram** um novo usuário via JIT.

O `sso-callback` já marca esses eventos: quando `applyPipeline` retorna `jitCreated: true`, o `logAttempt` de sucesso enriquece o registro com `error_code = 'jit_provisioned'` (e o `context.jit_created = true` na coluna JSONB). Ou seja, o dado já existe — falta apenas exibir.

### Comportamento

1. Adicionar 1 KPI extra ao painel: **"Provisionamentos JIT"** (últimos 7d), com ícone `UserPlus` e contagem de tentativas onde `success = true` **e** (`error_code === 'jit_provisioned'` **ou** `context?.jit_created === true`). O OR garante compatibilidade com registros novos (que usam `context`) e com a convenção atual (`error_code`).
2. Subtítulo em texto pequeno mostrando a taxa: `X% dos logins` (jitCount / totalSucessos × 100), para dar contexto sem poluir.
3. Reorganizar o grid de KPIs de `md:grid-cols-4` para `md:grid-cols-5` para acomodar o novo card sem quebrar o layout em mobile (continua 1 coluna no xs, ajusta em md+).
4. Adicionar uma série extra ao gráfico "Logins SSO últimos 7 dias": linha pontilhada **"JIT"** com a contagem diária de provisionamentos, usando `hsl(var(--accent))`. Isso permite ver visualmente picos de onboarding em massa (ex: rollout de novo IdP).
5. Nas "Últimas tentativas", quando o registro for um JIT, exibir um badge extra **"JIT"** ao lado do badge do provider (variant `secondary`), para o admin reconhecer rapidamente onboarding events na lista.

### Detalhes técnicos

**Edit em `src/components/admin/sso/SSOMetricsPanel.tsx`**:

- Importar `UserPlus` de `lucide-react`.
- No `useMemo`, derivar:
  ```ts
  const isJit = (a) => a.success && (a.error_code === 'jit_provisioned' || (a.context as any)?.jit_created === true);
  const jitCount = last7.filter(isJit).length;
  const jitRate = successCount ? (jitCount / successCount) * 100 : 0;
  ```
- Estender `byDay` para acumular `jit` por dia, em paralelo a `success`/`fail`.
- Adicionar 5º `<KPI>` no grid (mudar para `md:grid-cols-5`) com `value={jitCount}` e um subtítulo opcional. Pequeno ajuste no componente `KPI` para aceitar um `hint?: string` opcional renderizado abaixo do valor (`text-xs text-muted-foreground`).
- Adicionar `<Line dataKey="jit" stroke="hsl(var(--accent))" strokeDasharray="4 4" name="Provisionamentos JIT" />` no `LineChart`.
- Na lista de "Últimas tentativas", renderizar `{isJit(a) && <Badge variant="secondary" className="text-xs">JIT</Badge>}`.

**Sem migrations, sem mudanças de schema, sem novas queries**: o hook `useSSOLoginAttempts(500)` já traz `error_code` e `context` (a tabela tem essas colunas e o select é `*`). Verificarei o hook em implementação para confirmar.

### Critério de pronto

1. KPI "Provisionamentos JIT" aparece no painel com a contagem correta de últimos 7 dias.
2. O subtítulo mostra a porcentagem em relação aos logins bem-sucedidos.
3. Gráfico de série temporal exibe a 3ª linha (JIT) tracejada, sobreposta às curvas de sucesso/falha.
4. Tentativas JIT na lista exibem o badge "JIT" extra.
5. Layout permanece responsivo (1 col mobile, 5 cols desktop).
6. Sem regressão nos 4 KPIs existentes nem no PieChart por provedor.

### Arquivos

- ✏️ `src/components/admin/sso/SSOMetricsPanel.tsx`

