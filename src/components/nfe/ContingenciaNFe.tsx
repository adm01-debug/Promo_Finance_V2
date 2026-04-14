import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle, Wifi, WifiOff, Server, RefreshCw, FileText, Zap, Shield, Activity,
  AlertCircle, Play, Settings2, Loader2,
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { toast } from 'sonner';
import {
  ContingencyMode, ContingencyState, SefazHealthStatus, TIPO_EMISSAO,
  getContingencyState, getSefazHealthStatus, activateContingency, deactivateContingency,
  checkSefazHealth, getContingencyStats, updatePendingNFe, removePendingNFe,
  getAutoContingencyConfig, runAutoContingencyCheck,
} from '@/lib/sefaz-contingency';
import { registrarEvento } from '@/lib/sefaz-event-logger';
import { AutoContingenciaConfig } from './AutoContingenciaConfig';
import { ActivateContingencyDialog, DeactivateContingencyDialog } from './contingencia/ContingenciaDialogs';
import { ContingenciaPendingList } from './contingencia/ContingenciaPendingList';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

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
  const stats = getContingencyStats();
  const isContingencyActive = state.mode !== 'normal';

  useEffect(() => {
    if (!autoCheck) return;
    const interval = setInterval(async () => {
      const result = await runAutoContingencyCheck();
      setHealth(getSefazHealthStatus());
      setState(getContingencyState());
      if (result.action === 'activated' && result.rule) {
        registrarEvento({ tipo: 'CONTINGENCIA', cStat: 'CONT_AUTO_ATIVADA', xMotivo: `Contingência automática: ${result.rule.name}`, detalhes: result.rule.reason, ambiente: 'homologacao' });
        if (autoConfig.notifyOnActivation) toast.warning(`Contingência automática ativada: ${result.rule.name}`);
      } else if (result.action === 'deactivated') {
        registrarEvento({ tipo: 'CONTINGENCIA', cStat: 'CONT_AUTO_DESATIVADA', xMotivo: 'Contingência desativada automaticamente', detalhes: 'SEFAZ voltou a ficar disponível', ambiente: 'homologacao' });
        if (autoConfig.notifyOnDeactivation) toast.success('Contingência desativada automaticamente');
      }
    }, autoConfig.checkIntervalSeconds * 1000);
    return () => clearInterval(interval);
  }, [autoCheck, autoConfig.checkIntervalSeconds, autoConfig.notifyOnActivation, autoConfig.notifyOnDeactivation]);

  const handleCheckHealth = async () => {
    setIsChecking(true);
    try {
      const newHealth = await checkSefazHealth();
      setHealth(newHealth); setState(getContingencyState());
      toast[newHealth.online ? 'success' : 'warning'](newHealth.online ? 'SEFAZ está online e operacional' : 'SEFAZ está indisponível');
    } catch { toast.error('Erro ao verificar status da SEFAZ'); }
    finally { setIsChecking(false); }
  };

  const handleActivate = (mode: ContingencyMode, reason: string, hours: number) => {
    if (!reason) { toast.error('Informe o motivo da contingência'); return; }
    const estimatedReturn = new Date(); estimatedReturn.setHours(estimatedReturn.getHours() + hours);
    const newState = activateContingency(mode, reason, 'Usuário', estimatedReturn, false);
    registrarEvento({ tipo: 'CONTINGENCIA', cStat: 'CONT_ATIVADA', xMotivo: `Modo de contingência ${TIPO_EMISSAO[mode].label} ativado`, detalhes: reason, ambiente: 'homologacao' });
    setState(newState); setShowActivateDialog(false);
    toast.success(`Modo de contingência ${TIPO_EMISSAO[mode].label} ativado`);
  };

  const handleDeactivate = () => {
    if (stats.totalPending > 0) { toast.error('Transmita todas as NF-e pendentes antes de desativar'); return; }
    const newState = deactivateContingency();
    registrarEvento({ tipo: 'CONTINGENCIA', cStat: 'CONT_DESATIVADA', xMotivo: 'Modo de contingência desativado', detalhes: 'Sistema voltou ao modo normal de operação', ambiente: 'homologacao' });
    setState(newState); setShowDeactivateDialog(false); toast.success('Modo de contingência desativado');
  };

  const handleTransmitPending = async () => {
    if (!health.online) { toast.error('SEFAZ ainda está indisponível'); return; }
    setIsTransmitting(true);
    const pending = state.pendingNFes.filter(n => n.status === 'pendente');
    for (const nfe of pending) {
      updatePendingNFe(nfe.id, { status: 'transmitindo', ultimaTentativa: new Date() }); setState(getContingencyState());
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
      const success = Math.random() > 0.1;
      if (success) {
        removePendingNFe(nfe.id);
        registrarEvento({ tipo: 'AUTORIZACAO', cStat: '100', xMotivo: `NF-e ${nfe.numero} autorizada após contingência`, chaveAcesso: nfe.chaveAcesso, ambiente: 'homologacao' });
        toast.success(`NF-e ${nfe.numero} autorizada com sucesso`);
      } else {
        updatePendingNFe(nfe.id, { status: 'rejeitada', tentativas: nfe.tentativas + 1, erro: 'Erro na transmissão - tentar novamente' });
        toast.error(`Erro ao transmitir NF-e ${nfe.numero}`);
      }
      setState(getContingencyState());
    }
    setIsTransmitting(false); toast.success('Transmissão de NF-e pendentes concluída');
  };

  const ModeIcon = modeConfig[state.mode].icon;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-2 max-w-md">
        <TabsTrigger value="status" className="gap-2"><Shield className="h-4 w-4" />Status e Controle</TabsTrigger>
        <TabsTrigger value="config" className="gap-2"><Settings2 className="h-4 w-4" />Regras Automáticas</TabsTrigger>
      </TabsList>

      <TabsContent value="status">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          {/* Status Header */}
          <motion.div variants={itemVariants}>
            <Card className={isContingencyActive ? 'border-warning/50 bg-warning/5' : ''}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${modeConfig[state.mode].color}`}><ModeIcon className="h-8 w-8" /></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold">{isContingencyActive ? 'Modo de Contingência Ativo' : 'Operação Normal'}</h2>
                        <Badge variant="outline" className={modeConfig[state.mode].color}>{TIPO_EMISSAO[state.mode].label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{modeConfig[state.mode].description}</p>
                      {isContingencyActive && state.activatedAt && (
                        <p className="text-xs text-muted-foreground mt-1">Ativado em {formatDateTime(state.activatedAt.toISOString())} por {state.activatedBy}{state.autoActivated && ' (automático)'}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isContingencyActive ? (
                      <Button variant="outline" onClick={() => setShowDeactivateDialog(true)} className="gap-2"><Play className="h-4 w-4" />Desativar Contingência</Button>
                    ) : (
                      <Button variant="destructive" onClick={() => setShowActivateDialog(true)} className="gap-2"><AlertTriangle className="h-4 w-4" />Ativar Contingência</Button>
                    )}
                  </div>
                </div>
                {isContingencyActive && state.reason && (
                  <div className="mt-4 p-3 bg-warning/10 rounded-lg border border-warning/20">
                    <div className="flex items-center gap-2 text-warning"><AlertCircle className="h-4 w-4" /><span className="text-sm font-medium">Motivo: {state.reason}</span></div>
                    {state.estimatedReturn && <p className="text-xs text-muted-foreground mt-1">Previsão de retorno: {formatDateTime(state.estimatedReturn.toISOString())}</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${health.online ? 'bg-success/10' : 'bg-destructive/10'}`}>{health.online ? <Wifi className="h-5 w-5 text-success" /> : <WifiOff className="h-5 w-5 text-destructive" />}</div>
                  <div><p className="text-sm text-muted-foreground">Status SEFAZ</p><p className="font-bold">{health.online ? 'Online' : 'Offline'}</p></div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleCheckHealth} disabled={isChecking}><RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} /></Button>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Latência: {health.latency}ms</div>
            </CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className={`p-2 rounded-lg ${stats.totalPending > 0 ? 'bg-warning/10' : 'bg-muted'}`}><FileText className={`h-5 w-5 ${stats.totalPending > 0 ? 'text-warning' : 'text-muted-foreground'}`} /></div><div><p className="text-sm text-muted-foreground">NF-e Pendentes</p><p className="font-bold text-2xl">{stats.totalPending}</p></div></div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Zap className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Valor Pendente</p><p className="font-bold text-lg">{formatCurrency(stats.pendingValue)}</p></div></div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-muted"><Activity className="h-5 w-5 text-muted-foreground" /></div><div><p className="text-sm text-muted-foreground">Monitoramento</p><p className="font-medium">{autoCheck ? 'Automático' : 'Manual'}</p></div></div><Switch checked={autoCheck} onCheckedChange={setAutoCheck} /></div></CardContent></Card>
          </motion.div>

          <ContingenciaPendingList pendingNFes={state.pendingNFes} isOnline={health.online} isTransmitting={isTransmitting} onTransmit={handleTransmitPending} />
        </motion.div>
      </TabsContent>

      <TabsContent value="config"><AutoContingenciaConfig /></TabsContent>

      <ActivateContingencyDialog open={showActivateDialog} onOpenChange={setShowActivateDialog} onActivate={handleActivate} />
      <DeactivateContingencyDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog} hasPending={stats.totalPending > 0} onDeactivate={handleDeactivate} />
    </Tabs>
  );
}
