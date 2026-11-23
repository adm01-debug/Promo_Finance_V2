# 02 — Matriz de cenários por jornada

> Auditoria de QA somente leitura — 2026-11-22, `main` em `2c2486f`.

## Como esta matriz foi gerada

A cobertura não vem de exemplos improvisados: cada jornada que grava dado foi cruzada nas quatro dimensões abaixo, e as combinações relevantes foram rastreadas de ponta a ponta (interface → hook → chamada → backend → banco → resposta → interface).

| Dimensão | Valores usados |
|---|---|
| **Ator** | admin · financeiro/manager · operacional/operator · visualizador/viewer · contador (convidado externo) · usuário de **outra empresa** · visitante sem login (`anon`) · `service_role` (cron/Edge) |
| **Estado do dado** | vazio · um registro · muitos · no limite · inválido · duplicado · já excluído |
| **Entrada** | válida · vazia · enorme · malformada · com caracteres especiais · no valor de borda |
| **Condição** | normal · duplo clique · duas abas · dois usuários ao mesmo tempo · rede caindo no meio · sessão expirada · terceiro fora do ar · reenvio (retry/webhook duplicado) · passos fora de ordem |

## Legenda obrigatória

- **EXECUTADO** — o cenário foi rodado de verdade nesta sessão (teste, consulta SQL ou comando) e o resultado foi observado. A evidência traz a saída.
- **RASTREADO** — o caminho foi seguido lendo o código que roda, sem executar. **Não é teste e não é validação.**
- **Divergente = sim** → o encontrado difere do esperado → virou achado em `03-ACHADOS.md`.

Nenhum cenário foi executado contra dados de produção com escrita. As execuções foram: consultas `SELECT` no banco de produção, execução da suíte de testes e do verificador de tipos em cópia isolada do projeto, e comandos de leitura no repositório.

