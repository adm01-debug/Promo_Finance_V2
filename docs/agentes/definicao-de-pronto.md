# Definição de pronto — referência para agentes

> Ler antes de entregar uma funcionalidade ou declarar um bug resolvido. Resumo em `AGENTS.md`,
> seção 3.

## Bug resolvido

- **Diagnóstico antes de patch:** leia logs e estado real (banco, container, worker, request),
  localize o ponto exato (arquivo:linha) e diga a causa. Não chute fix em cima de suposição.
  Sintoma com mais de uma causa → liste todas, corrija a pedida.
- **Antes de abrir PR:** typecheck/lint/testes dos arquivos tocados. Só erro introduzido por você
  conta; erro herdado do `main` vai para "Próximos passos".
- **"Pronto"** = PR mergeada + deploy confirmado + comportamento verificado (log, query ou request
  real — não "deveria funcionar"), ligado em produção com tráfego real. Código existir não é
  pronto. Faltou um dos três → diga em que ponto parou.

## Funcionalidade pronta

- **Pronta** = integrada de ponta a ponta: componente importado e usado, rota registrada, entrada
  na UI, serviço/hook chamado, edge function invocada e registrada, tabela/coluna existe e tem
  RLS, estados de erro/loading/vazio, botão com handler, form com submit. Sem corpo vazio, mock,
  hardcode, TODO/WIP.
- Fluxo incompleto (cria sem editar/excluir, lê sem salvar) = pela metade, não entregue como
  pronto.
- Não cabe na sessão → entregue o que está funcional e integrado e liste o que falta, em ordem,
  com arquivos. Nunca deixe código morto ou feature "quase" sem dizer.
