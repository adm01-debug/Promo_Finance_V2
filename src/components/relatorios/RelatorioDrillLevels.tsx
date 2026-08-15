import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Building2, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/formatters';
import { InsightsIA } from './InsightsIA';

export interface ResumoDados {
  receitas: { total: number; realizado: number; pendente: number; percentual: number; count: number };
  despesas: { total: number; realizado: number; pendente: number; percentual: number; count: number };
  saldo: number;
}

export interface EmpresaDrillRow {
  id: string;
  nome: string;
  total: number;
  realizado: number;
  pendente: number;
  count: number;
  percentual: number;
}

export interface DetalheDrillRow {
  id: string;
  descricao: string;
  entidade: string;
  valor: number;
  vencimento: string;
  status: string;
}

interface ResumoProps {
  resumoData: ResumoDados | undefined;
  isLoadingResumo: boolean;
  onDrill: (categoria: 'receitas' | 'despesas') => void;
  periodo: string;
}

export function ResumoDrillLevel({ resumoData, isLoadingResumo, onDrill, periodo }: ResumoProps) {
  return (
    <motion.div
      key="resumo"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {isLoadingResumo ? (
        <>
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </>
      ) : (
        <>
          {/* Insights IA no nível resumo */}
          {resumoData && (
            <div className="col-span-full mb-2">
              <InsightsIA
                dados={{
                  receitas_total: resumoData.receitas.total,
                  receitas_recebidas: resumoData.receitas.realizado,
                  receitas_pendentes: resumoData.receitas.pendente,
                  receitas_percentual: resumoData.receitas.percentual,
                  despesas_total: resumoData.despesas.total,
                  despesas_pagas: resumoData.despesas.realizado,
                  despesas_pendentes: resumoData.despesas.pendente,
                  despesas_percentual: resumoData.despesas.percentual,
                  saldo_liquido: resumoData.saldo,
                  total_lancamentos: resumoData.receitas.count + resumoData.despesas.count,
                  periodo,
                }}
                contexto={`Relatório drill-down do período ${periodo}. Empresa de eventos com alto volume de PIX.`}
              />
            </div>
          )}
          {/* Card Receitas */}
          <Card 
            className="cursor-pointer hover:border-success transition-colors group"
            onClick={() => onDrill('receitas')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-success" />
                  <span className="font-semibold">Receitas</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-success transition-colors" />
              </div>
              <div className="space-y-3">
                <div className="text-3xl font-bold text-success">
                  {formatCurrency(resumoData?.receitas.total || 0)}
                </div>
                <Progress value={resumoData?.receitas.percentual || 0} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Recebido: {formatCurrency(resumoData?.receitas.realizado || 0)}
                  </span>
                  <span className="text-muted-foreground">
                    {resumoData?.receitas.count} lançamentos
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Despesas */}
          <Card 
            className="cursor-pointer hover:border-destructive transition-colors group"
            onClick={() => onDrill('despesas')}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                  <span className="font-semibold">Despesas</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-destructive transition-colors" />
              </div>
              <div className="space-y-3">
                <div className="text-3xl font-bold text-destructive">
                  {formatCurrency(resumoData?.despesas.total || 0)}
                </div>
                <Progress value={resumoData?.despesas.percentual || 0} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Pago: {formatCurrency(resumoData?.despesas.realizado || 0)}
                  </span>
                  <span className="text-muted-foreground">
                    {resumoData?.despesas.count} lançamentos
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </motion.div>
  );
}

interface EmpresasProps {
  empresasData: EmpresaDrillRow[] | undefined;
  isLoadingEmpresas: boolean;
  onSelectEmpresa: (empresaId: string, empresaNome: string) => void;
}

export function EmpresasDrillLevel({ empresasData, isLoadingEmpresas, onSelectEmpresa }: EmpresasProps) {
  return (
    <motion.div
      key="empresa"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {isLoadingEmpresas ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {empresasData?.map((empresa, index) => (
            <motion.div
              key={empresa.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => onSelectEmpresa(empresa.id, empresa.nome)}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{empresa.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {empresa.count} lançamentos
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(empresa.total)}</p>
                        <p className="text-sm text-muted-foreground">
                          {empresa.percentual.toFixed(0)}% realizado
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

interface DetalhesProps {
  detalhesData: DetalheDrillRow[] | undefined;
  isLoadingDetalhes: boolean;
  categoria: 'receitas' | 'despesas' | undefined;
}

export function DetalhesDrillLevel({ detalhesData, isLoadingDetalhes, categoria }: DetalhesProps) {
  return (
    <motion.div
      key="detalhes"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {isLoadingDetalhes ? (
        <Skeleton className="h-64" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>{categoria === 'receitas' ? 'Cliente' : 'Fornecedor'}</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detalhesData?.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.descricao}</TableCell>
                <TableCell>{item.entidade}</TableCell>
                <TableCell>{format(new Date(item.vencimento), 'dd/MM/yyyy')}</TableCell>
                <TableCell>
                  <Badge variant={
                    item.status === 'pago' ? 'default' :
                    item.status === 'vencido' ? 'destructive' : 'secondary'
                  }>
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(item.valor)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </motion.div>
  );
}
