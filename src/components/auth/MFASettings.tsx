import { useState } from 'react';
import { motion } from 'framer-motion';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMFA } from '@/hooks/useMFA';
import { useSessions } from '@/hooks/useSessions';
import { TwoFactorSetup } from './TwoFactorSetup';
import {
  Shield,
  Smartphone,
  Key,
  Monitor,
  Laptop,
  Tablet,
  Globe,
  Clock,
  Loader2,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function MFASettings() {
  const { factors, isEnabled, isLoading, unenroll } = useMFA();
  const { sessions, revokeSession, revokeAllOtherSessions, parseUserAgent } = useSessions();
  const [showSetup, setShowSetup] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disableFactorId, setDisableFactorId] = useState<string | null>(null);

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Monitor className="h-5 w-5" />;
    if (/iPhone|iPad/i.test(userAgent)) return <Smartphone className="h-5 w-5" />;
    if (/Android/i.test(userAgent)) return <Smartphone className="h-5 w-5" />;
    if (/Tablet/i.test(userAgent)) return <Tablet className="h-5 w-5" />;
    if (/Mac/i.test(userAgent)) return <Laptop className="h-5 w-5" />;
    return <Monitor className="h-5 w-5" />;
  };

  const handleDisableMFA = async () => {
    if (!disableFactorId) return;
    try {
      await unenroll(disableFactorId);
      setShowDisableDialog(false);
      setDisableFactorId(null);
    } catch (error: unknown) {
      logger.error('Erro ao desativar MFA:', error);
    }
  };

  if (showSetup) {
    return (
      <TwoFactorSetup
        onComplete={() => setShowSetup(false)}
        onSkip={() => setShowSetup(false)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="mfa" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mfa" className="gap-2">
            <Key className="h-4 w-4" />
            Autenticação 2FA
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2">
            <Globe className="h-4 w-4" />
            Sessões Ativas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mfa" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isEnabled ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
                    {isEnabled ? (
                      <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                    ) : (
                      <ShieldAlert className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    )}
                  </div>
                  <div>
                    <CardTitle>Autenticação de Dois Fatores</CardTitle>
                    <CardDescription>
                      {isEnabled
                        ? 'Sua conta está protegida com 2FA'
                        : 'Adicione uma camada extra de segurança'}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={isEnabled ? 'default' : 'secondary'}>
                  {isEnabled ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isEnabled ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-muted/50 rounded-lg p-4 space-y-4"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="font-medium">Recomendação de Segurança</p>
                      <p className="text-sm text-muted-foreground">
                        A autenticação de dois fatores protege sua conta mesmo que sua senha seja comprometida.
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => setShowSetup(true)} className="w-full gap-2">
                    <Shield className="h-4 w-4" />
                    Configurar 2FA
                  </Button>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {factors.filter(f => f.status === 'verified').map((factor) => (
                    <div
                      key={factor.id}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">
                            {factor.friendly_name || 'Authenticator App'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Adicionado em {format(new Date(factor.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setDisableFactorId(factor.id);
                          setShowDisableDialog(true);
                        }}
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sessões Ativas</CardTitle>
                  <CardDescription>
                    Gerencie os dispositivos conectados à sua conta
                  </CardDescription>
                </div>
                {sessions.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={revokeAllOtherSessions}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Encerrar Outras
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Nenhuma sessão ativa encontrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        session.is_current
                          ? 'border-primary/50 bg-primary/5'
                          : 'border-border bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {getDeviceIcon(session.user_agent)}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {session.device_info || parseUserAgent(session.user_agent)}
                            </p>
                            {session.is_current && (
                              <Badge variant="default" className="text-xs">
                                Atual
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {session.ip_address && (
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {session.ip_address}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(session.last_activity), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      {!session.is_current && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => revokeSession(session.id)}
                        >
                          <LogOut className="h-4 w-4" />
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar Autenticação 2FA?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao desativar a autenticação de dois fatores, sua conta ficará menos protegida.
              Você precisará configurar novamente se quiser reativar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDisableMFA}
            >
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
