import { useState } from 'react';
import {
  Banknote,
  CheckCircle2,
  DollarSign,
  Edit,
  Eye,
  History,
  MoreHorizontal,
  Send,
  Tag,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { VersionHistory } from '@/components/common/VersionHistory';
import { DuplicateButton } from '@/components/common/DuplicateButton';
import type { ContaReceberWithRelations } from './rowConfig';

interface AcoesCellProps {
  conta: ContaReceberWithRelations;
  onEdit: (conta: ContaReceberWithRelations) => void;
  onDelete: (conta: ContaReceberWithRelations) => void;
  onRegistrarRecebimento: (conta: ContaReceberWithRelations) => void;
  onView?: (conta: ContaReceberWithRelations) => void;
  onEnviarCobranca?: (conta: ContaReceberWithRelations) => void;
  onAplicarDesconto?: (conta: ContaReceberWithRelations) => void;
}

export function AcoesCell({
  conta,
  onEdit,
  onDelete,
  onRegistrarRecebimento,
  onView,
  onEnviarCobranca,
  onAplicarDesconto,
}: AcoesCellProps) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const notClosed = conta.status !== 'pago' && conta.status !== 'cancelado';

  return (
    <TableCell className="p-6">
      <div className="flex items-center justify-end gap-2">
        <TooltipProvider>
          {onView && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-xl border-white/5 bg-card/5 hover:bg-primary hover:text-primary-foreground transition-all duration-300 opacity-0 group-hover:opacity-100"
                  onClick={() => onView(conta)}
                  aria-label="Visualizar"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-background/95 backdrop-blur-xl border-white/10 rounded-xl font-bold">
                Visualizar
              </TooltipContent>
            </Tooltip>
          )}
          {notClosed && onEnviarCobranca && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-xl border-white/5 bg-card/5 hover:bg-blue-500 hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100"
                  onClick={() => onEnviarCobranca(conta)}
                  aria-label="Enviar cobrança"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-background/95 backdrop-blur-xl border-white/10 rounded-xl font-bold">
                Enviar cobrança
              </TooltipContent>
            </Tooltip>
          )}
          {notClosed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-xl border-white/5 bg-card/5 hover:bg-success hover:text-primary-foreground transition-all duration-300 opacity-0 group-hover:opacity-100"
                  onClick={() => onRegistrarRecebimento(conta)}
                  aria-label="Registrar recebimento"
                >
                  <DollarSign className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-background/95 backdrop-blur-xl border-white/10 rounded-xl font-bold">
                Registrar recebimento
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl hover:bg-card/10 transition-all opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-background/95 backdrop-blur-2xl border-white/10 p-2 rounded-2xl shadow-2xl min-w-[200px]"
          >
            <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-3 py-2">
              Operações
            </DropdownMenuLabel>
            <DropdownMenuItem className="gap-3 rounded-xl focus:bg-card/10" onClick={() => onView?.(conta)}>
              <Eye className="h-4 w-4 text-primary" /> Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-3 rounded-xl focus:bg-card/10" onClick={() => onEdit(conta)}>
              <Edit className="h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-3 rounded-xl focus:bg-card/10" onClick={() => setHistoryOpen(true)}>
              <History className="h-4 w-4" /> Histórico de alterações
            </DropdownMenuItem>
            <DuplicateButton
              data={conta}
              onDuplicate={(duplicated) => {
                onEdit(duplicated as ContaReceberWithRelations);
                toast.success('Registro clonado. Revise os dados e salve.');
              }}
              label="Analisar Duplicação"
              className="w-full justify-start px-2 py-1.5 h-auto font-normal text-sm gap-3 rounded-xl focus:bg-card/10"
              variant="ghost"
              size="default"
            />
            <DropdownMenuItem className="gap-3 rounded-xl focus:bg-card/10" onClick={() => onEnviarCobranca?.(conta)}>
              <Send className="h-4 w-4 text-blue-400" /> Enviar cobrança
            </DropdownMenuItem>
            {notClosed && (
              <DropdownMenuItem
                className="gap-3 rounded-xl focus:bg-card/10"
                onClick={() => (window.location.href = `/boletos?novo=true&receber_id=${conta.id}`)}
              >
                <Banknote className="h-4 w-4 text-primary" /> Gerar Boleto
              </DropdownMenuItem>
            )}
            {notClosed && (
              <DropdownMenuItem className="gap-3 rounded-xl focus:bg-card/10" onClick={() => onAplicarDesconto?.(conta)}>
                <Tag className="h-4 w-4 text-warning" /> Aplicar Desconto
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-card/5" />
            <DropdownMenuItem
              className="gap-3 rounded-xl focus:bg-success/20 text-success"
              onClick={() => onRegistrarRecebimento(conta)}
              disabled={!notClosed}
            >
              <CheckCircle2 className="h-4 w-4" /> Registrar recebimento
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-card/5" />
            <DropdownMenuItem
              className="gap-3 rounded-xl focus:bg-destructive/20 text-destructive font-bold"
              onClick={() => onDelete(conta)}
            >
              <Trash2 className="h-4 w-4" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <VersionHistory open={historyOpen} onOpenChange={setHistoryOpen} recordId={conta.id} tableName="contas_receber" />
    </TableCell>
  );
}
