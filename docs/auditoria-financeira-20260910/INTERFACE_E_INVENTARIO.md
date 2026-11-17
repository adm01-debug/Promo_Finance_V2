# Matriz individual de rotas e evidência de interface

Base: `d84a692dd13914540f9bc9d43a5317d9a65c62d9`. Rede externa interceptada. Sessão e dados sintéticos. Resultados não certificam backend/RLS nem execução de todas as ações.

O inventário completo está em `inventario.json.gz`: contém cada controle e função com arquivo e linha, além das chamadas de backend. Pode ser lido com `gzip -dc` e regenerado por `scripts/auditoria-financeira/inventario.mjs`.

## Rotas

| Rota | Arquivo:linha | Guard explícito | Sem sessão | Sessão sintética / conteúdo observado | Controles de botão no DOM | Erros/limites |
|---|---|---|---|---|---:|---|
| /auth | src/App.tsx:173 | não | não exercitada individualmente | não exercitada | — | Sem exceção capturada não comprova função completa |
| /auth/corporate | src/App.tsx:174 | não | não exercitada individualmente | não exercitada | — | Sem exceção capturada não comprova função completa |
| /reset-password | src/App.tsx:175 | não | não exercitada individualmente | não exercitada | — | Sem exceção capturada não comprova função completa |
| /contador/:token | src/App.tsx:176 | não | não exercitada individualmente | não exercitada | — | Sem exceção capturada não comprova função completa |
| /status | src/App.tsx:177 | não | não exercitada individualmente | não exercitada | — | Sem exceção capturada não comprova função completa |
| /portal-cliente | src/App.tsx:178 | não | não exercitada individualmente | não exercitada | — | Sem exceção capturada não comprova função completa |
| /design-system-debug | src/App.tsx:179 | não | não exercitada individualmente | não exercitada | — | Sem exceção capturada não comprova função completa |
| /__especimes | src/App.tsx:180 | não | não exercitada individualmente | não exercitada | — | Sem exceção capturada não comprova função completa |
| /theme-diagnostics | src/App.tsx:181 | não | não exercitada individualmente | não exercitada | — | Sem exceção capturada não comprova função completa |
| / | src/App.tsx:182 | sim | redirecionou | Bem-vindo ao Promo Finance! | 26 | Sem exceção capturada não comprova função completa |
| /dashboard | src/App.tsx:183 | sim | redirecionou | Bem-vindo ao Promo Finance! | 17 | Sem exceção capturada não comprova função completa |
| /dashboard-receber | src/App.tsx:184 | sim | redirecionou | Dashboard de Recebíveis; Bem-vindo ao Promo Finance! | 21 | Sem exceção capturada não comprova função completa |
| /dashboard-empresa | src/App.tsx:185 | sim | redirecionou | Dashboard por Empresa; Empresa sintética; Drill-down Detalhado; Bem-vindo ao Promo Finance! | 23 | Sem exceção capturada não comprova função completa |
| /bi | src/App.tsx:186 | sim | redirecionou | Business IntelligenceCNPJ: 00000000000000; Bem-vindo ao Promo Finance! | 29 | Sem exceção capturada não comprova função completa |
| /contas-pagar | src/App.tsx:187 | sim | redirecionou | Contas a Pagar | 33 | Sem exceção capturada não comprova função completa |
| /contas-pagar/bloqueios | src/App.tsx:188 | sim | redirecionou | Cofre de Integridade; Bem-vindo ao Promo Finance! | 29 | Sem exceção capturada não comprova função completa |
| /contas-receber | src/App.tsx:189 | sim | redirecionou | Contas a Receber; Bem-vindo ao Promo Finance! | 37 | Sem exceção capturada não comprova função completa |
| /notas-fiscais | src/App.tsx:190 | sim | redirecionou | Notas Fiscais Eletrônicas; Bem-vindo ao Promo Finance! | 45 | Sem exceção capturada não comprova função completa |
| /fluxo-caixa | src/App.tsx:191 | sim | redirecionou | Fluxo de Caixa; Bem-vindo ao Promo Finance! | 38 | Sem exceção capturada não comprova função completa |
| /relatorios | src/App.tsx:192 | sim | redirecionou | Relatórios & BI | 6 | Sem exceção capturada não comprova função completa |
| /expert | src/App.tsx:193 | sim | redirecionou | EXPERTIA; Olá! Sou o EXPERT; Bem-vindo ao Promo Finance! | 34 | Sem exceção capturada não comprova função completa |
| /conciliacao | src/App.tsx:194 | sim | redirecionou | Conciliação Bancária; Bem-vindo ao Promo Finance! | 31 | Sem exceção capturada não comprova função completa |
| /cobrancas | src/App.tsx:195 | sim | redirecionou | Cobrança e Inadimplência; Bem-vindo ao Promo Finance! | 25 | Sem exceção capturada não comprova função completa |
| /boletos | src/App.tsx:196 | sim | redirecionou | Gestão de Boletos; Bem-vindo ao Promo Finance! | 24 | Sem exceção capturada não comprova função completa |
| /clientes | src/App.tsx:197 | sim | redirecionou | Gestão de Clientes; Bem-vindo ao Promo Finance! | 28 | Sem exceção capturada não comprova função completa |
| /fornecedores | src/App.tsx:198 | sim | redirecionou |  Fornecedores; Bem-vindo ao Promo Finance! | 26 | Sem exceção capturada não comprova função completa |
| /empresas | src/App.tsx:199 | sim | redirecionou | Empresas | 4 | Sem exceção capturada não comprova função completa |
| /contas-bancarias | src/App.tsx:200 | sim | redirecionou | Contas Bancárias; Bem-vindo ao Promo Finance! | 23 | Sem exceção capturada não comprova função completa |
| /centro-custos | src/App.tsx:201 | sim | redirecionou | Bem-vindo ao Promo Finance! | 24 | Sem exceção capturada não comprova função completa |
| /aprovacoes | src/App.tsx:202 | sim | redirecionou | Aprovações; Bem-vindo ao Promo Finance! | 25 | Sem exceção capturada não comprova função completa |
| /alertas | src/App.tsx:203 | sim | redirecionou | Central de Alertas | 2 | Sem exceção capturada não comprova função completa |
| /configuracoes | src/App.tsx:204 | sim | redirecionou | Configurações | 7 | Sem exceção capturada não comprova função completa |
| /organizacoes | src/App.tsx:205 | sim | redirecionou |  Organizações; Bem-vindo ao Promo Finance! | 25 | Sem exceção capturada não comprova função completa |
| /convite/:token | src/App.tsx:206 | não | não exercitada individualmente | não exercitada | — | Sem exceção capturada não comprova função completa |
| /usuarios | src/App.tsx:207 | sim | redirecionou | Gerenciamento de Usuários; Bem-vindo ao Promo Finance! | 26 | Sem exceção capturada não comprova função completa |
| /audit-logs | src/App.tsx:208 | sim | redirecionou | Logs de Auditoria; Bem-vindo ao Promo Finance! | 29 | Sem exceção capturada não comprova função completa |
| /seguranca | src/App.tsx:209 | sim | redirecionou | Central de Segurança | 1 | Sem exceção capturada não comprova função completa |
| /integracoes | src/App.tsx:210 | sim | redirecionou | Hub de Integrações; Open Finance Brasil; Bem-vindo ao Promo Finance! | 24 | Sem exceção capturada não comprova função completa |
| /demonstrativos | src/App.tsx:211 | sim | redirecionou | Demonstrativos Contábeis; Bem-vindo ao Promo Finance! | 28 | Sem exceção capturada não comprova função completa |
| /contabilidade | src/App.tsx:212 | sim | redirecionou | Contabilidade & SPED; Bem-vindo ao Promo Finance! | 35 | Sem exceção capturada não comprova função completa |
| /financeiro | src/App.tsx:213 | sim | redirecionou | Visão Geral Financeira; Bem-vindo ao Promo Finance! | 24 | Sem exceção capturada não comprova função completa |
| /pagamentos-recorrentes | src/App.tsx:214 | sim | redirecionou | Pagamentos Recorrentes | 3 | Sem exceção capturada não comprova função completa |
| /bitrix24 | src/App.tsx:215 | sim | redirecionou | Bitrix24 CRM | 4 | Sem exceção capturada não comprova função completa |
| /reforma-tributaria | src/App.tsx:216 | sim | redirecionou | Bem-vindo ao Promo Finance! | 25 | Sem exceção capturada não comprova função completa |
| /reforma-tributaria/:tab | src/App.tsx:217 | sim | redirecionou | Reforma Tributária; Bem-vindo ao Promo Finance! | 24 | Sem exceção capturada não comprova função completa |
| /tributario/simulacao-regimes | src/App.tsx:218 | sim | redirecionou | Simulação de Regimes Tributários; Simples Nacional | 5 | Sem exceção capturada não comprova função completa |
| /tributario/historico-financeiro | src/App.tsx:219 | sim | redirecionou | Histórico Financeiro Tributário | 0 | Sem exceção capturada não comprova função completa |
| /tributario/oportunidades-elisao | src/App.tsx:220 | sim | redirecionou | Oportunidades de Elisão Fiscal | 2 | Sem exceção capturada não comprova função completa |
| /tributario/projecao-reforma | src/App.tsx:221 | sim | redirecionou | Projeção Reforma Tributária 2026-2033 | 0 | Sem exceção capturada não comprova função completa |
| /tributario | src/App.tsx:222 | sim | redirecionou | Dashboard Tributário: Quantum-Sentinel; Bem-vindo ao Promo Finance! | 27 | Sem exceção capturada não comprova função completa |
| /tributario/catalogos-fiscais | src/App.tsx:223 | sim | redirecionou | Catálogos Fiscais; Bem-vindo ao Promo Finance! | 25 | Sem exceção capturada não comprova função completa |
| /tributario/arquitetura | src/App.tsx:224 | sim | redirecionou | Arquitetura Modular; Camada 1 — Apresentação; Camada 2 — Aplicação; Camada 3 — Domínio Fiscal; Camada 4 — Infraestrutura; Arestas observadas no código | 0 | Sem exceção capturada não comprova função completa |
| /tributario/auditoria-overlay | src/App.tsx:225 | sim | redirecionou | Auditoria de Overlays; Bem-vindo ao Promo Finance! | 26 | Sem exceção capturada não comprova função completa |
| /tributario/dashboard | src/App.tsx:226 | sim | redirecionou | Dashboard Tributário: Quantum-Sentinel; Bem-vindo ao Promo Finance! | 27 | Sem exceção capturada não comprova função completa |
| /tributario/recomendacao | src/App.tsx:227 | sim | redirecionou | Recomendação Executiva; Comparativo dos 3 regimes | 7 | Sem exceção capturada não comprova função completa |
| /tributario/pf-vinculada | src/App.tsx:228 | sim | redirecionou | PF Vinculada — IRPFM | 1 | Sem exceção capturada não comprova função completa |
| /tributario/onboarding | src/App.tsx:229 | sim | redirecionou | Configure sua empresa em 4 passos | 2 | Sem exceção capturada não comprova função completa |
| /tributario/certificados-digitais | src/App.tsx:230 | sim | redirecionou | Certificados Digitais; Bem-vindo ao Promo Finance! | 25 | Sem exceção capturada não comprova função completa |
| /tributario/nfe-recebidas | src/App.tsx:231 | sim | redirecionou | NF-e Recebidas | 1 | Sem exceção capturada não comprova função completa |
| /tributario/sefaz-observabilidade | src/App.tsx:232 | sim | redirecionou | Observabilidade SEFAZ | 1 | Sem exceção capturada não comprova função completa |
| /tributario/calculadora | src/App.tsx:233 | sim | redirecionou |  Calculadora Tributária em Tempo Real | 7 | Sem exceção capturada não comprova função completa |
| /asaas | src/App.tsx:235 | sim | redirecionou | Bem-vindo ao Promo Finance! | 24 | Sem exceção capturada não comprova função completa |
| /bling | src/App.tsx:236 | sim | redirecionou | Bling ERP; Bem-vindo ao Promo Finance! | 26 | Sem exceção capturada não comprova função completa |
| /vendedores | src/App.tsx:237 | sim | redirecionou | Vendedores; Bem-vindo ao Promo Finance! | 25 | Sem exceção capturada não comprova função completa |
| /meu-perfil | src/App.tsx:238 | sim | redirecionou | Meu Perfil; Bem-vindo ao Promo Finance! | 27 | Sem exceção capturada não comprova função completa |
| /contratos | src/App.tsx:239 | sim | redirecionou | Contratos; Bem-vindo ao Promo Finance! | 24 | Sem exceção capturada não comprova função completa |
| /simulador-antecipacao | src/App.tsx:240 | sim | redirecionou | Simulador de Antecipação; Bem-vindo ao Promo Finance! | 25 | Sem exceção capturada não comprova função completa |
| /assinatura-digital | src/App.tsx:241 | sim | redirecionou | Assinatura Digital; Bem-vindo ao Promo Finance! | 26 | Sem exceção capturada não comprova função completa |
| /comprovante-ocr | src/App.tsx:242 | sim | redirecionou | Leitura de Comprovantes (OCR); Bem-vindo ao Promo Finance! | 26 | Sem exceção capturada não comprova função completa |
| /movimentacoes | src/App.tsx:243 | sim | redirecionou | Movimentações Financeiras; Bem-vindo ao Promo Finance! | 24 | Sem exceção capturada não comprova função completa |
| /tesouraria | src/App.tsx:244 | sim | redirecionou | Tesouraria Multi-CNPJ; Bem-vindo ao Promo Finance! | 23 | Sem exceção capturada não comprova função completa |
| /pix-hub | src/App.tsx:245 | sim | redirecionou | Central PIX; Bem-vindo ao Promo Finance! | 26 | Sem exceção capturada não comprova função completa |
| /orcamento-evento | src/App.tsx:246 | sim | redirecionou | Bem-vindo ao Promo Finance! | 24 | Sem exceção capturada não comprova função completa |
| /benchmarking | src/App.tsx:247 | sim | redirecionou | Benchmarking Setorial; Bem-vindo ao Promo Finance! | 27 | Sem exceção capturada não comprova função completa |
| /admin/telemetria | src/App.tsx:248 | sim | redirecionou | Telemetria de Queries; Bem-vindo ao Promo Finance! | 45 | Sem exceção capturada não comprova função completa |
| /admin/edge-health | src/App.tsx:249 | sim | redirecionou | /admin/edge-health | 0 | Sem exceção capturada não comprova função completa |
| /admin/system-health | src/App.tsx:250 | sim | redirecionou | /admin/system-health | 0 | Sem exceção capturada não comprova função completa |
| /admin/sre | src/App.tsx:251 | sim | redirecionou | /admin/sre | 0 | Sem exceção capturada não comprova função completa |
| /admin/bloat-monitor | src/App.tsx:252 | sim | redirecionou | Monitor de Bloat | 1 | Sem exceção capturada não comprova função completa |
| /admin/sso | src/App.tsx:253 | sim | redirecionou | SSO Empresarial | 1 | Sem exceção capturada não comprova função completa |
| /admin/sso-jit-events | src/App.tsx:254 | sim | redirecionou | Eventos JIT de Provisionamento SSO; Bem-vindo ao Promo Finance! | 27 | Sem exceção capturada não comprova função completa |
| /admin/scim-audit | src/App.tsx:255 | sim | redirecionou | /admin/scim-audit | 0 | Sem exceção capturada não comprova função completa |
| /audit-sso-profile-sync | src/App.tsx:256 | sim | redirecionou | Auditoria de Sincronização SSO; Bem-vindo ao Promo Finance! | 26 | Sem exceção capturada não comprova função completa |
| /admin/sso-events | src/App.tsx:257 | sim | redirecionou | Auditoria de Sincronização SSO; Bem-vindo ao Promo Finance! | 28 | Sem exceção capturada não comprova função completa |
| /admin/insights-ia | src/App.tsx:258 | sim | redirecionou | Insights de IA; Bem-vindo ao Promo Finance! | 36 | Sem exceção capturada não comprova função completa |
| /admin/insights-ia/anomalia/:id | src/App.tsx:259 | sim | redirecionou | Drill-down de anomalia; Bem-vindo ao Promo Finance! | 23 | Sem exceção capturada não comprova função completa |
| /admin/compliance | src/App.tsx:260 | sim | redirecionou | Compliance & Auditoria; Bem-vindo ao Promo Finance! | 32 | Sem exceção capturada não comprova função completa |
| /admin/auditoria-ia | src/App.tsx:261 | sim | redirecionou | Auditoria da IA | 0 | Sem exceção capturada não comprova função completa |
| /configuracoes/privacidade | src/App.tsx:262 | sim | redirecionou | Centro de Privacidade | 1 | Sem exceção capturada não comprova função completa |
| /configuracoes/filtros-salvos | src/App.tsx:263 | sim | redirecionou | Filtros salvos; Bem-vindo ao Promo Finance! | 53 | Sem exceção capturada não comprova função completa |
| /configuracoes/preferencias | src/App.tsx:264 | sim | redirecionou | Minhas preferências; Bem-vindo ao Promo Finance! | 25 | Sem exceção capturada não comprova função completa |
| /configuracoes/notificacoes/historico | src/App.tsx:265 | sim | redirecionou | Histórico de notificações | 1 | Sem exceção capturada não comprova função completa |
| /configuracoes/notificacoes/sino | src/App.tsx:266 | sim | redirecionou | Sino dos filtros salvos | 0 | Sem exceção capturada não comprova função completa |
| /admin/filtros-compartilhados | src/App.tsx:267 | sim | redirecionou | Permissões de filtros compartilhados; Bem-vindo ao Promo Finance! | 25 | Sem exceção capturada não comprova função completa |
| /admin/api | src/App.tsx:268 | sim | redirecionou | API & Integrações; Bem-vindo ao Promo Finance! | 28 | Sem exceção capturada não comprova função completa |
| /admin/campos-customizados | src/App.tsx:269 | sim | redirecionou | Campos Customizados; Bem-vindo ao Promo Finance! | 25 | Sem exceção capturada não comprova função completa |
| /tributario/split-payment | src/App.tsx:270 | sim | redirecionou | Split Payment; Bem-vindo ao Promo Finance! | 25 | Sem exceção capturada não comprova função completa |
| /tributario/conciliacao | src/App.tsx:271 | sim | redirecionou | Conciliação Tributária; Conciliação Tributária; Bem-vindo ao Promo Finance! | 23 | Sem exceção capturada não comprova função completa |
| /tributario/incentivos | src/App.tsx:272 | sim | redirecionou | Incentivos Fiscais; Incentivos Fiscais; Bem-vindo ao Promo Finance! | 25 | Sem exceção capturada não comprova função completa |
| /tributario/auditoria | src/App.tsx:273 | sim | redirecionou | Compliance & Auditoria; Auditoria de Compliance; Bem-vindo ao Promo Finance! | 25 | Sem exceção capturada não comprova função completa |
| /tributario/comparativo | src/App.tsx:274 | sim | redirecionou | Comparativo de Regimes; Comparativo de Regimes Tributários; Bem-vindo ao Promo Finance! | 22 | Sem exceção capturada não comprova função completa |
| /tributario/cashback | src/App.tsx:275 | sim | redirecionou | Simulador de Cashback;  Simulador de Cashback - LC 214/2025; Bem-vindo ao Promo Finance! | 24 | Sem exceção capturada não comprova função completa |
| /tributario/importacao-xml | src/App.tsx:276 | sim | redirecionou | Importação XML; Importação de XML NF-e; Bem-vindo ao Promo Finance! | 24 | Sem exceção capturada não comprova função completa |
| /tributario/sped | src/App.tsx:277 | sim | redirecionou | Exportação SPED; Bem-vindo ao Promo Finance! | 25 | Sem exceção capturada não comprova função completa |
| /tributario/relatorios-contabeis | src/App.tsx:278 | sim | redirecionou | Ops! Algo deu errado | 5 | Cannot read properties of undefined (reading 'filter'); Cannot read properties of undefined (reading 'filter') |
| /tributario/per-dcomp | src/App.tsx:279 | sim | redirecionou |  Per/Dcomp; Bem-vindo ao Promo Finance! | 25 | Sem exceção capturada não comprova função completa |
| /tributario/retencoes | src/App.tsx:280 | sim | redirecionou | Retenções na Fonte; Bem-vindo ao Promo Finance! | 23 | Sem exceção capturada não comprova função completa |
| /tributario/fechamento-mensal | src/App.tsx:281 | sim | redirecionou | Fechamento Mensal Tributário; Bem-vindo ao Promo Finance! | 23 | Sem exceção capturada não comprova função completa |
| /tributario/glossario | src/App.tsx:282 | sim | redirecionou | Glossário Tributário; Bem-vindo ao Promo Finance! | 24 | Sem exceção capturada não comprova função completa |
| /tributario/monofasico | src/App.tsx:283 | sim | redirecionou | Regime Monofásico PIS/COFINS; Bem-vindo ao Promo Finance! | 28 | Sem exceção capturada não comprova função completa |
| /tributario/folha-encargos | src/App.tsx:284 | sim | redirecionou | Encargos de Folha — RAT, FAP e Terceiros; Bem-vindo ao Promo Finance! | 24 | Sem exceção capturada não comprova função completa |
| /tributario/icms-st | src/App.tsx:285 | sim | redirecionou | ICMS — Substituição Tributária e DIFAL; Bem-vindo ao Promo Finance! | 24 | Sem exceção capturada não comprova função completa |
| /tributario/ipi-iss | src/App.tsx:286 | sim | redirecionou | IPI e ISS; Bem-vindo ao Promo Finance! | 22 | Sem exceção capturada não comprova função completa |
| /tributario/pis-cofins | src/App.tsx:287 | sim | redirecionou | PIS/COFINS não cumulativo; Bem-vindo ao Promo Finance! | 26 | Sem exceção capturada não comprova função completa |
| /tributario/irpj-csll | src/App.tsx:288 | sim | redirecionou | IRPJ/CSLL — Lucro Real; Bem-vindo ao Promo Finance! | 23 | Sem exceção capturada não comprova função completa |
| /tributario/darf | src/App.tsx:289 | sim | redirecionou | DARF Consolidado; Bem-vindo ao Promo Finance! | 25 | Sem exceção capturada não comprova função completa |
| /tributario/obrigacoes | src/App.tsx:290 | sim | redirecionou | Obrigações Acessórias; Bem-vindo ao Promo Finance! | 26 | Sem exceção capturada não comprova função completa |
| /tributario/comparativo-conformidade | src/App.tsx:291 | sim | redirecionou | Comparativo de Conformidade; Bem-vindo ao Promo Finance! | 28 | Sem exceção capturada não comprova função completa |
| /tributario/preferencias-digest | src/App.tsx:292 | sim | redirecionou | Preferências do resumo fiscal; Bem-vindo ao Promo Finance! | 22 | Sem exceção capturada não comprova função completa |
| /tributario/observabilidade-digest | src/App.tsx:293 | sim | redirecionou | Observabilidade do Digest; Bem-vindo ao Promo Finance! | 23 | Sem exceção capturada não comprova função completa |
| /inteligencia | src/App.tsx:296 | sim | redirecionou | Inteligência Operacional 360°; Bem-vindo ao Promo Finance! | 29 | Sem exceção capturada não comprova função completa |
| /metas | src/App.tsx:297 | sim | redirecionou | Metas Financeiras; Bem-vindo ao Promo Finance! | 25 | Sem exceção capturada não comprova função completa |
| /orcamentos | src/App.tsx:298 | sim | redirecionou | Bem-vindo ao Promo Finance! | 24 | Sem exceção capturada não comprova função completa |
| /categorias | src/App.tsx:299 | sim | redirecionou | Categorias Financeiras; Bem-vindo ao Promo Finance! | 25 | Sem exceção capturada não comprova função completa |
| /clientes/portal-tokens | src/App.tsx:300 | sim | redirecionou | Portal de Tokens; Bem-vindo ao Promo Finance! | 22 | Sem exceção capturada não comprova função completa |
| /clientes/scoring | src/App.tsx:301 | sim | redirecionou | Scoring & Risco; Bem-vindo ao Promo Finance! | 22 | Sem exceção capturada não comprova função completa |
| /compras | src/App.tsx:303 | sim | redirecionou | Gestão de Compras; Bem-vindo ao Promo Finance! | 30 | Sem exceção capturada não comprova função completa |
| /style-guide | src/App.tsx:304 | sim | redirecionou | Guia de Estilo Corporativo; Paleta de Cores; Tipografia; Heading Level 1; Heading Level 2; Estados de Interface; Animações & Feedback; Bem-vindo ao Promo Finance! | 26 | Sem exceção capturada não comprova função completa |
| * | src/App.tsx:305 | não | não exercitada individualmente | não exercitada | — | Sem exceção capturada não comprova função completa |

## Diálogos e cliques dirigidos

| Rota | Controle | Resultado | Limitação |
|---|---|---|---|
| /contas-pagar | Novo Registro | diálogo aberto | Somente abertura; gravação/efeito financeiro não certificados |
| /contas-receber | Novo Registro | diálogo aberto | Somente abertura; gravação/efeito financeiro não certificados |
| /boletos | Novo Boleto | diálogo aberto | Somente abertura; gravação/efeito financeiro não certificados |
| /notas-fiscais | Emitir NF-e | diálogo aberto | Somente abertura; gravação/efeito financeiro não certificados |
| /tesouraria | Transferência | diálogo aberto | Somente abertura; gravação/efeito financeiro não certificados |
| /pix-hub | Receber | diálogo aberto | Somente abertura; gravação/efeito financeiro não certificados |
| /usuarios | Convidar | não comprovado | TimeoutError: locator.click: Timeout 7000ms exceeded. Call log:   - waiting for getByRole('button', { name: /Convidar/i }).last()     - locator resolved to <button data-dyad-name=" |
| /admin/api | Nova Chave API | diálogo aberto | Somente abertura; gravação/efeito financeiro não certificados |

## Login desktop e mobile

- 1440×1000: botão acionável em trial=true; overflow horizontal=false. Nenhuma credencial real submetida.
- 375×812: botão acionável em trial=true; overflow horizontal=false. Nenhuma credencial real submetida.

## Consulta SEFAZ sintética

Toast de consulta concluída observado: true. Chamadas observadas para Edge Functions SEFAZ/NF-e durante o clique: 0. A inspeção do handler confirma timer/alteração local e protocolo simulado. Captura em `nfe-simulada.png`.

## Limites das fixtures

As respostas de dados gerais são coleções vazias e integrações retornam erro controlado. Isso exercita parte dos estados vazios/indisponíveis. Não certifica paginação populada, alçadas de produção, concorrência, persistência, envio externo ou liquidação. Resultado de diálogo ausente pode ser nome de controle divergente, bloqueio por perfil ou fixture insuficiente; exige reprodução dirigida antes de classificar bug.
