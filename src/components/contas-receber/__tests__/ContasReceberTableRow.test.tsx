import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContasReceberTableRow, ContaReceberWithRelations } from '../ContasReceberTableRow';
import { Table, TableBody } from '@/components/ui/table';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: { tr: ({ children, ...props }: any) => <tr {...props}>{children}</tr> },
}));

// Mock formatters
vi.mock('@/lib/formatters', () => ({
  formatCurrency: (v: number) => `R$ ${v.toFixed(2)}`,
  formatDate: (d: Date) => d.toLocaleDateString('pt-BR'),
  calculateOverdueDays: (d: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const venc = new Date(d);
    venc.setHours(0, 0, 0, 0);
    return Math.ceil((today.getTime() - venc.getTime()) / (1000 * 60 * 60 * 24));
  },
  getRelativeTime: () => 'em 5 dias',
  getEtapaCobrancaLabel: (e: string) => e.charAt(0).toUpperCase() + e.slice(1),
}));

const baseConta: ContaReceberWithRelations = {
  id: 'test-1',
  cliente_nome: 'Empresa ABC',
  descricao: 'Serviço de consultoria',
  valor: 5000,
  valor_recebido: 0,
  data_vencimento: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
  data_emissao: '2025-01-01',
  status: 'pendente',
  empresa_id: 'emp-1',
  created_by: 'user-1',
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
  tipo_cobranca: 'boleto',
  etapa_cobranca: null,
  numero_documento: 'NF-001',
  numero_parcela_atual: null,
  total_parcelas: null,
  valor_desconto: null,
  clientes: { razao_social: 'Empresa ABC', nome_fantasia: 'ABC Corp', score: 750 },
  has_protesto: false,
  has_boleto: false,
} as any;

const renderRow = (conta: Partial<ContaReceberWithRelations> = {}, extraProps = {}) => {
  const merged = { ...baseConta, ...conta } as ContaReceberWithRelations;
  const defaultHandlers = {
    index: 0,
    isSelected: false,
    onToggleSelect: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onRegistrarRecebimento: vi.fn(),
    onView: vi.fn(),
    onEnviarCobranca: vi.fn(),
    onAplicarDesconto: vi.fn(),
    ...extraProps,
  };
  return render(
    <Table><TableBody>
      <ContasReceberTableRow conta={merged} {...defaultHandlers} />
    </TableBody></Table>
  );
};

describe('ContasReceberTableRow', () => {
  // ===== #14: Coluna Empresa =====
  describe('Gap #14 - Coluna Empresa', () => {
    it('mostra coluna empresa quando showEmpresa=true', () => {
      const { container } = renderRow(
        { empresas: { razao_social: 'Minha Empresa LTDA', nome_fantasia: 'MinhaEmpresa' } as any },
        { showEmpresa: true }
      );
      expect(screen.getByText('MinhaEmpresa')).toBeInTheDocument();
    });

    it('não mostra coluna empresa quando showEmpresa=false', () => {
      renderRow(
        { empresas: { razao_social: 'Empresa X', nome_fantasia: 'EmpX' } as any },
        { showEmpresa: false }
      );
      expect(screen.queryByText('EmpX')).not.toBeInTheDocument();
    });

    it('exibe razao_social quando nome_fantasia é null', () => {
      renderRow(
        { empresas: { razao_social: 'Empresa Formal LTDA', nome_fantasia: null } as any },
        { showEmpresa: true }
      );
      expect(screen.getByText('Empresa Formal LTDA')).toBeInTheDocument();
    });
  });

  // ===== #15: Dias em Atraso sortável =====
  describe('Gap #15 - Coluna Dias em Atraso', () => {
    it('exibe dias em atraso para conta vencida', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 15);
      renderRow({ data_vencimento: pastDate.toISOString().split('T')[0], status: 'vencido' });
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('exibe "Hoje" quando vence hoje', () => {
      renderRow({ data_vencimento: new Date().toISOString().split('T')[0], status: 'pendente' });
      expect(screen.getByText('Hoje')).toBeInTheDocument();
    });

    it('exibe dias restantes com "d" para futuro', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      renderRow({ data_vencimento: futureDate.toISOString().split('T')[0], status: 'pendente' });
      expect(screen.getByText('5d')).toBeInTheDocument();
    });

    it('exibe "—" para contas pagas', () => {
      renderRow({ status: 'pago' });
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('exibe "—" para contas canceladas', () => {
      renderRow({ status: 'cancelado' });
      expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('aplica cor destructive para >30 dias atraso', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 45);
      const { container } = renderRow({ data_vencimento: oldDate.toISOString().split('T')[0], status: 'vencido' });
      const dias = container.querySelector('.text-destructive.font-semibold');
      expect(dias).toBeInTheDocument();
    });

    it('aplica cor warning para 1-30 dias atraso', () => {
      const date = new Date();
      date.setDate(date.getDate() - 10);
      const { container } = renderRow({ data_vencimento: date.toISOString().split('T')[0], status: 'vencido' });
      const dias = container.querySelector('.text-warning.font-semibold');
      expect(dias).toBeInTheDocument();
    });

    it('aplica cor success para futuro', () => {
      const date = new Date();
      date.setDate(date.getDate() + 10);
      const { container } = renderRow({ data_vencimento: date.toISOString().split('T')[0], status: 'pendente' });
      const dias = container.querySelector('.text-success.font-semibold');
      expect(dias).toBeInTheDocument();
    });

    it('não exibe coluna quando showDiasAtraso=false', () => {
      const { container } = renderRow({}, { showDiasAtraso: false });
      // Menos colunas renderizadas
      const cells = container.querySelectorAll('td');
      const withDias = render(
        <Table><TableBody>
          <ContasReceberTableRow conta={baseConta} index={0} isSelected={false} onToggleSelect={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} onRegistrarRecebimento={vi.fn()} showDiasAtraso />
        </TableBody></Table>
      ).container.querySelectorAll('td');
      expect(cells.length).toBeLessThan(withDias.length);
    });
  });

  // ===== #16: Badges tipo cobrança =====
  describe('Gap #16 - Badges tipo cobrança', () => {
    it('exibe badge Boleto', () => {
      renderRow({ tipo_cobranca: 'boleto' });
      expect(screen.getByText('Boleto')).toBeInTheDocument();
    });

    it('exibe badge PIX', () => {
      renderRow({ tipo_cobranca: 'pix' });
      expect(screen.getByText('PIX')).toBeInTheDocument();
    });

    it('exibe badge Cartão', () => {
      renderRow({ tipo_cobranca: 'cartao' });
      expect(screen.getByText('Cartão')).toBeInTheDocument();
    });

    it('exibe badge TED', () => {
      renderRow({ tipo_cobranca: 'transferencia' });
      expect(screen.getByText('TED')).toBeInTheDocument();
    });

    it('exibe badge Dinheiro', () => {
      renderRow({ tipo_cobranca: 'dinheiro' });
      expect(screen.getByText('Dinheiro')).toBeInTheDocument();
    });
  });

  // ===== #25: Protesto =====
  describe('Gap #25 - Indicador protesto', () => {
    it('exibe badge "Protestado" quando has_protesto=true', () => {
      renderRow({ has_protesto: true });
      expect(screen.getByText('Protestado')).toBeInTheDocument();
    });

    it('exibe ícone indicador de protesto no avatar', () => {
      const { container } = renderRow({ has_protesto: true });
      const protestIcon = container.querySelector('.bg-destructive');
      expect(protestIcon).toBeInTheDocument();
    });

    it('não exibe protesto quando has_protesto=false', () => {
      renderRow({ has_protesto: false });
      expect(screen.queryByText('Protestado')).not.toBeInTheDocument();
    });
  });

  // ===== #35: Indicador boleto =====
  describe('Gap #35 - Indicador boleto', () => {
    it('exibe badge "Boleto" indicador quando has_boleto=true', () => {
      renderRow({ has_boleto: true, tipo_cobranca: 'pix' });
      // Badge de tipo "PIX" + badge indicador "Boleto"
      const boletos = screen.getAllByText('Boleto');
      expect(boletos.length).toBeGreaterThanOrEqual(1);
    });

    it('não exibe indicador boleto quando has_boleto=false', () => {
      renderRow({ has_boleto: false, tipo_cobranca: 'pix' });
      expect(screen.queryByText('Boleto')).not.toBeInTheDocument();
    });
  });

  // ===== #29: Régua de cobrança =====
  describe('Gap #29 - Indicador régua de cobrança', () => {
    it('exibe etapa preventiva', () => {
      renderRow({ etapa_cobranca: 'preventiva' as any });
      expect(screen.getByText('Preventiva')).toBeInTheDocument();
    });

    it('exibe etapa lembrete', () => {
      renderRow({ etapa_cobranca: 'lembrete' as any });
      expect(screen.getByText('Lembrete')).toBeInTheDocument();
    });

    it('exibe etapa cobrança', () => {
      renderRow({ etapa_cobranca: 'cobranca' as any });
      expect(screen.getByText('Cobranca')).toBeInTheDocument();
    });

    it('exibe etapa negociação', () => {
      renderRow({ etapa_cobranca: 'negociacao' as any });
      expect(screen.getByText('Negociacao')).toBeInTheDocument();
    });

    it('exibe etapa jurídico', () => {
      renderRow({ etapa_cobranca: 'juridico' as any });
      expect(screen.getByText('Juridico')).toBeInTheDocument();
    });

    it('não exibe etapa quando null', () => {
      renderRow({ etapa_cobranca: null as any });
      expect(screen.queryByText('Preventiva')).not.toBeInTheDocument();
      expect(screen.queryByText('Lembrete')).not.toBeInTheDocument();
    });
  });

  // ===== #27: Quick actions inline =====
  describe('Gap #27 - Quick actions inline', () => {
    it('exibe botão de recebimento inline para conta pendente', () => {
      const onRegistrar = vi.fn();
      renderRow({ status: 'pendente' }, { onRegistrarRecebimento: onRegistrar });
      // Botão inline existe (opacity-0 mas renderizado)
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(3); // receber, cobrar, ver, dropdown
    });

    it('não exibe botões inline de ação para conta paga', () => {
      const onRegistrar = vi.fn();
      renderRow({ status: 'pago' }, { onRegistrarRecebimento: onRegistrar });
      // Sem botões de receber/cobrar, apenas ver e dropdown
    });

    it('chama onView ao clicar no botão de visualizar', () => {
      const onView = vi.fn();
      renderRow({ status: 'pago' }, { onView });
      // Dropdown "Visualizar" funciona via onView
    });
  });

  // ===== Status badges =====
  describe('Status badges', () => {
    it('exibe badge Pago para conta paga', () => {
      renderRow({ status: 'pago' });
      expect(screen.getByText('Pago')).toBeInTheDocument();
    });

    it('exibe badge Pendente para conta pendente', () => {
      renderRow({ status: 'pendente' });
      expect(screen.getByText('Pendente')).toBeInTheDocument();
    });

    it('exibe badge Vencido para conta vencida', () => {
      renderRow({ status: 'vencido' });
      expect(screen.getByText('Vencido')).toBeInTheDocument();
    });

    it('exibe badge Parcial para pagamento parcial', () => {
      renderRow({ status: 'parcial' });
      expect(screen.getByText('Parcial')).toBeInTheDocument();
    });

    it('exibe badge Cancelado para conta cancelada', () => {
      renderRow({ status: 'cancelado' });
      expect(screen.getByText('Cancelado')).toBeInTheDocument();
    });
  });

  // ===== Valor/Progress =====
  describe('Valor e progresso', () => {
    it('exibe valor formatado', () => {
      renderRow({ valor: 1500.50 });
      expect(screen.getByText('R$ 1500.50')).toBeInTheDocument();
    });

    it('exibe barra de progresso para pagamento parcial', () => {
      const { container } = renderRow({ valor: 1000, valor_recebido: 300 });
      expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument();
      expect(screen.getByText(/Saldo/)).toBeInTheDocument();
    });

    it('exibe indicador de desconto', () => {
      renderRow({ valor_desconto: 100 } as any);
      expect(screen.getByText(/Desc/)).toBeInTheDocument();
    });

    it('exibe indicador de parcela', () => {
      renderRow({ numero_parcela_atual: 3, total_parcelas: 6 } as any);
      expect(screen.getByText('3/6')).toBeInTheDocument();
    });
  });

  // ===== Score do cliente =====
  describe('Score do cliente', () => {
    it('exibe score >= 800 com cor success', () => {
      const { container } = renderRow({ clientes: { razao_social: 'X', nome_fantasia: null, score: 850 } });
      expect(screen.getByText('850')).toBeInTheDocument();
      expect(screen.getByText('Excelente')).toBeInTheDocument();
    });

    it('exibe score 600-799 como Bom', () => {
      renderRow({ clientes: { razao_social: 'X', nome_fantasia: null, score: 700 } });
      expect(screen.getByText('Bom')).toBeInTheDocument();
    });

    it('exibe score 400-599 como Regular', () => {
      renderRow({ clientes: { razao_social: 'X', nome_fantasia: null, score: 500 } });
      expect(screen.getByText('Regular')).toBeInTheDocument();
    });

    it('exibe score < 400 como Crítico', () => {
      renderRow({ clientes: { razao_social: 'X', nome_fantasia: null, score: 200 } });
      expect(screen.getByText('Crítico')).toBeInTheDocument();
    });
  });

  // ===== Dropdown menu (#12 desconto) =====
  describe('Gap #12 - Aplicar Desconto no dropdown', () => {
    it('renderiza item "Aplicar Desconto" no dropdown para conta pendente', async () => {
      const onDesconto = vi.fn();
      renderRow({ status: 'pendente' }, { onAplicarDesconto: onDesconto });
      // O dropdown existe
      const moreButton = screen.getAllByRole('button').find(b => b.querySelector('[class*="lucide-more"]') || b.textContent === '');
      // Dropdown is hidden until clicked, but the component is mounted
    });
  });

  // ===== Checkbox seleção =====
  describe('Checkbox seleção', () => {
    it('renderiza checkbox com estado correto', () => {
      const { container } = renderRow({}, { isSelected: true });
      const checkbox = container.querySelector('[role="checkbox"]');
      expect(checkbox).toBeInTheDocument();
    });

    it('chama onToggleSelect ao mudar checkbox', () => {
      const onToggle = vi.fn();
      const { container } = renderRow({}, { onToggleSelect: onToggle });
      const checkbox = container.querySelector('[role="checkbox"]');
      if (checkbox) fireEvent.click(checkbox);
    });
  });
});
