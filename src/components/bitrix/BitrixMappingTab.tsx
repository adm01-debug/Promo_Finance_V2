import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeftRight, ArrowRight, DollarSign, Users, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FieldMapping {
  id: string;
  entidade: string;
  campo_bitrix: string;
  campo_sistema: string;
  transformacao?: string | null;
  obrigatorio?: boolean;
  ativo: boolean;
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

interface Props {
  fieldMappings?: FieldMapping[];
  isLoading: boolean;
  onToggleMapping: (params: { id: string; ativo: boolean }) => void;
}

export function BitrixMappingTab({ fieldMappings, isLoading, onToggleMapping }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Mapeamento de Campos</CardTitle>
            <CardDescription>Configure como os campos do Bitrix24 são convertidos para o sistema financeiro</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
        ) : fieldMappings && fieldMappings.length > 0 ? (
          <div className="space-y-4">
            {['deal', 'contact', 'company'].map((entidade) => {
              const list = fieldMappings.filter(m => m.entidade === entidade);
              if (list.length === 0) return null;
              return (
                <div key={entidade} className="space-y-2">
                  <h3 className="font-semibold text-lg capitalize flex items-center gap-2">
                    {entidade === 'deal' && <DollarSign className="h-5 w-5" />}
                    {entidade === 'contact' && <Users className="h-5 w-5" />}
                    {entidade === 'company' && <Building2 className="h-5 w-5" />}
                    {entidade === 'deal' ? 'Deals' : entidade === 'contact' ? 'Contatos' : 'Empresas'}
                  </h3>
                  {list.map((mapping) => (
                    <motion.div
                      key={mapping.id}
                      variants={itemVariants}
                      className={cn("flex items-center gap-4 p-4 rounded-lg border transition-all", mapping.ativo ? "bg-card" : "bg-muted/50 opacity-60")}
                    >
                      <div className="flex-1 grid grid-cols-3 gap-4 items-center">
                        <div className="p-3 rounded-lg bg-secondary/10">
                          <p className="text-xs text-muted-foreground mb-1">Bitrix24</p>
                          <code className="font-mono text-sm font-medium">{mapping.campo_bitrix}</code>
                        </div>
                        <div className="flex items-center justify-center">
                          <div className="flex items-center gap-2">
                            <div className="h-px w-8 bg-border" />
                            {mapping.transformacao ? (
                              <Badge variant="outline" className="text-xs">{mapping.transformacao}</Badge>
                            ) : (
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div className="h-px w-8 bg-border" />
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-success/10">
                          <p className="text-xs text-muted-foreground mb-1">Sistema</p>
                          <code className="font-mono text-sm font-medium">{mapping.campo_sistema}</code>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {mapping.obrigatorio && (
                          <Badge variant="destructive" className="text-xs">Obrigatório</Badge>
                        )}
                        <Switch
                          checked={mapping.ativo}
                          onCheckedChange={() => onToggleMapping({ id: mapping.id, ativo: !mapping.ativo })}
                          disabled={mapping.obrigatorio}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <ArrowLeftRight className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum mapeamento configurado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
