

## Plano — Emissão e Gestão de SPED ECD/ECF

Novo fluxo contábil completo para gerar, validar, transmitir e arquivar **SPED ECD** (Escrituração Contábil Digital) e **SPED ECF** (Escrituração Contábil Fiscal), apoiado em plano de contas + lançamentos contábeis (partidas dobradas) e relatórios DRE/Balanço gerados a partir dessa base contábil — não mais inferidos de `contas_pagar/receber`.

### Estado atual

- `ObrigacoesAcessorias.tsx` lista ECD/ECF apenas como cards de calendário — sem geração real.
- `sped-generator.ts` cobre EFD-IBS/CBS e EFD-Contribuições (não ECD/ECF).
- `DREStatement` e `BalancoPatrimonial` derivam de contas a pagar/receber — não da contabilidade.
- Não existem tabelas de plano de contas nem lançamentos contábeis.

### Estrutura da nova área

```text
/contabilidade
├── Header: empresa, ano-calendário, status ECD/ECF do exercício
├── Tab 1 · Plano de Contas         (CRUD + import padrão CFC + busca)
├── Tab 2 · Lançamentos Contábeis   (partidas dobradas + import lote + filtros)
├── Tab 3 · Razão & Diário          (relatórios contábeis navegáveis)
├── Tab 4 · DRE & Balanço           (gerados da contabilidade real)
├── Tab 5 · SPED ECD                (wizard + validação + download + histórico)
└── Tab 6 · SPED ECF                (wizard + validação + download + histórico)
```

### Schema (migração)

Quatro tabelas novas + bucket de armazenamento.

```sql
-- 1. Plano de contas (referencial CFC)
CREATE TABLE public.plano_contas (
  id UUID PK,
  empresa_id UUID REFERENCES empresas(id),
  codigo TEXT NOT NULL,           -- ex 1.1.01.001
  nome TEXT NOT NULL,
  natureza TEXT CHECK (natureza IN ('ativo','passivo','patrimonio','receita','despesa','resultado')),
  tipo TEXT CHECK (tipo IN ('sintetica','analitica')),
  conta_pai_id UUID REFERENCES plano_contas(id),
  centro_resultado TEXT,          -- mapeamento DRE/BP
  codigo_referencial TEXT,        -- código CFC oficial p/ ECD bloco I050
  ativo BOOLEAN DEFAULT true,
  UNIQUE(empresa_id, codigo)
);

-- 2. Lançamentos contábeis (cabeçalho)
CREATE TABLE public.lancamentos_contabeis (
  id UUID PK,
  empresa_id UUID,
  numero_lancamento BIGINT,        -- sequencial por exercício
  data_lancamento DATE NOT NULL,
  historico TEXT NOT NULL,
  origem TEXT,                     -- manual|conta_pagar|conta_receber|movimentacao|importacao
  origem_id UUID,
  valor_total NUMERIC(15,2),
  status TEXT CHECK (status IN ('rascunho','confirmado','cancelado')) DEFAULT 'confirmado',
  created_by UUID, created_at TIMESTAMPTZ
);

-- 3. Partidas (debits/credits) — partidas dobradas
CREATE TABLE public.partidas_contabeis (
  id UUID PK,
  lancamento_id UUID REFERENCES lancamentos_contabeis(id) ON DELETE CASCADE,
  conta_id UUID REFERENCES plano_contas(id),
  tipo CHAR(1) CHECK (tipo IN ('D','C')),
  valor NUMERIC(15,2) NOT NULL CHECK (valor > 0),
  historico_complementar TEXT
);
-- Trigger: garante soma D = soma C por lancamento

-- 4. SPED contábil gerado (ECD/ECF)
CREATE TABLE public.sped_contabil_arquivos (
  id UUID PK,
  empresa_id UUID,
  tipo TEXT CHECK (tipo IN ('ECD','ECF')),
  ano_calendario INT,
  periodo_inicio DATE, periodo_fim DATE,
  storage_path TEXT,
  hash_sha256 TEXT,
  total_linhas INT,
  total_lancamentos INT,
  validacoes JSONB,                -- { erros:[], avisos:[] }
  status TEXT CHECK (status IN ('gerado','validado','transmitido','rejeitado')),
  recibo_transmissao TEXT,
  gerado_por UUID, created_at TIMESTAMPTZ
);
```

RLS admin/financeiro nas 4 tabelas. Trigger valida `Σdébitos = Σcréditos` em `partidas_contabeis`. Trigger preenche `numero_lancamento` por exercício. Bucket existente `relatorios-tributarios` reutilizado em subpasta `sped-contabil/`.

### Geração ECD (`src/lib/sped-ecd-generator.ts`)

Layout oficial 2024 (versão 9). Registros emitidos:

- **Bloco 0**: 0000 (abertura), 0001, 0007, 0020 (escrituração), 0150 (participantes consolidados), 0990
- **Bloco I**: I001, I010 (livro), I012 (livros auxiliares), I030 (termo abertura), I050 (plano de contas), I052 (códigos referenciais), I100 (centros), I150 (saldos periódicos), I155 (detalhe), I200 (lançamentos cabeçalho), I250 (partidas), I300 (balancetes), I310 (detalhamento), I350 (DRE), I355 (detalhamento DRE), I990
- **Bloco J**: J001, J005 (DRE), J100 (BP), J150 (DRE consolidado), J800 (RTF), J900 (termo encerramento), J990
- **Bloco 9**: 9001, 9900 (registro de registros), 9990, 9999

### Geração ECF (`src/lib/sped-ecf-generator.ts`)

Layout 10. Registros principais:

- **Bloco 0**: 0000, 0010, 0020, 0030
- **Bloco C**: C001, C040, C050, C051, C053, C100, C150, C155, C157, C990 (recupera ECD)
- **Bloco J**: J001, J050 (plano referencial), J051, J100, J990
- **Bloco K**: K001, K030, K155 (saldos), K156, K355 (DRE), K356, K990
- **Bloco L**: L001, L030 (identificação), L100 (BP), L200 (DRE), L210, L300, L990
- **Bloco M**: M001, M010, M300 (LALUR-A), M350 (LACS-A), M990
- **Bloco N**: N001, N500, N620 (CSLL), N630, N650, N660, N670, N990
- **Bloco 9**: 9001, 9100, 9900, 9990, 9999

### Validações automáticas (cliente + servidor)

Pré-geração roda checklist e bloqueia download se `erros.length>0`:

- Plano de contas: códigos referenciais CFC preenchidos para contas analíticas
- Lançamentos: `Σdébitos = Σcréditos` por lançamento e por período
- Saldos: balancete fecha (ativo = passivo + PL)
- DRE: receitas − despesas = resultado do exercício
- Datas: todos os lançamentos dentro do período de escrituração
- Sequência: numeração sem gaps no exercício
- ECF: totais batem com ECD do mesmo período (cross-check)

Avisos não bloqueiam: contas sem movimento, partidas sem histórico complementar etc.

### Edge functions

1. **`gerar-sped-ecd`** — admin/financeiro. Body `{ empresa_id, ano_calendario }`. Lê plano + lançamentos + partidas, monta TXT layout 9, calcula SHA-256, sobe ZIP em `sped-contabil/ECD-{cnpj}-{ano}.txt`, persiste em `sped_contabil_arquivos`, retorna URL assinada 7d + lista de validações.
2. **`gerar-sped-ecf`** — análogo, layout 10, recupera ECD do mesmo período via `recibo_transmissao`.
3. **`importar-plano-contas-padrao`** — popula plano padrão CFC para empresa nova (≈ 200 contas).

Padrões: CORS oficial, validação JWT, Zod no body, logger P2.

### Hooks novos

- `usePlanoContas(empresaId)` — CRUD + cache 30min
- `useLancamentosContabeis(empresaId, periodo)` — paginação 50/pg
- `useGerarSpedContabil()` — mutation única, recebe `tipo: 'ECD'|'ECF'`
- `useSpedContabilHistorico(empresaId)` — lista arquivos gerados
- `useDREContabil(empresaId, periodo)` / `useBalancoContabil(empresaId, periodo)` — gerados de partidas

### DRE & Balanço da contabilidade

`DREStatement` e `BalancoPatrimonial` ganham flag `fonte: 'caixa' | 'competencia'`:
- `caixa` (atual) — derivado de `contas_pagar/receber` 
- `competencia` (novo, default quando há lançamentos) — agregado de `partidas_contabeis` por `centro_resultado`

Mantém retrocompat para empresas que ainda não usam contabilidade.

### Componentes a criar

```
src/pages/Contabilidade.tsx                      (orquestra 6 tabs)
src/components/contabilidade/
  PlanoContasTab.tsx + PlanoContaForm.tsx
  LancamentosContabeisTab.tsx + LancamentoForm.tsx (partidas dobradas inline)
  RazaoDiarioTab.tsx
  DREBalancoTab.tsx                              (reusa DREStatement com fonte=competencia)
  SpedECDTab.tsx + SpedECFTab.tsx
  SpedHistoricoTable.tsx                         (compartilhado ECD/ECF)
  ValidacoesPreSpedDialog.tsx                    (modal com erros/avisos)
  ImportLancamentosCSVDialog.tsx
src/lib/sped-ecd-generator.ts + __tests__
src/lib/sped-ecf-generator.ts + __tests__
src/hooks/usePlanoContas.ts
src/hooks/useLancamentosContabeis.ts
src/hooks/useSpedContabil.ts
src/hooks/useDREContabil.ts
src/hooks/useBalancoContabil.ts
```

### Roteamento e navegação

- Nova rota `/contabilidade` (lazy, ProtectedRoute admin/financeiro)
- Item "Contabilidade & SPED" no menu lateral com ícone `BookOpen`
- Cross-link: `ObrigacoesAcessorias` ao clicar em ECD/ECF → abre `/contabilidade?tab=sped-ecd`
- Botão "Gerar SPED contábil" no header do `Demonstrativos.tsx`

### Exportação dos relatórios contábeis

- DRE/Balanço: PDF (jsPDF/autoTable, padrão `ExportDemonstrativoPDF`) + CSV BOM-UTF-8
- Razão/Diário: PDF paginado por conta + CSV
- Cada exportação grava `audit_logs` action=EXPORT (gancho já existente)

### Detalhes técnicos

- **Padrão SPED**: encoding `latin1` (ISO-8859-1) com line ending CRLF, separador `|` no início e fim de cada linha
- **Hash de integridade**: SHA-256 calculado e exibido pós-geração para conferência no PVA-ECD/PVA-ECF
- **Validador local**: porta da rotina `validarArquivoSPED` existente, estendida para checar contagem de blocos (registros 9900) e totalizadores (9999)
- **Performance**: lançamentos paginados via cursor; geração ECD em stream chunk de 5k partidas para não estourar memória da edge function
- **Acessibilidade**: tabelas com `caption`, badges de status (`gerado`, `validado`, `transmitido`) com contraste AA
- **Aviso preliminar**: arquivos são PRELIMINARES — sempre validar no PVA-ECD/PVA-ECF da RFB antes da transmissão oficial

### Fora de escopo

- Transmissão automática via web service da RFB (apenas geração + download)
- Importação reversa de ECD/ECF de exercícios anteriores
- Conciliação automática ECD ↔ ECF (apenas cross-check de totais)
- Apuração automática IRPJ/CSLL (Bloco N alimentado por valores já apurados em `apuracoes_tributarias`)

