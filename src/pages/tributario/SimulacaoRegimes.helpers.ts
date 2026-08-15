// Constantes e helpers da página SimulacaoRegimes — extraídos para zerar max-lines.
import type { RegimeTributario } from '@/lib/tributario';
import type { LinhaAuditoriaCsv } from '@/lib/tributario/historico-simulacao';
import type { ExportColumn } from '@/lib/export-utils';

/** Colunas da trilha de auditoria exportável (ordem fixa para diffs estáveis). */
export const COLUNAS_AUDITORIA: ExportColumn<LinhaAuditoriaCsv>[] = [
  { key: 'data', header: 'Data da simulação' },
  { key: 'regimeSalvo', header: 'Regime recomendado (salvo)' },
  { key: 'regimeRecalculado', header: 'Regime recalculado (motor atual)' },
  { key: 'situacao', header: 'Situação' },
  { key: 'versaoMotor', header: 'Versão do motor' },
  { key: 'faturamento12m', header: 'Faturamento 12m' },
  { key: 'folha12m', header: 'Folha 12m' },
  { key: 'economiaAnual', header: 'Economia anual estimada' },
  { key: 'qtdAjustes', header: 'Qtd. ajustes' },
  { key: 'ajustesCriticos', header: 'Ajustes críticos' },
  { key: 'ajustes', header: 'Detalhe dos ajustes' },
];

export const corPorRegime = (r: RegimeTributario) =>
  r === 'simples_nacional' ? 'hsl(160 84% 39%)' : r === 'lucro_presumido' ? 'hsl(258 90% 66%)' : 'hsl(217 91% 60%)';
