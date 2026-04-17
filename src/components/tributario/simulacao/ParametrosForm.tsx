// ============================================
// COMPONENTE: Formulário de Parâmetros da Simulação
// Extraído de SimulacaoRegimes.tsx (modularização)
// ============================================

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ParametrosSimulacao, RegimeTributario } from '@/lib/tributario';

interface EmpresaOption {
  id: string;
  razao_social: string;
}

interface Props {
  empresas: EmpresaOption[];
  empresaId?: string;
  setEmpresaId: (id: string) => void;
  regimeAtual?: RegimeTributario;
  setRegimeAtual: (r: RegimeTributario) => void;
  parametros: ParametrosSimulacao;
  setParametros: (p: ParametrosSimulacao) => void;
  temHistoricoSuficiente: boolean;
}

export function ParametrosForm({
  empresas,
  empresaId,
  setEmpresaId,
  regimeAtual,
  setRegimeAtual,
  parametros,
  setParametros,
  temHistoricoSuficiente,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Parâmetros</CardTitle>
        <CardDescription>Empresa e dados financeiros</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Empresa</Label>
          <Select value={empresaId} onValueChange={setEmpresaId}>
            <SelectTrigger aria-label="Selecionar empresa para simulação">
              <SelectValue placeholder="Selecionar empresa" />
            </SelectTrigger>
            <SelectContent>
              {empresas.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.razao_social}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {empresaId && !temHistoricoSuficiente && (
            <p className="text-xs text-warning" role="status">
              ⚠️ Sem 12 meses de histórico — usando estimativa.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Regime Atual (opcional)</Label>
          <Select value={regimeAtual} onValueChange={(v) => setRegimeAtual(v as RegimeTributario)}>
            <SelectTrigger aria-label="Selecionar regime tributário atual">
              <SelectValue placeholder="Selecionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
              <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
              <SelectItem value="lucro_real">Lucro Real</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="faturamento-anual">Faturamento Anual</Label>
          <Input
            id="faturamento-anual"
            type="number"
            value={parametros.faturamentoAnual}
            onChange={(e) => setParametros({ ...parametros, faturamentoAnual: Number(e.target.value) })}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="margem">Margem (%)</Label>
            <Input
              id="margem"
              type="number"
              value={parametros.margemLucro}
              onChange={(e) => setParametros({ ...parametros, margemLucro: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="perc-servicos">% Serviços</Label>
            <Input
              id="perc-servicos"
              type="number"
              value={parametros.percentualServicos}
              onChange={(e) => setParametros({ ...parametros, percentualServicos: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="folha-anual">Folha Anual</Label>
          <Input
            id="folha-anual"
            type="number"
            value={parametros.folhaAnual || 0}
            onChange={(e) => setParametros({ ...parametros, folhaAnual: Number(e.target.value) })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="compras-credito">Compras com Crédito (PIS/COFINS/ICMS)</Label>
          <Input
            id="compras-credito"
            type="number"
            value={parametros.comprasComCredito || 0}
            onChange={(e) => setParametros({ ...parametros, comprasComCredito: Number(e.target.value) })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="despesas-op">Despesas Operacionais</Label>
          <Input
            id="despesas-op"
            type="number"
            value={parametros.despesasOperacionais || 0}
            onChange={(e) => setParametros({ ...parametros, despesasOperacionais: Number(e.target.value) })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
