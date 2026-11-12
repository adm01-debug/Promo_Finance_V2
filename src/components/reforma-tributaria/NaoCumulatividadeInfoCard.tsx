import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

export function NaoCumulatividadeInfoCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-success" />
          Não-Cumulatividade Plena
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Crédito Integral</h4>
            <p className="text-sm text-muted-foreground">
              Todo IBS e CBS pago nas aquisições gera crédito, sem restrições por tipo de bem ou
              serviço.
            </p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Compensação Cruzada</h4>
            <p className="text-sm text-muted-foreground">
              Créditos de CBS compensam débitos de CBS. Créditos de IBS compensam débitos de IBS.
            </p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Ressarcimento</h4>
            <p className="text-sm text-muted-foreground">
              Saldo credor acumulado pode ser ressarcido em até 60 dias, conforme regulamentação.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
