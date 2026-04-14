import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Edit2, Trash2, RotateCcw, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { StaggerContainer, StaggerItem } from '@/components/ui/micro-interactions';
import type { CentroCusto } from '@/hooks/useCentrosCusto';

const COLORS = ['hsl(24, 95%, 46%)', 'hsl(215, 90%, 42%)', 'hsl(150, 70%, 32%)', 'hsl(275, 75%, 48%)', 'hsl(42, 95%, 48%)'];

function getParentName(parentId: string | null, centros: CentroCusto[]): string {
  if (!parentId) return '';
  const parent = centros.find((c) => c.id === parentId);
  return parent ? `${parent.codigo} - ${parent.nome}` : '';
}

interface Props {
  filteredCentros: CentroCusto[];
  allCentros: CentroCusto[];
  onEdit: (centro: CentroCusto) => void;
  onDelete: (centro: CentroCusto) => void;
  onReactivate: (centro: CentroCusto) => void;
}

export function CentroCustoCards({ filteredCentros, allCentros, onEdit, onDelete, onReactivate }: Props) {
  return (
    <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredCentros.map((centro, index) => {
        const percentual = centro.orcamento_previsto > 0 ? (centro.orcamento_realizado / centro.orcamento_previsto) * 100 : 0;
        const diferenca = centro.orcamento_realizado - centro.orcamento_previsto;
        const isOver = diferenca > 0;
        const parentName = getParentName(centro.parent_id, allCentros);

        return (
          <StaggerItem key={centro.id}>
            <Card className={cn('card-interactive h-full', !centro.ativo && 'opacity-60')}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ background: `${COLORS[index % COLORS.length]}20`, color: COLORS[index % COLORS.length] }}>
                      <span className="font-bold text-sm">{centro.codigo}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{centro.nome}</h3>
                        {!centro.ativo && <Badge variant="secondary" className="text-xs">Inativo</Badge>}
                      </div>
                      {parentName && <div className="flex items-center gap-1 text-xs text-muted-foreground"><ChevronRight className="h-3 w-3" />{parentName}</div>}
                      <p className="text-xs text-muted-foreground">{centro.descricao || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(centro)}><Edit2 className="h-4 w-4" /></Button>
                    {centro.ativo ? (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(centro)}><Trash2 className="h-4 w-4" /></Button>
                    ) : (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:text-success" onClick={() => onReactivate(centro)}><RotateCcw className="h-4 w-4" /></Button>
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Orçado</span><span className="font-medium">{formatCurrency(centro.orcamento_previsto)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Realizado</span><span className={cn('font-medium', isOver ? 'text-destructive' : 'text-success')}>{formatCurrency(centro.orcamento_realizado)}</span></div>
                  <Progress value={percentual > 100 ? 100 : percentual} className={cn('h-2', isOver && '[&>div]:bg-destructive')} />
                  <div className="flex justify-between text-xs text-muted-foreground"><span>{percentual.toFixed(1)}% utilizado</span><span className={cn(isOver ? 'text-destructive' : 'text-success')}>{isOver ? '+' : ''}{formatCurrency(diferenca)}</span></div>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
