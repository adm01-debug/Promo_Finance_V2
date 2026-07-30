import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { StandardFilterSection } from '@/components/shared/StandardFilterSection';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
} as const;

interface Props {
  searchTerm: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  estadoFilter: string;
  onEstadoChange: (v: string) => void;
  estados: string[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  filteredCount: number;
  totalCount: number;
  /** Slot opcional para o ClearFiltersButton (substitui o botão padrão de Limpar). */
  clearSlot?: ReactNode;
}

export function FornecedoresFiltersPanel({
  searchTerm, onSearchChange, statusFilter, onStatusChange,
  estadoFilter, onEstadoChange, estados, hasActiveFilters,
  onClearFilters, filteredCount, totalCount, clearSlot,
}: Props) {
  return (
    <motion.div variants={itemVariants}>
      <StandardFilterSection
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        searchPlaceholder="Buscar por razão social, nome fantasia, CNPJ ou e-mail..."
        badge="Filtros"
      >
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="inativo">Inativos</SelectItem>
          </SelectContent>
        </Select>

        <Select value={estadoFilter} onValueChange={onEstadoChange}>
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {estados.map((estado) => (
              <SelectItem key={estado} value={estado}>{estado}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {clearSlot ?? (
          hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-9 px-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )
        )}

        <div className="ml-auto text-sm text-muted-foreground whitespace-nowrap">
          {filteredCount} de {totalCount} fornecedores
        </div>
      </StandardFilterSection>
    </motion.div>
  );
}
