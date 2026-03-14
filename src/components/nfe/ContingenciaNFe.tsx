import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  Wifi,
  WifiOff,
  Server,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Upload,
  FileText,
  Zap,
  Shield,
  Activity,
  AlertCircle,
  Play,
  Pause,
  Settings,
  History,
  Loader2,
  Settings2,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { toast } from 'sonner';
import {
  ContingencyMode,
  ContingencyState,
  PendingNFe,
  SefazHealthStatus,
  TIPO_EMISSAO,
  MOTIVOS_CONTINGENCIA,
  getContingencyState,
  getSefazHealthStatus,
  activateContingency,
  deactivateContingency,
  checkSefazHealth,
  getContingencyStats,
  updatePendingNFe,
  removePendingNFe,
  getAutoContingencyConfig,
  runAutoContingencyCheck,
} from '@/lib/sefaz-contingency';
import { registrarEvento } from '@/lib/sefaz-event-logger';
import { AutoContingenciaConfig } from './AutoContingenciaConfig';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const modeConfig: Record<ContingencyMode, { color: string; icon: typeof Wifi; description: string }> = {
  normal: { color: 'bg-success/10 text-success border-success/20', icon: Wifi, description: 'Operação normal' },
  SCAN: { color: 'bg-primary/10 text-primary border-primary/20', icon: Server, description: 'SCAN - Ambiente Nacional' },
  DPEC: { color: 'bg-warning/10 text-warning border-warning/20', icon: FileText, description: 'DPEC - Declaração Prévia' },
  FSDA: { color: 'bg-accent text-accent-foreground border-accent', icon: FileText, description: 'FS-DA - Formulário de Segurança' },
  SVCAN: { color: 'bg-secondary text-secondary-foreground border-secondary', icon: Server, description: 'SVC-AN - SEFAZ Virtual Nacional' },
  SVCRS: { color: 'bg-muted text-muted-foreground border-border', icon: Server, description: 'SVC-RS - SEFAZ Virtual RS' },
  offline: { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: WifiOff, description: 'Modo Offline' },
};

export function ContingenciaNFe() {
  const [state, setState] = useState<ContingencyState>(getContingencyState());
  const [health, setHealth] = useState<SefazHealthStatus>(getSefazHealthStatus());
  const [isChecking, setIsChecking] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [autoCheck, setAutoCheck] = useState(true);
  const [activeTab, setActiveTab] = useState('status');
  const autoConfig = getAutoContingencyConfig();
  
  // Formulário de ativação
  const [selectedMode, setSelectedMode] = useState<ContingencyMode>('offline');
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('2');

  const stats = getContingencyStats();
  const isContingencyActive = state.mode !== 'normal';

  // Verificação automática de saúde com regras
  useEffect(() => {
    if (!autoCheck) return;
    
    const interval = setInterval(async () => {
      const result = await runAutoContingencyCheck();
      setHealth(getSefazHealthStatus());
      setState(getContingencyState());
      
      if (result.action === 'activated' && result.rule) {
        registrarEvento({
          tipo: 'CONTINGENCIA',
          cStat: 'CONT_AUTO_ATIVADA',
          xMotivo: `Contingência automática: ${result.rule.name}`,
          detalhes: result.rule.reason,
          ambiente: 'homologacao',
        });
        
        if (autoConfig.notifyOnActivation) {
          toast.warning(`Contingência automática ativada: ${result.rule.name}`);
        }
      } else if (result.action === 'deactivated') {
        registrarEvento({
          tipo: 'CONTINGENCIA',
          cStat: 'CONT_AUTO_DESATIVADA',
          xMotivo: 'Contingência desativada automaticamente',
          detalhes: 'SEFAZ voltou a ficar disponível',
          ambiente: 'homologacao',
        });
        
        if (autoConfig.notifyOnDeactivation) {
          toast.success('Contingência desativada automaticamente');
        }
      }
    }, autoConfig.checkIntervalSeconds * 1000);

    return () => clearInterval(interval);
  }, [autoCheck, autoConfig.checkIntervalSeconds, autoConfig.notifyOnActivation, autoConfig.notifyOnDeactivation]);

  const handleCheckHealth = async () => {
    setIsChecking(true);
    try {
      const newHealth = await checkSefazHealth();
      setHealth(newHealth);
      setState(getContingencyState());
      
      if (newHealth.online) {
        toast.success('SEFAZ está online e operacional');
      } else {
        toast.warning('SEFAZ está indisponível');
      }
    } catch (error: unknown) {
      toast.error('Erro ao verificar status da SEFAZ');
    } finally {
      setIsChecking(false);
    }
  };

  const handleActivateContingency = () => {
    const reason = selectedReason === 'Outro motivo' ? customReason : selectedReason;
    if (!reason) {
      toast.error('Informe o motivo da contingência');
      return;
    }

    const estimatedReturn = new Date();
    estimatedReturn.setHours(estimatedReturn.getHours() + parseInt(estimatedHours));

    const newState = activateContingency(
      selectedMode,
      reason,
      'Usuário',
      estimatedReturn,
      false
    );

    registrarEvento({
      tipo: 'CONTINGENCIA',
      cStat: 'CONT_ATIVADA',
      xMotivo: `Modo de contingência ${TIPO_EMISSAO[selectedMode].label} ativado`,
      detalhes: reason,
      ambiente: 'homologacao',
    });

    setState(newState);
    setShowActivateDialog(false);
    toast.success(`Modo de contingência ${TIPO_EMISSAO[selectedMode].label} ativado`);
  };

  const handleDeactivateContingency = () => {
    if (stats.totalPending > 0) {
      toast.error('Transmita todas as NF-e pendentes antes de desativar');
      return;
    }

    const newState = deactivateContingency();

    registrarEvento({
      tipo: 'CONTINGENCIA',
      cStat: 'CONT_DESATIVADA',
      xMotivo: 'Modo de contingência desativado',
      detalhes: 'Sistema voltou ao modo normal de operação',
      ambiente: 'homologacao',
    });

    setState(newState);
    setShowDeactivateDialog(false);
    toast.success('Modo de contingência desativado');
  };

  const handleTransmitPending = async () => {
    if (!health.online) {
      toast.error('SEFAZ ainda está indisponível');
      return;
    }

    setIsTransmitting(true);
    const pending = state.pendingNFes.filter(n => n.status === 'pendente');

    for (const nfe of pending) {
      updatePendingNFe(nfe.id, { status: 'transmitindo', ultimaTentativa: new Date() });
      setState(getContingencyState());

      // Simula transmissão
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

      // 90% de sucesso
      const success = Math.random() > 0.1;
      
      if (success) {
        removePendingNFe(nfe.id);
        registrarEvento({
          tipo: 'AUTORIZACAO',
          cStat: '100',
          xMotivo: `NF-e ${nfe.numero} autorizada após contingência`,
          chaveAcesso: nfe.chaveAcesso,
          ambiente: 'homologacao',
        });
        toast.success(`NF-e ${nfe.numero} autorizada com sucesso`);
      } else {
        updatePendingNFe(nfe.id, { 
          status: 'rejeitada', 
          tentativas: nfe.tentativas + 1,
          erro: 'Erro na transmissão - tentar novamente'
        });
        toast.error(`Erro ao transmitir NF-e ${nfe.numero}`);
      }

      setState(getContingencyState());
    }

    setIsTransmitting(false);
    toast.success('Transmissão de NF-e pendentes concluída');
  };

  const ModeIcon = modeConfig[state.mode].icon;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-2 max-w-md">
        <TabsTrigger value="status" className="gap-2">
          <Shield className="h-4 w-4" />
          Status e Controle
        </TabsTrigger>
        <TabsTrigger value="config" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Regras Automáticas
        </TabsTrigger>
      </TabsList>

      <TabsContent value="status">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
      {/* Status Header */}
      <motion.div variants={itemVariants}>
        <Card className={isContingencyActive ? 'border-amber-500/50 bg-amber-500/5' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${modeConfig[state.mode].color}`}>
                  <ModeIcon className="h-8 w-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold">
                      {isContingencyActive ? 'Modo de Contingência Ativo' : 'Operação Normal'}
                    </h2>
                    <Badge variant="outline" className={modeConfig[state.mode].color}>
                      {TIPO_EMISSAO[state.mode].label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {modeConfig[state.mode].description}
                  </p>
                  {isContingencyActive && state.activatedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Ativado em {formatDateTime(state.activatedAt.toISOString())} por {state.activatedBy}
                      {state.autoActivated && ' (automático)'}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isContingencyActive ? (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDeactivateDialog(true)}
                    className="gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Desativar Contingência
                  </Button>
                ) : (
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowActivateDialog(true)}
                    className="gap-2"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Ativar Contingência
                  </Button>
                )}
              </div>
            </div>

            {isContingencyActive && state.reason && (
              <div className="mt-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Motivo: {state.reason}</span>
                </div>
                {state.estimatedReturn && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Previsão de retorno: {formatDateTime(state.estimatedReturn.toISOString())}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* SEFAZ Health */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${health.online ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                  {health.online ? (
                    <Wifi className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status SEFAZ</p>
                  <p className="font-bold">{health.online ? 'Online' : 'Offline'}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleCheckHealth}
                disabled={isChecking}
              >
                <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Latência: {health.latency}ms • Última verificação: {formatDateTime(health.lastCheck.toISOString())}
            </div>
          </CardContent>
        </Card>

        {/* NF-e Pendentes */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stats.totalPending > 0 ? 'bg-amber-500/10' : 'bg-muted'}`}>
                <FileText className={`h-5 w-5 ${stats.totalPending > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">NF-e Pendentes</p>
                <p className="font-bold text-2xl">{stats.totalPending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Valor Pendente */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Pendente</p>
                <p className="font-bold text-lg">{formatCurrency(stats.pendingValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Auto Check */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monitoramento</p>
                  <p className="font-medium">{autoCheck ? 'Automático' : 'Manual'}</p>
                </div>
              </div>
              <Switch checked={autoCheck} onCheckedChange={setAutoCheck} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* NF-e Pendentes List */}
      {stats.totalPending > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  NF-e Aguardando Transmissão
                </CardTitle>
                <CardDescription>
                  NF-e emitidas em contingência pendentes de autorização
                </CardDescription>
              </div>
              <Button
                onClick={handleTransmitPending}
                disabled={!health.online || isTransmitting}
                className="gap-2"
              >
                {isTransmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Transmitir Pendentes
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <AnimatePresence>
                  {state.pendingNFes.map((nfe) => (
                    <motion.div
                      key={nfe.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${
                          nfe.status === 'pendente' ? 'bg-amber-500/10' :
                          nfe.status === 'transmitindo' ? 'bg-blue-500/10' :
                          nfe.status === 'autorizada' ? 'bg-emerald-500/10' :
                          'bg-red-500/10'
                        }`}>
                          {nfe.status === 'transmitindo' ? (
                            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                          ) : nfe.status === 'autorizada' ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : nfe.status === 'rejeitada' ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <Clock className="h-5 w-5 text-amber-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">NF-e #{nfe.numero}</p>
                          <p className="text-sm text-muted-foreground">{nfe.destinatario}</p>
                          {nfe.erro && (
                            <p className="text-xs text-red-500 mt-1">{nfe.erro}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(nfe.valorTotal)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(nfe.dataEmissao.toISOString())}
                        </p>
                        {nfe.tentativas > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {nfe.tentativas} tentativa(s)
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Contingency Modes Info */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Modos de Contingência Disponíveis
            </CardTitle>
            <CardDescription>
              Opções de emissão quando a SEFAZ está indisponível
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(TIPO_EMISSAO).filter(([key]) => key !== 'normal').map(([key, value]) => (
                <div 
                  key={key}
                  className={`p-4 rounded-lg border ${modeConfig[key as ContingencyMode].color}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{value.code}</Badge>
                    <span className="font-medium">{value.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Activate Dialog */}
      <Dialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Ativar Modo de Contingência
            </DialogTitle>
            <DialogDescription>
              A emissão em contingência permite gerar NF-e quando a SEFAZ está indisponível.
              As notas serão transmitidas posteriormente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Contingência</Label>
              <Select value={selectedMode} onValueChange={(v) => setSelectedMode(v as ContingencyMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_EMISSAO)
                    .filter(([key]) => key !== 'normal')
                    .map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.label} - {value.description}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Motivo da Contingência</Label>
              <Select value={selectedReason} onValueChange={setSelectedReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  {MOTIVOS_CONTINGENCIA.map((motivo) => (
                    <SelectItem key={motivo} value={motivo}>
                      {motivo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedReason === 'Outro motivo' && (
              <div className="space-y-2">
                <Label>Especifique o motivo</Label>
                <Textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Descreva o motivo da contingência..."
                  rows={3}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Previsão de retorno (horas)</Label>
              <Input
                type="number"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                min="1"
                max="72"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActivateDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleActivateContingency} className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Ativar Contingência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Dialog */}
      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Desativar Modo de Contingência
            </DialogTitle>
            <DialogDescription>
              {stats.totalPending > 0 
                ? `Existem ${stats.totalPending} NF-e pendentes de transmissão. Transmita todas antes de desativar.`
                : 'O sistema voltará ao modo normal de operação com a SEFAZ.'}
            </DialogDescription>
          </DialogHeader>

          {stats.totalPending > 0 && (
            <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {stats.totalPending} NF-e pendente(s) - {formatCurrency(stats.pendingValue)}
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeactivateDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleDeactivateContingency}
              disabled={stats.totalPending > 0}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              Desativar e Voltar ao Normal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </motion.div>
      </TabsContent>

      <TabsContent value="config">
        <AutoContingenciaConfig />
      </TabsContent>
    </Tabs>
  );
}
