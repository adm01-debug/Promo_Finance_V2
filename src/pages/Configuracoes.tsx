import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Bell,
  Mail,
  Clock,
  CheckCircle2,
  CreditCard,
  Shield,
  Database,
  Zap,
  Timer,
  Link2,
  FileText,
  Brain,
  Route
} from 'lucide-react';
import { RegrasRoteamentoTab } from '@/components/configuracoes/RegrasRoteamentoTab';
import { OpenFinancePanel } from '@/components/integracoes/OpenFinancePanel';
import { WhatsAppConfigPanel } from '@/components/integracoes/WhatsAppConfigPanel';
import { CronJobsPanel } from '@/components/configuracoes/CronJobsPanel';
import { CronJobsStatus } from '@/components/admin/CronJobsStatus';
import { SecuritySettings } from '@/components/configuracoes/SecuritySettings';
import { SecurityStatusBanner } from '@/components/configuracoes/SecurityStatusBanner';
import { DocumentacaoAPI } from '@/components/api/DocumentacaoAPI';
import { GestaoContratos } from '@/components/contratos/GestaoContratos';
import { AssinaturaDigital } from '@/components/documentos/AssinaturaDigital';
import { ComprovanteOCR } from '@/components/comprovantes/ComprovanteOCR';
import { BiometricSettings } from '@/components/configuracoes/BiometricSettings';
import { ConfiguracaoConciliacaoPanel } from '@/components/conciliacao/ConfiguracaoConciliacaoPanel';
import { RegrasConciliacaoPanel } from '@/components/conciliacao/RegrasConciliacaoPanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { ReguaCobrancaTab } from '@/components/configuracoes/ReguaCobrancaTab';
import { SistemaTab } from '@/components/configuracoes/SistemaTab';
import { TemplatesTab } from '@/components/configuracoes/TemplatesTab';
import { RegrasDuplicidadeTab } from '@/components/configuracoes/RegrasDuplicidadeTab';
import { NotificacoesPreferencias } from '@/components/configuracoes/NotificacoesPreferencias';
import { ShieldAlert } from 'lucide-react';
import { AtalhosRapidos } from './Configuracoes.parts';
import { containerVariants } from './Configuracoes.constants';
import { etapasIniciais, templatesIniciais, type EtapaConfig, type Template } from './Configuracoes.constants';

export default function Configuracoes() {
  const [etapas, setEtapas] = useState<EtapaConfig[]>(etapasIniciais);
  const [templates] = useState<Template[]>(templatesIniciais);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTemplate] = useState<Template | null>(null);
  const { toast } = useToast();

  // Preferências do Sistema
  const [preferencias, setPreferencias] = useState({
    notificacoesEmail: true,
    notificacoesPush: true,
    alertasVencimento: 3,
    alertasFluxoCaixa: true,
    temaEscuro: false,
    formatoData: 'dd/MM/yyyy',
    formatoMoeda: 'BRL',
    fusoHorario: 'America/Sao_Paulo',
    backupAutomatico: true,
    frequenciaBackup: 'diario',
  });

  const toggleEtapa = (id: string) => {
    setEtapas(prev => prev.map(e =>
      e.id === id ? { ...e, ativo: !e.ativo } : e
    ));
    toast({
      title: "Etapa atualizada",
      description: "A régua de cobrança foi atualizada com sucesso.",
    });
  };

  const savePreferencias = () => {
    toast({
      title: "Preferências salvas",
      description: "Suas configurações foram atualizadas com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie régua de cobrança, templates e preferências do sistema
        </p>
      </div>

      {/* Atalhos rápidos */}
      <AtalhosRapidos />

      <Tabs defaultValue="regua" className="space-y-6">
        <TabsList className="grid w-full grid-cols-12 lg:w-[1500px]">
          <TabsTrigger value="regua" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Régua</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
          </TabsTrigger>
          <TabsTrigger value="duplicidade" className="gap-2 text-destructive font-bold">
            <ShieldAlert className="h-4 w-4" />
            <span className="hidden sm:inline">Anti-Duplicidade</span>
          </TabsTrigger>
          <TabsTrigger value="conciliacao" className="gap-2 text-primary font-bold">
            <CheckCircle2 className="h-4 w-4" />
            <span className="hidden sm:inline">Conciliação</span>
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Alertas</span>
          </TabsTrigger>
          <TabsTrigger value="agendamentos" className="gap-2">
            <Timer className="h-4 w-4" />
            <span className="hidden sm:inline">Cron</span>
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Segurança</span>
          </TabsTrigger>
          <TabsTrigger value="integracoes" className="gap-2">
            <Link2 className="h-4 w-4" />
            <span className="hidden sm:inline">APIs</span>
          </TabsTrigger>
          <TabsTrigger value="contratos" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Contratos</span>
          </TabsTrigger>
          <TabsTrigger value="ocr" className="gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">OCR</span>
          </TabsTrigger>
          <TabsTrigger value="asaas" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Asaas</span>
          </TabsTrigger>
          <TabsTrigger value="sistema" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Sistema</span>
          </TabsTrigger>
          <TabsTrigger value="automacao-compras" className="gap-2 text-primary font-bold animate-pulse">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">IA Compras</span>
          </TabsTrigger>
          <TabsTrigger value="roteamento" className="gap-2 text-primary font-bold">
            <Route className="h-4 w-4" />
            <span className="hidden sm:inline">Roteamento</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="automacao-compras">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Zap className="h-6 w-6 text-primary" /> Automação de Compras IA
              </CardTitle>
              <CardDescription>
                Configure o motor de inteligência preditiva para compras automáticas e reposição de estoque.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-card/5">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold">Compras Preditivas</Label>
                      <p className="text-xs text-muted-foreground">Reposição automática baseada em demanda histórica.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-card/5">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold">Otimização Tributária</Label>
                      <p className="text-xs text-muted-foreground">Selecionar fornecedores por melhor benefício fiscal (ICMS/IPI).</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Margem de Segurança (Estoque)</Label>
                    <Slider defaultValue={[20]} max={50} step={5} />
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                      <span>Mínimo (5%)</span>
                      <span>Atual: 20%</span>
                      <span>Máximo (50%)</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-card/5" />

              <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex items-start gap-4">
                <Brain className="h-10 w-10 text-primary shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-bold">Quantum-Sentinel Insight</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    O motor de IA detectou uma oportunidade de economia tributária de <strong>12.4%</strong> ao centralizar compras de insumos via fornecedores em estados com regime especial de ICMS. Ative a automação para permitir que o sistema sugira ordens de compra otimizadas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="asaas">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-primary" /> Integração Asaas
              </CardTitle>
              <CardDescription>Configurações globais de pagamentos, cobranças e automatização.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/30 p-4 rounded-xl border border-dashed text-center">
                <p className="text-sm text-muted-foreground">
                  As configurações do Asaas foram integradas ao ecossistema central de pagamentos.
                </p>
                <Button variant="link" asChild className="mt-2 text-primary font-bold">
                  <a href="/asaas">Abrir Hub Asaas Pagamentos →</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações de Conciliação Multi-CNPJ */}
        <TabsContent value="conciliacao" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ConfiguracaoConciliacaoPanel />
            <RegrasConciliacaoPanel />
          </div>
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Mapeamento de Campos (Extrato CSV)
              </CardTitle>
              <CardDescription>Configure como as colunas do seu arquivo CSV devem ser interpretadas pelo sistema para este CNPJ.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 p-4 rounded-xl border border-dashed text-center">
                <p className="text-sm text-muted-foreground">O mapeamento é feito individualmente por conta bancária dentro do menu lateral em <strong>Contas Bancárias → Mapeamento de Extrato</strong>.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Régua de Cobrança */}
        <TabsContent value="regua">
          <ReguaCobrancaTab etapas={etapas} onToggleEtapa={toggleEtapa} />
        </TabsContent>

        {/* Templates de Mensagem */}
        <TabsContent value="templates">
          <TemplatesTab
            templates={templates}
            templateDialogOpen={templateDialogOpen}
            selectedTemplate={selectedTemplate}
            onTemplateDialogChange={setTemplateDialogOpen}
          />
        </TabsContent>

        {/* Notificações */}
        <TabsContent value="notificacoes">
          <NotificacoesPreferencias preferencias={preferencias} onPreferenciasChange={setPreferencias} />
        </TabsContent>

        {/* Agendamentos / Cron Jobs */}
        <TabsContent value="agendamentos">
          <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <CronJobsStatus />
            <CronJobsPanel />
          </motion.div>
        </TabsContent>

        {/* Integrações */}
        <TabsContent value="integracoes">
          <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <OpenFinancePanel />
            <WhatsAppConfigPanel />
            <DocumentacaoAPI />
          </motion.div>
        </TabsContent>

        {/* Sistema */}
        <TabsContent value="sistema">
          <SistemaTab preferencias={preferencias} onPreferenciasChange={setPreferencias} onSave={savePreferencias} />
        </TabsContent>

        {/* Segurança */}
        <TabsContent value="seguranca">
          <div className="space-y-6">
            <SecurityStatusBanner />
            <BiometricSettings />
            <SecuritySettings />
          </div>
        </TabsContent>

        {/* Gestão de Contratos */}
        <TabsContent value="contratos">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GestaoContratos />
            <AssinaturaDigital documentoNome="Contrato de Serviço" />
          </div>
        </TabsContent>

        {/* Anti-Duplicidade */}
        <TabsContent value="duplicidade">
          <RegrasDuplicidadeTab />
        </TabsContent>

        {/* OCR de Comprovantes */}
        <TabsContent value="ocr">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ComprovanteOCR />
            <DocumentacaoAPI />
          </div>
        </TabsContent>
        {/* Roteamento Multi-CNPJ */}
        <TabsContent value="roteamento">
          <RegrasRoteamentoTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
