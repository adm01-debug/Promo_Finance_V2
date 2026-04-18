import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Building2, CheckCircle2, FileSearch, Loader2, Search, SkipForward } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { applyCnpjMask } from '@/lib/masks';
import { useCnpjaLookup, type CnpjaData } from '@/hooks/useCnpjaLookup';
import { useAllEmpresas, useCriarEmpresa } from '@/hooks/useEmpresas';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3;

export default function OnboardingTributario() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [cnpjInput, setCnpjInput] = useState('');
  const [cnpjData, setCnpjData] = useState<CnpjaData | null>(null);
  const [empresaSelecionadaId, setEmpresaSelecionadaId] = useState<string>('');

  const lookup = useCnpjaLookup();
  const { data: empresas = [] } = useAllEmpresas();
  const criarEmpresa = useCriarEmpresa();

  const empresaExistente = (empresas || []).find(
    (e) => (e.cnpj || '').replace(/\D/g, '') === (cnpjData?.cnpj || ''),
  );

  const handleBuscar = async () => {
    const result = await lookup.mutateAsync(cnpjInput);
    const data = result?.data;
    setCnpjData(data);
    if (data) {
      const existente = (empresas || []).find(
        (e) => (e.cnpj || '').replace(/\D/g, '') === data.cnpj,
      );
      if (existente) setEmpresaSelecionadaId(existente.id);
    }
  };

  const handleAvancarStep2 = () => {
    if (!cnpjData) return;
    setStep(2);
  };

  const handleCriarEmpresa = async () => {
    if (!cnpjData) return;
    try {
      const nova = await criarEmpresa.mutateAsync({
        razao_social: cnpjData.razaoSocial || `Empresa ${cnpjData.cnpj}`,
        nome_fantasia: cnpjData.nomeFantasia || null,
        cnpj: cnpjData.cnpj,
        regime_tributario: cnpjData.regimeAtual,
        cnae_principal: cnpjData.cnaePrincipal?.codigo || null,
        endereco: cnpjData.endereco?.logradouro || null,
        cidade: cnpjData.endereco?.cidade || null,
        estado: cnpjData.endereco?.uf || null,
        cep: cnpjData.endereco?.cep || null,
        ativo: true,
      } as never);
      setEmpresaSelecionadaId(nova.id);
      toast.success('Empresa criada com dados do CNPJá');
    } catch {
      // useCriarEmpresa já trata o erro via toast
    }
  };

  const handleConcluir = () => {
    if (!empresaSelecionadaId) {
      toast.error('Selecione ou crie uma empresa antes de concluir');
      return;
    }
    navigate('/tributario/recomendacao');
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            Onboarding Tributário
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">Comece pelo CNPJ</h1>
          <p className="text-muted-foreground">
            Buscamos automaticamente razão social, regime atual e CNAE no CNPJá. Você confirma e avança.
          </p>
        </motion.div>

        <StepIndicator current={step} />

        {step === 1 && (
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                1. Buscar CNPJ
              </CardTitle>
              <CardDescription>
                Informe o CNPJ da empresa. Vamos consultar a base oficial e pré-preencher tudo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <div className="flex gap-2">
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    value={cnpjInput}
                    onChange={(e) => setCnpjInput(applyCnpjMask(e.target.value))}
                    maxLength={18}
                    className="font-mono"
                  />
                  <Button
                    onClick={handleBuscar}
                    disabled={lookup.isPending || cnpjInput.replace(/\D/g, '').length !== 14}
                  >
                    {lookup.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Buscar
                  </Button>
                </div>
              </div>

              {cnpjData && (
                <CnpjaPreview data={cnpjData} empresaExistenteRazao={empresaExistente?.razao_social} />
              )}

              <div className="flex justify-end pt-2">
                <Button onClick={handleAvancarStep2} disabled={!cnpjData}>
                  Avançar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && cnpjData && (
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                2. Confirmar empresa
              </CardTitle>
              <CardDescription>
                Vincule a uma empresa existente ou crie uma nova com os dados consultados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Empresa existente</Label>
                <Select
                  value={empresaSelecionadaId}
                  onValueChange={setEmpresaSelecionadaId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma empresa..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(empresas || []).map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.razao_social} {e.cnpj ? `— ${e.cnpj}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="rounded-lg border border-dashed border-border/60 p-4 space-y-3">
                <p className="text-sm font-medium">Ou criar nova empresa com dados do CNPJá</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <InfoRow label="Razão social" value={cnpjData.razaoSocial} />
                  <InfoRow label="CNPJ" value={cnpjData.cnpj} mono />
                  <InfoRow label="Regime atual" value={regimeLabel(cnpjData.regimeAtual)} />
                  <InfoRow
                    label="CNAE principal"
                    value={cnpjData.cnaePrincipal?.codigo || '—'}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleCriarEmpresa}
                  disabled={criarEmpresa.isPending || !!empresaExistente}
                >
                  {criarEmpresa.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Building2 className="h-4 w-4" />
                  )}
                  {empresaExistente ? 'Empresa já cadastrada' : 'Criar empresa'}
                </Button>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button onClick={() => setStep(3)} disabled={!empresaSelecionadaId}>
                  Avançar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="bg-card/50 backdrop-blur border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSearch className="h-5 w-5 text-primary" />
                3. Importar histórico (opcional)
              </CardTitle>
              <CardDescription>
                Para uma recomendação mais precisa, importe faturamento e folha. Você pode pular e fazer depois.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-base">Faturamento mensal</CardTitle>
                    <CardDescription className="text-xs">
                      CSV com colunas: ano, mês, receita_bruta, receita_servicos.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate('/tributario/dashboard')}
                    >
                      Ir para importação
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-base">Folha de pagamento</CardTitle>
                    <CardDescription className="text-xs">
                      CSV com colunas: ano, mês, total_folha, encargos.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate('/tributario/dashboard')}
                    >
                      Ir para importação
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  Voltar
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleConcluir}>
                    <SkipForward className="h-4 w-4" />
                    Pular e ver recomendação
                  </Button>
                  <Button variant="premium" onClick={handleConcluir}>
                    <CheckCircle2 className="h-4 w-4" />
                    Concluir onboarding
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}

function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { n: 1, label: 'Buscar CNPJ' },
    { n: 2, label: 'Confirmar empresa' },
    { n: 3, label: 'Importar histórico' },
  ];
  return (
    <div className="flex items-center gap-3">
      {steps.map((s, idx) => (
        <div key={s.n} className="flex items-center gap-3 flex-1">
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors',
              current === s.n
                ? 'bg-primary text-primary-foreground border-primary'
                : current > s.n
                  ? 'bg-success/15 text-success border-success/30'
                  : 'bg-muted/50 text-muted-foreground border-border',
            )}
          >
            <span className="font-mono">{s.n}</span>
            <span>{s.label}</span>
          </div>
          {idx < steps.length - 1 && (
            <div
              className={cn(
                'h-px flex-1 transition-colors',
                current > s.n ? 'bg-success/40' : 'bg-border',
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function CnpjaPreview({
  data,
  empresaExistenteRazao,
}: {
  data: CnpjaData;
  empresaExistenteRazao?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold">{data.razaoSocial || 'Sem razão social'}</p>
        <Badge variant="outline">{regimeLabel(data.regimeAtual)}</Badge>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        <InfoRow label="CNPJ" value={data.cnpj} mono />
        <InfoRow label="Situação" value={data.situacaoCadastral || '—'} />
        <InfoRow label="Porte" value={data.porte || '—'} />
        <InfoRow label="CNAE principal" value={data.cnaePrincipal?.codigo || '—'} />
        <InfoRow
          label="Cidade/UF"
          value={
            data.endereco?.cidade
              ? `${data.endereco.cidade}/${data.endereco.uf}`
              : '—'
          }
        />
        <InfoRow
          label="Capital social"
          value={
            typeof data.capitalSocial === 'number'
              ? data.capitalSocial.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })
              : '—'
          }
        />
      </div>
      {empresaExistenteRazao && (
        <p className="text-xs text-warning flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Empresa já cadastrada como “{empresaExistenteRazao}”.
        </p>
      )}
    </motion.div>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn('text-sm', mono && 'font-mono')}>{value}</p>
    </div>
  );
}

function regimeLabel(r: CnpjaData['regimeAtual']): string {
  switch (r) {
    case 'mei':
      return 'MEI';
    case 'simples':
      return 'Simples Nacional';
    case 'presumido_real':
      return 'Presumido / Real';
    default:
      return r;
  }
}
