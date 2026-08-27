import { render, screen } from '@testing-library/react';
import { vi, describe, expect, it } from 'vitest';
import { StartupDiagnostic } from './StartupDiagnostic';

const diagnostico = vi.fn();

vi.mock('@/hooks/useStartupDiagnostic', () => ({
  useStartupDiagnostic: () => diagnostico(),
}));

describe('StartupDiagnostic', () => {
  it('não bloqueia a rota pública quando a checagem falha', () => {
    diagnostico.mockReturnValue({
      results: [],
      isComplete: true,
      hasError: true,
      retry: vi.fn(),
    });

    render(<StartupDiagnostic><main>Login disponível</main></StartupDiagnostic>);

    expect(screen.getByText('Login disponível')).toBeInTheDocument();
    expect(screen.getByText('Diagnóstico indisponível')).toBeInTheDocument();
  });

  it('mantém a tela da aplicação disponível durante a verificação', () => {
    diagnostico.mockReturnValue({
      results: [],
      isComplete: false,
      hasError: false,
      retry: vi.fn(),
    });

    render(<StartupDiagnostic><main>Rota pública</main></StartupDiagnostic>);

    expect(screen.getByText('Rota pública')).toBeInTheDocument();
  });
});
