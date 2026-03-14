// ============================================
// COMPONENTE: MÓDULO IRPJ/CSLL LUCRO REAL
// Apuração trimestral/anual completa
// ============================================

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Calculator, Calendar, Plus, FileText, TrendingDown, DollarSign, AlertTriangle, CheckCircle2, Send } from 'lucide-react';
import { useIRPJCSLL } from '@/hooks/useIRPJCSLL';
import { useAllEmpresas } from '@/hooks/useEmpresas';
import { formatCurrency } from '@/lib/formatters';

const trimestres = ['1º Trimestre', '2º Trimestre', '3º Trimestre', '4º Trimestre'];

export function ModuloIRPJCSLL() {
  const { data: empresas } = useAllEmpresas();
  const empresaId = empresas?.[0]?.id;
  
  const {
    apuracoes,
    prejuizos,
    saldoPrejuizos,
    isLoading,
    criarApuracao,
    calcularApuracao,
    ALIQUOTA_IRPJ,
    ALIQUOTA_CSLL,
    LIMITE_ADICIONAL_MES,
  } = useIRPJCSLL(empresaId);

  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [dialogAberto, setDialogAberto] = useState(false);
  const [novaApuracao, setNovaApuracao] = useState({
    tipo: 'trimestral' as 'trimestral' | 'anual',
    ano: new Date().getFullYear(),
    trimestre: 1,
  });

  // Form de cálculo
  const [formCalculo, setFormCalculo] = useState({
    apuracaoId: '',
    lucroContabil: 0,
    adicoesPermanentes: 0,
    adicoesTemporarias: 0,
    exclusoesPermanentes: 0,
    exclusoesTemporarias: 0,
  });

  // Apurações do ano
  const apuracoesAno = useMemo(() => {
    if (!apuracoes) return [];
    return apuracoes.filter(a => a.ano === anoSelecionado);
  }, [apuracoes, anoSelecionado]);

  // Totais do ano
  const totaisAno = useMemo(() => {
    return apuracoesAno.reduce((acc, ap) => ({
      irpj: acc.irpj + Number(ap.irpj_total),
      csll: acc.csll + Number(ap.csll_total),
      total: acc.total + Number(ap.total_tributos),
    }), { irpj: 0, csll: 0, total: 0 });
  }, [apuracoesAno]);

  const handleCriarApuracao = async () => {
    if (!empresaId) return;
    await criarApuracao.mutateAsync({
      empresa_id: empresaId,
      tipo_apuracao: novaApuracao.tipo,
      ano: novaApuracao.ano,
      trimestre: novaApuracao.tipo === 'trimestral' ? novaApuracao.trimestre : undefined,
    });
    setDialogAberto(false);
  };

  const handleCalcular = async () => {
    if (!formCalculo.apuracaoId) return;
    await calcularApuracao.mutateAsync({
      id: formCalculo.apuracaoId,
      lucroContabil: formCalculo.lucroContabil,
      adicoes: {
        permanentes: formCalculo.adicoesPermanentes,
        temporarias: formCalculo.adicoesTemporarias,
      },
      exclusoes: {
        permanentes: formCalculo.exclusoesPermanentes,
        temporarias: formCalculo.exclusoesTemporarias,
      },
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, JSX.Element> = {
      rascunho: <Badge variant="outline">Rascunho</Badge>,
      calculado: <Badge variant="secondary">Calculado</Badge>,
      revisado: <Badge className="bg-primary">Revisado</Badge>,
      transmitido: <Badge className="bg-success">Transmitido</Badge>,
      retificado: <Badge className="bg-warning text-warning-foreground">Retificado</Badge>,
    };
    return badges[status] || <Badge variant="outline">{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-8 w-32" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            IRPJ/CSLL - Lucro Real
          </h3>
          <p className="text-sm text-muted-foreground">
            Apuração trimestral e anual com LALUR
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={String(anoSelecionado)} onValueChange={v => setAnoSelecionado(Number(v))}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025, 2026].map(a => (
                <SelectItem key={a} value={String(a)}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nova Apuração</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Apuração IRPJ/CSLL</DialogTitle>
                <DialogDescription>Selecione o tipo e período</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label>Tipo de Apuração</Label>
                  <Select value={novaApuracao.tipo} onValueChange={(v: 'trimestral' | 'anual') => setNovaApuracao(p => ({ ...p, tipo: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="anual">Anual (Balanço de Redução)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Ano</Label>
                    <Select value={String(novaApuracao.ano)} onValueChange={v => setNovaApuracao(p => ({ ...p, ano: Number(v) }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[2023, 2024, 2025, 2026].map(a => (
                          <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {novaApuracao.tipo === 'trimestral' && (
                    <div>
                      <Label>Trimestre</Label>
                      <Select value={String(novaApuracao.trimestre)} onValueChange={v => setNovaApuracao(p => ({ ...p, trimestre: Number(v) }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4].map(t => (
                            <SelectItem key={t} value={String(t)}>{t}º Trimestre</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogAberto(false)}>Cancelar</Button>
                <Button onClick={handleCriarApuracao} disabled={criarApuracao.isPending}>Criar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">IRPJ Total</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totaisAno.irpj)}</div>
            <p className="text-xs text-muted-foreground">Alíquota: {(ALIQUOTA_IRPJ * 100).toFixed(0)}% + {10}% adicional</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">CSLL Total</CardTitle>
            <FileText className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totaisAno.csll)}</div>
            <p className="text-xs text-muted-foreground">Alíquota: {(ALIQUOTA_CSLL * 100).toFixed(0)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tributos</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totaisAno.total)}</div>
            <p className="text-xs text-muted-foreground">{apuracoesAno.length} apurações</p>
          </CardContent>
        </Card>

        <Card className="border-warning/20 bg-warning/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Prejuízos Fiscais</CardTitle>
            <TrendingDown className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {formatCurrency(saldoPrejuizos.irpj + saldoPrejuizos.csll)}
            </div>
            <p className="text-xs text-muted-foreground">
              IRPJ: {formatCurrency(saldoPrejuizos.irpj)} | CSLL: {formatCurrency(saldoPrejuizos.csll)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="apuracoes">
        <TabsList>
          <TabsTrigger value="apuracoes">Apurações</TabsTrigger>
          <TabsTrigger value="calcular">Calcular</TabsTrigger>
          <TabsTrigger value="lalur">LALUR</TabsTrigger>
        </TabsList>

        {/* Lista de Apurações */}
        <TabsContent value="apuracoes">
          <Card>
            <CardHeader>
              <CardTitle>Apurações {anoSelecionado}</CardTitle>
            </CardHeader>
            <CardContent>
              {apuracoesAno.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Período</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Lucro Real</TableHead>
                      <TableHead className="text-right">IRPJ</TableHead>
                      <TableHead className="text-right">CSLL</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apuracoesAno.map(ap => (
                      <TableRow key={ap.id}>
                        <TableCell>
                          {ap.tipo_apuracao === 'trimestral' 
                            ? `${ap.trimestre}º Trim/${ap.ano}`
                            : `Anual ${ap.ano}`}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{ap.tipo_apuracao}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(ap.lucro_real)}</TableCell>
                        <TableCell className="text-right text-primary">{formatCurrency(ap.irpj_total)}</TableCell>
                        <TableCell className="text-right text-success">{formatCurrency(ap.csll_total)}</TableCell>
                        <TableCell className="text-right font-bold">{formatCurrency(ap.total_tributos)}</TableCell>
                        <TableCell>{getStatusBadge(ap.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma apuração para {anoSelecionado}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calculadora */}
        <TabsContent value="calcular">
          <Card>
            <CardHeader>
              <CardTitle>Calcular IRPJ/CSLL</CardTitle>
              <CardDescription>Informe o lucro contábil e ajustes do LALUR</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Selecione a Apuração</Label>
                <Select value={formCalculo.apuracaoId} onValueChange={v => setFormCalculo(p => ({ ...p, apuracaoId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {apuracoesAno.filter(a => a.status === 'rascunho').map(ap => (
                      <SelectItem key={ap.id} value={ap.id}>
                        {ap.tipo_apuracao === 'trimestral' ? `${ap.trimestre}º Trim/${ap.ano}` : `Anual ${ap.ano}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Lucro Contábil</h4>
                  <Input
                    type="number"
                    value={formCalculo.lucroContabil}
                    onChange={e => setFormCalculo(p => ({ ...p, lucroContabil: Number(e.target.value) }))}
                    placeholder="0,00"
                  />
                </div>

                <div className="p-4 border rounded-lg border-success/20 bg-success/5">
                  <h4 className="font-medium mb-3 text-success">Adições</h4>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Permanentes</Label>
                      <Input
                        type="number"
                        value={formCalculo.adicoesPermanentes}
                        onChange={e => setFormCalculo(p => ({ ...p, adicoesPermanentes: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Temporárias</Label>
                      <Input
                        type="number"
                        value={formCalculo.adicoesTemporarias}
                        onChange={e => setFormCalculo(p => ({ ...p, adicoesTemporarias: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg border-red-200 bg-red-50/50">
                  <h4 className="font-medium mb-3 text-red-700">Exclusões</h4>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Permanentes</Label>
                      <Input
                        type="number"
                        value={formCalculo.exclusoesPermanentes}
                        onChange={e => setFormCalculo(p => ({ ...p, exclusoesPermanentes: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Temporárias</Label>
                      <Input
                        type="number"
                        value={formCalculo.exclusoesTemporarias}
                        onChange={e => setFormCalculo(p => ({ ...p, exclusoesTemporarias: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-muted/30">
                  <h4 className="font-medium mb-3">Prejuízos Compensáveis</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>IRPJ:</span>
                      <span className="font-medium">{formatCurrency(saldoPrejuizos.irpj)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CSLL:</span>
                      <span className="font-medium">{formatCurrency(saldoPrejuizos.csll)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Limite de compensação: 30% do lucro real
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={handleCalcular} disabled={!formCalculo.apuracaoId || calcularApuracao.isPending} className="w-full">
                <Calculator className="h-4 w-4 mr-2" />
                {calcularApuracao.isPending ? 'Calculando...' : 'Calcular IRPJ/CSLL'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LALUR */}
        <TabsContent value="lalur">
          <Card>
            <CardHeader>
              <CardTitle>LALUR - Livro de Apuração do Lucro Real</CardTitle>
              <CardDescription>Parte A (Ajustes) e Parte B (Controle)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Parte A - Ajustes do Lucro Líquido
                  </h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• Adições permanentes (despesas indedutíveis)</li>
                    <li>• Adições temporárias (diferenças temporárias)</li>
                    <li>• Exclusões permanentes (receitas não tributáveis)</li>
                    <li>• Exclusões temporárias (realizações Parte B)</li>
                    <li>• Compensação de prejuízos fiscais</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Parte B - Controle de Valores
                  </h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• Saldo de prejuízos fiscais a compensar</li>
                    <li>• Adições temporárias a realizar</li>
                    <li>• Exclusões temporárias a realizar</li>
                    <li>• Depreciação acelerada incentivada</li>
                    <li>• Outros valores controlados</li>
                  </ul>
                </div>
              </div>

              {/* Lista de Prejuízos */}
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Prejuízos Fiscais Acumulados</h4>
                {prejuizos && prejuizos.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead className="text-right">Valor Original</TableHead>
                        <TableHead className="text-right">Compensado</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prejuizos.map(p => (
                        <TableRow key={p.id}>
                          <TableCell><Badge variant="outline">{p.tipo}</Badge></TableCell>
                          <TableCell>{p.trimestre_origem ? `${p.trimestre_origem}T/${p.ano_origem}` : p.ano_origem}</TableCell>
                          <TableCell className="text-right">{formatCurrency(p.valor_original)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{formatCurrency(p.valor_compensado)}</TableCell>
                          <TableCell className="text-right font-medium text-orange-600">{formatCurrency(p.saldo_disponivel)}</TableCell>
                          <TableCell><Badge variant="secondary">{p.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum prejuízo fiscal registrado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ModuloIRPJCSLL;
