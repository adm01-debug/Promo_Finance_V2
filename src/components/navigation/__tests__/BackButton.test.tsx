import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BackButton } from '../BackButton';
import { TooltipProvider } from '@/components/ui/tooltip';
import { recordNavEntry, resetNavStack } from '@/lib/navigation';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderWithRouter(ui: React.ReactElement, initialRoute = '/contas-receber') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <TooltipProvider>{ui}</TooltipProvider>
    </MemoryRouter>
  );
}

describe('BackButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetNavStack();
  });

  it('renders on non-home pages', () => {
    renderWithRouter(<BackButton />);
    expect(screen.getByRole('button', { name: /voltar/i })).toBeInTheDocument();
  });

  it('does NOT render on home page', () => {
    renderWithRouter(<BackButton />, '/');
    expect(screen.queryByRole('button', { name: /voltar/i })).not.toBeInTheDocument();
  });

  it('does NOT render on /dashboard', () => {
    renderWithRouter(<BackButton />, '/dashboard');
    expect(screen.queryByRole('button', { name: /voltar/i })).not.toBeInTheDocument();
  });

  it('navigates to fallbackPath when provided', () => {
    renderWithRouter(<BackButton fallbackPath="/empresas" />);
    fireEvent.click(screen.getByRole('button', { name: /voltar/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/empresas');
  });

  it('navigates to parent route without in-app history', () => {
    renderWithRouter(<BackButton />, '/usuarios');
    fireEvent.click(screen.getByRole('button', { name: /voltar/i }));
    // Sem entrada in-app anterior, sobe para a rota-pai (nunca sai do app)
    expect(mockNavigate).toHaveBeenCalledWith('/configuracoes', { replace: true });
  });

  it('uses in-app history stack when available', () => {
    recordNavEntry({ key: 'a', pathname: '/', search: '' }, 'PUSH');
    recordNavEntry({ key: 'b', pathname: '/contas-pagar', search: '' }, 'PUSH');
    recordNavEntry({ key: 'c', pathname: '/contas-receber', search: '' }, 'PUSH');
    renderWithRouter(<BackButton />);
    fireEvent.click(screen.getByRole('button', { name: /voltar/i }));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('shows label when showLabel is true', () => {
    renderWithRouter(<BackButton showLabel label="Retornar" />);
    expect(screen.getByText('Retornar')).toBeInTheDocument();
  });

  it('renders with different size variants', () => {
    const { rerender } = renderWithRouter(<BackButton size="sm" />);
    const btn = screen.getByRole('button', { name: /voltar/i });
    expect(btn).toBeInTheDocument();

    rerender(
      <MemoryRouter initialEntries={['/contas-receber']}>
        <TooltipProvider>
          <BackButton size="lg" />
        </TooltipProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /voltar/i })).toBeInTheDocument();
  });

  it('has proper aria-label for accessibility', () => {
    renderWithRouter(<BackButton />);
    expect(screen.getByRole('button', { name: /voltar/i })).toHaveAttribute(
      'aria-label',
      'Voltar para Dashboard'
    );
  });

  it('applies custom className', () => {
    renderWithRouter(<BackButton className="my-custom-class" />);
    const btn = screen.getByRole('button', { name: /voltar/i });
    expect(btn.className).toContain('my-custom-class');
  });

  it('falls back to "/" for unknown routes', () => {
    renderWithRouter(<BackButton />, '/some-unknown-route');
    fireEvent.click(screen.getByRole('button', { name: /voltar/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });
});
