// ============================================
// CALCULADORA DE TRIBUTOS IBS/CBS/IS
// Cálculo em tempo real para operações
// ============================================

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  Calculator, 
  Receipt, 
  Landmark, 
  AlertTriangle,
  ArrowRight,
  FileText,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useReformaTributaria from '@/hooks/useReformaTributaria';
import { formatCurrency } from '@/lib/formatters';
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
    aliquotasAtuais,
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
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
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
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resultado do Cálculo
            </CardTitle>
            <CardDescription>
              Tributos calculados para {anoReferencia} - Fase: {faseAtual.replace('_', ' ')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {resultado.detalhamento.some(d => d.includes('isenta')) ? (
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Operação Isenta</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {resultado.detalhamento.find(d => d.includes('isenta'))}
                </p>
              </div>
            ) : (
              <>
                {/* Tributos Novos */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Tributos Novos (IBS/CBS)
                  </h4>
                  
                  <div className="flex items-center justify-between p-3 bg-cbs/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-cbs" />
                      <span>CBS (Federal)</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-cbs">{formatCurrency(resultado.valorCBS)}</p>
                      <p className="text-xs text-muted-foreground">{resultado.aliquotaCBS.toFixed(2)}%</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-ibs/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-ibs" />
                      <span>IBS (Est/Mun)</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-ibs">{formatCurrency(resultado.valorIBS)}</p>
                      <p className="text-xs text-muted-foreground">{resultado.aliquotaIBS.toFixed(2)}%</p>
                    </div>
                  </div>

                  {resultado.valorIS > 0 && (
                    <div className="flex items-center justify-between p-3 bg-imposto-seletivo/10 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-imposto-seletivo" />
                        <span>IS (Seletivo)</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-imposto-seletivo">{formatCurrency(resultado.valorIS)}</p>
                        <p className="text-xs text-muted-foreground">{resultado.aliquotaIS.toFixed(2)}%</p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Tributos Residuais */}
                {resultado.totalTributosAntigos > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                      Tributos Residuais (Transição)
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {resultado.icmsResidual > 0 && (
                        <div className="flex justify-between p-2 bg-muted/50 rounded">
                          <span className="text-muted-foreground">ICMS</span>
                          <span>{formatCurrency(resultado.icmsResidual)}</span>
                        </div>
                      )}
                      {resultado.issResidual > 0 && (
                        <div className="flex justify-between p-2 bg-muted/50 rounded">
                          <span className="text-muted-foreground">ISS</span>
                          <span>{formatCurrency(resultado.issResidual)}</span>
                        </div>
                      )}
                      {resultado.pisResidual > 0 && (
                        <div className="flex justify-between p-2 bg-muted/50 rounded">
                          <span className="text-muted-foreground">PIS</span>
                          <span>{formatCurrency(resultado.pisResidual)}</span>
                        </div>
                      )}
                      {resultado.cofinsResidual > 0 && (
                        <div className="flex justify-between p-2 bg-muted/50 rounded">
                          <span className="text-muted-foreground">COFINS</span>
                          <span>{formatCurrency(resultado.cofinsResidual)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Totais */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base de Cálculo</span>
                    <span className="font-semibold">{formatCurrency(resultado.valorBase)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Tributos Novos</span>
                    <span className="font-semibold">{formatCurrency(resultado.totalTributosNovos)}</span>
                  </div>
                  {resultado.totalTributosAntigos > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Tributos Antigos</span>
                      <span className="font-semibold">{formatCurrency(resultado.totalTributosAntigos)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg">
                    <span className="font-medium">Carga Tributária Total</span>
                    <span className="font-bold text-primary">
                      {formatCurrency(resultado.totalTributosNovos + resultado.totalTributosAntigos)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Alíquota Efetiva</span>
                    <Badge variant="secondary">
                      {resultado.cargaTributariaPercentual.toFixed(2)}%
                    </Badge>
                  </div>
                </div>

                {/* Split Payment */}
                {resultado.valorTotalSplitPayment > 0 && (
                  <>
                    <Separator />
                    <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                        <ArrowRight className="h-4 w-4" />
                        Split Payment (Retenção Automática)
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">CBS Retido</span>
                          <span>{formatCurrency(resultado.valorSplitPaymentCBS)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IBS Retido</span>
                          <span>{formatCurrency(resultado.valorSplitPaymentIBS)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between mt-2 pt-2 border-t">
                        <span className="font-medium">Valor Líquido a Receber</span>
                        <span className="font-bold text-purple-600">
                          {formatCurrency(resultado.valorBase - resultado.valorTotalSplitPayment)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Detalhamento */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Detalhamento do Cálculo</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {resultado.detalhamento.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default CalculadoraTributos;
