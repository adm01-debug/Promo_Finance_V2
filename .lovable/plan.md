

## Plano — Navegação por abas sincronizada em `/contabilidade`

### Diagnóstico

O componente `Tabs` do shadcn já alterna entre as 6 abas (Plano, Lançamentos, Razão & Diário, DRE & Balanço, **SPED ECD**, **SPED ECF**). Cada aba SPED já consome:

- O **mesmo `empresaId`** (Select global no header)
- O **mesmo `ano`** (Input global no header)
- Os **mesmos hooks** de validação/histórico (`useSpedEcdValidacao`, `useSpedEcfValidacao`, `useGerarSpedContabil`, `useSpedContabilHistorico`) — todos com `queryKey` parametrizado por `empresaId`

Portanto **as validações e o histórico já estão sincronizados por construção**: trocar empresa/ano no header recarrega tudo via React Query.

O que falta para a navegação ECD ↔ ECF ser de fato útil:

1. **Persistência da aba ativa** — hoje, F5 ou voltar pela Recents cai em "Plano".
2. **Deep-link por URL** — `/contabilidade?tab=ecd&ano=2024` para favoritos, alertas tributários e dashboard linkar direto.
3. **Hint visual ECD→ECF** — a ECF exige ECD do mesmo período já gerada. Mostrar um badge no trigger ECF quando a ECD do `ano` selecionado ainda **não** existe no histórico.

### Mudanças

**`src/pages/Contabilidade.tsx`** (única edição)

1. **Tabs controlado + URL sync** via `useSearchParams`:
   ```tsx
   const [searchParams, setSearchParams] = useSearchParams();
   const tab = searchParams.get('tab') ?? 'plano';
   const setTab = (v: string) => setSearchParams(prev => {
     const next = new URLSearchParams(prev);
     next.set('tab', v);
     return next;
   }, { replace: true });
   ```
   Usar `<Tabs value={tab} onValueChange={setTab}>`.

2. **Sincronizar `ano` e `empresaId` na URL** (mesmo padrão), para que o deep-link reproduza o estado completo: `?tab=ecd&ano=2024&empresa=<uuid>`. Inicialização lê da URL; setters propagam. Se a URL está vazia, mantém defaults atuais (aba `plano`, ano = ano anterior, empresa vazia).

3. **Badge "ECD pendente" no trigger SPED ECF**:
   - Reusar `useSpedContabilHistorico(empresaId)` (já existe).
   - `temEcdNoAno = historico.some(h => h.tipo === 'ECD' && h.ano_calendario === ano && h.status !== 'rejeitado')`.
   - Quando `empresaId && !temEcdNoAno`, renderizar `<Badge variant="warning">!</Badge>` no `TabsTrigger` da ECF, com `title="Gere a SPED ECD do mesmo ano antes da ECF"`.

### O que NÃO muda

- `SpedContabilTab.tsx`, `SpedEcdWizard`, `SpedEcfWizard`, hooks de validação/histórico — intactos. A sincronização já vinha das `queryKey` parametrizadas.
- Componentes das demais abas (Plano, Lançamentos, Razão, DRE) — sem mudança.
- Roteamento — continua uma única rota `/contabilidade` com tabs internas (alinhado ao padrão do app combinado na sidebar).

### Critério de pronto

1. Trocar de aba reflete na URL como `?tab=<id>` sem recarregar a página.
2. F5 em `/contabilidade?tab=ecd` mantém a aba SPED ECD aberta.
3. `/contabilidade?tab=ecd&ano=2024&empresa=<uuid>` abre direto a ECD daquela empresa/ano.
4. Selecionar um ano sem ECD gerada → trigger "SPED ECF" exibe badge amarelo de aviso com tooltip.
5. Trocar empresa ou ano no header recalcula validações, histórico e o badge ECF imediatamente.
6. Default antes de qualquer interação: aba `plano`, ano = ano anterior, empresa vazia (mesma UX de hoje).
7. Sem regressão nas demais 4 abas e zero mudança em componentes SPED filhos.

### Arquivos

- ✏️ `src/pages/Contabilidade.tsx` — Tabs controlado + URL sync + badge ECD-pendente

