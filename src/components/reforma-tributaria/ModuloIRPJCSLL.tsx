// ============================================
// COMPONENTE: MÓDULO IRPJ/CSLL LUCRO REAL
// Apuração trimestral/anual completa
// ============================================

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { IRPJCSLLCalculadora } from './irpj-csll/IRPJCSLLCalculadora';
import { IRPJCSLLResumoCards } from './irpj-csll/IRPJCSLLResumoCards';
import { IRPJCSLLApuracoesTable } from './irpj-csll/IRPJCSLLApuracoesTable';
import { IRPJCSLLLalurTab } from './irpj-csll/IRPJCSLLLalurTab';
import { Skeleton } from '@/components/ui/skeleton';
import { Calculator, Plus } from 'lucide-react';
import { useIRPJCSLL } from '@/hooks/useIRPJCSLL';
import { useAllEmpresas } from '@/hooks/useEmpresas';

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
      <IRPJCSLLResumoCards
        totaisAno={totaisAno}
        qtdApuracoes={apuracoesAno.length}
        saldoPrejuizos={saldoPrejuizos}
        aliquotaIRPJ={ALIQUOTA_IRPJ}
        aliquotaCSLL={ALIQUOTA_CSLL}
      />

      <Tabs defaultValue="apuracoes">
        <TabsList>
          <TabsTrigger value="apuracoes">Apurações</TabsTrigger>
          <TabsTrigger value="calcular">Calcular</TabsTrigger>
          <TabsTrigger value="lalur">LALUR</TabsTrigger>
        </TabsList>

        <TabsContent value="apuracoes">
          <IRPJCSLLApuracoesTable
            apuracoesAno={apuracoesAno}
            ano={anoSelecionado}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="calcular">
          <IRPJCSLLCalculadora
            apuracoesAno={apuracoesAno}
            formCalculo={formCalculo}
            setFormCalculo={setFormCalculo}
            saldoPrejuizos={saldoPrejuizos}
            handleCalcular={handleCalcular}
            isPending={calcularApuracao.isPending}
          />
        </TabsContent>

        <TabsContent value="lalur">
          <IRPJCSLLLalurTab prejuizos={prejuizos} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ModuloIRPJCSLL;
