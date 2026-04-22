

## Paridade total de UX entre SpedEcfWizard e SpedEcdWizard

O `SpedEcfWizard.tsx` já compartilha header, StepPills, MetaField, KpiChip, KpiCard, AnimatePresence, gradientes de banner, hash SHA-256 com tooltip "Copiado" e botões `premium`. Faltam quatro detalhes do padrão ECD que vou portar para o ECF.

### Diferenças a corrigir

**1. Step 2 — Listas detalhadas de erros e avisos**
Hoje o ECF mostra apenas chips KPI numéricos. Vou adicionar, logo após a linha "Re-validar":
- `Alert variant="error"` com ScrollArea (`max-h-48`) listando cada erro em `motion.li` com badge numerada, animação staggered (`delay: i*0.03`).
- `Alert variant="warning"` equivalente para avisos (`max-h-40`, badge `border-warning/40 text-warning`).
- Derivar `errosLista = data.validacoes.erros` e `avisosLista = data.validacoes.avisos`.

**2. Step 2 — Alerta de bloqueio com motivo + tooltip no botão**
- Calcular `motivoBloqueio` consolidando todas as causas (erros de validação, ECD ausente em `data.ecd_referencia`, problemas críticos do `preValidacao`, CFC críticos).
- Adicionar `Alert variant="error" title="Geração de arquivo bloqueada"` com `ShieldAlert animate-pulse` e o `motivoBloqueio` quando `!podeGerar`.
- Envolver o botão "Gerar arquivo SPED ECF" em `Tooltip` mostrando o motivo no estado desabilitado (mesmo padrão `<span tabIndex>` do ECD para acessibilidade).

**3. Step 3 — Banner de bloqueio + downloads bloqueados**
- Derivar `errosResultado = resultado.validacoes?.erros || []`, `avisosResultado = resultado.validacoes?.avisos || []`, `downloadBloqueado = errosResultado.length > 0`.
- Substituir o banner único de sucesso por condicional: quando `downloadBloqueado`, renderizar card vermelho (`from-destructive/10 to-destructive/5`) com `Ban animate-pulse` e mensagem explicando que o arquivo foi gerado mas a validação falhou.
- Listar `errosResultado` e `avisosResultado` em ScrollArea (mesmo padrão do Step 2).
- Botões "Baixar .txt" e "Baixar .zip" envoltos em Tooltip; quando bloqueados ficam `variant="outline"` com ícone `Ban`, `disabled` e tooltip "Corrija os N erro(s) antes de baixar".
- Adicionar botão **"Voltar e revalidar"** (`variant="outline"` + `RefreshCw`) que retorna ao Step 2 quando `downloadBloqueado`.

**4. Ajustes menores**
- Importar `Ban`, `ScrollArea`, `AlertTitle` no topo do arquivo.
- O bloco de "Apuração preliminar" e o card "ECD vinculada" do Step 1 permanecem (são exclusivos do ECF — não há equivalente no ECD, e fazem parte do valor de negócio da etapa).

### Arquivo editado
- `src/components/contabilidade/SpedEcfWizard.tsx` — apenas as 4 mudanças acima; sem alteração comportamental além do bloqueio defensivo dos botões de download quando o backend retorna erros pós-geração.

Resultado: paridade visual e de UX 100% com o `SpedEcdWizard`, mantendo a especificidade da ECF (vínculo com ECD e apuração IRPJ/CSLL preliminar).

