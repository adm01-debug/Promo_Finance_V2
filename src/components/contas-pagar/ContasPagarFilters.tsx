import { motion } from 'framer-motion';
import { Search, ShieldAlert } from 'lucide-react';
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
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
} as const;

export function ContasPagarFilters({
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
}: ContasPagarFiltersProps) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="card-base">
        <CardContent className="p-3 sm:p-4">
          {/* Search bar - always full width */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por fornecedor, descrição..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filters grid - responsive */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-row gap-2 sm:gap-3">
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
            
            <Select value={aprovacaoFilter} onValueChange={onAprovacaoChange}>
              <SelectTrigger className="w-full lg:w-[160px]">
                <SelectValue placeholder="Aprovação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
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
            
            <Select value={ordenacao} onValueChange={onOrdenacaoChange}>
              <SelectTrigger className="w-full lg:w-[160px]">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prioridade_aprovacao">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-warning" />
                    Prioridade
                  </div>
                </SelectItem>
                <SelectItem value="vencimento">Venc. próximos</SelectItem>
                <SelectItem value="vencimento_desc">Venc. distantes</SelectItem>
                <SelectItem value="valor">Maior valor</SelectItem>
                <SelectItem value="valor_asc">Menor valor</SelectItem>
                <SelectItem value="fornecedor">Fornecedor A-Z</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Advanced filters button - full width on last row if needed */}
            <div className="col-span-2 sm:col-span-1 lg:col-span-1">
              <AdvancedFiltersPopover
                filters={advancedFilters}
                onFiltersChange={onAdvancedFiltersChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
