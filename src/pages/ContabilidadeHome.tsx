import { AlertTriangle, Plug, History, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ContabilidadeHomeProps } from './Contabilidade.types';
import { HOME_CARDS } from './Contabilidade.helpers';

export function ContabilidadeHome({
  onSelect,
  ecfPendente,
  ano,
  empresaSelecionada,
}: ContabilidadeHomeProps) {
  return (
    <div className="space-y-6">
      {!empresaSelecionada && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-muted-foreground">
          <strong className="text-warning">Selecione uma empresa</strong> no topo da página para
          habilitar a geração de SPED e relatórios contábeis específicos.
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {HOME_CARDS.map((card, idx) => {
          const Icon = card.icon;
          const ecfBadge = card.id === 'ecf' && ecfPendente;
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card
                onClick={() => onSelect(card.id)}
                className="group cursor-pointer border-border/50 transition-all hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className={`rounded-lg bg-muted/50 p-2.5 ${card.accent}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {ecfBadge && (
                      <Badge
                        variant="outline"
                        className="border-warning/40 bg-warning/10 text-warning gap-1 text-[10px]"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        ECD {ano} pendente
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base mt-3">{card.label}</CardTitle>
                  <CardDescription className="text-xs">{card.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between -mx-2 group-hover:bg-primary/5 group-hover:text-primary"
                  >
                    Abrir
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Plug className="h-4 w-4 text-primary" />
              Verificação de integrações
            </CardTitle>
            <CardDescription className="text-xs">
              Confira se NF-e, contas e tributos estão alimentando a contabilidade.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelect('integracoes')}
              className="w-full"
            >
              Ver integrações <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Auditoria de lançamentos
            </CardTitle>
            <CardDescription className="text-xs">
              Histórico de criação, ajustes e estornos de partidas contábeis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelect('auditoria')}
              className="w-full"
            >
              Abrir auditoria <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
