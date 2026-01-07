import { Link } from 'react-router-dom';
import { Building2, CreditCard, CheckCircle2, Clock, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SecondaryKPICardsProps {
  empresasCount: number;
  contasBancariasCount: number;
  venceHojeReceberCount: number;
  venceHojePagarCount: number;
  aprovacoesPendentes: number;
  vencidasTotal: number;
}

export function SecondaryKPICards({
  empresasCount,
  contasBancariasCount,
  venceHojeReceberCount,
  venceHojePagarCount,
  aprovacoesPendentes,
  vencidasTotal,
}: SecondaryKPICardsProps) {
  return (
    <div className="col-span-1 lg:col-span-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Empresas</p>
            <p className="text-lg font-bold">{empresasCount}</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-secondary/10">
            <CreditCard className="h-4 w-4 text-secondary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Contas Bancárias</p>
            <p className="text-lg font-bold">{contasBancariasCount}</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-success/10">
            <CheckCircle2 className="h-4 w-4 text-success" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Receber Hoje</p>
            <p className="text-lg font-bold">{venceHojeReceberCount}</p>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-warning/10">
            <Clock className="h-4 w-4 text-warning" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pagar Hoje</p>
            <p className="text-lg font-bold">{venceHojePagarCount}</p>
          </div>
        </div>
      </Card>
      <Link to="/aprovacoes">
        <Card className={cn("p-4 cursor-pointer hover:shadow-md transition-all h-full", aprovacoesPendentes > 0 && "ring-2 ring-warning/50")}>
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", aprovacoesPendentes > 0 ? "bg-warning/10" : "bg-muted")}>
              <ShieldAlert className={cn("h-4 w-4", aprovacoesPendentes > 0 ? "text-warning" : "text-muted-foreground")} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Aprovações</p>
              <p className={cn("text-lg font-bold", aprovacoesPendentes > 0 && "text-warning")}>{aprovacoesPendentes}</p>
            </div>
          </div>
        </Card>
      </Link>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/10">
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Vencidas</p>
            <p className="text-lg font-bold text-destructive">{vencidasTotal}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
