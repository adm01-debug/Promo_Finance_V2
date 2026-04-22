

## Validação de Códigos Referenciais CFC

Implementar uma camada de validação automatizada para o **Plano de Contas**, garantindo que os códigos referenciais CFC (usados no SPED ECD/ECF) estejam corretos e sem duplicidades por empresa.

### Contexto

O SPED ECD/ECF exige que cada conta analítica tenha um `codigo_referencial` válido seguindo o padrão CFC (ex: `1.01.01.01.001`). Hoje o sistema apenas avisa quando faltam códigos, mas não valida formato nem detecta duplicidades — o que pode causar rejeição direta na transmissão à Receita Federal.

### O que será entregue

#### 1. Biblioteca de validação CFC (`src/lib/cfc-validator.ts`)
- `validarFormatoCFC(codigo)`: regex `^\d(\.\d{2}){3,4}(\.\d{1,3})?$`, aceitando 4 ou 5 níveis hierárquicos.
- `validarPrefixoNatureza(codigo, natureza)`: confere se o prefixo corresponde à natureza da conta (1=Ativo, 2=Passivo+PL, 3=Receita, 4=Custos/Despesas, 5=Apuração).
- `detectarDuplicidades(contas)`: agrupa por (empresa_id, codigo_referencial) e retorna conflitos.
- `validarHierarquiaCFC(codigo, nivel)`: garante que o nível do código bate com a profundidade declarada.

#### 2. Hook de auditoria (`src/hooks/useAuditoriaCFC.ts`)
Cruza dados de `plano_contas` por empresa e retorna:
```ts
{
  totalContas, totalAnaliticas, comReferencial, semReferencial,
  formatoInvalido: PlanoContaRow[],
  prefixoIncorreto: { conta, esperado, atual }[],
  duplicidades: { codigo_referencial, contas: PlanoContaRow[] }[],
  scoreConformidade: number  // 0-100
}
```

#### 3. Painel de relatório (`src/components/contabilidade/AuditoriaCFCPanel.tsx`)
Card premium com:
- **KPIs**: Score de conformidade (com badge color-coded), totais, contagens por categoria
- **Lista de problemas** agrupada por tipo (formato inválido, prefixo incorreto, duplicidades)
- **Ações**: botão "Ir para conta" e "Exportar relatório CSV/PDF"
- Estado vazio celebratório quando 100% conforme

#### 4. Integração nos pontos críticos
- **`PlanoContasManager`**: novo botão "Auditar CFC" abrindo o painel em modal.
- **`SpedEcdWizard` / `SpedEcfWizard`**: bloqueio de geração quando houver erros críticos (formato inválido ou duplicidade), exibindo o painel inline na etapa 2.
- **`usePreValidacaoSped`**: integra alertas CFC ao checklist existente, categoria `'cfc'`.

#### 5. Exportação
- CSV (UTF-8 BOM, separador `;`) com colunas: empresa, código local, código referencial, natureza, problema, sugestão.
- PDF via `jsPDF/autoTable` reaproveitando o padrão de `export-contabil.ts` (header empresa + período + paginação).

### Detalhes técnicos

**Padrão CFC esperado (Receita Federal):**
```text
N.NN.NN.NN[.NNN]   ← 4 ou 5 níveis
│ │  │  │   └─ subconta opcional (1-3 dígitos)
│ │  │  └───── conta analítica
│ │  └──────── subgrupo
│ └─────────── grupo
└───────────── natureza (1-5)
```

**Detecção de duplicidades** usa SQL no hook (mais eficiente que JS):
```sql
SELECT codigo_referencial, COUNT(*) as total, array_agg(id) as ids
FROM plano_contas
WHERE empresa_id = $1 AND codigo_referencial IS NOT NULL AND ativo = true
GROUP BY codigo_referencial HAVING COUNT(*) > 1
```

**Score de conformidade:**
```text
score = 100 - (formatoInvalido*5 + prefixoIncorreto*3 + duplicidades*10 + semReferencial*1)
clamp(0, 100)
```

### Arquivos

**Criados:**
- `src/lib/cfc-validator.ts`
- `src/lib/__tests__/cfc-validator.test.ts`
- `src/hooks/useAuditoriaCFC.ts`
- `src/components/contabilidade/AuditoriaCFCPanel.tsx`

**Editados:**
- `src/components/contabilidade/PlanoContasManager.tsx` — botão "Auditar CFC"
- `src/components/contabilidade/SpedEcdWizard.tsx` — bloqueio + painel inline
- `src/components/contabilidade/SpedEcfWizard.tsx` — bloqueio + painel inline
- `src/hooks/usePreValidacaoSped.ts` — categoria `'cfc'` no checklist
- `src/lib/export-contabil.ts` — função `exportAuditoriaCFC(PDF/CSV)`

