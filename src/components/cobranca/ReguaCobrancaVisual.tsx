import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCcw, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EtapaRegua {
  id: string;
  nome: string;
  dias: number;
  descricao: string;
  canal: string;
  icon: LucideIcon;
  cor: string;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
} as const;

interface Props {
  etapas: EtapaRegua[];
  getEtapaCount: (etapaId: string) => number;
}

export function ReguaCobrancaVisual({ etapas, getEtapaCount }: Props) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <RefreshCcw className="h-5 w-5 text-primary" />
            Régua de Cobrança Automática
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between overflow-x-auto pb-4">
            {etapas.map((etapa, index) => {
              const EtapaIcon = etapa.icon;
              const count = getEtapaCount(etapa.id);
              return (
                <div key={etapa.id} className="flex items-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "flex flex-col items-center p-4 rounded-xl border min-w-[140px] transition-all hover:shadow-md cursor-pointer relative",
                      etapa.cor
                    )}
                  >
                    {count > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs">
                        {count}
                      </Badge>
                    )}
                    <div className="h-12 w-12 rounded-full bg-background flex items-center justify-center mb-2">
                      <EtapaIcon className="h-6 w-6" />
                    </div>
                    <h4 className="font-semibold text-sm">{etapa.nome}</h4>
                    <p className="text-xs text-muted-foreground mt-1 text-center">{etapa.descricao}</p>
                    <Badge variant="outline" className="mt-2 text-xs">{etapa.canal}</Badge>
                  </motion.div>
                  {index < etapas.length - 1 && (
                    <div className="w-8 h-0.5 bg-border mx-2 hidden lg:block" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
