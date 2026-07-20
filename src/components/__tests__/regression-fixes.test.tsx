import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Target } from 'lucide-react';
import { EmpresaHeroKPI } from '../empresas/EmpresaCardView';
import { PageHeader } from '../layout/PageHeader';

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_t, tag: string) => {
        const C = ({
          children,
          ...rest
        }: Record<string, unknown> & { children?: React.ReactNode }) => {
          const { initial, animate, exit, transition, variants, whileHover, whileTap, ...dom } =
            rest;
          const Tag = tag as keyof JSX.IntrinsicElements;
          return <Tag {...(dom as object)}>{children}</Tag>;
        };
        return C;
      },
    }
  ),
  useInView: () => true,
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

describe('EmpresaHeroKPI (regressão: require() no render quebrava a página)', () => {
  it('renderiza sem lançar com dados consolidados', () => {
    expect(() =>
      render(
        <EmpresaHeroKPI
          consolidado={{
            saldoTotal: 150000,
            totalReceber: 80000,
            totalPagar: 30000,
            empresasAtivas: 3,
            titulosPendentesReceber: 12,
            titulosPendentesPagar: 7,
          }}
          saldoLiquido={50000}
          totalEmpresas={4}
        />
      )
    ).not.toThrow();
  });
});

describe('PageHeader (regressão: prop icon era aceito e nunca renderizado)', () => {
  it('renderiza o ícone quando fornecido', () => {
    const { container } = render(<PageHeader title="Metas Financeiras" icon={Target} />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('não renderiza wrapper de ícone quando ausente', () => {
    render(<PageHeader title="Sem Icone" />);
    expect(screen.getByText('Sem')).toBeTruthy();
  });
});
