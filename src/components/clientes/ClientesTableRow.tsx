import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { RankBadge, getRankFromScore } from '@/components/ui/rank-badge';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { ExternalCliente } from '@/hooks/useFinancialData';

const getScoreLabel = (score: number | null) => {
  if (!score) return '-';
  if (score >= 800) return 'Excelente';
  if (score >= 600) return 'Bom';
  if (score >= 400) return 'Regular';
  return 'Crítico';
};

interface Props {
  cliente: ExternalCliente;
  index: number;
  totalCount: number;
  onView: (c: ExternalCliente) => void;
  onEdit: (c: ExternalCliente) => void;
  onDelete: (c: ExternalCliente) => void;
}

export function ClientesTableRow({ cliente, index, totalCount, onView, onEdit, onDelete }: Props) {
  const shouldAnimate = totalCount <= 20;
  const RowComponent = shouldAnimate ? motion.tr : 'tr';
  const animationProps = shouldAnimate ? { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, transition: { delay: index * 0.02 } } : {};

  return (
    <RowComponent key={cliente.id} {...animationProps} className="group hover:bg-muted/50 transition-colors">
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><User className="h-5 w-5 text-primary" /></div>
          <div>
            <p className="font-medium">{cliente.razao_social}</p>
            {cliente.nome_fantasia && <p className="text-xs text-muted-foreground">{cliente.nome_fantasia}</p>}
            {cliente.cnpj_cpf && <p className="text-xs text-muted-foreground">{cliente.cnpj_cpf}</p>}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          {cliente.email && <div className="flex items-center gap-1 text-sm"><Mail className="h-3 w-3 text-muted-foreground" /><span className="truncate max-w-[150px]">{cliente.email}</span></div>}
          {cliente.telefone && <div className="flex items-center gap-1 text-sm"><Phone className="h-3 w-3 text-muted-foreground" /><span>{cliente.telefone}</span></div>}
        </div>
      </TableCell>
      <TableCell>
        {(cliente.cidade || cliente.estado) && <div className="flex items-center gap-1 text-sm"><MapPin className="h-3 w-3 text-muted-foreground" /><span>{cliente.cidade}{cliente.cidade && cliente.estado && ' - '}{cliente.estado}</span></div>}
      </TableCell>
      <TableCell>
        <RankBadge rank={getRankFromScore(cliente.score || 0, { gold: 800, silver: 600, bronze: 400 })} size="sm" label={getScoreLabel(cliente.score)} value={cliente.score || '-'} animate />
      </TableCell>
      <TableCell><span className="font-medium">{formatCurrency(cliente.limite_credito || 0)}</span></TableCell>
      <TableCell>
        <Badge variant="outline" className={cn(cliente.ativo ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground")}>{cliente.ativo ? 'Ativo' : 'Inativo'}</Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="gap-2" onClick={() => onView(cliente)}><Eye className="h-4 w-4" />Visualizar</DropdownMenuItem>
            <DropdownMenuItem className="gap-2" onClick={() => onEdit(cliente)}><Edit className="h-4 w-4" />Editar</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-destructive" onClick={() => onDelete(cliente)}><Trash2 className="h-4 w-4" />Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </RowComponent>
  );
}
