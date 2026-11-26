import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const baseRegua = [
  {
    id: '1',
    nome: 'Preventiva',
    descricao: 'Lembrete antes do vencimento',
    dias_gatilho: -3,
    canais: ['email', 'whatsapp'],
    auto_executar: true,
    ativo: true,
  },
  {
    id: '2',
    nome: 'Lembrete',
    descricao: 'Lembrete no vencimento',
    dias_gatilho: 0,
    canais: ['email'],
    auto_executar: true,
    ativo: true,
  },
  {
    id: '3',
    nome: 'Cobranca',
    descricao: 'Após vencimento',
    dias_gatilho: 3,
    canais: ['email', 'sms'],
    auto_executar: false,
    ativo: true,
  },
  {
    id: '4',
    nome: 'Negociacao',
    descricao: 'Tentativa de acordo',
    dias_gatilho: 15,
    canais: ['telefone'],
    auto_executar: false,
    ativo: false,
  },
];

const reguaState = vi.hoisted(() => ({ regua: [] as unknown[] }));

vi.mock('@/hooks/useReguaCobranca', () => ({
  useReguaCobranca: () => ({
    data: reguaState.regua,
    isLoading: false,
  }),
  useUpdateReguaCobranca: () => ({ mutate: vi.fn() }),
  useTemplatesCobranca: () => ({
    data: [
      {
        id: 't1',
        nome: 'Template Preventivo',
        tipo: 'preventiva',
        canal: 'email',
        assunto: 'Assunto',
        corpo: 'Corpo',
        ativo: true,
      },
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
  let ReguaCobrancaConfig: any;

  beforeAll(async () => {
    const mod = await import('../ReguaCobrancaConfig');
    ReguaCobrancaConfig = mod.ReguaCobrancaConfig;
    reguaState.regua = baseRegua;
  });

  afterEach(() => {
    reguaState.regua = baseRegua;
  });

  describe('Renderização da régua', () => {
    it('exibe título da configuração', () => {
      render(<ReguaCobrancaConfig />, { wrapper });
      expect(screen.getByText('Configuração da Régua de Cobrança')).toBeInTheDocument();
    });

    it('exibe etapa Preventiva', () => {
      render(<ReguaCobrancaConfig />, { wrapper });
      expect(screen.getAllByText('Preventiva').length).toBeGreaterThanOrEqual(1);
    });

    it('exibe etapa Cobranca', () => {
      render(<ReguaCobrancaConfig />, { wrapper });
      expect(screen.getByText('Cobranca')).toBeInTheDocument();
    });

    it('exibe etapa Negociacao', () => {
      render(<ReguaCobrancaConfig />, { wrapper });
      expect(screen.getByText('Negociacao')).toBeInTheDocument();
    });

    it('exibe descrição das etapas', () => {
      render(<ReguaCobrancaConfig />, { wrapper });
      expect(screen.getByText('Lembrete antes do vencimento')).toBeInTheDocument();
    });
  });

  describe('Switches de configuração', () => {
    it('exibe switches Auto para cada etapa', () => {
      render(<ReguaCobrancaConfig />, { wrapper });
      expect(screen.getAllByText('Auto').length).toBe(4);
    });

    it('exibe switches Ativo para cada etapa', () => {
      render(<ReguaCobrancaConfig />, { wrapper });
      expect(screen.getAllByText('Ativo').length).toBe(4);
    });
  });

  describe('Prop secao (uso nas Configuracoes)', () => {
    it('secao="regua" mostra a regua e esconde os templates', () => {
      render(<ReguaCobrancaConfig secao="regua" />, { wrapper });
      expect(screen.getByText('Configuração da Régua de Cobrança')).toBeInTheDocument();
      expect(screen.queryByText('Templates de Cobrança')).not.toBeInTheDocument();
    });

    it('secao="templates" mostra os templates e esconde a regua', () => {
      render(<ReguaCobrancaConfig secao="templates" />, { wrapper });
      expect(screen.getByText('Templates de Cobrança')).toBeInTheDocument();
      expect(screen.queryByText('Configuração da Régua de Cobrança')).not.toBeInTheDocument();
    });
  });

  describe('Estado vazio', () => {
    it('avisa quando nao ha etapas de regua cadastradas', () => {
      reguaState.regua = [];
      render(<ReguaCobrancaConfig secao="regua" />, { wrapper });
      expect(screen.getByText(/Nenhuma etapa de régua configurada/)).toBeInTheDocument();
    });
  });
});
