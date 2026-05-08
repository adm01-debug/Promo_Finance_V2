import { Search, SlidersHorizontal, Building2, Target, CreditCard, Tag, Banknote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdvancedFiltersPopover, AdvancedFilters } from '@/components/ui/advanced-filters';

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
  contasBancarias?: any[];
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
    <Card className="border-none bg-white/[0.03] backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] rounded-[2.5rem] overflow-hidden ring-1 ring-white/10">
      <CardContent className="p-6 sm:p-8 space-y-6">
        {/* Search Command */}
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/5 rounded-2xl -m-1 opacity-0 group-focus-within:opacity-100 transition-opacity blur-sm pointer-events-none" />
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-white/20 group-focus-within:text-primary transition-all duration-500 group-focus-within:scale-110" />
          <Input
            placeholder="Search within receivables (Client, description, reference...)"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-16 bg-white/[0.03] border-white/5 focus:bg-background/80 focus:border-primary/40 h-16 rounded-[1.5rem] transition-all duration-700 font-bold text-sm shadow-inner"
          />
        </div>
        
        {/* Intelligence Filters Grid */}
        <div className="flex flex-col lg:flex-row items-center gap-6 p-4 rounded-[2rem] bg-black/20 border border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3 pl-4 border-r border-white/10 pr-4 h-8 hidden lg:flex">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Governança</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-row gap-3 flex-1 w-full px-2 lg:px-0">
            <div className="flex items-center gap-2 flex-1 min-w-[140px]">
              <Tag className="h-4 w-4 text-primary/40 shrink-0" />
              <Select value={statusFilter} onValueChange={onStatusChange}>
                <SelectTrigger className="border-none bg-transparent hover:bg-white/5 h-12 rounded-xl font-bold text-xs focus:ring-0 transition-all">
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

            {empresas && onEmpresaChange && (
              <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                <Building2 className="h-4 w-4 text-primary/40 shrink-0" />
                <Select value={empresaFilter || 'all'} onValueChange={onEmpresaChange}>
                  <SelectTrigger className="border-none bg-transparent hover:bg-white/5 h-10 rounded-xl font-bold text-xs focus:ring-0">
                    <SelectValue placeholder="Empresa" />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10 rounded-xl">
                    <SelectItem value="all">Enterprise Filter</SelectItem>
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
                  <SelectTrigger className="border-none bg-transparent hover:bg-white/5 h-10 rounded-xl font-bold text-xs focus:ring-0">
                    <SelectValue placeholder="Forma" />
                  </SelectTrigger>
                  <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10 rounded-xl">
                    <SelectItem value="all">Payment Methods</SelectItem>
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
                  <SelectTrigger className="border-none bg-transparent hover:bg-white/5 h-10 rounded-xl font-bold text-xs focus:ring-0">
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
                <SelectTrigger className="border-none bg-transparent hover:bg-white/5 h-10 rounded-xl font-bold text-xs focus:ring-0">
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
            
            <div className="lg:ml-auto">
              <AdvancedFiltersPopover
                filters={advancedFilters}
                onFiltersChange={onAdvancedFiltersChange}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

