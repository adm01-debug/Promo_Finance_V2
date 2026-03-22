import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContasReceberFilters } from '../ContasReceberFilters';

describe('ContasReceberFilters', () => {
  const defaultProps = {
    searchTerm: '',
    onSearchChange: vi.fn(),
    statusFilter: 'all',
    onStatusChange: vi.fn(),
    centroCustoFilter: 'all',
    onCentroCustoChange: vi.fn(),
    centrosCusto: [
      { id: 'cc-1', nome: 'Administrativo' },
      { id: 'cc-2', nome: 'Comercial' },
    ],
    advancedFilters: {},
    onAdvancedFiltersChange: vi.fn(),
  };

  // ===== Busca =====
  describe('Busca textual', () => {
    it('renderiza input de busca', () => {
      render(<ContasReceberFilters {...defaultProps} />);
      expect(screen.getByPlaceholderText(/buscar/i)).toBeInTheDocument();
    });

    it('chama onSearchChange ao digitar', () => {
      const onSearch = vi.fn();
      render(<ContasReceberFilters {...defaultProps} onSearchChange={onSearch} />);
      fireEvent.change(screen.getByPlaceholderText(/buscar/i), { target: { value: 'teste' } });
      expect(onSearch).toHaveBeenCalledWith('teste');
    });

    it('exibe valor atual do searchTerm', () => {
      render(<ContasReceberFilters {...defaultProps} searchTerm="cliente X" />);
      expect(screen.getByDisplayValue('cliente X')).toBeInTheDocument();
    });
  });

  // ===== #3: Filtro por Empresa =====
  describe('Gap #3 - Filtro por Empresa', () => {
    const empresas = [
      { id: 'emp-1', razao_social: 'Empresa Alpha LTDA', nome_fantasia: 'Alpha' },
      { id: 'emp-2', razao_social: 'Empresa Beta LTDA', nome_fantasia: null },
    ];

    it('renderiza select de empresa quando empresas são fornecidas', () => {
      render(
        <ContasReceberFilters
          {...defaultProps}
          empresas={empresas}
          empresaFilter="all"
          onEmpresaChange={vi.fn()}
        />
      );
      // O trigger do select deve estar presente
      expect(screen.getByText('Todas empresas')).toBeInTheDocument();
    });

    it('não renderiza select de empresa quando empresas não são fornecidas', () => {
      render(<ContasReceberFilters {...defaultProps} />);
      expect(screen.queryByText('Todas empresas')).not.toBeInTheDocument();
    });

    it('não renderiza select de empresa quando onEmpresaChange não é fornecido', () => {
      render(
        <ContasReceberFilters {...defaultProps} empresas={empresas} />
      );
      expect(screen.queryByText('Todas empresas')).not.toBeInTheDocument();
    });
  });

  // ===== #32: Filtro por forma de pagamento =====
  describe('Gap #32 - Filtro forma pagamento', () => {
    it('renderiza select de forma quando onFormaChange é fornecido', () => {
      render(
        <ContasReceberFilters
          {...defaultProps}
          formaFilter="all"
          onFormaChange={vi.fn()}
        />
      );
      expect(screen.getByText('Todas formas')).toBeInTheDocument();
    });

    it('não renderiza select de forma quando onFormaChange não é fornecido', () => {
      render(<ContasReceberFilters {...defaultProps} />);
      expect(screen.queryByText('Todas formas')).not.toBeInTheDocument();
    });
  });

  // ===== Status filter =====
  describe('Filtro de status', () => {
    it('renderiza opções de status', () => {
      render(<ContasReceberFilters {...defaultProps} />);
      expect(screen.getByText('Todos status')).toBeInTheDocument();
    });
  });

  // ===== Centro de custo filter =====
  describe('Filtro centro de custo', () => {
    it('renderiza opções de centros de custo', () => {
      render(<ContasReceberFilters {...defaultProps} />);
      expect(screen.getByText('Todos centros')).toBeInTheDocument();
    });
  });
});
