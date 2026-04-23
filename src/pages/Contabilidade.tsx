import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookOpen, FileText, Calculator, Building2, BookText, BarChart3, AlertTriangle, Plug, History, ArrowRight, LayoutGrid, Pin } from 'lucide-react';
import { useLocalStorageState } from '@/hooks/useLocalStorageState';
import { formatCnpj } from '@/lib/brazilian-validators';
import { motion } from 'framer-motion';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useEmpresas } from '@/hooks/useFinancialData';
import { useSpedContabilHistorico } from '@/hooks/useSpedContabil';
import { PlanoContasTab } from '@/components/contabilidade/PlanoContasTab';
import { LancamentosTab } from '@/components/contabilidade/LancamentosTab';
import { SpedContabilTab } from '@/components/contabilidade/SpedContabilTab';
import { RazaoDiarioTab } from '@/components/contabilidade/RazaoDiarioTab';
import { DreBalancoTab } from '@/components/contabilidade/DreBalancoTab';
import { VerificacaoIntegracoesPanel } from '@/components/contabilidade/VerificacaoIntegracoesPanel';
import { AuditoriaLancamentosPanel } from '@/components/contabilidade/AuditoriaLancamentosPanel';

const VALID_TABS = ['inicio', 'plano', 'lancamentos', 'razao', 'dre', 'integracoes', 'auditoria', 'ecd', 'ecf'] as const;
type TabId = typeof VALID_TABS[number];

const ANO_DEFAULT = new Date().getFullYear() - 1;

interface HistoricoMin {
  tipo: string;
  ano_calendario: number;
  status: string;
}

export default function Contabilidade() {
  const { data: empresas = [] } = useEmpresas();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const tab: TabId = (VALID_TABS as readonly string[]).includes(tabParam ?? '')
    ? (tabParam as TabId)
    : 'inicio';

  const empresaId = searchParams.get('empresa') ?? '';
  const anoParam = Number(searchParams.get('ano'));
  const ano = Number.isFinite(anoParam) && anoParam >= 2010 && anoParam <= new Date().getFullYear()
    ? anoParam
    : ANO_DEFAULT;

  const updateParam = (key: string, value: string | null) => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev);
        if (value === null || value === '') next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true },
    );
  };

  const setTab = (v: string) => updateParam('tab', v);
  const setEmpresaId = (v: string) => updateParam('empresa', v || null);
  const setAno = (v: number) => updateParam('ano', String(v));

  // Histórico SPED para detectar se a ECD do ano selecionado já foi gerada (sincroniza badge da ECF)
  const { data: historico = [] } = useSpedContabilHistorico(empresaId);
  const temEcdNoAno = (historico as HistoricoMin[]).some(
    h => h.tipo === 'ECD' && h.ano_calendario === ano && h.status !== 'rejeitado',
  );
  const ecfPendente = !!empresaId && !temEcdNoAno;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="h-7 w-7 text-primary" />
              Contabilidade & SPED
            </h1>
            <p className="text-muted-foreground">Plano de contas, lançamentos e geração de ECD/ECF</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Empresa</Label>
              <Select value={empresaId} onValueChange={setEmpresaId}>
                <SelectTrigger className="w-[220px]">
                  <Building2 className="mr-2 h-4 w-4" /><SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome_fantasia || e.razao_social}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ano-calendário</Label>
              <Input
                type="number"
                min={2010}
                max={new Date().getFullYear()}
                value={ano}
                onChange={e => setAno(Number(e.target.value))}
                className="w-[100px]"
              />
            </div>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-9">
            <TabsTrigger value="inicio" className="gap-1.5"><LayoutGrid className="h-4 w-4" />Início</TabsTrigger>
            <TabsTrigger value="plano" className="gap-1.5"><BookOpen className="h-4 w-4" />Plano</TabsTrigger>
            <TabsTrigger value="lancamentos" className="gap-1.5"><Calculator className="h-4 w-4" />Lançamentos</TabsTrigger>
            <TabsTrigger value="razao" className="gap-1.5"><BookText className="h-4 w-4" />Razão & Diário</TabsTrigger>
            <TabsTrigger value="dre" className="gap-1.5"><BarChart3 className="h-4 w-4" />DRE & Balanço</TabsTrigger>
            <TabsTrigger value="integracoes" className="gap-1.5"><Plug className="h-4 w-4" />Integrações</TabsTrigger>
            <TabsTrigger value="auditoria" className="gap-1.5"><History className="h-4 w-4" />Auditoria</TabsTrigger>
            <TabsTrigger value="ecd" className="gap-1.5"><FileText className="h-4 w-4" />SPED ECD</TabsTrigger>
            <TabsTrigger value="ecf" className="gap-1.5">
              <FileText className="h-4 w-4" />
              SPED ECF
              {ecfPendente && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className="ml-1 h-5 px-1.5 border-amber-500/40 bg-amber-500/10 text-amber-700"
                      >
                        <AlertTriangle className="h-3 w-3" />
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      Gere a SPED ECD de {ano} antes da ECF
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inicio">
            <ContabilidadeHome
              onSelect={setTab}
              ecfPendente={ecfPendente}
              ano={ano}
              empresaSelecionada={!!empresaId}
            />
          </TabsContent>
          <TabsContent value="plano"><PlanoContasTab empresaId={empresaId} /></TabsContent>
          <TabsContent value="lancamentos"><LancamentosTab empresaId={empresaId} ano={ano} /></TabsContent>
          <TabsContent value="razao"><RazaoDiarioTab empresaId={empresaId} ano={ano} /></TabsContent>
          <TabsContent value="dre"><DreBalancoTab empresaId={empresaId} ano={ano} /></TabsContent>
          <TabsContent value="integracoes"><VerificacaoIntegracoesPanel empresaId={empresaId} ano={ano} /></TabsContent>
          <TabsContent value="auditoria"><AuditoriaLancamentosPanel empresaId={empresaId} ano={ano} /></TabsContent>
          <TabsContent value="ecd"><SpedContabilTab tipo="ECD" empresaId={empresaId} /></TabsContent>
          <TabsContent value="ecf"><SpedContabilTab tipo="ECF" empresaId={empresaId} /></TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

interface HomeCard {
  id: TabId;
  label: string;
  description: string;
  icon: typeof BookOpen;
  accent: string;
}

const HOME_CARDS: HomeCard[] = [
  { id: 'plano', label: 'Plano de Contas', description: 'Estruture e mantenha o plano referencial CFC.', icon: BookOpen, accent: 'text-primary' },
  { id: 'lancamentos', label: 'Lançamentos', description: 'Registre partidas dobradas no diário contábil.', icon: Calculator, accent: 'text-primary' },
  { id: 'razao', label: 'Razão & Diário', description: 'Consulte movimentação por conta e por data.', icon: BookText, accent: 'text-primary' },
  { id: 'dre', label: 'DRE & Balanço', description: 'Demonstrações apuradas pela escrituração contábil.', icon: BarChart3, accent: 'text-success' },
  { id: 'ecd', label: 'SPED ECD', description: 'Geração e validação da Escrituração Contábil Digital.', icon: FileText, accent: 'text-warning' },
  { id: 'ecf', label: 'SPED ECF', description: 'Escrituração Contábil Fiscal — depende da ECD do ano.', icon: FileText, accent: 'text-warning' },
];

interface ContabilidadeHomeProps {
  onSelect: (tab: string) => void;
  ecfPendente: boolean;
  ano: number;
  empresaSelecionada: boolean;
}

function ContabilidadeHome({ onSelect, ecfPendente, ano, empresaSelecionada }: ContabilidadeHomeProps) {
  return (
    <div className="space-y-6">
      {!empresaSelecionada && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-muted-foreground">
          <strong className="text-warning">Selecione uma empresa</strong> no topo da página para habilitar a geração de SPED e relatórios contábeis específicos.
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {HOME_CARDS.map((card, idx) => {
          const Icon = card.icon;
          const ecfBadge = card.id === 'ecf' && ecfPendente;
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card
                onClick={() => onSelect(card.id)}
                className="group cursor-pointer border-border/50 transition-all hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className={`rounded-lg bg-muted/50 p-2.5 ${card.accent}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {ecfBadge && (
                      <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning gap-1 text-[10px]">
                        <AlertTriangle className="h-3 w-3" />
                        ECD {ano} pendente
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base mt-3">{card.label}</CardTitle>
                  <CardDescription className="text-xs">{card.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between -mx-2 group-hover:bg-primary/5 group-hover:text-primary"
                  >
                    Abrir
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Plug className="h-4 w-4 text-primary" />
              Verificação de integrações
            </CardTitle>
            <CardDescription className="text-xs">
              Confira se NF-e, contas e tributos estão alimentando a contabilidade.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" onClick={() => onSelect('integracoes')} className="w-full">
              Ver integrações <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Auditoria de lançamentos
            </CardTitle>
            <CardDescription className="text-xs">
              Histórico de criação, ajustes e estornos de partidas contábeis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" onClick={() => onSelect('auditoria')} className="w-full">
              Abrir auditoria <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
