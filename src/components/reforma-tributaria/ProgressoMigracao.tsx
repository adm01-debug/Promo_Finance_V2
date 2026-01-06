// ============================================
// PROGRESSO DA MIGRAÇÃO - VISUAL APRIMORADO
// Barra de progresso com microinterações
// ============================================

import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Props {
  percentual: number;
  fase: string;
}

const MARCOS = [
  { percent: 0, year: '2024', label: 'Início' },
  { percent: 10, year: '2026', label: 'Teste' },
  { percent: 40, year: '2027', label: 'Transição' },
  { percent: 70, year: '2029', label: 'Avançado' },
  { percent: 100, year: '2033', label: 'Completo' },
];

export function ProgressoMigracao({ percentual, fase }: Props) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Progresso da Transição
            </CardTitle>
            <CardDescription>
              Migração do sistema tributário antigo para IBS/CBS
            </CardDescription>
          </div>
          <Badge 
            variant={percentual >= 100 ? "default" : "secondary"}
            className="text-sm px-3 py-1"
          >
            {percentual.toFixed(0)}% migrado
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Barra de progresso com gradiente */}
        <div className="relative h-4 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentual}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 via-primary to-emerald-500 rounded-full"
          />
          
          {/* Efeito de brilho */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              repeatDelay: 3,
              ease: 'linear'
            }}
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          />
        </div>

        {/* Marcos */}
        <div className="relative mt-6 px-2">
          <div className="flex justify-between">
            {MARCOS.map((marco, i) => {
              const isCompleted = percentual >= marco.percent;
              const isCurrent = percentual >= marco.percent && 
                (i === MARCOS.length - 1 || percentual < MARCOS[i + 1].percent);

              return (
                <div 
                  key={marco.percent}
                  className="flex flex-col items-center"
                  style={{ flex: i === 0 ? 0 : 1 }}
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                      isCompleted 
                        ? "bg-primary border-primary text-primary-foreground" 
                        : "bg-muted border-muted-foreground/30 text-muted-foreground",
                      isCurrent && "ring-4 ring-primary/20 animate-pulse"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <span className="text-xs font-medium">{i + 1}</span>
                    )}
                  </motion.div>
                  <span className={cn(
                    "mt-2 text-xs font-medium",
                    isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {marco.year}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {marco.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Linha conectora */}
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-muted -z-10" />
        </div>

        {/* Labels */}
        <div className="flex justify-between mt-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-muted-foreground/30" />
            ICMS/ISS/PIS/COFINS
          </span>
          <ArrowRight className="h-4 w-4" />
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-gradient-to-r from-primary to-emerald-500" />
            IBS + CBS
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProgressoMigracao;
