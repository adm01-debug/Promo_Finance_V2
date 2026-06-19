import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Tag, Target, ArrowDownAZ } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdvancedFiltersPopover, AdvancedFilters } from '@/components/ui/advanced-filters';
import { cn } from '@/lib/utils';
import { StandardFilterSection } from '../shared/StandardFilterSection';

interface CentroCusto {
  id: string;
  nome: string;
}

interface ContasPagarFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  centroCustoFilter: string;
  onCentroCustoChange: (value: string) => void;
  aprovacaoFilter: string;
  onAprovacaoChange: (value: string) => void;
  ordenacao: string;
  onOrdenacaoChange: (value: string) => void;
  advancedFilters: AdvancedFilters;
  onAdvancedFiltersChange: (filters: AdvancedFilters) => void;
  centrosCusto: CentroCusto[];
  countPendentesAprovacao: number;
  empresas?: Array<{ id: string; razao_social: string; nome_fantasia: string | null }>;
  contasBancarias?: Array<{ id: string; banco: string; agencia: string; conta: string }>;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
} as const;

export const ContasPagarFilters = forwardRef<HTMLDivElement, ContasPagarFiltersProps>(function ContasPagarFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  centroCustoFilter,
  onCentroCustoChange,
  aprovacaoFilter,
  onAprovacaoChange,
  ordenacao,
  onOrdenacaoChange,
  advancedFilters,
  onAdvancedFiltersChange,
  centrosCusto,
  countPendentesAprovacao,
  empresas = [],
  contasBancarias = [],
}, ref) {
  return (
    <motion.div ref={ref} variants={itemVariants}>
      <StandardFilterSection
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search within payables (Supplier, description, ID...)"
        badge="Controle"
      >
        <div className="flex items-center gap-2 flex-1 min-w-[140px]">
          <Tag className="h-4 w-4 text-primary/40 shrink-0" />
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="border-none bg-transparent hover:bg-card/5 h-10 rounded-xl font-bold text-xs focus:ring-0">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10 rounded-xl">
              <SelectItem value="all">Global Status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="vencido">Vencido</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="parcial">Parcial</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[140px]">
          <Target className="h-4 w-4 text-primary/40 shrink-0" />
          <Select value={centroCustoFilter} onValueChange={onCentroCustoChange}>
            <SelectTrigger className="border-none bg-transparent hover:bg-card/5 h-10 rounded-xl font-bold text-xs focus:ring-0">
              <SelectValue placeholder="Centro Custo" />
            </SelectTrigger>
            <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10 rounded-xl">
              <SelectItem value="all">Cost Centers</SelectItem>
              {centrosCusto.map(cc => (
                <SelectItem key={cc.id} value={cc.id}>{cc.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[160px]">
          <ShieldAlert className="h-4 w-4 text-warning/40 shrink-0" />
          <Select value={aprovacaoFilter} onValueChange={onAprovacaoChange}>
            <SelectTrigger className="border-none bg-transparent hover:bg-card/5 h-10 rounded-xl font-bold text-xs focus:ring-0">
              <SelectValue placeholder="Aprovação" />
            </SelectTrigger>
            <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10 rounded-xl">
              <SelectItem value="all">Governance Status</SelectItem>
              <SelectItem value="pendente_aprovacao">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-warning" />
                  <span className="truncate">Pendente {countPendentesAprovacao > 0 && `(${countPendentesAprovacao})`}</span>
                </div>
              </SelectItem>
              <SelectItem value="aprovado">Aprovado</SelectItem>
              <SelectItem value="rejeitado">Rejeitado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[160px]">
          <ArrowDownAZ className="h-4 w-4 text-primary/40 shrink-0" />
          <Select value={ordenacao} onValueChange={onOrdenacaoChange}>
            <SelectTrigger className="border-none bg-transparent hover:bg-card/5 h-10 rounded-xl font-bold text-xs focus:ring-0">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10 rounded-xl">
              <SelectItem value="prioridade_aprovacao">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-warning" />
                  Prioridade de Risco
                </div>
              </SelectItem>
              <SelectItem value="vencimento">Vencimento Próximo</SelectItem>
              <SelectItem value="vencimento_desc">Vencimento Distante</SelectItem>
              <SelectItem value="valor">Maior Volume Financeiro</SelectItem>
              <SelectItem value="valor_asc">Menor Volume Financeiro</SelectItem>
              <SelectItem value="fornecedor">Fornecedor (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="lg:ml-auto">
          <AdvancedFiltersPopover
            filters={advancedFilters}
            onFiltersChange={onAdvancedFiltersChange}
            empresas={empresas.map(e => ({ value: e.id, label: e.nome_fantasia || e.razao_social }))}
            contasBancarias={contasBancarias.map(cb => ({ value: cb.id, label: `${cb.banco} - ${cb.conta}` }))}
          />
        </div>
      </StandardFilterSection>
    </motion.div>
  );
});

ContasPagarFilters.displayName = 'ContasPagarFilters';
