import { useState } from 'react';
import {
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  MoreHorizontal,
  Banknote,
  History,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { VersionHistory } from '@/components/common/VersionHistory';
import { DuplicateButton } from '@/components/common/DuplicateButton';
import { useContasPagarLogic } from '@/hooks/useContasPagarLogic';

interface ContaPagarRowActionsProps {
  status: string;
  aguardandoSolicitacao: boolean;
  temSolicitacaoPendente: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onRegistrarPagamento: () => void;
  onSolicitarAprovacao: () => void;
  id?: string;
}

export function ContaPagarRowActions({
  status,
  aguardandoSolicitacao,
  temSolicitacaoPendente,
  onEdit,
  onDelete,
  onRegistrarPagamento,
  onSolicitarAprovacao,
  id,
}: ContaPagarRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="gap-2">
          <Eye className="h-4 w-4" />
          Visualizar
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2" onClick={onEdit}>
          <Edit className="h-4 w-4" />
          Editar
        </DropdownMenuItem>
        
        {status !== 'pago' && status !== 'cancelado' && id && (
          <DropdownMenuItem className="gap-2" onClick={() => window.location.href = `/boletos?novo=true&pagar_id=${id}`}>
            <Banknote className="h-4 w-4" />
            Gerar Boleto Pagamento
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        {aguardandoSolicitacao && (
          <DropdownMenuItem className="gap-2 text-warning" onClick={onSolicitarAprovacao}>
            <ShieldAlert className="h-4 w-4" />
            Solicitar Aprovação
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="gap-2"
          onClick={onRegistrarPagamento}
          disabled={status === 'pago' || status === 'cancelado' || aguardandoSolicitacao || temSolicitacaoPendente}
        >
          <CheckCircle2 className="h-4 w-4" />
          Registrar Pagamento
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 text-destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
