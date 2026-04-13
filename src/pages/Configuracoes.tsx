import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings,
  Bell,
  Mail,
  MessageSquare,
  Phone,
  Clock,
  Plus,
  Edit,
  Trash2,
  Save,
  Copy,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Users,
  Building2,
  CreditCard,
  Palette,
  Globe,
  Shield,
  Database,
  Zap,
  ToggleLeft,
  Timer,
  Link2,
  FileText
} from 'lucide-react';
import { OpenFinancePanel } from '@/components/integracoes/OpenFinancePanel';
import { WhatsAppConfigPanel } from '@/components/integracoes/WhatsAppConfigPanel';
import { NotificacoesConfig } from '@/components/configuracoes/NotificacoesConfig';
import { CronJobsPanel } from '@/components/configuracoes/CronJobsPanel';
import { SecuritySettings } from '@/components/configuracoes/SecuritySettings';
import { DocumentacaoAPI } from '@/components/api/DocumentacaoAPI';
import { GestaoContratos } from '@/components/contratos/GestaoContratos';
import { AssinaturaDigital } from '@/components/documentos/AssinaturaDigital';
import { ComprovanteOCR } from '@/components/comprovantes/ComprovanteOCR';
import { BiometricSettings } from '@/components/configuracoes/BiometricSettings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { EtapaReguaCobranca } from '@/types/financial';
import { ReguaCobrancaTab } from '@/components/configuracoes/ReguaCobrancaTab';
import { SistemaTab } from '@/components/configuracoes/SistemaTab';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

interface EtapaConfig {
  id: string;
  etapa: EtapaReguaCobranca;
  nome: string;
  diasAposVencimento: number;
  canais: ('email' | 'sms' | 'whatsapp' | 'telefone')[];
  templateId: string;
  ativo: boolean;
  cor: string;
}

interface Template {
  id: string;
  nome: string;
  tipo: 'email' | 'sms' | 'whatsapp';
  assunto?: string;
  conteudo: string;
  variaveis: string[];
}

const etapasIniciais: EtapaConfig[] = [
  { id: '1', etapa: 'preventiva', nome: 'Lembrete Preventivo', diasAposVencimento: -3, canais: ['email', 'whatsapp'], templateId: '1', ativo: true, cor: 'bg-secondary' },
  { id: '2', etapa: 'lembrete', nome: 'Lembrete de Vencimento', diasAposVencimento: 0, canais: ['email', 'sms', 'whatsapp'], templateId: '2', ativo: true, cor: 'bg-warning' },
  { id: '3', etapa: 'cobranca', nome: '1ª Cobrança', diasAposVencimento: 5, canais: ['email', 'whatsapp', 'telefone'], templateId: '3', ativo: true, cor: 'bg-streak' },
  { id: '4', etapa: 'cobranca', nome: '2ª Cobrança', diasAposVencimento: 15, canais: ['email', 'whatsapp', 'telefone'], templateId: '4', ativo: true, cor: 'bg-destructive' },
  { id: '5', etapa: 'negociacao', nome: 'Negociação', diasAposVencimento: 30, canais: ['telefone', 'whatsapp'], templateId: '5', ativo: true, cor: 'bg-accent' },
  { id: '6', etapa: 'juridico', nome: 'Aviso Jurídico', diasAposVencimento: 60, canais: ['email'], templateId: '6', ativo: false, cor: 'bg-muted-foreground' },
];

const templatesIniciais: Template[] = [
  { 
    id: '1', 
    nome: 'Lembrete Preventivo', 
    tipo: 'email', 
    assunto: 'Lembrete: Fatura vencendo em breve',
    conteudo: 'Olá {{cliente}},\n\nGostaríamos de lembrar que sua fatura no valor de {{valor}} vence em {{data_vencimento}}.\n\nPara sua comodidade, segue o link para pagamento: {{link_pagamento}}\n\nAtenciosamente,\n{{empresa}}',
    variaveis: ['cliente', 'valor', 'data_vencimento', 'link_pagamento', 'empresa']
  },
  { 
    id: '2', 
    nome: 'Vencimento Hoje', 
    tipo: 'whatsapp', 
    conteudo: 'Olá {{cliente}}! 👋\n\nSua fatura de {{valor}} vence *hoje*.\n\n💳 Pague agora: {{link_pagamento}}\n\nQualquer dúvida, estamos à disposição!',
    variaveis: ['cliente', 'valor', 'link_pagamento']
  },
  { 
    id: '3', 
    nome: '1ª Cobrança', 
    tipo: 'email', 
    assunto: 'Fatura em atraso - Regularize sua situação',
    conteudo: 'Prezado(a) {{cliente}},\n\nIdentificamos que sua fatura no valor de {{valor}}, vencida em {{data_vencimento}}, encontra-se em aberto.\n\nPara evitar encargos adicionais, solicitamos a regularização o mais breve possível.\n\nLink para pagamento: {{link_pagamento}}\n\nEm caso de dúvidas, entre em contato conosco.\n\nAtenciosamente,\n{{empresa}}',
    variaveis: ['cliente', 'valor', 'data_vencimento', 'link_pagamento', 'empresa']
  },
];

const canaisConfig = {
  email: { label: 'E-mail', icon: Mail, color: 'bg-secondary' },
  sms: { label: 'SMS', icon: MessageSquare, color: 'bg-success' },
  whatsapp: { label: 'WhatsApp', icon: Phone, color: 'bg-success' },
  telefone: { label: 'Telefone', icon: Phone, color: 'bg-accent' },
};

export default function Configuracoes() {
  const [etapas, setEtapas] = useState<EtapaConfig[]>(etapasIniciais);
  const [templates, setTemplates] = useState<Template[]>(templatesIniciais);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
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

      <Tabs defaultValue="regua" className="space-y-6">
        <TabsList className="grid w-full grid-cols-9 lg:w-[1200px]">
          <TabsTrigger value="regua" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Régua</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Templates</span>
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
          <TabsTrigger value="sistema" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Sistema</span>
          </TabsTrigger>
        </TabsList>

        {/* Régua de Cobrança */}
        <TabsContent value="regua">
          <ReguaCobrancaTab etapas={etapas} onToggleEtapa={toggleEtapa} />
        </TabsContent>

        {/* Templates de Mensagem */}
        <TabsContent value="templates">
          <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Templates de Mensagem</CardTitle>
                    <CardDescription>
                      Crie e gerencie templates para e-mail, SMS e WhatsApp
                    </CardDescription>
                  </div>
                  <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Template
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {selectedTemplate ? 'Editar Template' : 'Novo Template'}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label>Nome do Template</Label>
                            <Input placeholder="Ex: Lembrete de Vencimento" />
                          </div>
                          <div className="grid gap-2">
                            <Label>Tipo</Label>
                            <Select defaultValue="email">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="email">E-mail</SelectItem>
                                <SelectItem value="sms">SMS</SelectItem>
                                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label>Assunto (apenas e-mail)</Label>
                          <Input placeholder="Assunto do e-mail" />
                        </div>
                        <div className="grid gap-2">
                          <Label>Conteúdo da Mensagem</Label>
                          <Textarea 
                            placeholder="Digite o conteúdo da mensagem..."
                            className="min-h-[200px] font-mono text-sm"
                          />
                        </div>
                        <div className="p-3 rounded-lg bg-muted">
                          <p className="text-sm font-medium mb-2">Variáveis disponíveis:</p>
                          <div className="flex flex-wrap gap-2">
                            {['{{cliente}}', '{{valor}}', '{{data_vencimento}}', '{{link_pagamento}}', '{{empresa}}', '{{dias_atraso}}'].map(v => (
                              <Badge key={v} variant="outline" className="cursor-pointer hover:bg-primary/10">
                                {v}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button className="w-full">Salvar Template</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {templates.map((template) => {
                    const tipoConfig = {
                      email: { icon: Mail, color: 'text-secondary', bg: 'bg-secondary/10' },
                      sms: { icon: MessageSquare, color: 'text-success', bg: 'bg-success/10' },
                      whatsapp: { icon: Phone, color: 'text-success', bg: 'bg-success/10' },
                    }[template.tipo];
                    const Icon = tipoConfig.icon;

                    return (
                      <motion.div 
                        key={template.id}
                        variants={itemVariants}
                        className="p-4 rounded-lg border hover:shadow-md transition-all"
                      >
                        <div className="flex items-start gap-4">
                          <div className={cn("p-2 rounded-lg", tipoConfig.bg)}>
                            <Icon className={cn("h-5 w-5", tipoConfig.color)} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{template.nome}</h4>
                              <Badge variant="secondary">{template.tipo.toUpperCase()}</Badge>
                            </div>
                            {template.assunto && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Assunto: {template.assunto}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {template.conteudo}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon">
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Notificações */}
        <TabsContent value="notificacoes">
          <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Push Notifications Config */}
            <NotificacoesConfig />

            <Card>
              <CardHeader>
                <CardTitle>Preferências de Notificação</CardTitle>
                <CardDescription>
                  Configure como e quando deseja receber alertas do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <motion.div variants={itemVariants} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary/10">
                      <Mail className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-medium">Notificações por E-mail</p>
                      <p className="text-sm text-muted-foreground">Receba alertas importantes por e-mail</p>
                    </div>
                  </div>
                  <Switch 
                    checked={preferencias.notificacoesEmail}
                    onCheckedChange={(checked) => setPreferencias(p => ({ ...p, notificacoesEmail: checked }))}
                  />
                </motion.div>

                <Separator />

                <motion.div variants={itemVariants} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-warning/10">
                      <AlertTriangle className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p className="font-medium">Alertas de Vencimento</p>
                      <p className="text-sm text-muted-foreground">Dias de antecedência para alertar</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pl-12">
                    <Slider 
                      value={[preferencias.alertasVencimento]}
                      onValueChange={([value]) => setPreferencias(p => ({ ...p, alertasVencimento: value }))}
                      max={7}
                      min={1}
                      step={1}
                      className="flex-1"
                    />
                    <span className="font-medium w-16">{preferencias.alertasVencimento} dias</span>
                  </div>
                </motion.div>

                <Separator />

                <motion.div variants={itemVariants} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-destructive/10">
                      <CreditCard className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium">Alertas de Fluxo de Caixa</p>
                      <p className="text-sm text-muted-foreground">Alertar quando saldo projetado ficar negativo</p>
                    </div>
                  </div>
                  <Switch 
                    checked={preferencias.alertasFluxoCaixa}
                    onCheckedChange={(checked) => setPreferencias(p => ({ ...p, alertasFluxoCaixa: checked }))}
                  />
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Agendamentos / Cron Jobs */}
        <TabsContent value="agendamentos">
          <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
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

        {/* OCR de Comprovantes */}
        <TabsContent value="ocr">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ComprovanteOCR />
            <DocumentacaoAPI />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
