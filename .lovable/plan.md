

## Plano — Diff visual antes/depois nos registros de auditoria

Hoje os dois drill-downs existentes (`AuditLogTable` e `AuditDetailDialog`) só mostram dois `<pre>` lado a lado com `JSON.stringify`. Não há destaque do que mudou nem identificação dos campos relevantes. Vou adicionar um componente reutilizável de diff e integrá-lo nos dois pontos.

### Arquivos

**1. Novo `src/lib/audit-diff.ts`** — utilitário puro, sem dependências externas:
- `computeDiff(antes, depois)` → retorna `{ added: Field[], removed: Field[], changed: Field[], unchanged: Field[] }`
- Compara recursivamente apenas chaves de 1º nível (objetos aninhados viram JSON string para comparação) — evita explosão visual.
- Ignora chaves técnicas: `created_at`, `updated_at`, `id`, `*_id` permanecem mas vão para `unchanged` por padrão.
- `extractCamposChave(registro)` → retorna lista priorizada (valor, status, descrição, numero, competencia, empresa_id, user_email) presentes em `new_data` ou no próprio registro.

**2. Novo `src/components/audit/AuditDiffView.tsx`**
```text
┌─ Campos-chave ──────────────────┐
│ [valor] R$ 12.500,00            │ ← chips destacando o que justifica a ação
│ [status] pendente → aprovado    │
└─────────────────────────────────┘
┌─ Alterações (3) ────────────────┐
│ ▼ status                        │
│   - "pendente"  + "aprovado"    │ ← linha vermelha / verde
│ ▼ valor                         │
│   - 10000  + 12500              │
└─────────────────────────────────┘
┌─ Adicionados (1) / Removidos (0)
└─ ▸ Ver JSON bruto (collapsible) │ ← mantém o pre antigo escondido
```
- Usa tokens semânticos: `bg-destructive/10 text-destructive` para removido, `bg-success/10 text-success` para adicionado, `bg-accent/10` para alterado.
- Quando só existe `new_data` (INSERT) ou só `old_data` (DELETE), mostra a tabela de campos sem comparação e marca "Criação" / "Exclusão".
- Formata valores: number com `Intl.NumberFormat`, datas ISO via `formatDate`, boolean → "Sim/Não", objetos → `<pre>` truncado.

**3. Integrar em `src/components/audit/AuditLogTable.tsx`**
- Substituir os dois blocos `<pre>{JSON.stringify(log.old_data...)}` por `<AuditDiffView old={log.old_data} new={log.new_data} action={log.action} />`.
- Manter metadados (ação, tabela, usuário, IP, detalhes) no topo.

**4. Integrar em `src/components/compliance/AuditDetailDialog.tsx`**
- Substituir os dois `<pre>` Antes/Depois por `<AuditDiffView old={antes} new={depois} />`.
- Manter o grid de metadados existente.

### Sem alterações
- Nenhuma migration. Estrutura de `audit_logs` / `auditoria_financeira` / `auditoria_tributaria` já tem `old_data`/`new_data` (e variantes `payload_anterior`/`payload_novo`, `dados_antigos`/`dados_novos`) — `AuditDetailDialog` já normaliza isso e passa pronto.
- Hook `useTrilhaAuditoria` segue igual.
- Sem novas dependências (diff feito à mão, sem `jsondiffpatch`).

### Critério de pronto
- Abrir um registro UPDATE em `/admin/compliance` → ver lista de campos alterados com cor antes/depois, e chips dos campos-chave no topo.
- Registro INSERT mostra "Criação" + tabela de valores novos.
- Registro DELETE mostra "Exclusão" + valores anteriores.
- JSON bruto continua acessível via collapsible para auditoria forense.

