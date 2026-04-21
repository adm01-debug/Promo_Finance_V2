

## Plano — Vincular feedback de Confirmar/Rejeitar IA ao banco

Hoje, na conciliação por IA (`SugestoesMatchIA`):
- **Confirmar** já chama `confirmarConciliacao` RPC (atualiza `transacoes_bancarias.conciliada=true` + status da conta) e grava `historico_conciliacao_ia` + `feedback_conciliacao_ia`. ✅
- **Rejeitar** abre o `RejeicaoDialog`, captura motivo e grava `historico_conciliacao_ia(acao='rejeitado')` + `feedback_conciliacao_ia(motivo_rejeicao)`. Mas:
  - O parâmetro `transacaoId` é descartado em `registrarHistorico` (a coluna `historico_conciliacao_ia.transacao_bancaria_id` nunca é preenchida) → impossível auditar qual transação foi rejeitada.
  - `handleRejeitarMatch` em `useConciliacaoPage` só faz `toast.info('Sugestão rejeitada')`. A sugestão rejeitada permanece no painel e o mesmo match volta a ser sugerido na próxima reanálise.
  - Não há filtragem do `matchesRejeitados` Set ao calcular `transacoesComSugestao` / `melhorMatch` em `SugestoesMatchIA`.

Este plano fecha as três pontas.

### Mudanças

**1. `src/hooks/useHistoricoConciliacaoIA.ts`**
- Estender `RegistrarHistoricoParams` com `transacaoId?: string` (já recebido mas ignorado).
- No `insertData` do `registrarHistorico`, adicionar `transacao_bancaria_id: params.transacaoId ?? null` para que o vínculo FK seja gravado.
- Em `aprovarEmLote`, propagar `transacaoId: match.transacaoId` na chamada de `registrarHistorico` (atualmente já passa, só precisa do campo no insert).

**2. `src/hooks/useConciliacaoPage.ts`**
- `handleRejeitarMatch(transacaoId, lancamentoId)`:
  - Remove a transação da lista de sugestões da IA: `setTransacoesImportadas(prev => prev.filter(t => t.id !== transacaoId))` quando todas as sugestões para ela foram rejeitadas (ou simplesmente: tirar da lista; o painel então mostra a próxima).
  - Mantém `toast.info('Sugestão rejeitada — feedback registrado')`.
- Decisão: tirar a transação inteira da fila de sugestões IA é mais simples e alinha com o comportamento atual de "rejeitar = não quero esse match agora"; ela continua visível na lista pendente principal abaixo, onde pode ser conciliada manualmente.

**3. `src/components/conciliacao/SugestoesMatchIA.tsx`**
- Em `transacoesComSugestao`, filtrar também `matchesRejeitados`: para uma transação cujo `melhorMatch.lancamentoId` esteja em `matchesRejeitados` como `${transacaoId}-${lancamentoId}`, pular para a próxima sugestão (ou ocultar a transação se não restar nenhuma).
- Lógica: `const sugestoesValidas = sugestoes.filter(s => !matchesRejeitados.has('${transacao.id}-${s.lancamentoId}'))` e usar `sugestoesValidas[0]` como `melhorMatch`.

**4. UX/feedback**
- `confirmarRejeicao` mostra `toast.success('Rejeição registrada — IA aprenderá com este feedback')` quando `motivoRejeicao` foi preenchido; toast neutro caso contrário.
- Botão **Rejeitar** no `RejeicaoDialog` fica `disabled={registrarHistorico.isPending || registrarFeedback.isPending}` para evitar duplo-clique.

### Detalhes técnicos

- Sem mudança de schema: `historico_conciliacao_ia.transacao_bancaria_id` já existe (FK para `transacoes_bancarias`), apenas não estava sendo preenchido.
- RLS dessas tabelas continua válida (`feedback_conciliacao_ia` e `historico_conciliacao_ia` já têm policies de insert para usuários autenticados conforme migrações anteriores).
- `confirmarConciliacao` (RPC já existente) continua sendo o único responsável por mexer em `transacoes_bancarias.conciliada` — não duplicamos lógica.
- Rejeição é puramente um **sinal de feedback**: não altera `transacoes_bancarias` (não há coluna "rejeitada"), apenas registra histórico/feedback e remove a sugestão da UI.

### Fora de escopo

- Adicionar coluna `rejeitada_em` a `transacoes_bancarias` (rejeição é por par transação↔lançamento, não por transação inteira).
- Treinar/ajustar pesos do motor de IA com base no histórico de rejeições (consumido por `conciliacao-ia` edge — fica para próxima iteração).
- Bulk-rejeitar com motivo único.

