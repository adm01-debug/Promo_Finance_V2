import { motion } from 'framer-motion';
import { 
  Link2, Zap, Phone, Globe, Package, CreditCard, 
  RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck,
  ExternalLink, Code2, Database, Key
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OpenFinancePanel } from '@/components/integracoes/OpenFinancePanel';
import { WhatsAppConfigPanel } from '@/components/integracoes/WhatsAppConfigPanel';
import { DocumentacaoAPI } from '@/components/api/DocumentacaoAPI';
import { Separator } from '@/components/ui/separator';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Integracoes() {
  const integrationStats = [
    { label: 'Ativas', value: '4', icon: CheckCircle2, color: 'text-success' },
    { label: 'Em Configuração', value: '2', icon: RefreshCw, color: 'text-warning' },
    { label: 'Endpoints API', value: '54', icon: Code2, color: 'text-primary' },
    { label: 'Requisições/24h', value: '12.4k', icon: Zap, color: 'text-accent' },
  ];

  const integrations = [
    { 
      name: 'Bling ERP v3', 
      desc: 'Sincronização de notas, produtos e pedidos', 
      status: 'ativo', 
      icon: Package, 
      category: 'ERP' 
    },
    { 
      name: 'Asaas Pagamentos', 
      desc: 'Emissão de boletos, pix e cobranças', 
      status: 'ativo', 
      icon: CreditCard, 
      category: 'Fintech' 
    },
    { 
      name: 'Bitrix24 CRM', 
      desc: 'Sincronização de contatos e negócios', 
      status: 'configurando', 
      icon: Link2, 
      category: 'CRM' 
    },
    { 
      name: 'WhatsApp IA', 
      desc: 'Chatbot inteligente e régua proativa', 
      status: 'ativo', 
      icon: Phone, 
      category: 'Comunicação' 
    },
  ];

  return (
    <MainLayout>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Link2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Hub de Integrações</h1>
              <p className="text-muted-foreground">Central de comando do ecossistema conectado</p>
            </div>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Nova Integração
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {integrationStats.map((stat) => (
            <Card key={stat.label} className="border-border/50 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{stat.label}</p>
                  <p className={`text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 opacity-20 ${stat.color}`} />
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Quick List */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {integrations.map((int) => (
            <Card key={int.name} className="group hover:border-primary/50 transition-all cursor-pointer">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg ${int.status === 'ativo' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                    <int.icon className="h-5 w-5" />
                  </div>
                  <Badge variant={int.status === 'ativo' ? 'success' : 'warning'} className="text-[10px]">
                    {int.status.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-bold group-hover:text-primary transition-colors">{int.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">{int.desc}</p>
                </div>
                <div className="pt-2 border-t flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{int.category}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        <Separator className="opacity-50" />

        {/* Tabs for detailed config */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="open-finance" className="space-y-6">
            <TabsList className="bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="open-finance" className="gap-2 rounded-lg">
                <Globe className="h-4 w-4" /> Open Finance
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="gap-2 rounded-lg">
                <Phone className="h-4 w-4" /> WhatsApp Config
              </TabsTrigger>
              <TabsTrigger value="api-docs" className="gap-2 rounded-lg">
                <Code2 className="h-4 w-4" /> API & Webhooks
              </TabsTrigger>
              <TabsTrigger value="credentials" className="gap-2 rounded-lg">
                <Key className="h-4 w-4" /> Credenciais
              </TabsTrigger>
            </TabsList>

            <TabsContent value="open-finance" className="space-y-6">
              <OpenFinancePanel />
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-6">
              <WhatsAppConfigPanel />
            </TabsContent>

            <TabsContent value="api-docs" className="space-y-6">
              <DocumentacaoAPI />
            </TabsContent>

            <TabsContent value="credentials">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Cofre de Credenciais
                  </CardTitle>
                  <CardDescription>Gerencie suas chaves de API e segredos de forma segura</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 p-8 rounded-xl border border-dashed text-center">
                    <Database className="h-10 w-10 mx-auto mb-4 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">As credenciais são protegidas por criptografia de nível militar AES-256-GCM.</p>
                    <Button variant="outline" className="mt-4 gap-2">
                      <RefreshCw className="h-4 w-4" /> Rotacionar Chaves Master
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </MainLayout>
  );
}

function Plus(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}
