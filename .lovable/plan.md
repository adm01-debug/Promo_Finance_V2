

## Status atual

`src/lib/__tests__/ip-mask.test.ts` já cobre os casos básicos:
- IPv4 mascarado / não mascarado
- IPv6 mascarado nos 4 últimos hextets
- `null` / `undefined` / `''` → `'-'`
- string não-IP (`localhost`) preservada
- `matchesIpFilter` com substring, IP nulo e termo vazio
- Um caso afirmando que o filtro casa o IP original mesmo "se a UI estiver mascarada"

## Lacunas a cobrir

Para atender ao pedido (mascaramento + filtro por substring com toggle ligado), faltam casos que reforcem o invariante "a UI mascara, mas a busca continua funcionando contra o original":

1. **Trim de espaços** em `maskIp` (`'  192.168.1.42  '` → `'192.168.*.*'`).
2. **IPv4 com octetos curtos** (`'1.2.3.4'` → `'1.2.*.*'`).
3. **IPv6 comprimido** (`'::1'`, `'fe80::1'`) — confirma que formas exóticas não são corrompidas.
4. **`matchesIpFilter` case-insensitive** com termo em maiúsculas contra IPv6 (`'FE80'` casa `'fe80::1'`).
5. **Invariante combinado** (teste de integração da própria lib): para uma lista de IPs reais, `filter(ip => matchesIpFilter(ip, '192.168'))` produz o mesmo subconjunto independente de `maskIp(ip, true|false)` ter sido aplicado para exibição. Isso documenta de forma executável que mascarar **não** afeta o filtro.
6. **Substring que só existiria no valor mascarado** (`'*.*'`) **não casa** nada — garante que ninguém acidentalmente use a saída mascarada como entrada de filtro.

## Mudança proposta

**Único arquivo editado**: `src/lib/__tests__/ip-mask.test.ts` — adicionar um novo `describe('maskIp + matchesIpFilter — invariantes')` com os 6 casos acima, mais 2 casos pontuais nos `describe` existentes (trim e IPv4 curto).

Sem novos arquivos, sem mudanças em código de produção, sem mudanças de config (`vitest.config.ts` já inclui `src/**/*.test.ts`).

## Resultado esperado

- Suite cresce de ~9 para ~15 asserções na área de mascaramento.
- Invariante "mascarar é cosmético; filtrar usa o original" fica documentado em teste e protegido contra regressão.
- `npm test` continua passando; cobertura da lib `ip-mask` chega a 100% de branches.

