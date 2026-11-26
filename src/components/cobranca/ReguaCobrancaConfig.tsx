import { useContext, useState } from 'react';
import {
  Settings,
  Mail,
  MessageSquare,
  Phone,
  Smartphone,
  Clock,
  Edit2,
  Check,
  X,
  Plus,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmpresaScopeContext } from '@/contexts/useEmpresaScope';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useReguaCobranca,
  useUpdateReguaCobranca,
  useTemplatesCobranca,
  useUpdateTemplate,
  useCriarTemplate,
  useExcluirTemplate,
} from '@/hooks/useReguaCobranca';

const canalIcons: Record<string, React.ElementType> = {
  email: Mail,
  whatsapp: MessageSquare,
  sms: Smartphone,
  telefone: Phone,
};

const etapaColors: Record<string, string> = {
  preventiva: 'bg-secondary/10 text-secondary border-secondary/30',
  lembrete: 'bg-warning/10 text-warning border-warning/30',
  cobranca: 'bg-primary/10 text-primary border-primary/30',
  negociacao: 'bg-destructive/10 text-destructive border-destructive/30',
  juridico: 'bg-destructive/20 text-destructive border-destructive/40',
};

const ETAPAS = ['preventiva', 'lembrete', 'cobranca', 'negociacao', 'juridico'] as const;
/**
 * Só canais com despacho real no executor (`executar-regua-cobranca`): e-mail via
 * `enviar-alerta-email` e WhatsApp via `whatsapp-ia-proativo`. SMS e telefone não
 * têm provedor — oferecê-los criava template que nunca chegava ao cliente
 * (achado do review da PR #571).
 */
const CANAIS = ['email', 'whatsapp'] as const;
const TONS = ['amigavel', 'profissional', 'firme', 'urgente', 'juridico'] as const;

interface ReguaCobrancaConfigProps {
  secao?: 'tudo' | 'regua' | 'templates';
}

export function ReguaCobrancaConfig({ secao = 'tudo' }: ReguaCobrancaConfigProps = {}) {
  // `useContext` direto (e não `useEmpresaScope`) para o componente continuar
  // renderizável fora do provider — é o que os testes fazem.
  const scope = useContext(EmpresaScopeContext);
  const empresaId = scope?.currentEmpresaId ?? undefined;
  const nomeEmpresa = (id?: string | null) =>
    scope?.availableEmpresas.find((v) => v.empresa_id === id)?.empresa?.razao_social ?? id ?? null;

  const { data: regua, isLoading } = useReguaCobranca(empresaId);
  const { data: templates } = useTemplatesCobranca(empresaId);
  const updateRegua = useUpdateReguaCobranca();
  const updateTemplate = useUpdateTemplate();
  const criarTemplate = useCriarTemplate();
  const excluirTemplate = useExcluirTemplate();
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [editCorpo, setEditCorpo] = useState('');
  const [novoAberto, setNovoAberto] = useState(false);
  const [templateParaExcluir, setTemplateParaExcluir] = useState<{
    id: string;
    etapa: string | null;
    canal: string;
  } | null>(null);
  const [novoTemplate, setNovoTemplate] = useState({
    etapa: 'preventiva' as string,
    canal: 'email' as string,
    tom: 'profissional' as string,
    assunto: '',
    corpo: '',
  });

  const salvarNovoTemplate = () => {
    if (!empresaId) return;
    criarTemplate.mutate(
      {
        empresa_id: empresaId,
        etapa: novoTemplate.etapa,
        canal: novoTemplate.canal,
        tom: novoTemplate.tom,
        nome: `${novoTemplate.etapa} - ${novoTemplate.canal}`,
        assunto: novoTemplate.assunto.trim() || null,
        corpo: novoTemplate.corpo,
      },
      {
        onSuccess: () => {
          setNovoAberto(false);
          setNovoTemplate({
            etapa: 'preventiva',
            canal: 'email',
            tom: 'profissional',
            assunto: '',
            corpo: '',
          });
        },
      }
    );
  };

  if (isLoading)
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Régua de Cobrança */}
      {secao !== 'templates' && (
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
              <div
                key={etapa.id}
                className={`p-4 rounded-lg border ${etapaColors[etapa.nome?.toLowerCase()] || 'border-border'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{etapa.nome}</h4>
                      <p className="text-sm text-muted-foreground">
                        {etapa.descricao || `Dias gatilho: ${etapa.dias_gatilho}`}
                      </p>
                      {!empresaId && (
                        <p className="text-xs text-muted-foreground">
                          Empresa: {nomeEmpresa((etapa as { empresa_id?: string }).empresa_id)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-1">
                      {(etapa.canais || []).map((canal: string) => {
                        const Icon = canalIcons[canal] || Mail;
                        return (
                          <Badge key={canal} variant="outline" className="gap-1">
                            <Icon className="h-3 w-3" />
                            {canal}
                          </Badge>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Auto</span>
                      <Switch
                        checked={etapa.auto_executar || false}
                        onCheckedChange={(checked) =>
                          updateRegua.mutate({ id: etapa.id, auto_executar: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Ativo</span>
                      <Switch
                        checked={etapa.ativo || false}
                        onCheckedChange={(checked) =>
                          updateRegua.mutate({ id: etapa.id, ativo: checked })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {!regua?.length && (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma etapa de régua configurada para esta empresa.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Templates */}
      {secao !== 'regua' && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Templates de Cobrança</CardTitle>
                  <CardDescription>Mensagens parametrizadas por etapa e canal</CardDescription>
                </div>
              </div>
              <Dialog open={novoAberto} onOpenChange={setNovoAberto}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    disabled={!empresaId}
                    title={
                      !empresaId ? 'Selecione uma empresa no topo para criar templates' : undefined
                    }
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Novo template
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo template de cobrança</DialogTitle>
                    <DialogDescription>
                      {empresaId
                        ? `Será criado para ${nomeEmpresa(empresaId)}.`
                        : 'Selecione uma empresa para criar o template.'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="novo-template-etapa">Etapa</Label>
                        <Select
                          value={novoTemplate.etapa}
                          onValueChange={(v) => setNovoTemplate((s) => ({ ...s, etapa: v }))}
                        >
                          <SelectTrigger id="novo-template-etapa">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ETAPAS.map((etapa) => (
                              <SelectItem key={etapa} value={etapa} className="capitalize">
                                {etapa}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="novo-template-canal">Canal</Label>
                        <Select
                          value={novoTemplate.canal}
                          onValueChange={(v) => setNovoTemplate((s) => ({ ...s, canal: v }))}
                        >
                          <SelectTrigger id="novo-template-canal">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CANAIS.map((canal) => (
                              <SelectItem key={canal} value={canal} className="capitalize">
                                {canal}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          E-mail e WhatsApp são os canais com envio automático ativo. SMS e telefone
                          ainda não têm provedor.
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="novo-template-tom">Tom</Label>
                      <Select
                        value={novoTemplate.tom}
                        onValueChange={(v) => setNovoTemplate((s) => ({ ...s, tom: v }))}
                      >
                        <SelectTrigger id="novo-template-tom">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TONS.map((tom) => (
                            <SelectItem key={tom} value={tom} className="capitalize">
                              {tom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="novo-template-assunto">Assunto (e-mail)</Label>
                      <Input
                        id="novo-template-assunto"
                        value={novoTemplate.assunto}
                        onChange={(e) =>
                          setNovoTemplate((s) => ({ ...s, assunto: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="novo-template-corpo">Corpo</Label>
                      <Textarea
                        id="novo-template-corpo"
                        rows={5}
                        value={novoTemplate.corpo}
                        onChange={(e) => setNovoTemplate((s) => ({ ...s, corpo: e.target.value }))}
                        placeholder="Olá {{cliente}}, sua parcela de {{valor}} vence em {{vencimento}}."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setNovoAberto(false)}>
                      Cancelar
                    </Button>
                    <Button
                      onClick={salvarNovoTemplate}
                      disabled={!empresaId || !novoTemplate.corpo.trim() || criarTemplate.isPending}
                    >
                      Criar template
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                  {templates
                    ?.filter((t) => t.etapa === etapa)
                    .map((template) => {
                      const Icon = canalIcons[template.canal] || Mail;
                      const isEditing = editingTemplate === template.id;
                      return (
                        <div key={template.id} className="p-4 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span className="font-medium capitalize">{template.canal}</span>
                              {template.padrao && (
                                <Badge variant="secondary" className="text-xs">
                                  Padrão
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {template.tom}
                              </Badge>
                              {!empresaId && (
                                <span className="text-xs text-muted-foreground">
                                  Empresa: {nomeEmpresa(template.empresa_id)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={template.ativo}
                                onCheckedChange={(checked) =>
                                  updateTemplate.mutate({ id: template.id, ativo: checked })
                                }
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label={`Excluir template ${template.canal} da etapa ${template.etapa}`}
                                onClick={() =>
                                  setTemplateParaExcluir({
                                    id: template.id,
                                    etapa: template.etapa,
                                    canal: template.canal,
                                  })
                                }
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                              {isEditing ? (
                                <>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      updateTemplate.mutate({ id: template.id, corpo: editCorpo });
                                      setEditingTemplate(null);
                                    }}
                                  >
                                    <Check className="h-4 w-4 text-success" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setEditingTemplate(null)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingTemplate(template.id);
                                    setEditCorpo(template.corpo);
                                  }}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          {template.assunto && (
                            <p className="text-sm font-medium mb-1">Assunto: {template.assunto}</p>
                          )}
                          {isEditing ? (
                            <Textarea
                              value={editCorpo}
                              onChange={(e) => setEditCorpo(e.target.value)}
                              rows={4}
                            />
                          ) : (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {template.corpo}
                            </p>
                          )}
                          {template.variaveis_disponiveis &&
                            template.variaveis_disponiveis.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {template.variaveis_disponiveis.map((v: string) => (
                                  <Badge
                                    key={v}
                                    variant="outline"
                                    className="text-xs font-mono"
                                  >{`{{${v}}}`}</Badge>
                                ))}
                              </div>
                            )}
                        </div>
                      );
                    })}
                  {templates?.filter((t) => t.etapa === etapa).length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum template para esta etapa
                    </p>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={templateParaExcluir !== null}
        onOpenChange={(aberto) => {
          if (!aberto) setTemplateParaExcluir(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este template?</AlertDialogTitle>
            <AlertDialogDescription>
              {templateParaExcluir
                ? `O template de ${templateParaExcluir.canal} da etapa ${templateParaExcluir.etapa} deixa de ser usado nas cobranças automáticas. A ação não pode ser desfeita.`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (templateParaExcluir) excluirTemplate.mutate({ id: templateParaExcluir.id });
                setTemplateParaExcluir(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
