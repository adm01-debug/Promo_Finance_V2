# Política de Segurança — Promo Finance V2

## Versões suportadas

Apenas a versão atual em produção (`main`) recebe correções de segurança.

## Reportar uma vulnerabilidade

**Não abra uma issue pública** com detalhes de uma vulnerabilidade. Isso expõe
informações sensíveis antes que a correção esteja disponível.

### Canal de reporte

Envie um e-mail para **ti@promobrindes.com.br** com:

- Descrição do problema e impacto estimado
- Passos para reproduzir (PoC quando possível)
- Versão/commit onde foi identificado

### O que esperar

| Prazo | Ação |
| ----- | ---- |
| 48 h | Confirmação de recebimento |
| 7 dias | Avaliação de severidade e plano de resposta |
| 30 dias | Correção publicada (ou prazo negociado para severidade baixa) |

## Política de rotação de credenciais

Qualquer credencial exposta em histórico git, log ou artefato de CI deve ser
rotacionada imediatamente, independentemente do ambiente:

- `SUPABASE_ACCESS_TOKEN` — Supabase Dashboard → Account → Access Tokens
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase Dashboard → Settings → API
- Chaves Asaas, Bling, CNPJA — respectivos painéis de API
- JWTs de migration — regenerar o segredo da chave `app.jwt_secret` em nova migration

Após a rotação, atualizar os GitHub Secrets correspondentes e verificar
`SUPABASE_ACCESS_TOKEN` e `SUPABASE_SERVICE_ROLE_KEY` no environment `Production`.

## Segredos no histório git (baseline atual)

O `.gitleaks-baseline.json` contém 23 achados historicizados (19 JWTs, 4 API keys)
em migrations e edge functions. Cada entrada documentada foi avaliada e as
credenciais aguardam rotação. **Nenhuma nova entrada deve ser adicionada ao
baseline sem rotação prévia.**

## Contato

`ti@promobrindes.com.br` — Joaquim, Diretor, Promo Brindes SP
