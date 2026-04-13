import { motion } from 'framer-motion';
import { Plus, Edit, Mail, MessageSquare, Phone, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const itemVariants = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } };

const canaisConfig = {
  email: { label: 'E-mail', icon: Mail, color: 'bg-secondary' },
  sms: { label: 'SMS', icon: MessageSquare, color: 'bg-success' },
  whatsapp: { label: 'WhatsApp', icon: Phone, color: 'bg-success' },
  telefone: { label: 'Telefone', icon: Phone, color: 'bg-accent' },
};

interface EtapaConfig {
  id: string; nome: string; diasAposVencimento: number;
  canais: ('email' | 'sms' | 'whatsapp' | 'telefone')[]; ativo: boolean; cor: string;
}

interface ReguaCobrancaTabProps {
  etapas: EtapaConfig[];
  onToggleEtapa: (id: string) => void;
}

export function ReguaCobrancaTab({ etapas, onToggleEtapa }: ReguaCobrancaTabProps) {
  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div><CardTitle>Régua de Cobrança Automática</CardTitle><CardDescription>Configure as etapas e canais de comunicação para cobrança automática</CardDescription></div>
            <Button><Plus className="h-4 w-4 mr-2" />Nova Etapa</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-8">
            <div className="absolute top-6 left-0 right-0 h-1 bg-muted rounded-full" />
            <div className="relative flex justify-between">
              {etapas.filter(e => e.ativo).map((etapa) => (
                <div key={etapa.id} className="flex flex-col items-center">
                  <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white font-bold z-10", etapa.cor)}>
                    {etapa.diasAposVencimento < 0 ? etapa.diasAposVencimento : `+${etapa.diasAposVencimento}`}
                  </div>
                  <p className="text-xs text-center mt-2 max-w-[80px]">{etapa.nome}</p>
                </div>
              ))}
            </div>
          </div>
          <Separator className="my-6" />
          <div className="space-y-4">
            {etapas.map((etapa) => (
              <motion.div key={etapa.id} variants={itemVariants} className={cn("p-4 rounded-lg border transition-all", etapa.ativo ? "bg-card" : "bg-muted/50 opacity-60")}>
                <div className="flex items-center gap-4">
                  <div className={cn("w-3 h-3 rounded-full", etapa.cor)} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{etapa.nome}</h4>
                      <Badge variant="outline">{etapa.diasAposVencimento < 0 ? `${Math.abs(etapa.diasAposVencimento)} dias antes` : etapa.diasAposVencimento === 0 ? 'No vencimento' : `${etapa.diasAposVencimento} dias após`}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {etapa.canais.map(canal => { const config = canaisConfig[canal]; const Icon = config.icon; return (<Badge key={canal} variant="secondary" className="gap-1"><Icon className="h-3 w-3" />{config.label}</Badge>); })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                    <Switch checked={etapa.ativo} onCheckedChange={() => onToggleEtapa(etapa.id)} />
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
