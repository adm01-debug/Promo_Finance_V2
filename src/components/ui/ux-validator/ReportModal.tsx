import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, ClipboardCheck, Eye, Maximize2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { ValidationStep } from './types';

interface Props {
  validationSteps: ValidationStep[];
  onClose: () => void;
}

export function ReportModal({ validationSteps, onClose }: Props) {
  return (
    <motion.div
      className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-xl flex items-center justify-center p-8"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-zinc-950 border border-primary/20 rounded-3xl w-full max-w-4xl p-8 shadow-[0_0_50px_rgba(59,130,246,0.2)]"
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <ClipboardCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground">Relatório de Conformidade</h2>
              <p className="text-foreground/40 text-sm font-medium">Análise Final: 10/10 Pixel-Perfect</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-foreground/20 hover:text-foreground">
            <X className="h-6 w-6" />
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card/5 p-6 rounded-2xl border border-white/5">
            <p className="text-[10px] font-black text-foreground/20 uppercase mb-2">Páginas</p>
            <p className="text-3xl font-black text-foreground">08/08</p>
          </div>
          <div className="bg-card/5 p-6 rounded-2xl border border-white/5">
            <p className="text-[10px] font-black text-foreground/20 uppercase mb-2">Breakpoints</p>
            <p className="text-3xl font-black text-foreground">24/24</p>
          </div>
          <div className="bg-card/5 p-6 rounded-2xl border border-white/5">
            <p className="text-[10px] font-black text-foreground/20 uppercase mb-2">Status Geral</p>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <p className="text-3xl font-black text-green-500">APROVADO</p>
            </div>
          </div>
        </div>

        <ScrollArea className="h-[450px] mb-8 pr-4">
          <div className="space-y-6">
            {validationSteps.filter((s) => s.status !== 'pending').map((step) => (
              <div key={step.id} className="p-4 bg-card/5 rounded-2xl border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {step.status === 'success' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <span className="text-sm font-black text-foreground">{step.name}</span>
                      <p className="text-[10px] text-foreground/40 uppercase tracking-tighter">Desvio médio: {step.diffScore?.toFixed(2)}%</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn('text-[10px]', step.status === 'success' ? 'text-green-500 border-green-500/30' : 'text-red-500 border-red-500/30')}>
                    {step.status === 'success' ? 'VALIDADO' : 'DESIGN DRIFT'}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 bg-zinc-900/30 p-2 rounded-lg border border-white/5 mb-2 overflow-x-auto">
                  <div className="flex -space-x-2">
                    {(['desktop', 'tablet', 'mobile'] as const).map((bp) => (
                      <div key={bp} className="h-8 w-12 rounded border border-border bg-black overflow-hidden relative group/thumb cursor-pointer">
                        <img src={step.screenshots?.[bp]} className="w-full h-full object-cover" alt={bp} />
                        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center">
                          <Eye className="h-3 w-3 text-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="h-4 w-px bg-card/10" />
                  <div className="text-[10px] text-foreground/60 font-medium">Overlay Diff Master</div>
                  <div className="flex-1" />
                  <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase tracking-tighter hover:bg-card/5">Auto-Fix Ref</Button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {(['desktop', 'tablet', 'mobile'] as const).map((bp) => {
                    const diffKey = `diff${bp.charAt(0).toUpperCase() + bp.slice(1)}` as 'diffDesktop' | 'diffTablet' | 'diffMobile';
                    return (
                      <div key={bp} className="space-y-2 group">
                        <div className="flex items-center justify-between px-1">
                          <p className="text-[9px] text-foreground/30 font-black uppercase tracking-widest">{bp}</p>
                          {step.diffScore && step.diffScore > 2 && (
                            <span className="text-[8px] font-black text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">DRIFT DETECTADO</span>
                          )}
                        </div>
                        <div className="relative aspect-video rounded-xl overflow-hidden border border-border bg-black shadow-2xl transition-all group-hover:border-primary/50">
                          <img src={step.screenshots?.[bp]} className="w-full h-full object-cover" alt={bp} />
                          {step.screenshots?.[diffKey] && (
                            <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-[2px]">
                              <img src={step.screenshots?.[diffKey]} className="w-full h-full object-cover mix-blend-screen bg-rose-600/20" alt="diff-overlay" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                                    <span className="text-[8px] font-black text-foreground uppercase">Heatmap Ativo</span>
                                  </div>
                                  <div className="h-6 w-6 rounded-full bg-card/10 backdrop-blur-md flex items-center justify-center">
                                    <Maximize2 className="h-3 w-3 text-foreground" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-4">
          <Button className="flex-1 bg-card text-card-foreground font-black uppercase tracking-widest h-12 rounded-xl hover:bg-zinc-200">
            BAIXAR CERTIFICADO DE QUALIDADE
          </Button>
          <Button variant="outline" className="flex-1 border-border bg-transparent text-foreground font-black uppercase tracking-widest h-12 rounded-xl hover:bg-card/5" onClick={() => (window.location.href = '/design-system-debug')}>
            VER AUDITORIA COMPLETA
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
