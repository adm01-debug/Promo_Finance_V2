import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';
import type { ApuracaoTributaria } from '@/hooks/useApuracoesTributarias';

const meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface Props {
  apuracao: ApuracaoTributaria;
}

export function ApuracaoDetalheCard({ apuracao }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalhes: {meses[apuracao.mes - 1]}/{apuracao.ano}</CardTitle>
        <CardDescription>Composição detalhada dos tributos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {/* CBS */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold text-cbs mb-3">CBS - Contribuição sobre Bens e Serviços</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Débitos</span><span className="font-medium">{formatCurrency(apuracao.cbs_debitos)}</span></div>
              <div className="flex justify-between text-success"><span>(-) Créditos</span><span className="font-medium">{formatCurrency(apuracao.cbs_creditos)}</span></div>
              <div className="flex justify-between text-success"><span>(-) Saldo Anterior</span><span className="font-medium">{formatCurrency(apuracao.cbs_saldo_anterior)}</span></div>
              <div className="border-t pt-2 flex justify-between font-bold"><span>= A Pagar</span><span className="text-cbs">{formatCurrency(apuracao.cbs_a_pagar)}</span></div>
              {Number(apuracao.cbs_a_compensar) > 0 && (
                <div className="flex justify-between text-success"><span>Saldo Credor</span><span className="font-medium">{formatCurrency(apuracao.cbs_a_compensar)}</span></div>
              )}
            </div>
          </div>

          {/* IBS */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold text-ibs mb-3">IBS - Imposto sobre Bens e Serviços</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Débitos</span><span className="font-medium">{formatCurrency(apuracao.ibs_debitos)}</span></div>
              <div className="flex justify-between text-success"><span>(-) Créditos</span><span className="font-medium">{formatCurrency(apuracao.ibs_creditos)}</span></div>
              <div className="flex justify-between text-success"><span>(-) Saldo Anterior</span><span className="font-medium">{formatCurrency(apuracao.ibs_saldo_anterior)}</span></div>
              <div className="border-t pt-2 flex justify-between font-bold"><span>= A Pagar</span><span className="text-ibs">{formatCurrency(apuracao.ibs_a_pagar)}</span></div>
              {Number(apuracao.ibs_a_compensar) > 0 && (
                <div className="flex justify-between text-success"><span>Saldo Credor</span><span className="font-medium">{formatCurrency(apuracao.ibs_a_compensar)}</span></div>
              )}
            </div>
          </div>

          {/* IS */}
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold text-imposto-seletivo mb-3">IS - Imposto Seletivo</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Débitos</span><span className="font-medium">{formatCurrency(apuracao.is_debitos)}</span></div>
              <div className="border-t pt-2 flex justify-between font-bold"><span>= A Pagar</span><span className="text-imposto-seletivo">{formatCurrency(apuracao.is_a_pagar)}</span></div>
            </div>
          </div>

          {/* Residuais */}
          <div className="p-4 border rounded-lg bg-muted/30">
            <h4 className="font-semibold text-residual mb-3">Tributos Residuais (Transição)</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>ICMS Residual</span><span className="font-medium">{formatCurrency(apuracao.icms_residual)}</span></div>
              <div className="flex justify-between"><span>ISS Residual</span><span className="font-medium">{formatCurrency(apuracao.iss_residual)}</span></div>
              <div className="flex justify-between"><span>PIS Residual</span><span className="font-medium">{formatCurrency(apuracao.pis_residual)}</span></div>
              <div className="flex justify-between"><span>COFINS Residual</span><span className="font-medium">{formatCurrency(apuracao.cofins_residual)}</span></div>
              <div className="border-t pt-2 flex justify-between font-bold"><span>= Total Residuais</span><span>{formatCurrency(apuracao.total_tributos_residuais)}</span></div>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="mt-6 p-4 bg-primary/10 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-lg">Total a Recolher</h4>
              <p className="text-sm text-muted-foreground">Tributos novos + residuais</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">{formatCurrency(apuracao.total_geral)}</div>
              <div className="text-sm text-muted-foreground">
                Novos: {formatCurrency(apuracao.total_tributos_novos)} | Residuais: {formatCurrency(apuracao.total_tributos_residuais)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
