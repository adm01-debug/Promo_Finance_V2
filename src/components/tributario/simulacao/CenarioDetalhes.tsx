// ============================================
// COMPONENTE: Detalhes do Cenário Tributário
// Extraído de SimulacaoRegimes.tsx (modularização)
// ============================================

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import type { ResultadoCenario } from '@/lib/tributario';

export function CenarioDetalhes({ cenario }: { cenario: ResultadoCenario }) {
  if (!cenario.elegivel) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Regime não elegível</AlertTitle>
            <AlertDescription>{cenario.motivoInelegibilidade}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const linhas = [
    { label: 'IRPJ', valor: cenario.irpj },
    { label: 'CSLL', valor: cenario.csll },
    { label: 'PIS', valor: cenario.pis },
    { label: 'COFINS', valor: cenario.cofins },
    { label: 'CPP (INSS)', valor: cenario.cpp },
    { label: 'ICMS', valor: cenario.icms },
    { label: 'ISS', valor: cenario.iss },
  ].filter((l) => l.valor > 0);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {linhas.map((l) => (
            <div key={l.label} className="p-3 rounded bg-muted/50">
              <p className="text-xs text-muted-foreground">{l.label}</p>
              <p className="text-lg font-semibold">{formatCurrency(l.valor)}</p>
            </div>
          ))}
          <div className="p-3 rounded bg-primary/10 sm:col-span-2">
            <p className="text-xs text-muted-foreground">Total Anual</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(cenario.totalTributos)}</p>
            <p className="text-xs">Carga efetiva: {cenario.cargaEfetiva.toFixed(2)}%</p>
          </div>
        </div>

        {(cenario.anexoAplicavel || cenario.faixaAplicavel) && (
          <div className="flex gap-2 flex-wrap">
            {cenario.anexoAplicavel && <Badge variant="outline">Anexo {cenario.anexoAplicavel}</Badge>}
            {cenario.faixaAplicavel && <Badge variant="outline">Faixa {cenario.faixaAplicavel}</Badge>}
            {cenario.fatorR !== undefined && (
              <Badge variant="outline">Fator R: {(cenario.fatorR * 100).toFixed(2)}%</Badge>
            )}
            {cenario.aliquotaNominal !== undefined && (
              <Badge variant="outline">Alíq. nominal: {cenario.aliquotaNominal.toFixed(2)}%</Badge>
            )}
          </div>
        )}

        {cenario.observacoes.length > 0 && (
          <div className="text-sm space-y-1 p-3 rounded bg-muted/30">
            <p className="font-medium">Observações:</p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              {cenario.observacoes.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
