import React, { useState } from 'react';
import { useResumosSemanais, type ResumoSemanal } from '@/hooks/useRelatoriosData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Calendar, ChevronRight, Sparkles, Download, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

export function RelatoriosResumosSemanais() {
  const { data: resumos = [], isLoading } = useResumosSemanais();
  const [selectedResumo, setSelectedResumo] = useState<ResumoSemanal | null>(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <div className="md:col-span-2">
          <Skeleton className="h-[600px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* List of Summaries */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/40 px-2">Histórico de Resumos</h3>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-3">
            {resumos.length === 0 ? (
              <div className="text-center py-12 text-foreground/20">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-10" />
                <p>Nenhum resumo gerado ainda.</p>
              </div>
            ) : (
              resumos.map((resumo) => (
                <button
                  key={resumo.id}
                  onClick={() => setSelectedResumo(resumo)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedResumo?.id === resumo.id
                      ? 'bg-primary/10 border-primary/30 ring-1 ring-primary/20'
                      : 'bg-card/5 border-white/10 hover:border-white/20 hover:bg-card/10'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase">
                      Semana {format(new Date(resumo.semana_inicio), 'dd/MM')} - {format(new Date(resumo.semana_fim), 'dd/MM')}
                    </Badge>
                    {resumo.enviado_em && (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[10px]">
                        Enviado
                      </Badge>
                    )}
                  </div>
                  <h4 className="text-white font-bold text-sm truncate">Resumo Executivo Quantum</h4>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-foreground/40">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(resumo.created_at), "PPP", { locale: ptBR })}
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Content Area */}
      <div className="md:col-span-2">
        <AnimatePresence mode="wait">
          {selectedResumo ? (
            <motion.div
              key={selectedResumo.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="bg-card/5 border-white/10 backdrop-blur-xl h-[600px] flex flex-col">
                <CardHeader className="border-b border-white/10 flex-shrink-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Resumo Semanal
                      </CardTitle>
                      <CardDescription>
                        Análise de IA para o período de {format(new Date(selectedResumo.semana_inicio), 'dd/MM/yyyy')} a {format(new Date(selectedResumo.semana_fim), 'dd/MM/yyyy')}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="bg-card/5 border-white/10 text-white">
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                      <Button variant="outline" size="sm" className="bg-card/5 border-white/10 text-white">
                        <Mail className="h-4 w-4 mr-2" />
                        Reenviar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow overflow-hidden p-0">
                  <ScrollArea className="h-full p-6">
                    <div className="prose prose-invert max-w-none prose-p:text-foreground/70 prose-headings:text-white prose-strong:text-primary">
                      <ReactMarkdown>{selectedResumo.resumo_md}</ReactMarkdown>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="h-[600px] rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center text-foreground/20 p-8 text-center">
              <Sparkles className="h-12 w-12 mb-4 opacity-10" />
              <h3 className="text-lg font-bold text-foreground/40 mb-2">Selecione um resumo</h3>
              <p className="max-w-xs text-sm">
                Escolha um resumo semanal no histórico ao lado para visualizar os insights e KPIs detalhados.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
