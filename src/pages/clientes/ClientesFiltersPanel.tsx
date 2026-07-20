import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RankLegend } from '@/components/ui/rank-badge';
import { X } from 'lucide-react';
import { StandardFilterSection } from '@/components/shared/StandardFilterSection';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
} as const;

interface Props {
  searchTerm: string;
  statusFilter: string;
  estadoFilter: string;
  scoreFilter: string;
  estados: string[];
  filteredCount: number;
  totalCount: number;
  hasActiveFilters: boolean;
  onSearchChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onEstadoChange: (v: string) => void;
  onScoreChange: (v: string) => void;
  onClearFilters: () => void;
  /** Slot opcional para o ClearFiltersButton (substitui o botão padrão de Limpar). */
  clearSlot?: ReactNode;
}

export function ClientesFiltersPanel({
  searchTerm, statusFilter, estadoFilter, scoreFilter, estados, filteredCount, totalCount, hasActiveFilters,
  onSearchChange, onStatusChange, onEstadoChange, onScoreChange, onClearFilters, clearSlot,
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
          <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="inativo">Inativos</SelectItem>
          </SelectContent>
        </Select>

        <Select value={estadoFilter} onValueChange={onEstadoChange}>
          <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {estados.map((e) => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={scoreFilter} onValueChange={onScoreChange}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Score" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="excelente">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-success" />Excelente (800+)
              </span>
            </SelectItem>
            <SelectItem value="bom">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-warning" />Bom (600-799)
              </span>
            </SelectItem>
            <SelectItem value="regular">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-streak" />Regular (400-599)
              </span>
            </SelectItem>
            <SelectItem value="critico">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-destructive" />Crítico (&lt;400)
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        {clearSlot ?? (
          hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-9 px-2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4 mr-1" />Limpar
            </Button>
          )
        )}

        <div className="flex items-center gap-4 ml-auto">
          <RankLegend />
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {filteredCount} de {totalCount} clientes
          </span>
        </div>
      </StandardFilterSection>
    </motion.div>
  );
}
