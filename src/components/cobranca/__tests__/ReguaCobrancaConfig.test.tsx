import { describe, it, expect, vi, beforeAll, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EmpresaScopeContext, type EmpresaScopeContextValue } from '@/contexts/useEmpresaScope';

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

/**
 * Fixtures no formato REAL de `templates_cobranca`: a coluna é `etapa`
 * (migrations 20260317000817 / 20260518171613), não `tipo`. Com `tipo` o
 * componente filtrava por `etapa` e nenhum template aparecia — o teste
 * "passava" sem exercitar a lista.
 */
const baseTemplates = [
  {
    id: 't1',
    empresa_id: 'e1',
    etapa: 'preventiva',
    canal: 'email',
    tom: 'profissional',
    assunto: 'Assunto preventivo',
    corpo: 'Olá {{cliente}}, sua parcela de {{valor}} vence em {{vencimento}}.',
    ativo: true,
    padrao: true,
  },
  {
    id: 't2',
    empresa_id: 'e2',
    etapa: 'cobranca',
    canal: 'whatsapp',
    tom: 'firme',
    assunto: null,
    corpo: 'Cobrança da parcela {{valor}}.',
    ativo: true,
  },
];

const estado = vi.hoisted(() => ({
  regua: [] as unknown[],
  templates: [] as unknown[],
  criados: [] as Array<Record<string, unknown>>,
  excluidos: [] as string[],
  escopos: [] as Array<string | null>,
}));

vi.mock('@/hooks/useReguaCobranca', () => ({
  useReguaCobranca: () => ({ data: estado.regua, isLoading: false }),
  useUpdateReguaCobranca: () => ({ mutate: vi.fn() }),
  useTemplatesCobranca: (empresaId?: string) => {
    estado.escopos.push(empresaId ?? null);
    return { data: estado.templates };
  },
  useUpdateTemplate: () => ({ mutate: vi.fn() }),
  useCriarTemplate: () => ({
    mutate: (payload: Record<string, unknown>, opcoes?: { onSuccess?: () => void }) => {
      estado.criados.push(payload);
      opcoes?.onSuccess?.();
    },
    isPending: false,
  }),
  useExcluirTemplate: () => ({
    mutate: ({ id }: { id: string }) => estado.excluidos.push(id),
  }),
}));

const escopoEmpresa = (empresaId: string | null): EmpresaScopeContextValue =>
  ({
    mode: 'focused',
    ids: empresaId ? [empresaId] : [],
    isConsolidated: false,
    currentEmpresaId: empresaId,
    availableEmpresas: [
      { empresa_id: 'e1', empresa: { razao_social: 'ACME LTDA' } },
      { empresa_id: 'e2', empresa: { razao_social: 'BETA ME' } },
    ],
    scopedEmpresas: [],
    isLoading: false,
    setMode: vi.fn(),
    toggleEmpresa: vi.fn(),
    setSelectedIds: vi.fn(),
    selectAll: vi.fn(),
    focusEmpresa: vi.fn(),
  }) as unknown as EmpresaScopeContextValue;

const criarWrapper = (escopo?: EmpresaScopeContextValue) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>
      {escopo ? (
        <EmpresaScopeContext.Provider value={escopo}>{children}</EmpresaScopeContext.Provider>
      ) : (
        children
      )}
    </QueryClientProvider>
  );
};

describe('ReguaCobrancaConfig', () => {
  let ReguaCobrancaConfig: any;

  beforeAll(async () => {
    const mod = await import('../ReguaCobrancaConfig');
    ReguaCobrancaConfig = mod.ReguaCobrancaConfig;
    estado.regua = baseRegua;
    estado.templates = baseTemplates;
  });

  beforeEach(() => {
    estado.criados = [];
    estado.excluidos = [];
    estado.escopos = [];
  });

  afterEach(() => {
    estado.regua = baseRegua;
    estado.templates = baseTemplates;
    vi.restoreAllMocks();
  });
  describe('Renderização da régua', () => {
    it('exibe título da configuração', () => {
      render(<ReguaCobrancaConfig />, { wrapper: criarWrapper() });
      expect(screen.getByText('Configuração da Régua de Cobrança')).toBeInTheDocument();
    });

    it('exibe etapa Preventiva', () => {
      render(<ReguaCobrancaConfig />, { wrapper: criarWrapper() });
      expect(screen.getAllByText('Preventiva').length).toBeGreaterThanOrEqual(1);
    });

    it('exibe etapa Cobranca', () => {
      render(<ReguaCobrancaConfig />, { wrapper: criarWrapper() });
      expect(screen.getByText('Cobranca')).toBeInTheDocument();
    });

    it('exibe etapa Negociacao', () => {
      render(<ReguaCobrancaConfig />, { wrapper: criarWrapper() });
      expect(screen.getByText('Negociacao')).toBeInTheDocument();
    });

    it('exibe descrição das etapas', () => {
      render(<ReguaCobrancaConfig />, { wrapper: criarWrapper() });
      expect(screen.getByText('Lembrete antes do vencimento')).toBeInTheDocument();
    });
  });

  describe('Switches de configuração', () => {
    it('exibe switches Auto para cada etapa', () => {
      render(<ReguaCobrancaConfig />, { wrapper: criarWrapper() });
      expect(screen.getAllByText('Auto').length).toBe(4);
    });

    it('exibe switches Ativo para cada etapa', () => {
      render(<ReguaCobrancaConfig />, { wrapper: criarWrapper() });
      expect(screen.getAllByText('Ativo').length).toBe(4);
    });
  });

  describe('Prop secao (uso nas Configuracoes)', () => {
    it('secao="regua" mostra a regua e esconde os templates', () => {
      render(<ReguaCobrancaConfig secao="regua" />, { wrapper: criarWrapper() });
      expect(screen.getByText('Configuração da Régua de Cobrança')).toBeInTheDocument();
      expect(screen.queryByText('Templates de Cobrança')).not.toBeInTheDocument();
    });

    it('secao="templates" mostra os templates e esconde a regua', () => {
      render(<ReguaCobrancaConfig secao="templates" />, { wrapper: criarWrapper() });
      expect(screen.getByText('Templates de Cobrança')).toBeInTheDocument();
      expect(screen.queryByText('Configuração da Régua de Cobrança')).not.toBeInTheDocument();
    });
  });

  describe('Estado vazio', () => {
    it('avisa quando nao ha etapas de regua cadastradas', () => {
      estado.regua = [];
      render(<ReguaCobrancaConfig secao="regua" />, { wrapper: criarWrapper() });
      expect(screen.getByText(/Nenhuma etapa de régua configurada/)).toBeInTheDocument();
    });
  });

  describe('Templates: lista real por etapa', () => {
    it('mostra o template cadastrado na aba da sua etapa', () => {
      render(<ReguaCobrancaConfig secao="templates" />, { wrapper: criarWrapper() });
      expect(screen.getByText('Assunto: Assunto preventivo')).toBeInTheDocument();
      expect(screen.getAllByText('Padrão').length).toBe(1);
    });

    it('não mostra o template de outra etapa na aba atual', () => {
      render(<ReguaCobrancaConfig secao="templates" />, { wrapper: criarWrapper() });
      expect(screen.queryByText('Cobrança da parcela {{valor}}.')).not.toBeInTheDocument();
    });

    it('troca de aba e passa a mostrar o template daquela etapa', async () => {
      render(<ReguaCobrancaConfig secao="templates" />, { wrapper: criarWrapper() });
      await userEvent.click(screen.getByRole('tab', { name: 'Cobrança' }));
      expect(await screen.findByText('Cobrança da parcela {{valor}}.')).toBeInTheDocument();
    });

    it('avisa quando a etapa não tem template', async () => {
      render(<ReguaCobrancaConfig secao="templates" />, { wrapper: criarWrapper() });
      await userEvent.click(screen.getByRole('tab', { name: 'Jurídico' }));
      expect(await screen.findByText('Nenhum template para esta etapa')).toBeInTheDocument();
    });
  });

  describe('Templates: dono do registro', () => {
    it('mostra a empresa de cada template quando nenhuma está em escopo', () => {
      render(<ReguaCobrancaConfig secao="templates" />, { wrapper: criarWrapper() });
      expect(screen.getByText('Empresa: e1')).toBeInTheDocument();
    });

    it('usa a razão social e esconde o rótulo quando há empresa em escopo', () => {
      render(<ReguaCobrancaConfig secao="templates" />, {
        wrapper: criarWrapper(escopoEmpresa('e1')),
      });
      expect(screen.queryByText(/Empresa:/)).not.toBeInTheDocument();
      expect(estado.escopos).toContain('e1');
    });
  });

  describe('Templates: criação', () => {
    it('bloqueia a criação quando nenhuma empresa está em escopo', () => {
      render(<ReguaCobrancaConfig secao="templates" />, { wrapper: criarWrapper() });
      expect(screen.getByRole('button', { name: /Novo template/ })).toBeDisabled();
    });

    it('cria o template na empresa em escopo com os campos do formulário', async () => {
      render(<ReguaCobrancaConfig secao="templates" />, {
        wrapper: criarWrapper(escopoEmpresa('e1')),
      });
      await userEvent.click(screen.getByRole('button', { name: /Novo template/ }));
      fireEvent.change(screen.getByLabelText('Corpo'), {
        target: { value: 'Oi {{cliente}}, vence em {{vencimento}}.' },
      });
      await userEvent.click(screen.getByRole('button', { name: 'Criar template' }));

      await waitFor(() => expect(estado.criados).toHaveLength(1));
      expect(estado.criados[0]).toMatchObject({
        empresa_id: 'e1',
        etapa: 'preventiva',
        canal: 'email',
        tom: 'profissional',
        nome: 'preventiva - email',
        assunto: null,
        corpo: 'Oi {{cliente}}, vence em {{vencimento}}.',
      });
    });
  });

  describe('Templates: exclusão', () => {
    it('exclui o template depois da confirmação', async () => {
      render(<ReguaCobrancaConfig secao="templates" />, { wrapper: criarWrapper() });
      await userEvent.click(screen.getByLabelText('Excluir template email da etapa preventiva'));
      await userEvent.click(await screen.findByRole('button', { name: 'Excluir' }));
      expect(estado.excluidos).toEqual(['t1']);
    });

    it('não exclui quando o usuário cancela', async () => {
      render(<ReguaCobrancaConfig secao="templates" />, { wrapper: criarWrapper() });
      await userEvent.click(screen.getByLabelText('Excluir template email da etapa preventiva'));
      await userEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
      expect(estado.excluidos).toEqual([]);
      expect(screen.getByText('Assunto: Assunto preventivo')).toBeInTheDocument();
    });
  });
});
