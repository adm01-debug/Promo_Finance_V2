import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the hooks
vi.mock('@/hooks/useReguaCobranca', () => ({
  useReguaCobranca: () => ({
    data: [
      { id: '1', nome: 'Preventiva', descricao: 'Lembrete antes do vencimento', dias_gatilho: -3, canais: ['email', 'whatsapp'], auto_executar: true, ativo: true },
      { id: '2', nome: 'Lembrete', descricao: 'Lembrete no vencimento', dias_gatilho: 0, canais: ['email'], auto_executar: true, ativo: true },
      { id: '3', nome: 'Cobranca', descricao: 'Após vencimento', dias_gatilho: 3, canais: ['email', 'whatsapp', 'sms'], auto_executar: false, ativo: true },
      { id: '4', nome: 'Negociacao', descricao: 'Tentativa de acordo', dias_gatilho: 15, canais: ['telefone'], auto_executar: false, ativo: false },
    ],
    isLoading: false,
  }),
  useUpdateReguaCobranca: () => ({ mutate: vi.fn() }),
  useTemplatesCobranca: () => ({
    data: [
      { id: 't1', nome: 'Template Preventivo', tipo: 'preventiva', canal: 'email', assunto: 'Lembrete', corpo: 'Olá {{nome}}', ativo: true },
      { id: 't2', nome: 'Template Cobrança', tipo: 'cobranca', canal: 'whatsapp', assunto: 'Cobrança', corpo: 'Prezado {{nome}}', ativo: true },
    ],
  }),
  useUpdateTemplate: () => ({ mutate: vi.fn() }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

describe('ReguaCobrancaConfig', () => {
  // Dynamic import to ensure mocks are set up first
  let ReguaCobrancaConfig: any;
  
  beforeAll(async () => {
    const mod = await import('../ReguaCobrancaConfig');
    ReguaCobrancaConfig = mod.ReguaCobrancaConfig;
  });

  describe('Renderização da régua', () => {
    it('exibe título da configuração', () => {
      render(<ReguaCobrancaConfig />, { wrapper });
      expect(screen.getByText('Configuração da Régua de Cobrança')).toBeInTheDocument();
    });

    it('exibe todas as etapas', () => {
      render(<ReguaCobrancaConfig />, { wrapper });
      expect(screen.getByText('Preventiva')).toBeInTheDocument();
      expect(screen.getByText('Lembrete')).toBeInTheDocument();
      expect(screen.getByText('Cobranca')).toBeInTheDocument();
      expect(screen.getByText('Negociacao')).toBeInTheDocument();
    });

    it('exibe descrição das etapas', () => {
      render(<ReguaCobrancaConfig />, { wrapper });
      expect(screen.getByText('Lembrete antes do vencimento')).toBeInTheDocument();
      expect(screen.getByText('Após vencimento')).toBeInTheDocument();
    });
  });

  describe('Canais por etapa', () => {
    it('exibe badges de canal por etapa', () => {
      render(<ReguaCobrancaConfig />, { wrapper });
      // Preventiva has email + whatsapp
      expect(screen.getAllByText('email').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('whatsapp').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Switches de configuração', () => {
    it('exibe switch Auto para cada etapa', () => {
      render(<ReguaCobrancaConfig />, { wrapper });
      expect(screen.getAllByText('Auto').length).toBe(4);
    });

    it('exibe switch Ativo para cada etapa', () => {
      render(<ReguaCobrancaConfig />, { wrapper });
      expect(screen.getAllByText('Ativo').length).toBe(4);
    });
  });
});
