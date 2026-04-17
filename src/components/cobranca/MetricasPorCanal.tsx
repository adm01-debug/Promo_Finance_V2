import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, Mail, MessageSquare, Smartphone, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricaCanal {
  canal: string;
  enviados: number;
  abertos: number;
  pagos: number;
  taxaConversao: number;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
} as const;

export function MetricasPorCanal({ metricas }: { metricas: MetricaCanal[] }) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Performance por Canal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metricas.map((canal, index) => (
              <motion.div
                key={canal.canal}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-xl border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  {canal.canal === 'Email' && <Mail className="h-5 w-5 text-secondary" />}
                  {canal.canal === 'WhatsApp' && <MessageSquare className="h-5 w-5 text-success" />}
                  {canal.canal === 'SMS' && <Smartphone className="h-5 w-5 text-warning" />}
                  {canal.canal === 'Telefone' && <Phone className="h-5 w-5 text-primary" />}
                  <span className="font-semibold">{canal.canal}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Enviados</span>
                    <span className="font-medium">{canal.enviados}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Abertos</span>
                    <span className="font-medium">{canal.abertos}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pagos</span>
                    <span className="font-medium text-success">{canal.pagos}</span>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Conversão</span>
                      <Badge className={cn(
                        canal.taxaConversao >= 50 ? "bg-success text-success-foreground" :
                        canal.taxaConversao >= 35 ? "bg-warning text-warning-foreground" :
                        "bg-destructive text-destructive-foreground"
                      )}>
                        {canal.taxaConversao}%
                      </Badge>
                    </div>
                    <Progress value={canal.taxaConversao} className="h-1.5 mt-2" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
