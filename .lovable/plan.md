

## Plano — Mascaramento opcional de `ip_address` em listas e detalhes

### Diagnóstico

Hoje o campo `ip_address` é exibido **em texto puro** em várias telas administrativas/segurança:

- `src/components/audit/AuditLogTable.tsx` — coluna "Usuário" e bloco "Detalhes".
- `src/pages/AuditLogs.tsx` — coluna "IP" e exportações CSV/PDF.
- `src/components/security/rate-limit/BlockedIPsTab.tsx` — coluna principal e filtragem por substring.
- `src/components/security/RateLimitDashboard.tsx` — filtragem `log.ip_address.includes(...)` e listas.
- `src/components/auth/MFASettings.tsx` — sessões ativas do próprio usuário.
- `src/components/compliance/AuditDetailDialog.tsx` — metadata grid mostra `ip_address` cru.

A filtragem em todas essas telas é **substring** (`.includes`/`.ilike`) e o requisito é manter o filtro funcionando contra o IP **original** mesmo quando a exibição estiver mascarada.

### Abordagem

**1. Helper compartilhado e testável**

`src/lib/ip-mask.ts` com:

- `maskIp(ip: string | null | undefined, enabled: boolean): string` — quando `enabled`, mascara os 2 últimos octetos para IPv4 (`192.168.*.*`) e os 4 últimos hextets para IPv6 (`2001:db8:1234:5678:****:****:****:****`). Quando `enabled=false`, retorna o IP original. `null/undefined` → `'-'`.
- `matchesIpFilter(ip: string | null, term: string): boolean` — busca **sempre na string original** (lowercase), garantindo "filtro por substring continua funcionando mesmo com mascaramento".

Testes unitários novos em `src/lib/__tests__/ip-mask.test.ts` cobrindo IPv4, IPv6, null, e o requisito de filtro com mask ON.

**2. Preferência persistida por usuário**

`src/hooks/useIpMaskPreference.ts`:

- localStorage key `lov:ip-mask-enabled` (default `false`).
- Expõe `{ enabled, setEnabled, toggle }`.
- Sincronização entre abas via evento `storage`.

Sem tabela nova — é preferência local do operador (apenas um boolean).

**3. Componente toggle reutilizável**

`src/components/admin/IpMaskToggle.tsx`:

- `Switch` shadcn + ícone `Eye`/`EyeOff` + label "Mascarar IPs".
- Tooltip: "Os filtros continuam funcionando com o IP original."

**4. Aplicação nas telas**

Em cada tela que lista IPs:

- **`AuditLogs.tsx`** — toggle ao lado dos filtros existentes; coluna IP e exportação CSV/PDF passam por `maskIp`.
- **`AuditLogTable.tsx`** — render de IP (linha + bloco expandido) usa `maskIp`.
- **`BlockedIPsTab.tsx`** — toggle no header; coluna IP via `maskIp`; filtragem trocada para `matchesIpFilter`.
- **`RateLimitDashboard.tsx`** — toggle ao lado do search; `filteredLogs` usa `matchesIpFilter`; render usa `maskIp`.
- **`MFASettings.tsx`** — toggle no card de sessões; `session.ip_address` renderizado via `maskIp`.
- **`AuditDetailDialog.tsx`** — pós-processamento no `Object.entries(registro)`: se `key === 'ip_address'` e toggle ativo, exibe mascarado.

### Detalhes técnicos

- IPv4 detectado por regex `^(\d{1,3}\.){3}\d{1,3}$`.
- IPv6: pega os 4 primeiros hextets, substitui o resto por `****`.
- Strings que não casam com nenhum dos dois (ex.: hostnames) retornam o valor original — mascarar só faz sentido para IPs reais.
- Helper é puro (sem dependências React) → trivial de testar.
- Sem mudanças em backend, RLS, edge functions ou tipos do Supabase. O dado bruto continua no DB; mascaramento é puramente de exibição/exportação.
- Filtros por servidor (caso existam) continuam usando o IP original — só renderização e CSV/PDF respeitam o toggle.

### Critério de pronto

1. Toggle "Mascarar IPs" presente em: AuditLogs, BlockedIPsTab, RateLimitDashboard, MFASettings.
2. Quando ativo, IPs aparecem como `192.168.*.*` em listas, detalhes (`AuditDetailDialog`, expansão de log) e exportações de `AuditLogs`.
3. Buscar "192.168" continua trazendo o IP `192.168.1.42` mesmo com mascaramento ativo.
4. Preferência persiste entre reloads (localStorage) e sincroniza entre abas.
5. Testes unitários de `maskIp` e `matchesIpFilter` passam (`npm test -- ip-mask`).
6. `tsc --noEmit` continua verde; sem regressão visual.

### Arquivos

- 🆕 `src/lib/ip-mask.ts`
- 🆕 `src/lib/__tests__/ip-mask.test.ts`
- 🆕 `src/hooks/useIpMaskPreference.ts`
- 🆕 `src/components/admin/IpMaskToggle.tsx`
- ✏️ `src/components/audit/AuditLogTable.tsx`
- ✏️ `src/pages/AuditLogs.tsx` (toggle + exportação)
- ✏️ `src/components/security/rate-limit/BlockedIPsTab.tsx`
- ✏️ `src/components/security/RateLimitDashboard.tsx`
- ✏️ `src/components/auth/MFASettings.tsx`
- ✏️ `src/components/compliance/AuditDetailDialog.tsx`

