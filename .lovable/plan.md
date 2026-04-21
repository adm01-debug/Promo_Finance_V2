

## Plano — Compliance & Auditoria

Nova rota admin `/admin/compliance` que consolida as 3 trilhas existentes (`audit_logs`, `auditoria_financeira`, `auditoria_tributaria`) + verificações de conformidade fiscal numa cockpit única com filtros avançados e exportação de evidências.

### Por que faz sentido agora

- **Backend pronto**: tabelas `audit_logs`, `auditoria_financeira`, `auditoria_tributaria` e `verificacoes_conformidade` já existem com triggers populando dados.
- **UI fragmentada**: hoje cada trilha aparece em rotas separadas (`/audit-logs`, aba dentro de `/admin/system-health`, embutida no tributário). Falta visão consolidada para auditor externo / contador.
- **Gap apontado** em `GAPS_ENTERPRISE.md`: ausência de "evidence pack" exportável para auditoria externa (SOX, BACEN, contadores).

### Estrutura da página

```text
/admin/compliance
├── Header: KPIs (eventos 24h, score conformidade médio, ações críticas pendentes, evidências exportadas mês)
├── Tab 1 · Trilha Financeira
│   └── auditoria_financeira: tabela + filtros (tabela, operação, usuário, período)
├── Tab 2 · Trilha Tributária
│   └── auditoria_tributaria: tabela + filtros (empresa, ação, entidade, período)
├── Tab 3 · Trilha de Sistema
│   └── audit_logs: ações de usuário (LOGIN, EXPORT, APPROVE...) + filtros
├── Tab 4 · Conformidade Fiscal
│   └── verificacoes_conformidade: histórico de scores + drill nos itens reprovados
└── Tab 5 · Pacote de Evidências
    ├── Wizard de seleção: período + escopo (financeiro/tributário/sistema/conformidade)
    ├── Geração de ZIP com CSVs assinados (hash SHA-256) + manifest.json
    └── Histórico de pacotes gerados (downloads anteriores)
```

### Arquivos a criar

**Página + componentes**
- `src/pages/admin/ComplianceAuditoria.tsx` — orquestra 5 tabs
- `src/components/compliance/ComplianceKpis.tsx` — header com 4 KPIs
- `src/components/compliance/TrilhaFinanceiraTab.tsx`
- `src/components/compliance/TrilhaTributariaTab.tsx`
- `src/components/compliance/TrilhaSistemaTab.tsx`
- `src/components/compliance/ConformidadeFiscalTab.tsx`
- `src/components/compliance/EvidenciasTab.tsx` — wizard + lista de pacotes
- `src/components/compliance/AuditFiltersBar.tsx` — filtros reutilizáveis (período, usuário, busca)
- `src/components/compliance/AuditDetailDialog.tsx` — modal universal mostrando diff antigo→novo

**Hooks**
- `src/hooks/useComplianceKpis.ts` — agrega 4 KPIs
- `src/hooks/useTrilhaAuditoria.ts` — query genérica paginada (recebe tabela + filtros)
- `src/hooks/useEvidenciasPack.ts` — geração + listagem de pacotes

**Edge function (1 nova)**
- `supabase/functions/gerar-pacote-evidencias/index.ts`
  - Valida JWT + role admin
  - Recebe: `{ periodo_inicio, periodo_fim, escopos: ['financeiro'|'tributario'|'sistema'|'conformidade'][] }`
  - Gera CSVs por escopo, calcula SHA-256 de cada um, monta `manifest.json` (totais, hashes, gerado_por, timestamp)
  - Empacota em ZIP via `JSZip`, sobe para bucket `relatorios-tributarios/evidencias/` com signed URL 7 dias
  - Persiste registro em `evidencias_pacotes` (nova tabela)

### Schema (migração)

Nova tabela `evidencias_pacotes` para histórico:
```sql
CREATE TABLE public.evidencias_pacotes (
  id UUID PK DEFAULT gen_random_uuid(),
  gerado_por UUID REFERENCES auth.users(id),
  gerado_por_email TEXT,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  escopos TEXT[] NOT NULL,
  storage_path TEXT NOT NULL,
  manifest JSONB NOT NULL, -- { totais, hashes, contagens }
  tamanho_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE evidencias_pacotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin select" ON evidencias_pacotes FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "admin insert" ON evidencias_pacotes FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE INDEX idx_evidencias_pacotes_created ON evidencias_pacotes(created_at DESC);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_auditoria_financeira_created ON auditoria_financeira(created_at DESC);
CREATE INDEX idx_auditoria_tributaria_criado ON auditoria_tributaria(criado_em DESC);
```

Sem novos triggers. RLS admin-only nas existentes já está aplicada.

### Filtros padrão (todas as tabs de trilha)

- Período: presets (hoje, 7d, 30d, 90d, ano) + datepicker custom
- Usuário: combo com busca em `profiles.email`
- Operação/Ação: multi-select por enum
- Entidade/Tabela: select dinâmico
- Busca livre: descrição/detalhes
- Paginação server-side: 50/página

### Exportação por tab

- Botão "Exportar CSV" (BOM UTF-8) usando `ExportMenu` existente
- "Exportar PDF" do filtro atual
- Cada exportação registra evento em `audit_logs` (action=EXPORT) automaticamente

### Pacote de Evidências (cockpit forense)

Wizard 3 passos:
1. **Período** — datepicker
2. **Escopos** — checkboxes (financeiro/tributário/sistema/conformidade)
3. **Revisão & geração** — preview de contagens + botão "Gerar pacote"

Pacote ZIP contém:
```
auditoria-evidencias-2026-01-01_2026-04-21.zip
├── manifest.json           (hashes SHA-256, totais, gerado_por, timestamp ISO)
├── trilha-financeira.csv
├── trilha-tributaria.csv
├── trilha-sistema.csv
├── conformidade-fiscal.csv
└── README.txt              (instruções de validação)
```

### Roteamento e navegação

- Adicionar rota `/admin/compliance` em `src/App.tsx` (lazy)
- Cross-link no `/admin/system-health` apontando para a nova página
- Item "Compliance & Auditoria" no menu admin lateral com ícone `ShieldCheck`

### Detalhes técnicos

- **Realtime**: subscription em `audit_logs` (INSERT) → toast "Nova ação crítica" se `action IN ('DELETE','APPROVE','REJECT')`
- **Performance**: paginação cursor + índices novos garantem queries < 100ms em 100k linhas
- **Diff visual**: `AuditDetailDialog` mostra `payload_anterior` vs `payload_novo` lado-a-lado com destaque por chave alterada
- **Loading**: Skeleton em todas as tabelas
- **Acessibilidade**: tabelas com `caption`, badges contraste AA
- **Segurança**: edge function valida JWT + `has_role admin` antes de ler qualquer trilha

### Fora de escopo

- Assinatura digital criptográfica do pacote (apenas hash SHA-256 nesta versão)
- Retenção/purge automático de logs antigos (separar em P17)
- Integração com SOC externos (Splunk, Datadog) — só CSV/PDF nesta entrega

