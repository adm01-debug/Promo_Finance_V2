// CALCULADORA DE TRIBUTOS IBS/CBS/IS
// Cálculo em tempo real para operações

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  Calculator, 
  AlertTriangle,
  Info,
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useReformaTributaria from '@/hooks/useReformaTributaria';
import { ResultadoTributos } from './ResultadoTributos';
import { 
  TipoOperacao, 
  RegimeEspecial, 
  CategoriaIS 
} from '@/types/reforma-tributaria';
import { DadosOperacao } from '@/lib/reforma-tributaria-calculator';

const UFS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 
  'SP', 'SE', 'TO'
];

export function CalculadoraTributos() {
  const { 
    anoReferencia, 
    calcularTributos, 
    regimesEspeciais, 
    impostosSeletivos,
    faseAtual,
  } = useReformaTributaria();

  // Estado do formulário
  const [valorOperacao, setValorOperacao] = useState<number>(10000);
  const [tipoOperacao, setTipoOperacao] = useState<TipoOperacao>('venda');
  const [ufOrigem, setUfOrigem] = useState('SP');
  const [ufDestino, setUfDestino] = useState('RJ');
  const [cfop, setCfop] = useState('5102');
  const [ncm, setNcm] = useState('');
  const [regimeEspecial, setRegimeEspecial] = useState<RegimeEspecial>('nenhum');
  const [categoriaIS, setCategoriaIS] = useState<CategoriaIS | undefined>();
  const [isExportacao, setIsExportacao] = useState(false);

  // Cálculo em tempo real
  const resultado = useMemo(() => {
    const dados: DadosOperacao = {
      valorOperacao,
      tipoOperacao,
      ufOrigem,
      ufDestino,
      cfop,
      ncm: ncm || undefined,
      regimeEspecial,
      categoriaIS,
      isExportacao,
    };
    return calcularTributos(dados);
  }, [valorOperacao, tipoOperacao, ufOrigem, ufDestino, cfop, ncm, regimeEspecial, categoriaIS, isExportacao, calcularTributos]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Formulário de Entrada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Dados da Operação
          </CardTitle>
          <CardDescription>
            Informe os dados para cálculo dos tributos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="valor">Valor da Operação (R$)</Label>
            <Input
              id="valor"
              type="number"
              value={valorOperacao}
              onChange={(e) => setValorOperacao(Number(e.target.value))}
              min={0}
              step={100}
            />
          </div>

          {/* Tipo de Operação */}
          <div className="space-y-2">
            <Label>Tipo de Operação</Label>
            <Select value={tipoOperacao} onValueChange={(v) => setTipoOperacao(v as TipoOperacao)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="venda">Venda de Mercadoria</SelectItem>
                <SelectItem value="compra">Compra de Mercadoria</SelectItem>
                <SelectItem value="servico_prestado">Serviço Prestado</SelectItem>
                <SelectItem value="servico_tomado">Serviço Tomado</SelectItem>
                <SelectItem value="importacao">Importação</SelectItem>
                <SelectItem value="exportacao">Exportação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* UF Origem e Destino */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>UF Origem</Label>
              <Select value={ufOrigem} onValueChange={setUfOrigem}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UFS_BRASIL.map((uf) => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>UF Destino</Label>
              <Select value={ufDestino} onValueChange={setUfDestino}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UFS_BRASIL.map((uf) => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* CFOP e NCM */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cfop">CFOP</Label>
              <Input
                id="cfop"
                value={cfop}
                onChange={(e) => setCfop(e.target.value)}
                maxLength={4}
                placeholder="5102"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ncm">NCM (opcional)</Label>
              <Input
                id="ncm"
                value={ncm}
                onChange={(e) => setNcm(e.target.value)}
                maxLength={8}
                placeholder="00000000"
              />
            </div>
          </div>

          <Separator />

          {/* Regime Especial */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Regime Especial</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>Regimes com alíquotas diferenciadas conforme LC 214/2025</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select 
              value={regimeEspecial} 
              onValueChange={(v) => setRegimeEspecial(v as RegimeEspecial)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione se aplicável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhum">Nenhum (alíquota padrão)</SelectItem>
                {regimesEspeciais.map((regime) => (
                  <SelectItem key={regime.regime} value={regime.regime}>
                    {regime.descricao} ({regime.reducaoAliquotaCBS}% redução)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Imposto Seletivo */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Imposto Seletivo (IS)</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertTriangle className="h-4 w-4 text-imposto-seletivo" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>Incide sobre produtos nocivos à saúde ou meio ambiente</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Select 
              value={categoriaIS || 'nenhum'} 
              onValueChange={(v) => setCategoriaIS(v === 'nenhum' ? undefined : v as CategoriaIS)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione se aplicável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhum">Não incide IS</SelectItem>
                {impostosSeletivos.map((is) => (
                  <SelectItem key={is.categoria} value={is.categoria}>
                    {is.descricao} ({is.aliquotaBase}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Exportação */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Operação de Exportação</Label>
              <p className="text-xs text-muted-foreground">Imunidade tributária</p>
            </div>
            <Switch checked={isExportacao} onCheckedChange={setIsExportacao} />
          </div>
        </CardContent>
      </Card>

      {/* Resultado do Cálculo */}
      <ResultadoTributos resultado={resultado} anoReferencia={anoReferencia} faseAtual={faseAtual} />
    </div>
  );
}

export default CalculadoraTributos;
