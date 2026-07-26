import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { RegimeAplicavel } from '@/lib/tributario/elisao';

interface EmpresaOption {
  id: string;
  razao_social: string;
}

interface ContextoFormProps {
  empresas: EmpresaOption[];
  empresaId: string | undefined;
  setEmpresaId: (v: string) => void;
  regimeAtual: RegimeAplicavel;
  setRegimeAtual: (v: RegimeAplicavel) => void;
  pl: number; setPl: (v: number) => void;
  lucro: number; setLucro: (v: number) => void;
  importacao: number; setImportacao: (v: number) => void;
  pd: number; setPd: (v: number) => void;
  beneficioIcms: number; setBeneficioIcms: (v: number) => void;
  dividendos: number; setDividendos: (v: number) => void;
  uf: string; setUf: (v: string) => void;
  lucrosAcumulados: number; setLucrosAcumulados: (v: number) => void;
  creditosPisCofins: number; setCreditosPisCofins: (v: number) => void;
  investimentoMaquinas: number; setInvestimentoMaquinas: (v: number) => void;
}

/** UFs disponíveis para seleção da unidade principal. */
const UFS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI',
  'PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO',
] as const;

export function ContextoForm(props: ContextoFormProps) {
  const {
    empresas, empresaId, setEmpresaId, regimeAtual, setRegimeAtual,
    pl, setPl, lucro, setLucro, importacao, setImportacao,
    pd, setPd, beneficioIcms, setBeneficioIcms, dividendos, setDividendos,
    uf, setUf, lucrosAcumulados, setLucrosAcumulados,
    creditosPisCofins, setCreditosPisCofins,
    investimentoMaquinas, setInvestimentoMaquinas,
  } = props;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Contexto da empresa</CardTitle>
        <CardDescription>
          Empresa e variáveis usadas pelo motor para detectar oportunidades aplicáveis.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Empresa</Label>
          <Select value={empresaId} onValueChange={setEmpresaId}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {empresas.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.razao_social}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Regime atual</Label>
          <Select value={regimeAtual} onValueChange={(v) => setRegimeAtual(v as RegimeAplicavel)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="simples">Simples Nacional</SelectItem>
              <SelectItem value="presumido">Lucro Presumido</SelectItem>
              <SelectItem value="real">Lucro Real</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Patrimônio Líquido (R$)</Label>
          <Input type="number" value={pl} onChange={(e) => setPl(Number(e.target.value))} />
        </div>
        <div>
          <Label>Lucro Líquido anual (R$)</Label>
          <Input type="number" value={lucro} onChange={(e) => setLucro(Number(e.target.value))} />
        </div>
        <div>
          <Label>Importação anual (R$)</Label>
          <Input type="number" value={importacao} onChange={(e) => setImportacao(Number(e.target.value))} />
        </div>
        <div>
          <Label>Despesas P&D (R$)</Label>
          <Input type="number" value={pd} onChange={(e) => setPd(Number(e.target.value))} />
        </div>
        <div>
          <Label>Benefício ICMS anual (R$)</Label>
          <Input type="number" value={beneficioIcms} onChange={(e) => setBeneficioIcms(Number(e.target.value))} />
        </div>
        <div>
          <Label>Dividendos PF anuais (R$)</Label>
          <Input type="number" value={dividendos} onChange={(e) => setDividendos(Number(e.target.value))} />
        </div>
        <div>
          <Label htmlFor="elisao-uf">UF da unidade principal</Label>
          <Select value={uf} onValueChange={setUf}>
            <SelectTrigger id="elisao-uf"><SelectValue placeholder="Selecione a UF" /></SelectTrigger>
            <SelectContent>
              {UFS.map((sigla) => (
                <SelectItem key={sigla} value={sigla}>{sigla}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="elisao-lucros-acumulados">Lucros acumulados até 2025 (R$)</Label>
          <Input
            id="elisao-lucros-acumulados"
            type="number"
            min={0}
            value={lucrosAcumulados}
            onChange={(e) => setLucrosAcumulados(Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="elisao-creditos-pis">Créditos PIS/COFINS não aproveitados (R$/ano)</Label>
          <Input
            id="elisao-creditos-pis"
            type="number"
            min={0}
            value={creditosPisCofins}
            onChange={(e) => setCreditosPisCofins(Number(e.target.value))}
          />
        </div>
        <div>
          <Label htmlFor="elisao-investimento-maquinas">Investimento em máquinas novas (R$/ano)</Label>
          <Input
            id="elisao-investimento-maquinas"
            type="number"
            min={0}
            value={investimentoMaquinas}
            onChange={(e) => setInvestimentoMaquinas(Number(e.target.value))}
          />
        </div>
      </CardContent>
    </Card>
  );
}
