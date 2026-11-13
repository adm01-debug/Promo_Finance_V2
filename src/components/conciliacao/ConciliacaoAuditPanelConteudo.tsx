import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { User, Clock, Link2, CheckCircle2 } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConciliacaoAuditPanelConteudoProps {
  isLoading: boolean;
  filteredItems: {
    id: string;
    type: string;
    evento: string;
    valor: number;
    responsavel: string;
    data: string;
    regra: string;
    classificacao: string | undefined;
    evidencia_url: string | null;
    conta: string;
  }[];
}

export function ConciliacaoAuditPanelConteudo({
  isLoading,
  filteredItems,
}: ConciliacaoAuditPanelConteudoProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="font-bold">Evento / Lançamento</TableHead>
            <TableHead className="font-bold">Valor</TableHead>
            <TableHead className="font-bold">Conta</TableHead>
            <TableHead className="font-bold">Responsável</TableHead>
            <TableHead className="font-bold">Data/Hora</TableHead>
            <TableHead className="font-bold">Regra/Configuração</TableHead>
            <TableHead className="text-right font-bold">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto opacity-50" />
              </TableCell>
            </TableRow>
          ) : filteredItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center text-muted-foreground italic">
                Nenhum registro de auditoria encontrado com os filtros selecionados.
              </TableCell>
            </TableRow>
          ) : (
            filteredItems.map((item) => (
              <TableRow key={item.id} className={item.type === 'divergencia' ? 'bg-warning/5' : ''}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{item.evento}</span>
                    <Badge
                      variant={item.type === 'divergencia' ? 'warning' : 'outline'}
                      className="w-fit text-[10px] mt-1 h-4"
                    >
                      {item.classificacao}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell
                  className={cn(
                    'font-bold text-sm',
                    item.valor >= 0 ? 'text-success' : 'text-destructive'
                  )}
                >
                  {formatCurrency(item.valor)}
                </TableCell>
                <TableCell className="text-xs font-medium">{item.conta}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs">
                    <User className="h-3 w-3 text-muted-foreground" />
                    {item.responsavel}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {formatDate(item.data)}
                  </div>
                </TableCell>
                <TableCell className="text-xs max-w-[220px] truncate italic" title={item.regra}>
                  {item.regra}
                </TableCell>
                <TableCell className="text-right">
                  {item.evidencia_url ? (
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-primary">
                      <a href={item.evidencia_url} target="_blank" rel="noopener noreferrer">
                        <Link2 className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : item.type === 'divergencia' ? (
                    <CheckCircle2 className="h-4 w-4 text-success inline-block mr-2" />
                  ) : (
                    <span className="text-xs text-muted-foreground">Automático</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
