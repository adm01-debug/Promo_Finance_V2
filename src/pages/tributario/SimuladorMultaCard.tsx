import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Info } from 'lucide-react';
import { OBRIGACOES } from '@/lib/tributario/obrigacoes';
import { brl, num } from './obrigacoes-helpers';

export interface MultaSimulada {
  diasAtraso: number;
  mesesAtraso: number;
  percentual: number;
  valorDevido: number;
  aplicouPiso?: boolean;
  aplicouTeto?: boolean;
}

interface Props {
  multaObrigacao: string;
  setMultaObrigacao: (v: string) => void;
  multaPrazo: string;
  setMultaPrazo: (v: string) => void;
  multaEntrega: string;
  setMultaEntrega: (v: string) => void;
  setMultaBase: (v: number) => void;
  multa: MultaSimulada | null;
}

export function SimuladorMultaCard({
  multaObrigacao,
  setMultaObrigacao,
  multaPrazo,
  setMultaPrazo,
  multaEntrega,
  setMultaEntrega,
  setMultaBase,
  multa,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Simulador de multa por entrega em atraso</CardTitle>
        <CardDescription>
          Multa por mês-calendário ou fração, com piso e teto por obrigação (MP 2.158-35/2001, art.
          57).
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="multa-obrigacao">Obrigação</Label>
            <Select value={multaObrigacao} onValueChange={setMultaObrigacao}>
              <SelectTrigger id="multa-obrigacao">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OBRIGACOES.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="multa-prazo">Prazo legal</Label>
              <Input
                id="multa-prazo"
                type="date"
                value={multaPrazo}
                onChange={(e) => setMultaPrazo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="multa-entrega">Data de entrega</Label>
              <Input
                id="multa-entrega"
                type="date"
                value={multaEntrega}
                onChange={(e) => setMultaEntrega(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="multa-base">Base de cálculo (faturamento ou tributos declarados)</Label>
            <Input
              id="multa-base"
              inputMode="decimal"
              defaultValue="0"
              onChange={(e) => setMultaBase(num(e.target.value))}
            />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          {multa ? (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Dias em atraso</dt>
                <dd className="tabular-nums text-foreground">{multa.diasAtraso}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Meses (ou fração)</dt>
                <dd className="tabular-nums text-foreground">{multa.mesesAtraso}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Percentual aplicado</dt>
                <dd className="tabular-nums text-foreground">
                  {(multa.percentual * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <dt className="font-medium text-foreground">Multa devida</dt>
                <dd className="font-semibold tabular-nums text-foreground">
                  {brl(multa.valorDevido)}
                </dd>
              </div>
              {(multa.aplicouPiso || multa.aplicouTeto) && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {multa.aplicouTeto ? 'Teto percentual atingido. ' : ''}
                    {multa.aplicouPiso ? 'Valor ajustado ao piso legal da obrigação.' : ''}
                  </AlertDescription>
                </Alert>
              )}
            </dl>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>Preencha datas válidas para simular a multa.</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
