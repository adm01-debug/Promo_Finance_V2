import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Trash2, Truck, Mail, Phone, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExternalCliente } from '@/hooks/useFinancialData';

interface Props {
  fornecedor: ExternalCliente;
  index: number;
  onView: (f: ExternalCliente) => void;
  onEdit: (f: ExternalCliente) => void;
  onDelete: (f: ExternalCliente) => void;
}

export function FornecedoresTableRow({ fornecedor, index, onView, onEdit, onDelete }: Props) {
  return (
    <motion.tr
      key={fornecedor.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className="group hover:bg-muted/50 transition-colors"
    >
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
            <Truck className="h-5 w-5 text-warning" />
          </div>
          <div>
            <p className="font-medium">{fornecedor.razao_social}</p>
            {fornecedor.nome_fantasia && <p className="text-xs text-muted-foreground">{fornecedor.nome_fantasia}</p>}
            {fornecedor.cnpj_cpf && <p className="text-xs text-muted-foreground">{fornecedor.cnpj_cpf}</p>}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          {fornecedor.email && <div className="flex items-center gap-1 text-sm"><Mail className="h-3 w-3 text-muted-foreground" /><span className="truncate max-w-[150px]">{fornecedor.email}</span></div>}
          {fornecedor.telefone && <div className="flex items-center gap-1 text-sm"><Phone className="h-3 w-3 text-muted-foreground" /><span>{fornecedor.telefone}</span></div>}
        </div>
      </TableCell>
      <TableCell>
        {(fornecedor.cidade || fornecedor.estado) && (
          <div className="flex items-center gap-1 text-sm">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span>{fornecedor.cidade}{fornecedor.cidade && fornecedor.estado && ' - '}{fornecedor.estado}</span>
          </div>
        )}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={cn(fornecedor.ativo ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground")}>
          {fornecedor.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="gap-2" onClick={() => onView(fornecedor)}><Eye className="h-4 w-4" />Visualizar</DropdownMenuItem>
            <DropdownMenuItem className="gap-2" onClick={() => onEdit(fornecedor)}><Edit className="h-4 w-4" />Editar</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-destructive" onClick={() => onDelete(fornecedor)}><Trash2 className="h-4 w-4" />Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </motion.tr>
  );
}
