import { Building2, Target, CreditCard, Tag, Banknote } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdvancedFiltersPopover, AdvancedFilters } from '@/components/ui/advanced-filters';
import { StandardFilterSection } from '../shared/StandardFilterSection';
import type { ContaBancaria } from '@/hooks/financial/types';

interface CentroCusto {
  id: string;
  nome: string;
}

interface Empresa {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
}

interface ContasReceberFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  centroCustoFilter: string;
  onCentroCustoChange: (value: string) => void;
  centrosCusto: CentroCusto[];
  empresaFilter?: string;
  onEmpresaChange?: (value: string) => void;
  empresas?: Empresa[];
  formaFilter?: string;
  onFormaChange?: (value: string) => void;
  contaBancariaFilter?: string;
  onContaBancariaChange?: (value: string) => void;
  contasBancarias?: ContaBancaria[];
  advancedFilters: AdvancedFilters;
  onAdvancedFiltersChange: (filters: AdvancedFilters) => void;
}

export function ContasReceberFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  centroCustoFilter,
  onCentroCustoChange,
  centrosCusto,
  empresaFilter,
  onEmpresaChange,
  empresas,
  formaFilter,
  onFormaChange,
  contaBancariaFilter,
  onContaBancariaChange,
  contasBancarias,
  advancedFilters,
  onAdvancedFiltersChange,
}: ContasReceberFiltersProps) {
  return (
    <StandardFilterSection
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      searchPlaceholder="Buscar recebíveis (cliente, descrição, referência...)"
      badge="Governança"
    >
      <div className="flex items-center gap-2 flex-1 min-w-[140px]">
        <Tag className="h-4 w-4 text-primary/40 shrink-0" />
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="border-none bg-transparent hover:bg-card/5 h-12 rounded-xl font-bold text-xs focus:ring-0 transition-all">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10 rounded-xl">
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="vencido">Vencido</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="parcial">Parcial</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {empresas && onEmpresaChange && (
        <div className="flex items-center gap-2 flex-1 min-w-[180px]">
          <Building2 className="h-4 w-4 text-primary/40 shrink-0" />
          <Select value={empresaFilter || 'all'} onValueChange={onEmpresaChange}>
            <SelectTrigger className="border-none bg-transparent hover:bg-card/5 h-10 rounded-xl font-bold text-xs focus:ring-0">
              <SelectValue placeholder="Empresa" />
            </SelectTrigger>
            <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10 rounded-xl">
              <SelectItem value="all">Todas empresas</SelectItem>
              {empresas.map(e => (
                <SelectItem key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {onFormaChange && (
        <div className="flex items-center gap-2 flex-1 min-w-[140px]">
          <CreditCard className="h-4 w-4 text-primary/40 shrink-0" />
          <Select value={formaFilter || 'all'} onValueChange={onFormaChange}>
            <SelectTrigger className="border-none bg-transparent hover:bg-card/5 h-10 rounded-xl font-bold text-xs focus:ring-0">
              <SelectValue placeholder="Forma" />
            </SelectTrigger>
            <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10 rounded-xl">
              <SelectItem value="all">Todas formas</SelectItem>
              <SelectItem value="boleto">Boleto</SelectItem>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="cartao">Cartão</SelectItem>
              <SelectItem value="transferencia">Transferência</SelectItem>
              <SelectItem value="dinheiro">Dinheiro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {onContaBancariaChange && contasBancarias && (
        <div className="flex items-center gap-2 flex-1 min-w-[160px]">
          <Banknote className="h-4 w-4 text-primary/40 shrink-0" />
          <Select value={contaBancariaFilter || 'all'} onValueChange={onContaBancariaChange}>
            <SelectTrigger className="border-none bg-transparent hover:bg-card/5 h-10 rounded-xl font-bold text-xs focus:ring-0">
              <SelectValue placeholder="Conta Bancária" />
            </SelectTrigger>
            <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10 rounded-xl">
              <SelectItem value="all">Todas as Contas</SelectItem>
              {contasBancarias.map(cb => (
                <SelectItem key={cb.id} value={cb.id}>{cb.banco} - {cb.conta}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      <div className="flex items-center gap-2 flex-1 min-w-[140px]">
        <Target className="h-4 w-4 text-primary/40 shrink-0" />
        <Select value={centroCustoFilter} onValueChange={onCentroCustoChange}>
          <SelectTrigger className="border-none bg-transparent hover:bg-card/5 h-10 rounded-xl font-bold text-xs focus:ring-0">
            <SelectValue placeholder="Centro Custo" />
          </SelectTrigger>
          <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10 rounded-xl">
            <SelectItem value="all">Todos centros</SelectItem>
            {centrosCusto.map(cc => (
              <SelectItem key={cc.id} value={cc.id}>{cc.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="lg:ml-auto">
        <AdvancedFiltersPopover
          filters={advancedFilters}
          onFiltersChange={onAdvancedFiltersChange}
        />
      </div>
    </StandardFilterSection>
  );
}

