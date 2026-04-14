import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Upload, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import type { PendingNFe } from '@/lib/sefaz-contingency';

interface Props {
  pendingNFes: PendingNFe[];
  isOnline: boolean;
  isTransmitting: boolean;
  onTransmit: () => void;
}

export function ContingenciaPendingList({ pendingNFes, isOnline, isTransmitting, onTransmit }: Props) {
  if (pendingNFes.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-warning" />NF-e Aguardando Transmissão</CardTitle>
            <CardDescription>NF-e emitidas em contingência pendentes de autorização</CardDescription>
          </div>
          <Button onClick={onTransmit} disabled={!isOnline || isTransmitting} className="gap-2">
            {isTransmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Transmitir Pendentes
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <AnimatePresence>
              {pendingNFes.map((nfe) => (
                <motion.div key={nfe.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${nfe.status === 'autorizada' ? 'bg-success/10' : nfe.status === 'rejeitada' ? 'bg-destructive/10' : nfe.status === 'transmitindo' ? 'bg-primary/10' : 'bg-warning/10'}`}>
                      {nfe.status === 'autorizada' ? <CheckCircle2 className="h-5 w-5 text-success" /> : nfe.status === 'rejeitada' ? <XCircle className="h-5 w-5 text-destructive" /> : nfe.status === 'transmitindo' ? <Loader2 className="h-5 w-5 text-primary animate-spin" /> : <AlertTriangle className="h-5 w-5 text-warning" />}
                    </div>
                    <div>
                      <p className="font-medium">NF-e nº {nfe.numero}</p>
                      <p className="text-sm text-muted-foreground">{nfe.destinatario}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Emitida em {formatDateTime(nfe.emitidaEm.toISOString())} • {nfe.tentativas} tentativa(s)</p>
                      {nfe.erro && <p className="text-xs text-destructive mt-1">{nfe.erro}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(nfe.valor)}</p>
                    <Badge variant="outline" className={nfe.status === 'autorizada' ? 'bg-success/10 text-success' : nfe.status === 'rejeitada' ? 'bg-destructive/10 text-destructive' : nfe.status === 'transmitindo' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'}>
                      {nfe.status === 'autorizada' ? 'Autorizada' : nfe.status === 'rejeitada' ? 'Rejeitada' : nfe.status === 'transmitindo' ? 'Transmitindo...' : 'Pendente'}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
