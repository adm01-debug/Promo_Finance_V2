import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wifi, WifiOff, RefreshCw, Trash2, Clock, 
  CheckCircle2, XCircle, AlertTriangle, RotateCcw,
  CloudOff, Cloud, Upload
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOfflineSyncAdvanced, OperacaoPendente } from '@/hooks/useOfflineSyncAdvanced';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const tipoIcons = {
  INSERT: '➕',
  UPDATE: '✏️',
  DELETE: '🗑️'
};

const prioridadeCores = {
  alta: 'text-red-600 bg-red-100',
  media: 'text-amber-600 bg-amber-100',
  baixa: 'text-blue-600 bg-blue-100'
};

export default function OfflineSyncPanel() {
  const {
    status,
    operacoesPendentes,
    sincronizarTudo,
    limparErros,
    retryOperacao
  } = useOfflineSyncAdvanced();

  const operacoesComErro = operacoesPendentes.filter(o => o.tentativas >= 3);
  const operacoesPendentesValidas = operacoesPendentes.filter(o => o.tentativas < 3);

  return (
    <div className="space-y-6">
      {/* Header com Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {status.online ? (
              <Cloud className="h-6 w-6 text-green-500" />
            ) : (
              <CloudOff className="h-6 w-6 text-amber-500" />
            )}
            Sincronização Offline
          </h2>
          <p className="text-muted-foreground">
            Gerenciamento inteligente de operações offline
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge 
            variant={status.online ? 'default' : 'secondary'}
            className="text-lg px-4 py-2"
          >
            {status.online ? (
              <>
                <Wifi className="h-4 w-4 mr-2" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 mr-2" />
                Offline
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Cards de Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-amber-600">
                  {operacoesPendentesValidas.length}
                </p>
              </div>
              <Upload className="h-8 w-8 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Com Erro</p>
                <p className="text-2xl font-bold text-red-600">
                  {operacoesComErro.length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Última Sync</p>
                <p className="text-lg font-bold">
                  {status.ultimaSync 
                    ? formatDistanceToNow(new Date(status.ultimaSync), { locale: ptBR, addSuffix: true })
                    : 'Nunca'}
                </p>
              </div>
              <Clock className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-lg font-bold">
                  {status.sincronizando ? 'Sincronizando...' : 'Aguardando'}
                </p>
              </div>
              {status.sincronizando ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <RefreshCw className="h-8 w-8 text-primary" />
                </motion.div>
              ) : (
                <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações */}
      <div className="flex gap-3">
        <Button 
          onClick={sincronizarTudo}
          disabled={!status.online || status.sincronizando || operacoesPendentesValidas.length === 0}
        >
          {status.sincronizando ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
              </motion.div>
              Sincronizando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sincronizar Agora
            </>
          )}
        </Button>

        {operacoesComErro.length > 0 && (
          <Button variant="outline" onClick={limparErros}>
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Erros ({operacoesComErro.length})
          </Button>
        )}
      </div>

      {/* Lista de Operações */}
      <Card>
        <CardHeader>
          <CardTitle>Operações Pendentes</CardTitle>
          <CardDescription>
            Alterações aguardando sincronização com o servidor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {operacoesPendentes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
                <p className="font-medium">Tudo sincronizado!</p>
                <p className="text-sm">Não há operações pendentes</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {operacoesPendentes.map((op) => (
                    <motion.div
                      key={op.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`p-4 border rounded-lg ${
                        op.tentativas >= 3 ? 'border-red-200 bg-red-50 dark:bg-red-950/20' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{tipoIcons[op.tipo]}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{op.tabela}</span>
                              <Badge 
                                variant="outline" 
                                className={prioridadeCores[op.prioridade]}
                              >
                                {op.prioridade}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(op.criado_em), {
                                addSuffix: true,
                                locale: ptBR
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {op.tentativas > 0 && (
                            <div className="flex items-center gap-1 text-sm">
                              {op.tentativas >= 3 ? (
                                <XCircle className="h-4 w-4 text-red-500" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                              )}
                              <span>{op.tentativas}/3 tentativas</span>
                            </div>
                          )}
                          
                          {op.tentativas >= 3 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => retryOperacao(op.id)}
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Retry
                            </Button>
                          )}
                        </div>
                      </div>

                      {op.erro && (
                        <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-sm text-red-700 dark:text-red-300">
                          {op.erro}
                        </div>
                      )}

                      <div className="mt-2 text-xs text-muted-foreground">
                        <pre className="overflow-auto max-h-16">
                          {JSON.stringify(op.dados, null, 2)}
                        </pre>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
