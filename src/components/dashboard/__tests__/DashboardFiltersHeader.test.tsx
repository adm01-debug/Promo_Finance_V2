import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const mockUseAuth = vi.fn();

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/components/ui/ux-validator', () => ({
  VisualValidator: () => <div data-testid="ux-validator" />,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
}));

import { DashboardFiltersHeader } from '@/components/dashboard/DashboardFiltersHeader';

describe('DashboardFiltersHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      currentEmpresaId: 'empresa-1',
      profile: { full_name: 'Joaquim' },
      user: { email: 'joaquim@empresa.com' },
    });
  });

  it('mantém "Todas as Empresas" sem sobrescrever o filtro no mount', () => {
    const setEmpresaFilter = vi.fn();

    render(
      <DashboardFiltersHeader
        empresas={[{ id: 'empresa-1', nome_fantasia: 'Empresa 1', razao_social: 'Empresa 1 LTDA' }]}
        centrosCusto={[{ id: 'cc-1', nome: 'Financeiro' }]}
        empresaFilter="all"
        setEmpresaFilter={setEmpresaFilter}
        centroCustoFilter="all"
        setCentroCustoFilter={vi.fn()}
        onOpenConfig={vi.fn()}
      />,
    );

    expect(setEmpresaFilter).not.toHaveBeenCalled();
  });

  it('expõe nomes acessíveis para os filtros do dashboard', () => {
    render(
      <DashboardFiltersHeader
        empresas={[{ id: 'empresa-1', nome_fantasia: 'Empresa 1', razao_social: 'Empresa 1 LTDA' }]}
        centrosCusto={[{ id: 'cc-1', nome: 'Financeiro' }]}
        empresaFilter="all"
        setEmpresaFilter={vi.fn()}
        centroCustoFilter="all"
        setCentroCustoFilter={vi.fn()}
        onOpenConfig={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/filtro de empresa do dashboard/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filtro de centro de custo do dashboard/i)).toBeInTheDocument();
  });
});
