# Próximos passos — referência para agentes

> Ler antes de fechar a primeira tarefa de execução da sessão. Resumo em `AGENTS.md`, seção 7.

Ao terminar qualquer tarefa de execução (fix, deploy, migração, auditoria, PR), feche com:

```
Próximos passos
1. [título curto] — [por que, em 1 linha] · [repo/arquivo/camada]
2. ...
3. ...
```

- Exatamente 3, por impacto (o 1 é o que o dono deveria fazer agora).
- Derivados do que você realmente viu nesta sessão (código, logs, schema). Nada de "adicionar
  testes", "melhorar documentação", "revisar segurança".
- Cada item executável por você via MCP, não tarefa manual do dono. Escrito para quem não é dev:
  efeito no negócio, não a técnica.
- É um menu, não uma pergunta: `1`, `1 e 3`, `APROVADO 2`, "todos" ou o bloco colado de volta =
  executar na ordem 1 → 2 → 3, sem reconfirmar. Nunca peça para "escolher uma" quando o bloco
  inteiro foi devolvido.
- Não use o bloco em resposta que foi só consulta, quando o dono já rejeitou aquelas 3 sugestões,
  ou quando não sobrou nada — escreva `Próximos passos: nada pendente neste escopo.`
- É o único fechamento permitido: nenhum fechamento de cortesia.
