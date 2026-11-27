// COMPONENTE: APURAÇÃO TRIBUTÁRIA MENSAL
// Gestão de apurações CBS/IBS/IS

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Plus,
  RefreshCw,
  Send,
} from 'lucide-react';
import { useApuracoesTributarias, ApuracaoTributaria } from '@/hooks/useApuracoesTributarias';
import { useAllEmpresas } from '@/hooks/useEmpresas';
import { formatCurrency } from '@/lib/formatters';
import { ApuracaoDetalheCard } from './apuracao/ApuracaoDetalheCard';
import { meses } from './ApuracaoMensal.helpers';
import { ApuracaoMensalKPICards } from './ApuracaoMensalKPICards';

interface ApuracaoMensalProps {
  empresaId?: string;
}

export function ApuracaoMensal({ empresaId: empresaIdProp }: ApuracaoMensalProps = {}) {
  const { data: empresas } = useAllEmpresas();
  // A empresa do relatorio/painel manda; sem filtro, mantem a primeira da lista.
  const empresaId = empresaIdProp || empresas?.[0]?.id;
  const { apuracoes, isLoading, criarApuracao, calcularApuracao, transmitirApuracao } =
    useApuracoesTributarias(empresaId);

  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [mesSelecionado, setMesSelecionado] = useState<number | null>(null);
  const [dialogNovaApuracao, setDialogNovaApuracao] = useState(false);
  const [novoMes, setNovoMes] = useState(new Date().getMonth() + 1);
  const [novoAno, setNovoAno] = useState(new Date().getFullYear());

  const apuracaoAtual = useMemo(() => {
    if (!apuracoes || mesSelecionado === null) return null;
    return apuracoes.find((a) => a.ano === anoSelecionado && a.mes === mesSelecionado);
  }, [apuracoes, anoSelecionado, mesSelecionado]);

  const apuracoesAno = useMemo(() => {
    if (!apuracoes) return [];
    return apuracoes.filter((a) => a.ano === anoSelecionado).sort((a, b) => a.mes - b.mes);
  }, [apuracoes, anoSelecionado]);

  const totaisAno = useMemo(
    () =>
      apuracoesAno.reduce(
        (acc, ap) => ({
          cbs: acc.cbs + Number(ap.cbs_a_pagar),
          ibs: acc.ibs + Number(ap.ibs_a_pagar),
          is: acc.is + Number(ap.is_a_pagar),
          residuais:
            acc.residuais +
            Number(ap.icms_residual) +
            Number(ap.iss_residual) +
            Number(ap.pis_residual) +
            Number(ap.cofins_residual),
          total: acc.total + Number(ap.total_geral),
        }),
        { cbs: 0, ibs: 0, is: 0, residuais: 0, total: 0 }
      ),
    [apuracoesAno]
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'rascunho':
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Rascunho
          </Badge>
        );
      case 'calculado':
        return (
          <Badge variant="secondary">
            <Calculator className="h-3 w-3 mr-1" />
            Calculado
          </Badge>
        );
      case 'revisado':
        return (
          <Badge className="bg-info text-info-foreground">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Revisado
          </Badge>
        );
      case 'transmitido':
        return (
          <Badge className="bg-success text-success-foreground">
            <Send className="h-3 w-3 mr-1" />
            Transmitido
          </Badge>
        );
      case 'retificado':
        return (
          <Badge className="bg-warning text-warning-foreground">
            <RefreshCw className="h-3 w-3 mr-1" />
            Retificado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleCriarApuracao = async () => {
    if (!empresaId) return;
    await criarApuracao.mutateAsync({ empresa_id: empresaId, ano: novoAno, mes: novoMes });
    setDialogNovaApuracao(false);
  };

  const handleCalcular = async (ap: ApuracaoTributaria) => {
    await calcularApuracao.mutateAsync({
      id: ap.id,
      empresaId: ap.empresa_id,
      ano: ap.ano,
      mes: ap.mes,
    });
  };

  const handleTransmitir = async (id: string) => {
    await transmitirApuracao.mutateAsync(id);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
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
          <Select
            value={String(anoSelecionado)}
            onValueChange={(v) => setAnoSelecionado(Number(v))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027, 2028].map((ano) => (
                <SelectItem key={ano} value={String(ano)}>
                  {ano}
                </SelectItem>
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
                    <Select value={String(novoMes)} onValueChange={(v) => setNovoMes(Number(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {meses.map((mes, i) => (
                          <SelectItem key={i} value={String(i + 1)}>
                            {mes}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Ano</label>
                    <Select value={String(novoAno)} onValueChange={(v) => setNovoAno(Number(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2024, 2025, 2026, 2027, 2028].map((ano) => (
                          <SelectItem key={ano} value={String(ano)}>
                            {ano}
                          </SelectItem>
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

      {/* KPI Cards */}
      <ApuracaoMensalKPICards
        totaisAno={totaisAno}
        anoSelecionado={anoSelecionado}
        apuracoesAno={apuracoesAno}
      />

      {/* Table */}
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
                        Number(ap.icms_residual) +
                          Number(ap.iss_residual) +
                          Number(ap.pis_residual) +
                          Number(ap.cofins_residual)
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

      {apuracaoAtual && <ApuracaoDetalheCard apuracao={apuracaoAtual} />}
    </div>
  );
}

export default ApuracaoMensal;
