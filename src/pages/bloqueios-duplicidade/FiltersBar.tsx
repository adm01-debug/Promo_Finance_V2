import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Building2, Calendar, FileText, RefreshCcw } from "lucide-react";
import { itemVariants, emptyFilters, type BloqueiosFilters } from "./types";

interface FiltersBarProps {
  filters: BloqueiosFilters;
  setFilters: (updater: (prev: BloqueiosFilters) => BloqueiosFilters) => void;
  onReset: () => void;
  onRefetch: () => void;
  empresas: Array<{ id: string; nome_fantasia: string; cnpj: string }> | undefined;
}

export function FiltersBar({ filters, setFilters, onReset, onRefetch, empresas }: FiltersBarProps) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="p-6 border border-border bg-card/[0.02] backdrop-blur-xl rounded-[2.5rem]">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
            <Input
              placeholder="Fornecedor..."
              className="pl-10 h-14 bg-card/5 border-white/5 rounded-2xl font-medium"
              value={filters.fornecedor}
              onChange={(e) => setFilters((prev) => ({ ...prev, fornecedor: e.target.value }))}
            />
          </div>

          <div className="relative group">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
            <select
              className="w-full pl-10 h-14 bg-card/5 border-white/5 rounded-2xl font-medium appearance-none text-sm"
              value={filters.empresa_id}
              onChange={(e) => setFilters((prev) => ({ ...prev, empresa_id: e.target.value }))}
            >
              <option value="all">Todas Empresas (CNPJ)</option>
              {empresas?.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome_fantasia} ({e.cnpj})
                </option>
              ))}
            </select>
          </div>

          <div className="relative group">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
            <Input
              placeholder="Competência (MM/AAAA)..."
              className="pl-10 h-14 bg-card/5 border-white/5 rounded-2xl font-medium"
              value={filters.competencia}
              onChange={(e) => setFilters((prev) => ({ ...prev, competencia: e.target.value }))}
            />
          </div>

          <div className="relative group">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
            <Input
              placeholder="Documento..."
              className="pl-10 h-14 bg-card/5 border-white/5 rounded-2xl font-medium"
              value={filters.documento}
              onChange={(e) => setFilters((prev) => ({ ...prev, documento: e.target.value }))}
            />
          </div>

          <div className="relative group">
            <Badge className="absolute left-3 top-1/2 -translate-y-1/2 text-[8px] bg-primary/20 text-primary border-none">R$</Badge>
            <Input
              placeholder="Valor..."
              className="pl-10 h-14 bg-card/5 border-white/5 rounded-2xl font-medium"
              value={filters.valor}
              onChange={(e) => setFilters((prev) => ({ ...prev, valor: e.target.value }))}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="h-14 flex-1 rounded-2xl font-bold bg-card/5 hover:bg-card/10 border border-white/5"
              onClick={onReset}
            >
              Limpar
            </Button>
            <Button
              variant="outline"
              className="h-14 w-14 rounded-2xl bg-primary/10 text-primary border-primary/20"
              onClick={onRefetch}
            >
              <RefreshCcw className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export { emptyFilters };
