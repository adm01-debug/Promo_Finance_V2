/**
 * Guarda contra orfao: 4 paineis de telemetria estavam prontos no disco
 * (AcessosSuspeitos, CatalogosTributariosHealth, CatalogosTributariosHistory,
 * CoberturaFiscalUF — 36 KB, 5 RPCs ja em producao) e NENHUM arquivo da
 * aplicacao os importava. Nao havia rota, aba ou link: trabalho terminado e
 * inalcancavel, e nenhum teste reprovava por isso.
 *
 * Este teste le o fonte da pagina em vez de renderiza-la: o que ele garante e a
 * LIGACAO (import + uso no JSX), nao o comportamento de cada painel, que tem
 * teste proprio em components/admin/telemetry/__tests__/.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// `import.meta.url` chega como http:// no ambiente jsdom do vitest, entao o
// caminho sai da raiz do projeto (process.cwd()).
const fonte = readFileSync(resolve(process.cwd(), 'src/pages/AdminTelemetria.tsx'), 'utf-8');

const PAINEIS = [
  'AcessosSuspeitosPanel',
  'CatalogosTributariosHealthPanel',
  'CatalogosTributariosHistoryPanel',
  'CoberturaFiscalUFPanel',
  // os que ja estavam ligados, para nao serem desligados sem reprovar
  'IntegrityAlertsPanel',
  'PerformanceAlertsPanel',
  'RetentionPoliciesPanel',
  'RetentionHistoryPanel',
];

describe('AdminTelemetria — paineis ligados na pagina', () => {
  it.each(PAINEIS)('%s esta importado', (painel) => {
    expect(fonte).toMatch(
      new RegExp(`import \\{ ${painel} \\} from '@/components/admin/telemetry/${painel}'`)
    );
  });

  it.each(PAINEIS)('%s esta renderizado no JSX', (painel) => {
    expect(fonte).toMatch(new RegExp(`<${painel}\\s*/>`));
  });
});
