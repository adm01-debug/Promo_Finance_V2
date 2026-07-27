// COMPONENTE: Formulário de Parâmetros da Simulação
// Extraído de SimulacaoRegimes.tsx (modularização)

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useResolucaoCnae } from '@/hooks/useCnaes';
import { CnaeCatalogoInfo } from '@/components/empresas/CnaeCatalogoInfo';
import { resolverFpasPorCnae } from '@/lib/tributario/folha/fpas-terceiros';
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
  /** Valida o CNAE informado contra o catálogo fiscal interno. */
  const resolucaoCnae = useResolucaoCnae(parametros.cnaePrincipal ?? null);

  /**
   * Derivação de encargos patronais a partir do CNAE.
   *
   * FPAS/Terceiros vêm da tabela de enquadramento; o RAT só é sobrescrito
   * quando o código consta do catálogo — caso contrário mantemos o valor
   * atual em vez de degradar em silêncio para o piso de 1%.
   */
  const handleCnaeChange = (valor: string) => {
    const digitos = valor.replace(/\D/g, '');
    const fpas = digitos.length >= 2 ? resolverFpasPorCnae(digitos) : null;
    setParametros({
      ...parametros,
      cnaePrincipal: valor,
      ...(fpas ? { aliquotaTerceiros: fpas.aliquotaTerceiros } : {}),
    });
  };

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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="perc-industria">% Indústria (Anexo II)</Label>
            <Input
              id="perc-industria"
              type="number"
              value={parametros.percentualIndustria || 0}
              onChange={(e) => setParametros({ ...parametros, percentualIndustria: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="perc-revenda">% Revenda (Anexo I)</Label>
            <Input
              id="perc-revenda"
              type="number"
              value={parametros.percentualRevenda ?? Math.max(0, 100 - (parametros.percentualServicos || 0) - (parametros.percentualIndustria || 0))}
              onChange={(e) => setParametros({ ...parametros, percentualRevenda: Number(e.target.value) })}
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="aliq-icms">Alíquota ICMS (%)</Label>
            <Input
              id="aliq-icms"
              type="number"
              step="0.01"
              value={((parametros.aliquotaICMS ?? 0.18) * 100).toFixed(2)}
              onChange={(e) =>
                setParametros({ ...parametros, aliquotaICMS: Math.max(0, Number(e.target.value)) / 100 })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aliq-iss">Alíquota ISS (%)</Label>
            <Input
              id="aliq-iss"
              type="number"
              step="0.01"
              value={((parametros.aliquotaISS ?? 0.05) * 100).toFixed(2)}
              onChange={(e) =>
                setParametros({ ...parametros, aliquotaISS: Math.max(0, Number(e.target.value)) / 100 })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sublimite">Sublimite Estadual (R$)</Label>
            <Input
              id="sublimite"
              type="number"
              value={parametros.sublimiteEstadual ?? 3600000}
              onChange={(e) =>
                setParametros({ ...parametros, sublimiteEstadual: Math.max(0, Number(e.target.value)) })
              }
            />
            <p className="text-xs text-muted-foreground">
              Acima do sublimite, ICMS e ISS saem do DAS (LC 123/2006, arts. 19 e 20).
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="iss-retido">ISS Retido na Fonte (R$/ano)</Label>
            <Input
              id="iss-retido"
              type="number"
              value={parametros.issRetidoFonte || 0}
              onChange={(e) =>
                setParametros({ ...parametros, issRetidoFonte: Math.max(0, Number(e.target.value)) })
              }
            />
            <p className="text-xs text-muted-foreground">
              Deduzido da parcela de ISS do DAS, limitado ao valor devido.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="aliquota-rat">Alíquota RAT/FAP (%)</Label>
            <Input
              id="aliquota-rat"
              type="number"
              step="0.1"
              value={((parametros.aliquotaRAT ?? 0.02) * 100).toFixed(2)}
              onChange={(e) =>
                setParametros({
                  ...parametros,
                  aliquotaRAT: Math.min(6, Math.max(0, Number(e.target.value))) / 100,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Compõe a CPP patronal (20% + RAT) recolhida fora do DAS no Anexo IV
              e a folha em Presumido/Real.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnae-principal">CNAE principal</Label>
            <Input
              id="cnae-principal"
              type="text"
              placeholder="Ex.: 47.11-3/02"
              value={parametros.cnaePrincipal ?? ''}
              onChange={(e) => handleCnaeChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Define automaticamente o FPAS, a alíquota de terceiros e o RAT quando
              o código consta do catálogo fiscal.
            </p>
            <CnaeCatalogoInfo
              resolucao={resolucaoCnae}
              digitos={(parametros.cnaePrincipal ?? '').replace(/\D/g, '').length}
            />
          </div>


          <div className="space-y-2">

            <Label htmlFor="aliquota-terceiros">Terceiros / Sistema S (%)</Label>
            <Input
              id="aliquota-terceiros"
              type="number"
              step="0.1"
              value={((parametros.aliquotaTerceiros ?? 0.058) * 100).toFixed(2)}
              onChange={(e) =>
                setParametros({
                  ...parametros,
                  aliquotaTerceiros: Math.min(8, Math.max(0, Number(e.target.value))) / 100,
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              INCRA, SEBRAE, Salário-Educação e Sistema S (padrão 5,8% — FPAS 507).
              Não se aplica ao Simples Nacional.
            </p>
          </div>

        </div>


      </CardContent>
    </Card>
  );
}
