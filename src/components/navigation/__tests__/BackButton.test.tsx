import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BackButton } from '../BackButton';
import { TooltipProvider } from '@/components/ui/tooltip';

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
    Object.defineProperty(window, 'history', {
      value: { length: 1 },
      writable: true,
    });
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

  it('navigates to parent route when history is short', () => {
    renderWithRouter(<BackButton />, '/usuarios');
    fireEvent.click(screen.getByRole('button', { name: /voltar/i }));
    // With history.length <= 2, should fallback to parent route
    expect(mockNavigate).toHaveBeenCalledWith('/configuracoes');
  });

  it('uses browser history when available', () => {
    Object.defineProperty(window, 'history', {
      value: { length: 5 },
      writable: true,
    });
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
        <TooltipProvider><BackButton size="lg" /></TooltipProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /voltar/i })).toBeInTheDocument();
  });

  it('has proper aria-label for accessibility', () => {
    renderWithRouter(<BackButton />);
    expect(screen.getByRole('button', { name: /voltar/i })).toHaveAttribute('aria-label', 'Voltar');
  });

  it('applies custom className', () => {
    renderWithRouter(<BackButton className="my-custom-class" />);
    const btn = screen.getByRole('button', { name: /voltar/i });
    expect(btn.className).toContain('my-custom-class');
  });

  it('falls back to "/" for unknown routes', () => {
    renderWithRouter(<BackButton />, '/some-unknown-route');
    fireEvent.click(screen.getByRole('button', { name: /voltar/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
