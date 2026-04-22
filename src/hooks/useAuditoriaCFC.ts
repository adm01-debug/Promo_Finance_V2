// Hook que cruza dados do plano_contas e produz uma auditoria CFC completa
// usada por: PlanoContasTab (botão Auditar), SpedEcdWizard/SpedEcfWizard (bloqueio)
// e usePreValidacaoSped (categoria 'cfc').
import { useMemo } from 'react';
import { usePlanoContas, type PlanoContaRow } from '@/hooks/usePlanoContas';
import {
  validarFormatoCFC,
  validarPrefixoNatureza,
  detectarDuplicidades,
  sugerirCorrecaoPrefixo,
  type DuplicidadeCFC,
} from '@/lib/cfc-validator';

export interface PrefixoIncorreto {
  conta: PlanoContaRow;
  esperado: string[];
  atual: string;
  sugestao: string | null;
}

export interface AuditoriaCFCResult {
  isLoading: boolean;
  totalContas: number;
  totalAnaliticas: number;
  comReferencial: number;
  semReferencial: number;
  formatoInvalido: PlanoContaRow[];
  prefixoIncorreto: PrefixoIncorreto[];
  duplicidades: DuplicidadeCFC[];
  scoreConformidade: number; // 0-100
  totalProblemas: number;
  problemasCriticos: number; // formato inválido + duplicidades (bloqueiam SPED)
}

export function useAuditoriaCFC(empresaId: string | undefined): AuditoriaCFCResult {
  const { data: contas = [], isLoading } = usePlanoContas(empresaId);

  return useMemo<AuditoriaCFCResult>(() => {
    const ativas = (contas as PlanoContaRow[]).filter((c) => c.ativo !== false);
    const analiticas = ativas.filter((c) => c.tipo === 'analitica');
    const comRef = analiticas.filter((c) => !!c.codigo_referencial?.trim());
    const semRef = analiticas.filter((c) => !c.codigo_referencial?.trim());

    const formatoInvalido = comRef.filter((c) => !validarFormatoCFC(c.codigo_referencial));

    const prefixoIncorreto: PrefixoIncorreto[] = [];
    for (const c of comRef) {
      // Só checa prefixo de quem tem formato válido (evita ruído duplicado).
      if (!validarFormatoCFC(c.codigo_referencial)) continue;
      const check = validarPrefixoNatureza(c.codigo_referencial, c.natureza);
      if (!check.ok) {
        prefixoIncorreto.push({
          conta: c,
          esperado: check.esperado,
          atual: check.atual,
          sugestao: sugerirCorrecaoPrefixo(c.codigo_referencial!, check.esperado),
        });
      }
    }

    const duplicidades = detectarDuplicidades(ativas);

    // Score: penaliza por tipo. Duplicidade é o pior (bloqueia SPED).
    const penalidade =
      formatoInvalido.length * 5 +
      prefixoIncorreto.length * 3 +
      duplicidades.length * 10 +
      semRef.length * 1;
    const score = Math.max(0, Math.min(100, 100 - penalidade));

    const problemasCriticos = formatoInvalido.length + duplicidades.length;
    const totalProblemas = formatoInvalido.length + prefixoIncorreto.length + duplicidades.length + semRef.length;

    return {
      isLoading,
      totalContas: ativas.length,
      totalAnaliticas: analiticas.length,
      comReferencial: comRef.length,
      semReferencial: semRef.length,
      formatoInvalido,
      prefixoIncorreto,
      duplicidades,
      scoreConformidade: score,
      totalProblemas,
      problemasCriticos,
    };
  }, [contas, isLoading]);
}
