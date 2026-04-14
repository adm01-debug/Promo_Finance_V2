import { History, CheckCircle2, X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ScoreBadgeIA } from './ScoreBadgeIA';

interface HistoricoItem {
  id: string;
  acao: string;
  tipo_lancamento: string;
  score_ia: number;
  confianca: 'alta' | 'media' | 'baixa';
  analise_ia?: string | null;
  created_at: string;
}

interface EstatisticasHistorico {
  totalAprovados: number;
  totalRejeitados: number;
  scoreMedia: number;
  altaConfianca: number;
  mediaConfianca: number;
  baixaConfianca: number;
}

interface HistoricoConciliacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  historico: HistoricoItem[];
  estatisticasHistorico: EstatisticasHistorico;
  isLoadingHistorico: boolean;
}

export function HistoricoConciliacaoDialog({
  open, onOpenChange, historico, estatisticasHistorico, isLoadingHistorico
}: HistoricoConciliacaoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Histórico de Conciliações IA
          </DialogTitle>
          <DialogDescription>
            Registro de todas as conciliações aprovadas e rejeitadas com IA
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="historico" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="historico">Histórico</TabsTrigger>
            <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
          </TabsList>

          <TabsContent value="historico" className="space-y-4">
            <ScrollArea className="h-[400px]">
              {isLoadingHistorico ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : historico.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum registro encontrado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {historico.map((item) => (
                    <div 
                      key={item.id}
                      className={cn(
                        "p-3 rounded-lg border",
                        item.acao === 'aprovado' 
                          ? "bg-success/5 border-success/20" 
                          : "bg-destructive/5 border-destructive/20"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {item.acao === 'aprovado' ? (
                            <CheckCircle2 className="h-5 w-5 text-success" />
                          ) : (
                            <X className="h-5 w-5 text-destructive" />
                          )}
                          <div>
                            <p className="text-sm font-medium">
                              {item.tipo_lancamento === 'receber' ? 'Conta a Receber' : 'Conta a Pagar'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(item.created_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <ScoreBadgeIA 
                            score={item.score_ia} 
                            confianca={item.confianca}
                            size="sm"
                          />
                          <Badge variant={item.acao === 'aprovado' ? 'default' : 'destructive'}>
                            {item.acao}
                          </Badge>
                        </div>
                      </div>
                      {item.analise_ia && (
                        <p className="text-xs text-muted-foreground mt-2 ml-8">
                          IA: {item.analise_ia}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="estatisticas" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-success">{estatisticasHistorico.totalAprovados}</p>
                    <p className="text-sm text-muted-foreground">Aprovados</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-destructive">{estatisticasHistorico.totalRejeitados}</p>
                    <p className="text-sm text-muted-foreground">Rejeitados</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{estatisticasHistorico.scoreMedia}%</p>
                    <p className="text-sm text-muted-foreground">Score Médio</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Distribuição por Confiança</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: 'Alta (≥80%)', count: estatisticasHistorico.altaConfianca },
                    { label: 'Média (60-79%)', count: estatisticasHistorico.mediaConfianca },
                    { label: 'Baixa (<60%)', count: estatisticasHistorico.baixaConfianca },
                  ].map(({ label, count }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-sm">{label}</span>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(count / (historico.length || 1)) * 100} 
                          className="w-32 h-2"
                        />
                        <span className="text-sm font-mono w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
