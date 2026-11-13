import { AlertCircle, Eye, Filter, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { HistoricoRelatorio } from '@/hooks/useRelatoriosAgendados';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { tiposRelatorio } from './RelatoriosAgendados.helpers';

import type { Dispatch, SetStateAction } from 'react';
interface RelatoriosAgendadosHistoricoExecucoesProps {
  historicoFiltrado: HistoricoRelatorio[];
  historico: HistoricoRelatorio[];
  temFiltrosAtivos: string | true;
  limparFiltros: () => void;
  filtroTipo: string;
  setFiltroTipo: import('react').Dispatch<import('react').SetStateAction<string>>;
  filtroStatus: string;
  setFiltroStatus: import('react').Dispatch<import('react').SetStateAction<string>>;
  filtroDataInicio: string;
  setFiltroDataInicio: import('react').Dispatch<import('react').SetStateAction<string>>;
  filtroDataFim: string;
  setFiltroDataFim: import('react').Dispatch<import('react').SetStateAction<string>>;
  relatorios: import('@/hooks/useRelatoriosAgendados').RelatorioAgendado[];
  getTipoLabel: (tipo: string) => string;
  getStatusBadge: (status: string) => import('react/jsx-runtime').JSX.Element;
  setSelectedHistorico: Dispatch<SetStateAction<HistoricoRelatorio | null>>;
  setViewDialogOpen: import('react').Dispatch<import('react').SetStateAction<boolean>>;
}

export function RelatoriosAgendadosHistoricoExecucoes({
  historicoFiltrado,
  historico,
  temFiltrosAtivos,
  limparFiltros,
  filtroTipo,
  setFiltroTipo,
  filtroStatus,
  setFiltroStatus,
  filtroDataInicio,
  setFiltroDataInicio,
  filtroDataFim,
  setFiltroDataFim,
  relatorios,
  getTipoLabel,
  getStatusBadge,
  setSelectedHistorico,
  setViewDialogOpen,
}: RelatoriosAgendadosHistoricoExecucoesProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Histórico de Execuções</CardTitle>
            <CardDescription>
              {historicoFiltrado.length} de {historico.length} registros
            </CardDescription>
          </div>
          {temFiltrosAtivos && (
            <Button variant="ghost" size="sm" onClick={limparFiltros} className="gap-1.5">
              <X className="h-4 w-4" />
              Limpar filtros
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-3 pt-4">
          <Filter className="h-4 w-4 text-muted-foreground mt-2" />
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {tiposRelatorio.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos status</SelectItem>
              <SelectItem value="gerado">Gerado</SelectItem>
              <SelectItem value="enviado">Enviado</SelectItem>
              <SelectItem value="erro">Erro</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={filtroDataInicio}
              onChange={(e) => setFiltroDataInicio(e.target.value)}
              className="w-[150px]"
            />
            <span className="text-muted-foreground text-sm">até</span>
            <Input
              type="date"
              value={filtroDataFim}
              onChange={(e) => setFiltroDataFim(e.target.value)}
              className="w-[150px]"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {historicoFiltrado.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p>Nenhum registro encontrado com os filtros aplicados</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Relatório</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historicoFiltrado.map((item) => {
                const relatorio = relatorios.find((r) => r.id === item.relatorio_agendado_id);
                const hasData =
                  item.dados_relatorio && Object.keys(item.dados_relatorio).length > 0;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm">
                      {format(new Date(item.executado_em), 'dd/MM/yyyy HH:mm', {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {relatorio?.nome || 'Relatório removido'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getTipoLabel(relatorio?.tipo_relatorio || '')}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {item.erro_mensagem || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {hasData && item.status === 'gerado' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedHistorico(item);
                            setViewDialogOpen(true);
                          }}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Visualizar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
