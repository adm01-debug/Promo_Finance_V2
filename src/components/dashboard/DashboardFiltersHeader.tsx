import { motion } from 'framer-motion';
import { Building2, Target, Settings2 } from 'lucide-react';
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
    <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div>
        <h1 className="text-display-md gradient-text">Dashboard Executivo</h1>
        <p className="text-muted-foreground mt-1">Visão consolidada com drill-down por empresa e centro de custo</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
          <SelectTrigger className="w-[200px]">
            <Building2 className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Todas Empresas" />
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
          <SelectTrigger className="w-[200px]">
            <Target className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Todos Centros" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Centros de Custo</SelectItem>
            {centrosCusto.map(cc => (
              <SelectItem key={cc.id} value={cc.id}>{cc.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="outline" className="h-9 px-3 gap-2">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          Dados em tempo real
        </Badge>
        <Button variant="outline" size="icon" onClick={onOpenConfig}>
          <Settings2 className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
