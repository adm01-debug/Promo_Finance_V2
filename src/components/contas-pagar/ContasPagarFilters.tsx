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
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por fornecedor, descrição..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={onStatusChange}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="parcial">Parcial</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={centroCustoFilter} onValueChange={onCentroCustoChange}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Centro de Custo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os centros</SelectItem>
                {centrosCusto.map(cc => (
                  <SelectItem key={cc.id} value={cc.id}>{cc.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={aprovacaoFilter} onValueChange={onAprovacaoChange}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Aprovação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas aprovações</SelectItem>
                <SelectItem value="pendente_aprovacao">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-warning" />
                    Pendente de Aprovação {countPendentesAprovacao > 0 && `(${countPendentesAprovacao})`}
                  </div>
                </SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="rejeitado">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ordenacao} onValueChange={onOrdenacaoChange}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prioridade_aprovacao">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-warning" />
                    Prioridade Aprovação
                  </div>
                </SelectItem>
                <SelectItem value="vencimento">Vencimento (próximos)</SelectItem>
                <SelectItem value="vencimento_desc">Vencimento (distantes)</SelectItem>
                <SelectItem value="valor">Maior valor</SelectItem>
                <SelectItem value="valor_asc">Menor valor</SelectItem>
                <SelectItem value="fornecedor">Fornecedor (A-Z)</SelectItem>
              </SelectContent>
            </Select>
            <AdvancedFiltersPopover
              filters={advancedFilters}
              onFiltersChange={onAdvancedFiltersChange}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
