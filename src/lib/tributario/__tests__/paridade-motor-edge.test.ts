import { describe, expect, it } from 'vitest';
import {
  simularSimples as simularSimplesCliente,
  simularPresumido as simularPresumidoCliente,
  simularReal as simularRealCliente,
  determinarAnexoSimples as determinarAnexoCliente,
  ANEXOS as ANEXOS_CLIENTE,
} from '../shared-logic';
import {
  simularSimples as simularSimplesEdge,
  simularPresumido as simularPresumidoEdge,
  simularReal as simularRealEdge,
  determinarAnexoSimples as determinarAnexoEdge,
  ANEXOS as ANEXOS_EDGE,
} from '../../../../supabase/functions/_shared/tributario-logic';
import type { ParametrosSimulacao } from '../types';

/**
 * Paridade entre os DOIS motores tributários que este repositório mantém.
 *
 * `src/lib/tributario/shared-logic.ts` calcula o imposto que o usuário vê na
 * tela; `supabase/functions/_shared/tributario-logic.ts` calcula o que as edge
 * functions `simular-simples`, `simular-presumido` e `simular-real` devolvem.
 * São implementações **separadas** da mesma lei: a do cliente é modular
 * (`anexos`, `parametros`, `encargos-folha`, `apuracao`), a da edge é uma cópia
 * achatada num único arquivo autocontido — Deno não resolve os `@/` do bundler.
 *
 * A consequência é que corrigir uma faixa do Anexo III, ou a trava de 30% na
 * compensação de prejuízo, num lado deixa o outro com a lei antiga. E a falha
 * é silenciosa nos dois sentidos: a tela mostra um DAS, o servidor grava outro,
 * e nenhum dos dois erra sozinho de forma óbvia.
 *
 * Testar cada motor isoladamente não pega isso — dois testes verdes sobre
 * números diferentes continuam verdes. O que prende as cópias juntas é rodar a
 * MESMA entrada nas duas e exigir o MESMO resultado. Enquanto a duplicação
 * existir, este arquivo é a costura.
 *
 * Casos escolhidos nas fronteiras, porque é onde um `<` virando `<=` muda o
 * imposto: limite de faixa exato, teto do Simples, corte do Fator R (28%) e
 * sublimite estadual de ICMS/ISS.
 *
 * ## Por que isto NÃO é redundante com `drift-guard-motor.test.ts`
 *
 * Aquele guard compara o TEXTO das duas cópias, normalizado; este compara o
 * RESULTADO. São garantias diferentes, e cada um enxerga o que o outro não vê:
 *
 * - O guard textual descarta o conteúdo dos literais de propósito, para não
 *   quebrar por diferença de estilo em mensagem. Isso o deixou verde enquanto
 *   a cópia da edge exibia `Revenda/comercio ... -> Anexo I.` e a do cliente
 *   `Revenda/comércio ... → Anexo I.` — texto que vai para a tela do usuário,
 *   divergente por transcodificação, sem nenhum teste reclamando. Foi este
 *   arquivo que expôs isso, em 39 cenários.
 * - Em compensação, o guard textual cobre todo o código das duas cópias,
 *   inclusive ramos que nenhum cenário aqui alcança. Comparar só resultado
 *   deixaria passar deriva em caminho não exercitado.
 *
 * Um detalhe que custou tempo e vale registrar: por comparar texto, o guard é
 * sensível a FORMATAÇÃO. O prettier normaliza `0.20` para `0.2` e remove
 * parênteses redundantes, então formatar uma cópia sem formatar a outra derruba
 * o guard sem que exista deriva de lógica alguma. Como o `lint-staged` roda
 * `prettier --write` em todo `.ts` que entra no commit, as duas cópias precisam
 * ficar permanentemente prettier-clean — as duas foram formatadas junto com
 * esta mudança justamente para remover essa armadilha.
 */

function base(overrides: Partial<ParametrosSimulacao> = {}): ParametrosSimulacao {
  return {
    faturamentoAnual: 1_000_000,
    percentualServicos: 50,
    folhaAnual: 200_000,
    margemLucro: 15,
    ...overrides,
  } as ParametrosSimulacao;
}

/** Fronteiras de faixa: o valor exato do teto e um centavo acima. */
const TETOS_DE_FAIXA = [180_000, 360_000, 720_000, 1_800_000, 3_600_000];

const CENARIOS: Array<{ nome: string; params: ParametrosSimulacao; ano: number; mes: number }> = [
  { nome: 'comércio típico', params: base({ percentualServicos: 0 }), ano: 2026, mes: 6 },
  { nome: 'serviços típicos', params: base({ percentualServicos: 100 }), ano: 2026, mes: 6 },
  { nome: 'misto 50/50', params: base(), ano: 2026, mes: 6 },

  // Fator R = folha/RBT12. Em 28% exatos o anexo muda de V para III: é o corte
  // mais caro do Simples e o mais fácil de errar por um sinal de comparação.
  {
    nome: 'fator R exatamente 28%',
    params: base({ faturamentoAnual: 1_000_000, folhaAnual: 280_000, percentualServicos: 100 }),
    ano: 2026,
    mes: 6,
  },
  {
    nome: 'fator R logo abaixo de 28%',
    params: base({ faturamentoAnual: 1_000_000, folhaAnual: 279_999, percentualServicos: 100 }),
    ano: 2026,
    mes: 6,
  },
  {
    nome: 'fator R logo acima de 28%',
    params: base({ faturamentoAnual: 1_000_000, folhaAnual: 280_001, percentualServicos: 100 }),
    ano: 2026,
    mes: 6,
  },

  // Sublimite estadual: acima dele ICMS e ISS saem do DAS.
  {
    nome: 'sublimite estadual excedido',
    params: base({ faturamentoAnual: 4_000_000, percentualServicos: 30 }),
    ano: 2026,
    mes: 6,
  },

  // Teto do Simples: R$ 4,8 mi é elegível, um real acima não é.
  {
    nome: 'teto do Simples exato',
    params: base({ faturamentoAnual: 4_800_000 }),
    ano: 2026,
    mes: 6,
  },
  {
    nome: 'um real acima do teto do Simples',
    params: base({ faturamentoAnual: 4_800_001 }),
    ano: 2026,
    mes: 6,
  },

  // Prejuízo acumulado exercita a trava de 30% na compensação.
  {
    nome: 'lucro real com prejuízo acumulado',
    params: base({
      faturamentoAnual: 20_000_000,
      margemLucro: 20,
      prejuizoFiscalAcumulado: 5_000_000,
      baseNegativaCsllAcumulada: 5_000_000,
    } as Partial<ParametrosSimulacao>),
    ano: 2026,
    mes: 6,
  },

  // Créditos e retenções mexem em ramos que só aparecem quando preenchidos.
  {
    nome: 'presumido com créditos e ISS retido',
    params: base({
      faturamentoAnual: 30_000_000,
      percentualServicos: 40,
      comprasComCredito: 8_000_000,
      issRetidoFonte: 50_000,
    } as Partial<ParametrosSimulacao>),
    ano: 2026,
    mes: 6,
  },

  ...TETOS_DE_FAIXA.flatMap((teto) => [
    {
      nome: `teto de faixa exato (${teto})`,
      params: base({ faturamentoAnual: teto }),
      ano: 2026,
      mes: 6,
    },
    {
      nome: `um real acima da faixa (${teto})`,
      params: base({ faturamentoAnual: teto + 1 }),
      ano: 2026,
      mes: 6,
    },
  ]),
];

describe('paridade entre o motor tributário do cliente e o da edge function', () => {
  it('as tabelas de anexo do Simples são idênticas', () => {
    // Uma divergência aqui não muda um caso de borda: muda todo imposto do
    // anexo afetado.
    expect(ANEXOS_EDGE).toEqual(ANEXOS_CLIENTE);
  });

  it.each(CENARIOS)('simularSimples — $nome', ({ params, ano, mes }) => {
    expect(simularSimplesEdge(params, ano, mes)).toEqual(simularSimplesCliente(params, ano, mes));
  });

  it.each(CENARIOS)('simularPresumido — $nome', ({ params }) => {
    expect(simularPresumidoEdge(params)).toEqual(simularPresumidoCliente(params));
  });

  it.each(CENARIOS)('simularReal — $nome', ({ params }) => {
    expect(simularRealEdge(params)).toEqual(simularRealCliente(params));
  });

  it.each(CENARIOS)('determinarAnexoSimples — $nome', ({ params }) => {
    const fatorR =
      params.faturamentoAnual > 0 ? (params.folhaAnual ?? 0) / params.faturamentoAnual : 0;
    expect(determinarAnexoEdge(params, fatorR)).toEqual(determinarAnexoCliente(params, fatorR));
  });

  it('cada anexo forçado produz o mesmo resultado nos dois motores', () => {
    for (const anexo of Object.keys(ANEXOS_CLIENTE) as Array<keyof typeof ANEXOS_CLIENTE>) {
      const params = base({ faturamentoAnual: 1_500_000 });
      expect(simularSimplesEdge(params, 2026, 6, anexo)).toEqual(
        simularSimplesCliente(params, 2026, 6, anexo)
      );
    }
  });
});
