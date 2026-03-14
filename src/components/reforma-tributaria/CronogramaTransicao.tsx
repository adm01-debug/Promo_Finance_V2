// ============================================
// CRONOGRAMA DE TRANSIÇÃO
// Timeline visual 2026-2033
// ============================================

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  AlertCircle,
  Info,
} from 'lucide-react';
import useReformaTributaria from '@/hooks/useReformaTributaria';

const itemVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1 }
};

export function CronogramaTransicao() {
  const { cronogramaTransicao, anoReferencia } = useReformaTributaria();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido':
        return 'bg-success';
      case 'em_andamento':
        return 'bg-primary animate-pulse';
      default:
        return 'bg-muted';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'concluido':
        return <Badge variant="default" className="bg-green-500">Concluído</Badge>;
      case 'em_andamento':
        return <Badge variant="default" className="bg-blue-500">Em Andamento</Badge>;
      default:
        return <Badge variant="secondary">Futuro</Badge>;
    }
  };

  const getDescricaoFase = (ano: number) => {
    switch (ano) {
      case 2026:
        return {
          titulo: 'Fase de Testes',
          descricao: 'CBS com alíquota de teste (0,9%) e IBS simbólico (0,1%). Empresas começam a adaptar sistemas.',
          marcos: [
            'Início da emissão de NF-e com campos IBS/CBS',
            'Split Payment em fase piloto',
            'Coexistência com sistema antigo',
          ],
        };
      case 2027:
        return {
          titulo: 'CBS Plena',
          descricao: 'CBS assume alíquota cheia. PIS e COFINS são extintos para o regime não-cumulativo.',
          marcos: [
            'Extinção de PIS e COFINS (não-cumulativo)',
            'CBS com alíquota de referência (~8.8%)',
            'Início da apuração centralizada na RFB',
          ],
        };
      case 2028:
        return {
          titulo: 'Consolidação CBS',
          descricao: 'Último ano de preparação antes da transição do IBS.',
          marcos: [
            'Ajustes finais nos sistemas',
            'Comitê Gestor do IBS operacional',
            'Regulamentação de regimes especiais',
          ],
        };
      case 2029:
        return {
          titulo: 'Início Transição IBS',
          descricao: 'IBS começa a substituir ICMS e ISS gradualmente (10% IBS).',
          marcos: [
            'IBS assume 10% da carga',
            'ICMS e ISS reduzidos em 10%',
            'Distribuição para estados e municípios',
          ],
        };
      case 2030:
        return {
          titulo: 'Transição 25%',
          descricao: 'IBS aumenta para 25% da carga total.',
          marcos: [
            'IBS assume 25% da carga',
            'ICMS e ISS reduzidos em 25%',
            'Ajustes no Comitê Gestor',
          ],
        };
      case 2031:
        return {
          titulo: 'Transição 50%',
          descricao: 'Marco de metade da transição. IBS e tributos antigos em paridade.',
          marcos: [
            'IBS assume 50% da carga',
            'ICMS e ISS na metade',
            'Avaliação de impactos',
          ],
        };
      case 2032:
        return {
          titulo: 'Transição 75%',
          descricao: 'Reta final. IBS predomina sobre ICMS e ISS.',
          marcos: [
            'IBS assume 75% da carga',
            'ICMS e ISS residuais (25%)',
            'Preparação para extinção total',
          ],
        };
      case 2033:
        return {
          titulo: 'Transição Completa',
          descricao: 'ICMS e ISS extintos. Sistema IBS/CBS plenamente operacional.',
          marcos: [
            'Extinção total de ICMS e ISS',
            'IBS com alíquota plena (~17.7%)',
            'Novo sistema tributário consolidado',
          ],
        };
      default:
        return {
          titulo: 'Ano não definido',
          descricao: '',
          marcos: [],
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Cronograma da Reforma Tributária
          </CardTitle>
          <CardDescription>
            Período de transição conforme EC 132/2023 e LC 214/2025
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Concluído</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Em Andamento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-muted" />
              <span>Futuro</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="relative">
        {/* Linha central */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />
        
        <div className="space-y-8">
          {cronogramaTransicao.map((etapa, index) => {
            const info = getDescricaoFase(etapa.ano);
            const isAtual = etapa.ano === anoReferencia;
            
            return (
              <motion.div
                key={etapa.ano}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: index * 0.1 }}
                className={`relative pl-20 ${isAtual ? 'scale-[1.02]' : ''}`}
              >
                {/* Círculo do timeline */}
                <div className={`absolute left-6 w-5 h-5 rounded-full ${getStatusColor(etapa.status)} border-4 border-background`} />
                
                <Card className={isAtual ? 'ring-2 ring-primary' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-xl">{etapa.ano}</CardTitle>
                        <Badge variant="outline">{info.titulo}</Badge>
                      </div>
                      {getStatusBadge(etapa.status)}
                    </div>
                    <CardDescription>{info.descricao}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Alíquotas */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">CBS</p>
                        <p className="text-lg font-bold text-blue-600">{etapa.cbs}%</p>
                      </div>
                      <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">IBS</p>
                        <p className="text-lg font-bold text-emerald-600">{etapa.ibs}%</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">ICMS Residual</p>
                        <p className="text-lg font-bold">{etapa.icmsResidual}%</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">PIS/COFINS</p>
                        <p className="text-lg font-bold">
                          {etapa.pisResidual > 0 ? `${etapa.pisResidual}%` : 'Extinto'}
                        </p>
                      </div>
                    </div>

                    {/* Barra de progresso da migração */}
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Migração para IBS/CBS</span>
                        <span>{100 - etapa.icmsResidual}%</span>
                      </div>
                      <Progress value={100 - etapa.icmsResidual} className="h-2" />
                    </div>

                    {/* Marcos */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Marcos Principais:</p>
                      <ul className="space-y-1">
                        {info.marcos.map((marco, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            {etapa.status === 'concluido' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            ) : etapa.status === 'em_andamento' ? (
                              <Clock className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                            ) : (
                              <ArrowRight className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            )}
                            <span>{marco}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Informações Importantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <p className="font-medium">Período de Adaptação</p>
                <p className="text-sm text-muted-foreground">
                  O período de 2026 é considerado fase de testes. Penalidades por erros de cálculo serão reduzidas ou isentas.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium">Créditos Acumulados</p>
                <p className="text-sm text-muted-foreground">
                  Créditos de ICMS acumulados até 2032 poderão ser compensados ou ressarcidos conforme regulamentação específica.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Split Payment</p>
                <p className="text-sm text-muted-foreground">
                  A partir de 2026, o pagamento fracionado (split payment) será obrigatório para operações com cartão e Pix.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-purple-500 mt-0.5" />
              <div>
                <p className="font-medium">Documentos Fiscais</p>
                <p className="text-sm text-muted-foreground">
                  NF-e e NFC-e terão novos campos obrigatórios para IBS, CBS e IS a partir de janeiro de 2026.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CronogramaTransicao;
