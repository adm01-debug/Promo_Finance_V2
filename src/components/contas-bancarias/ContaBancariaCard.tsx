import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, RefreshCw, Edit, Trash2, Settings2, FileText, type LucideIcon } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { ContaBancaria } from '@/hooks/useFinancialData';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

interface Props {
  conta: ContaBancaria;
  empresaNome: string;
  showSaldos: boolean;
  bancoIcon: LucideIcon;
  bancoColor: string;
  onDelete: (conta: ContaBancaria) => void;
}

export function ContaBancariaCard({ conta, empresaNome, showSaldos, bancoIcon: BancoIcon, bancoColor, onDelete }: Props) {
  const percentualDisponivel = conta.saldo_atual > 0 ? (conta.saldo_disponivel / conta.saldo_atual) * 100 : 0;

  return (
    <motion.div variants={itemVariants}>
      <Card className={cn("relative overflow-hidden transition-all hover:shadow-lg", !conta.ativo && "opacity-60")}>
        <div className={cn("absolute top-0 left-0 right-0 h-1", bancoColor)} />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", bancoColor)}>
                <BancoIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">{conta.banco}</CardTitle>
                <p className="text-xs text-muted-foreground">Ag: {conta.agencia} | Cc: {conta.conta}</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem><RefreshCw className="h-4 w-4 mr-2" />Sincronizar</DropdownMenuItem>
                <DropdownMenuItem><Edit className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem><Settings2 className="h-4 w-4 mr-2" />Regras de Conciliação</DropdownMenuItem>
                <DropdownMenuItem><FileText className="h-4 w-4 mr-2" />Mapeamento de Extrato</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(conta)}>
                  <Trash2 className="h-4 w-4 mr-2" />Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Saldo Atual</span>
              <Badge variant={conta.ativo ? "default" : "secondary"}>
                {conta.ativo ? "Ativa" : "Inativa"}
              </Badge>
            </div>
            <p className={cn("text-2xl font-bold", conta.saldo_atual >= 0 ? "text-foreground" : "text-destructive")}>
              {showSaldos ? formatCurrency(conta.saldo_atual) : '••••••'}
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Disponível</span>
              <span className="text-sm font-medium">
                {showSaldos ? formatCurrency(conta.saldo_disponivel) : '••••••'}
              </span>
            </div>
            <Progress value={percentualDisponivel} className="h-2" />
          </div>
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">{empresaNome}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
