import { Search, SlidersHorizontal, Building2, Target, CreditCard, Tag } from 'lucide-react';
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
  advancedFilters,
  onAdvancedFiltersChange,
}: ContasReceberFiltersProps) {
  return (
    <Card className="card-base">
      <CardContent className="p-3 sm:p-4">
        {/* Search bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, descrição..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Filters grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-row gap-2 sm:gap-3 flex-wrap">
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-full lg:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="vencido">Vencido</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="parcial">Parcial</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          {/* Empresa Filter (#3, #14) */}
          {empresas && onEmpresaChange && (
            <Select value={empresaFilter || 'all'} onValueChange={onEmpresaChange}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas empresas</SelectItem>
                {empresas.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Forma de Pagamento Filter (#32) */}
          {onFormaChange && (
            <Select value={formaFilter || 'all'} onValueChange={onFormaChange}>
              <SelectTrigger className="w-full lg:w-[150px]">
                <SelectValue placeholder="Forma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas formas</SelectItem>
                <SelectItem value="boleto">Boleto</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="cartao">Cartão</SelectItem>
                <SelectItem value="transferencia">Transferência</SelectItem>
                <SelectItem value="dinheiro">Dinheiro</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          <Select value={centroCustoFilter} onValueChange={onCentroCustoChange}>
            <SelectTrigger className="w-full lg:w-[150px]">
              <SelectValue placeholder="Centro Custo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos centros</SelectItem>
              {centrosCusto.map(cc => (
                <SelectItem key={cc.id} value={cc.id}>{cc.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="col-span-2 sm:col-span-1">
            <AdvancedFiltersPopover
              filters={advancedFilters}
              onFiltersChange={onAdvancedFiltersChange}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
