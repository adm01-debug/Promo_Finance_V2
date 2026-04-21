

## Plano — Wizards SPED ECD + ECF (concluído)

### Resultado

- ✅ `SpedEcdWizard` — wizard 3 passos (período → checklist → download/hash/zip)
- ✅ `SpedEcfWizard` — wizard 3 passos com cross-check ECD do mesmo período + apuração preliminar IRPJ/CSLL + bloco "Registrar transmissão"
- ✅ Edge `gerar-sped-ecd` e `gerar-sped-ecf` suportam `mode: 'validate' | 'generate'` com bloqueio 422 em erros
- ✅ Componente `SpedChecklistRow` extraído e reusado pelos dois wizards (DRY)
- ✅ Hooks `useSpedEcdValidacao`, `useSpedEcfValidacao`, `useRegistrarTransmissaoSped`
- ✅ Histórico ganhou coluna **Recibo**, badge "Transmitido" e ação "Registrar transmissão" (dialog inline)
- ✅ Todos os arquivos compilam sem erros (apenas falhas pré-existentes em testes não relacionados)

### Critério de aceite — wizards SPED

1. `/contabilidade` → ECD/ECF abrem wizards 3 passos.
2. ECF mostra ECD vinculada (ou alerta se ausente) no passo 1.
3. Checklist visual ✓/⚠/✗ no passo 2 com expansão de detalhes.
4. Erros bloqueiam geração; avisos não bloqueiam.
5. Hash SHA-256 com botão copiar; downloads `.txt` e `.zip` com README.
6. ECF passo 3 inclui form "Registrar transmissão" (recibo → status `transmitido`).
7. Histórico: coluna Recibo + badge verde + ação extra para registrar transmissão de execuções anteriores.

