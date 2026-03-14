// ============================================
// COMPONENTE: APURAÇÃO TRIBUTÁRIA MENSAL
// Gestão de apurações CBS/IBS/IS
// ============================================

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Calculator,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Plus,
  RefreshCw,
  Send,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useApuracoesTributarias, ApuracaoTributaria } from '@/hooks/useApuracoesTributarias';
import { useAllEmpresas } from '@/hooks/useEmpresas';
import { formatCurrency } from '@/lib/formatters';

const meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function ApuracaoMensal() {
  const { data: empresas } = useAllEmpresas();
  const empresaId = empresas?.[0]?.id;
  
  const {
    apuracoes,
    isLoading,
    criarApuracao,
    calcularApuracao,
    transmitirApuracao,
  } = useApuracoesTributarias(empresaId);

  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState<number | null>(null);
  const [dialogNovaApuracao, setDialogNovaApuracao] = useState(false);
  const [novoMes, setNovoMes] = useState(new Date().getMonth() + 1);
  const [novoAno, setNovoAno] = useState(new Date().getFullYear());

  // Apuração selecionada
  const apuracaoAtual = useMemo(() => {
    if (!apuracoes || mesSelecionado === null) return null;
    return apuracoes.find(a => a.ano === anoSelecionado && a.mes === mesSelecionado);
  }, [apuracoes, anoSelecionado, mesSelecionado]);

  // Apurações do ano
  const apuracoesAno = useMemo(() => {
    if (!apuracoes) return [];
    return apuracoes.filter(a => a.ano === anoSelecionado).sort((a, b) => a.mes - b.mes);
  }, [apuracoes, anoSelecionado]);

  // Totais do ano
  const totaisAno = useMemo(() => {
    return apuracoesAno.reduce((acc, ap) => ({
      cbs: acc.cbs + Number(ap.cbs_a_pagar),
      ibs: acc.ibs + Number(ap.ibs_a_pagar),
      is: acc.is + Number(ap.is_a_pagar),
      residuais: acc.residuais + Number(ap.icms_residual) + Number(ap.iss_residual) + 
                 Number(ap.pis_residual) + Number(ap.cofins_residual),
      total: acc.total + Number(ap.total_geral),
    }), { cbs: 0, ibs: 0, is: 0, residuais: 0, total: 0 });
  }, [apuracoesAno]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'rascunho':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Rascunho</Badge>;
      case 'calculado':
        return <Badge variant="secondary"><Calculator className="h-3 w-3 mr-1" />Calculado</Badge>;
      case 'revisado':
        return <Badge className="bg-info text-info-foreground"><CheckCircle2 className="h-3 w-3 mr-1" />Revisado</Badge>;
      case 'transmitido':
        return <Badge className="bg-success text-success-foreground"><Send className="h-3 w-3 mr-1" />Transmitido</Badge>;
      case 'retificado':
        return <Badge className="bg-warning text-warning-foreground"><RefreshCw className="h-3 w-3 mr-1" />Retificado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleCriarApuracao = async () => {
    if (!empresaId) return;
    await criarApuracao.mutateAsync({
      empresa_id: empresaId,
      ano: novoAno,
      mes: novoMes,
    });
    setDialogNovaApuracao(false);
  };

  const handleCalcular = async (apuracao: ApuracaoTributaria) => {
    await calcularApuracao.mutateAsync({
      id: apuracao.id,
      empresaId: apuracao.empresa_id,
      ano: apuracao.ano,
      mes: apuracao.mes,
    });
  };

  const handleTransmitir = async (id: string) => {
    await transmitirApuracao.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-32" /></CardContent>
            </Card>
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
          <h3 className="text-lg font-semibold">Apurações Tributárias</h3>
          <p className="text-sm text-muted-foreground">
            Gestão mensal de CBS, IBS e Imposto Seletivo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(anoSelecionado)} onValueChange={v => setAnoSelecionado(Number(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027, 2028].map(ano => (
                <SelectItem key={ano} value={String(ano)}>{ano}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Dialog open={dialogNovaApuracao} onOpenChange={setDialogNovaApuracao}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Apuração
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Apuração</DialogTitle>
                <DialogDescription>
                  Selecione o período para criar uma nova apuração tributária
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Mês</label>
                    <Select value={String(novoMes)} onValueChange={v => setNovoMes(Number(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {meses.map((mes, i) => (
                          <SelectItem key={i} value={String(i + 1)}>{mes}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Ano</label>
                    <Select value={String(novoAno)} onValueChange={v => setNovoAno(Number(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2024, 2025, 2026, 2027, 2028].map(ano => (
                          <SelectItem key={ano} value={String(ano)}>{ano}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogNovaApuracao(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCriarApuracao} disabled={criarApuracao.isPending}>
                  {criarApuracao.isPending ? 'Criando...' : 'Criar Apuração'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cards de Resumo Anual */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">CBS Total</CardTitle>
            <FileText className="h-4 w-4 text-cbs" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cbs">{formatCurrency(totaisAno.cbs)}</div>
            <p className="text-xs text-muted-foreground">Ano {anoSelecionado}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">IBS Total</CardTitle>
            <FileText className="h-4 w-4 text-ibs" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-ibs">{formatCurrency(totaisAno.ibs)}</div>
            <p className="text-xs text-muted-foreground">Ano {anoSelecionado}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Imposto Seletivo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-imposto-seletivo" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-imposto-seletivo">{formatCurrency(totaisAno.is)}</div>
            <p className="text-xs text-muted-foreground">Ano {anoSelecionado}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tributos Residuais</CardTitle>
            <TrendingDown className="h-4 w-4 text-residual" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-residual">{formatCurrency(totaisAno.residuais)}</div>
            <p className="text-xs text-muted-foreground">ICMS/ISS/PIS/COFINS</p>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
            <Calculator className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totaisAno.total)}</div>
            <p className="text-xs text-muted-foreground">{apuracoesAno.length} apurações</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Apurações */}
      <Card>
        <CardHeader>
          <CardTitle>Apurações do Ano</CardTitle>
          <CardDescription>Clique em uma apuração para ver detalhes</CardDescription>
        </CardHeader>
        <CardContent>
          {apuracoesAno.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Competência</TableHead>
                  <TableHead className="text-right">CBS a Pagar</TableHead>
                  <TableHead className="text-right">IBS a Pagar</TableHead>
                  <TableHead className="text-right">IS</TableHead>
                  <TableHead className="text-right">Residuais</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apuracoesAno.map((ap) => (
                  <TableRow 
                    key={ap.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setMesSelecionado(ap.mes)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {meses[ap.mes - 1]}/{ap.ano}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-cbs">
                      {formatCurrency(ap.cbs_a_pagar)}
                    </TableCell>
                    <TableCell className="text-right text-ibs">
                      {formatCurrency(ap.ibs_a_pagar)}
                    </TableCell>
                    <TableCell className="text-right text-imposto-seletivo">
                      {formatCurrency(ap.is_a_pagar)}
                    </TableCell>
                    <TableCell className="text-right text-residual">
                      {formatCurrency(
                        Number(ap.icms_residual) + Number(ap.iss_residual) +
                        Number(ap.pis_residual) + Number(ap.cofins_residual)
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(ap.total_geral)}
                    </TableCell>
                    <TableCell>{getStatusBadge(ap.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {ap.status === 'rascunho' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCalcular(ap);
                            }}
                            disabled={calcularApuracao.isPending}
                          >
                            <Calculator className="h-3 w-3" />
                          </Button>
                        )}
                        {(ap.status === 'calculado' || ap.status === 'revisado') && (
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTransmitir(ap.id);
                            }}
                            disabled={transmitirApuracao.isPending}
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost">
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Calendar className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Nenhuma apuração para {anoSelecionado}</p>
              <p className="text-sm mb-4">Crie uma nova apuração para começar</p>
              <Button onClick={() => setDialogNovaApuracao(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Apuração
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalhes da Apuração Selecionada */}
      {apuracaoAtual && (
        <Card>
          <CardHeader>
            <CardTitle>
              Detalhes: {meses[apuracaoAtual.mes - 1]}/{apuracaoAtual.ano}
            </CardTitle>
            <CardDescription>
              Composição detalhada dos tributos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* CBS */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-cbs mb-3">CBS - Contribuição sobre Bens e Serviços</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Débitos</span>
                    <span className="font-medium">{formatCurrency(apuracaoAtual.cbs_debitos)}</span>
                  </div>
                  <div className="flex justify-between text-success">
                    <span>(-) Créditos</span>
                    <span className="font-medium">{formatCurrency(apuracaoAtual.cbs_creditos)}</span>
                  </div>
                  <div className="flex justify-between text-success">
                    <span>(-) Saldo Anterior</span>
                    <span className="font-medium">{formatCurrency(apuracaoAtual.cbs_saldo_anterior)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>= A Pagar</span>
                    <span className="text-cbs">{formatCurrency(apuracaoAtual.cbs_a_pagar)}</span>
                  </div>
                  {Number(apuracaoAtual.cbs_a_compensar) > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Saldo Credor</span>
                      <span className="font-medium">{formatCurrency(apuracaoAtual.cbs_a_compensar)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* IBS */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-ibs mb-3">IBS - Imposto sobre Bens e Serviços</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Débitos</span>
                    <span className="font-medium">{formatCurrency(apuracaoAtual.ibs_debitos)}</span>
                  </div>
                  <div className="flex justify-between text-success">
                    <span>(-) Créditos</span>
                    <span className="font-medium">{formatCurrency(apuracaoAtual.ibs_creditos)}</span>
                  </div>
                  <div className="flex justify-between text-success">
                    <span>(-) Saldo Anterior</span>
                    <span className="font-medium">{formatCurrency(apuracaoAtual.ibs_saldo_anterior)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>= A Pagar</span>
                    <span className="text-ibs">{formatCurrency(apuracaoAtual.ibs_a_pagar)}</span>
                  </div>
                  {Number(apuracaoAtual.ibs_a_compensar) > 0 && (
                    <div className="flex justify-between text-success">
                      <span>Saldo Credor</span>
                      <span className="font-medium">{formatCurrency(apuracaoAtual.ibs_a_compensar)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Imposto Seletivo */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-imposto-seletivo mb-3">IS - Imposto Seletivo</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Débitos</span>
                    <span className="font-medium">{formatCurrency(apuracaoAtual.is_debitos)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>= A Pagar</span>
                    <span className="text-imposto-seletivo">{formatCurrency(apuracaoAtual.is_a_pagar)}</span>
                  </div>
                </div>
              </div>

              {/* Tributos Residuais */}
              <div className="p-4 border rounded-lg bg-muted/30">
                <h4 className="font-semibold text-residual mb-3">Tributos Residuais (Transição)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>ICMS Residual</span>
                    <span className="font-medium">{formatCurrency(apuracaoAtual.icms_residual)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ISS Residual</span>
                    <span className="font-medium">{formatCurrency(apuracaoAtual.iss_residual)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PIS Residual</span>
                    <span className="font-medium">{formatCurrency(apuracaoAtual.pis_residual)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>COFINS Residual</span>
                    <span className="font-medium">{formatCurrency(apuracaoAtual.cofins_residual)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>= Total Residuais</span>
                    <span>{formatCurrency(apuracaoAtual.total_tributos_residuais)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Geral */}
            <div className="mt-6 p-4 bg-primary/10 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-lg">Total a Recolher</h4>
                  <p className="text-sm text-muted-foreground">
                    Tributos novos + residuais
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">
                    {formatCurrency(apuracaoAtual.total_geral)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Novos: {formatCurrency(apuracaoAtual.total_tributos_novos)} | 
                    Residuais: {formatCurrency(apuracaoAtual.total_tributos_residuais)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ApuracaoMensal;
