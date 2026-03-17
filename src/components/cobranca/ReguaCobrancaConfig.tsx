import { useState } from 'react';
import { Settings, Mail, MessageSquare, Phone, Smartphone, ToggleLeft, ToggleRight, Clock, Zap, Edit2, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useReguaCobranca, useUpdateReguaCobranca, useTemplatesCobranca, useUpdateTemplate } from '@/hooks/useReguaCobranca';

const canalIcons: Record<string, React.ElementType> = {
  email: Mail, whatsapp: MessageSquare, sms: Smartphone, telefone: Phone,
};

const etapaColors: Record<string, string> = {
  preventiva: 'bg-secondary/10 text-secondary border-secondary/30',
  lembrete: 'bg-warning/10 text-warning border-warning/30',
  cobranca: 'bg-primary/10 text-primary border-primary/30',
  negociacao: 'bg-destructive/10 text-destructive border-destructive/30',
  juridico: 'bg-destructive/20 text-destructive border-destructive/40',
};

export function ReguaCobrancaConfig() {
  const { data: regua, isLoading } = useReguaCobranca();
  const { data: templates } = useTemplatesCobranca();
  const updateRegua = useUpdateReguaCobranca();
  const updateTemplate = useUpdateTemplate();
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editCorpo, setEditCorpo] = useState('');

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>;

  return (
    <div className="space-y-6">
      {/* Régua de Cobrança */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Configuração da Régua de Cobrança</CardTitle>
              <CardDescription>Gerencie as etapas automáticas de cobrança</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {regua?.map((etapa) => (
            <div key={etapa.id} className={`p-4 rounded-lg border ${etapaColors[etapa.nome?.toLowerCase()] || 'border-border'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{etapa.nome}</h4>
                    <p className="text-sm text-muted-foreground">{etapa.descricao || `Dias gatilho: ${etapa.dias_gatilho}`}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1">
                    {(etapa.canais || []).map((canal: string) => {
                      const Icon = canalIcons[canal] || Mail;
                      return <Badge key={canal} variant="outline" className="gap-1"><Icon className="h-3 w-3" />{canal}</Badge>;
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Auto</span>
                    <Switch
                      checked={etapa.auto_executar || false}
                      onCheckedChange={(checked) => updateRegua.mutate({ id: etapa.id, auto_executar: checked })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Ativo</span>
                    <Switch
                      checked={etapa.ativo || false}
                      onCheckedChange={(checked) => updateRegua.mutate({ id: etapa.id, ativo: checked })}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Templates */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Templates de Cobrança</CardTitle>
              <CardDescription>Mensagens parametrizadas por etapa e canal</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="preventiva">
            <TabsList className="mb-4">
              <TabsTrigger value="preventiva">Preventiva</TabsTrigger>
              <TabsTrigger value="lembrete">Lembrete</TabsTrigger>
              <TabsTrigger value="cobranca">Cobrança</TabsTrigger>
              <TabsTrigger value="negociacao">Negociação</TabsTrigger>
              <TabsTrigger value="juridico">Jurídico</TabsTrigger>
            </TabsList>
            {['preventiva', 'lembrete', 'cobranca', 'negociacao', 'juridico'].map((etapa) => (
              <TabsContent key={etapa} value={etapa} className="space-y-3">
                {templates?.filter(t => t.etapa === etapa).map((template) => {
                  const Icon = canalIcons[template.canal] || Mail;
                  const isEditing = editingTemplate === template.id;
                  return (
                    <div key={template.id} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium capitalize">{template.canal}</span>
                          {template.padrao && <Badge variant="secondary" className="text-xs">Padrão</Badge>}
                          <Badge variant="outline" className="text-xs">{template.tom}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={template.ativo}
                            onCheckedChange={(checked) => updateTemplate.mutate({ id: template.id, ativo: checked })}
                          />
                          {isEditing ? (
                            <>
                              <Button size="icon" variant="ghost" onClick={() => { updateTemplate.mutate({ id: template.id, corpo: editCorpo }); setEditingTemplate(null); }}>
                                <Check className="h-4 w-4 text-success" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => setEditingTemplate(null)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button size="icon" variant="ghost" onClick={() => { setEditingTemplate(template.id); setEditCorpo(template.corpo); }}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {template.assunto && <p className="text-sm font-medium mb-1">Assunto: {template.assunto}</p>}
                      {isEditing ? (
                        <Textarea value={editCorpo} onChange={(e) => setEditCorpo(e.target.value)} rows={4} />
                      ) : (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{template.corpo}</p>
                      )}
                      {template.variaveis_disponiveis && template.variaveis_disponiveis.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.variaveis_disponiveis.map((v: string) => (
                            <Badge key={v} variant="outline" className="text-xs font-mono">{`{{${v}}}`}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {templates?.filter(t => t.etapa === etapa).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Nenhum template para esta etapa</p>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
