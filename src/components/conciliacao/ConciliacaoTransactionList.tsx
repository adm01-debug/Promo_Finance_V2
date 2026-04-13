import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, CheckCircle2, Calendar, Check,
  MoreHorizontal, Link2, Unlink, SplitSquareHorizontal, Upload, Search,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { ConciliacaoFilters, ConciliacaoFilterState } from './ConciliacaoFilters';

interface TransacaoExtrato {
  id: string; data: Date; descricao: string; valor: number; tipo: 'credito' | 'debito'; conciliada: boolean;
}

interface ConciliacaoTransactionListProps {
  filteredTransacoes: TransacaoExtrato[];
  totalTransacoes: number;
  pendentes: number;
  conciliadas: number;
  statusTab: string;
  onStatusTabChange: (v: string) => void;
  searchTerm: string;
  onSearchChange: (v: string) => void;
  filters: ConciliacaoFilterState;
  onFiltersChange: (f: ConciliacaoFilterState) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onConciliar: (id: string) => void;
  onConciliarManual: (id: string) => void;
  onConciliarSplit: (id: string) => void;
  onIgnorar: (id: string) => void;
  onImportClick: () => void;
}

export function ConciliacaoTransactionList({
  filteredTransacoes, totalTransacoes, pendentes, conciliadas, statusTab, onStatusTabChange,
  searchTerm, onSearchChange, filters, onFiltersChange,
  selectedIds, onToggleSelect, onToggleSelectAll,
  onConciliar, onConciliarManual, onConciliarSplit, onIgnorar, onImportClick,
}: ConciliacaoTransactionListProps) {
  return (
    <div className="space-y-4">
      <Card className="card-base">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <Tabs value={statusTab} onValueChange={onStatusTabChange}>
              <TabsList>
                <TabsTrigger value="pendentes" className="gap-2">
                  <AlertTriangle className="h-4 w-4" />Pendentes
                  <Badge variant="secondary" className="ml-1">{pendentes}</Badge>
                </TabsTrigger>
                <TabsTrigger value="conciliadas" className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />Conciliadas
                  <Badge variant="secondary" className="ml-1">{conciliadas}</Badge>
                </TabsTrigger>
                <TabsTrigger value="todas">Todas</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-[280px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar transações..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} className="pl-10" />
              </div>
              <ConciliacaoFilters filters={filters} onFiltersChange={onFiltersChange} />
            </div>
          </div>
        </CardContent>
      </Card>

      {statusTab === 'pendentes' && filteredTransacoes.length > 0 && (
        <div className="flex items-center gap-3 px-1">
          <Checkbox checked={selectedIds.size > 0 && selectedIds.size === filteredTransacoes.filter(t => !t.conciliada).length} onChange={onToggleSelectAll} />
          <span className="text-sm text-muted-foreground">{selectedIds.size > 0 ? `${selectedIds.size} selecionadas` : 'Selecionar todas'}</span>
        </div>
      )}

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredTransacoes.map((transacao, index) => {
            const isCredito = transacao.tipo === 'credito';
            const isSelected = selectedIds.has(transacao.id);
            return (
              <motion.div key={transacao.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }} transition={{ delay: Math.min(index * 0.02, 0.3) }}>
                <Card className={cn("card-base transition-all hover:shadow-md", transacao.conciliada && "opacity-70", isSelected && "ring-2 ring-primary/50 bg-primary/5")}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {!transacao.conciliada && <Checkbox checked={isSelected} onChange={() => onToggleSelect(transacao.id)} className="flex-shrink-0" />}
                      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0", isCredito ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                        {isCredito ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{transacao.descricao}</p>
                        <div className="flex items-center gap-2 mt-0.5"><Calendar className="h-3 w-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">{formatDate(transacao.data)}</span></div>
                      </div>
                      <p className={cn("font-bold text-base whitespace-nowrap", isCredito ? "text-success" : "text-destructive")}>{isCredito ? '+' : ''}{formatCurrency(transacao.valor)}</p>
                      {transacao.conciliada && <Badge className="bg-success/10 text-success border-success/20 gap-1 flex-shrink-0"><CheckCircle2 className="h-3 w-3" />Conciliada</Badge>}
                      {!transacao.conciliada && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => onConciliar(transacao.id)}><Check className="h-3.5 w-3.5" />Conciliar</Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="outline" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="gap-2" onClick={() => onConciliarManual(transacao.id)}><Link2 className="h-4 w-4" /> Vincular manualmente</DropdownMenuItem>
                              <DropdownMenuItem className="gap-2" onClick={() => onConciliarSplit(transacao.id)}><SplitSquareHorizontal className="h-4 w-4" /> Conciliação parcial</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="gap-2 text-destructive" onClick={() => onIgnorar(transacao.id)}><Unlink className="h-4 w-4" /> Ignorar</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredTransacoes.length === 0 && (
          <Card className="card-base">
            <CardContent className="p-12 text-center">
              {totalTransacoes === 0 ? (
                <div className="space-y-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto"><Upload className="h-8 w-8 text-primary" /></div>
                  <div><h3 className="font-semibold text-lg">Comece importando um extrato</h3><p className="text-muted-foreground mt-1 max-w-md mx-auto">1. Selecione o banco acima → 2. Clique em "Importar Extrato" → 3. A IA analisa e sugere matches automaticamente</p></div>
                  <Button onClick={onImportClick} className="gap-2"><Upload className="h-4 w-4" /> Importar Extrato</Button>
                </div>
              ) : (
                <div>
                  <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="h-8 w-8 text-success" /></div>
                  <h3 className="font-semibold text-lg">{statusTab === 'pendentes' ? 'Todas as transações foram conciliadas! 🎉' : 'Nenhuma transação encontrada'}</h3>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
