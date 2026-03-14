import { motion } from 'framer-motion';
import { Building2, Target, Settings2, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
} as const;

interface DashboardFiltersHeaderProps {
  empresas: Array<{ id: string; nome_fantasia: string | null; razao_social: string }>;
  centrosCusto: Array<{ id: string; nome: string }>;
  empresaFilter: string;
  setEmpresaFilter: (value: string) => void;
  centroCustoFilter: string;
  setCentroCustoFilter: (value: string) => void;
  onOpenConfig: () => void;
}

export function DashboardFiltersHeader({
  empresas,
  centrosCusto,
  empresaFilter,
  setEmpresaFilter,
  centroCustoFilter,
  setCentroCustoFilter,
  onOpenConfig,
}: DashboardFiltersHeaderProps) {
  return (
    <motion.div variants={itemVariants} className="flex flex-col gap-4">
      {/* Title section */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-display-md gradient-text">Dashboard Executivo</h1>
            <Badge variant="outline" className="hidden sm:flex h-7 px-2.5 gap-1.5 border-success/30 bg-success/5">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] text-success font-medium">Ao vivo</span>
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary hidden sm:block" />
            Visão consolidada com drill-down por empresa e centro de custo
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={onOpenConfig} className="h-9 w-9 shrink-0">
          <Settings2 className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Filters section */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3">
        <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
          <SelectTrigger className="w-full sm:w-[200px] h-9">
            <Building2 className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
            <span className="truncate">
              <SelectValue placeholder="Todas Empresas" />
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Empresas</SelectItem>
            {empresas.map(e => (
              <SelectItem key={e.id} value={e.id}>
                {e.nome_fantasia || e.razao_social}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={centroCustoFilter} onValueChange={setCentroCustoFilter}>
          <SelectTrigger className="w-full sm:w-[200px] h-9">
            <Target className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
            <span className="truncate">
              <SelectValue placeholder="Todos Centros" />
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Centros</SelectItem>
            {centrosCusto.map(cc => (
              <SelectItem key={cc.id} value={cc.id}>{cc.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </motion.div>
  );
}
