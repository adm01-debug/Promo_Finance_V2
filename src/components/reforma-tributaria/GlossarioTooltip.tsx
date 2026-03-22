// ============================================
// GLOSSÁRIO INTERATIVO - REFORMA TRIBUTÁRIA
// Tooltips educativos para termos técnicos
// ============================================

import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const GLOSSARIO: Record<string, { titulo: string; descricao: string; fundamentoLegal?: string }> = {
  CBS: {
    titulo: 'Contribuição sobre Bens e Serviços',
    descricao: 'Tributo federal que substitui PIS e COFINS. Alíquota de referência: 8,8%.',
    fundamentoLegal: 'LC 214/2025, Art. 1º',
  },
  IBS: {
    titulo: 'Imposto sobre Bens e Serviços',
    descricao: 'Tributo estadual/municipal que substitui ICMS e ISS. Alíquota de referência: 17,7%.',
    fundamentoLegal: 'LC 214/2025, Art. 1º',
  },
  IS: {
    titulo: 'Imposto Seletivo',
    descricao: 'Incide sobre produtos nocivos à saúde e ao meio ambiente (cigarros, bebidas alcoólicas, combustíveis fósseis).',
    fundamentoLegal: 'LC 214/2025, Art. 393-400',
  },
  'Split Payment': {
    titulo: 'Recolhimento Fracionado',
    descricao: 'Mecanismo de retenção automática do IBS/CBS no momento do pagamento, repassando diretamente ao fisco.',
    fundamentoLegal: 'LC 214/2025, Art. 28-30',
  },
  'PER/DCOMP': {
    titulo: 'Pedido de Restituição/Declaração de Compensação',
    descricao: 'Formulário eletrônico para solicitar restituição ou compensar créditos tributários acumulados.',
    fundamentoLegal: 'IN RFB 2.055/2021',
  },
  CFOP: {
    titulo: 'Código Fiscal de Operações e Prestações',
    descricao: 'Código numérico que identifica a natureza da operação (venda, compra, transferência, devolução).',
  },
  NCM: {
    titulo: 'Nomenclatura Comum do Mercosul',
    descricao: 'Código de 8 dígitos que classifica mercadorias para fins tributários e de comércio exterior.',
  },
  SPED: {
    titulo: 'Sistema Público de Escrituração Digital',
    descricao: 'Plataforma digital da RFB para transmissão de obrigações acessórias e escrituração contábil.',
  },
  DARF: {
    titulo: 'Documento de Arrecadação de Receitas Federais',
    descricao: 'Guia de pagamento dos tributos federais (CBS, IRPJ, CSLL, etc.).',
  },
  'Não-Cumulatividade': {
    titulo: 'Princípio da Não-Cumulatividade',
    descricao: 'Direito de descontar o imposto pago nas etapas anteriores da cadeia produtiva. No IVA dual, é "plena" — crédito amplo.',
    fundamentoLegal: 'LC 214/2025, Art. 47',
  },
  Cashback: {
    titulo: 'Devolução de Tributos',
    descricao: 'Mecanismo de devolução de CBS/IBS para famílias de baixa renda inscritas no CadÚnico.',
    fundamentoLegal: 'LC 214/2025, Art. 105-115',
  },
};

interface Props {
  termo: string;
  children?: React.ReactNode;
  className?: string;
  showIcon?: boolean;
}

export function GlossarioTooltip({ termo, children, className, showIcon = true }: Props) {
  const info = GLOSSARIO[termo];
  if (!info) return <span className={className}>{children || termo}</span>;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn('inline-flex items-center gap-1 cursor-help border-b border-dashed border-muted-foreground/40', className)}>
            {children || termo}
            {showIcon && <Info className="h-3 w-3 text-muted-foreground" />}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs p-3">
          <p className="font-semibold text-sm">{info.titulo}</p>
          <p className="text-xs text-muted-foreground mt-1">{info.descricao}</p>
          {info.fundamentoLegal && (
            <p className="text-[10px] text-muted-foreground/70 mt-1.5 italic">
              📜 {info.fundamentoLegal}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default GlossarioTooltip;
