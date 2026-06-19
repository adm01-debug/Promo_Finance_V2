import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Save, History, CheckCircle2, XCircle, Info, Zap, Sparkles, Sliders, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };

export function RegrasDuplicidadeTab() {
  const queryClient = useQueryClient();
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [fuzzyMatching, setFuzzyMatching] = useState(false);
  const [toleranciaDias, setToleranciaDias] = useState(0);
  
  const { data: config, isLoading } = useQuery({
    queryKey: ['configuracoes-duplicidade'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracoes_duplicidade')
        .select('*')
        .eq('ativo', true)
        .order('versao', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      if (data) {
        const campos = Array.isArray(data.campos_validacao) ? (data.campos_validacao as string[]) : [];
        setSelectedFields(campos);
        setFuzzyMatching(data.fuzzy_matching || false);
        setToleranciaDias(data.tolerancia_dias || 0);
      }
      return data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async ({ fields, fuzzy, tolerance }: { fields: string[], fuzzy: boolean, tolerance: number }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data: perfil } = await supabase
        .from('profiles')
        .select('empresa_id')
        .single();

      if (!perfil?.empresa_id) throw new Error("Empresa não encontrada");

      if (config) {
        await supabase
          .from('configuracoes_duplicidade')
          .update({ ativo: false })
          .eq('id', config.id);
      }

      const { error } = await supabase
        .from('configuracoes_duplicidade')
        .insert({
          empresa_id: perfil.empresa_id,
          campos_validacao: fields,
          fuzzy_matching: fuzzy,
          tolerancia_dias: tolerance,
          versao: (config?.versao || 0) + 1,
          ativo: true,
          criado_por: userData.user?.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['configuracoes-duplicidade'] });
      toast.success("Regras de duplicidade atualizadas e versionadas com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar regras: " + error.message);
    }
  });

  const fields = [
    { id: 'fornecedor_id', label: 'Fornecedor / CNPJ', description: 'Detecta se o fornecedor ou CNPJ é o mesmo.' },
    { id: 'valor', label: 'Valor Exato', description: 'Compara o valor bruto do lançamento.' },
    { id: 'numero_documento', label: 'Número do Documento', description: 'Chave principal (Nota Fiscal, Fatura, etc).' },
    { id: 'mes_vencimento', label: 'Competência (Mês/Ano)', description: 'Evita lançamentos duplicados no mesmo período.' },
    { id: 'data_vencimento', label: 'Data de Vencimento Exata', description: 'Restrição mais rígida por dia.' },
  ];

  const toggleField = (id: string) => {
    setSelectedFields(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  if (isLoading) return <div className="p-8 text-center animate-pulse">Sincronizando motor de regras...</div>;

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border border-white/10 bg-card/[0.02] backdrop-blur-xl rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-card/[0.02] border-b border-white/5 p-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black flex items-center gap-2">
                  <ShieldAlert className="h-6 w-6 text-primary" /> Motor de Anti-Duplicidade
                </CardTitle>
                <CardDescription>Defina os critérios que o sistema deve usar para bloquear pagamentos suspeitos.</CardDescription>
              </div>
              <Badge variant="outline" className="h-6 px-2 text-[10px] font-black uppercase tracking-widest border-primary/20 text-primary">
                Versão {config?.versao || 1} ATIVA
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid gap-6">
              {fields.map((field) => (
                <div key={field.id} className="flex items-start justify-between p-5 rounded-2xl bg-card/[0.03] hover:bg-card/[0.06] transition-all border border-white/5 group">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id={field.id}
                        checked={selectedFields.includes(field.id)}
                        onChange={() => toggleField(field.id)}
                      />
                      <Label htmlFor={field.id} className="text-base font-bold cursor-pointer">
                        {field.label}
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">{field.description}</p>
                  </div>
                  {selectedFields.includes(field.id) ? (
                    <CheckCircle2 className="h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground/20" />
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="p-6 rounded-2xl bg-card/[0.03] border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-500" /> Fuzzy Matching (IA)
                    </Label>
                    <p className="text-[10px] text-muted-foreground">Detecta nomes de fornecedores similares (ex: "Apple" vs "Apple Inc").</p>
                  </div>
                  <Switch 
                    checked={fuzzyMatching}
                    onCheckedChange={setFuzzyMatching}
                  />
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-card/[0.03] border border-white/5 space-y-4">
                <div className="space-y-1">
                  <Label className="text-sm font-bold flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-primary" /> Tolerância (Dias)
                  </Label>
                  <p className="text-[10px] text-muted-foreground">Janela de dias para considerar um pagamento como duplicado.</p>
                </div>
                <Input 
                  type="number"
                  className="h-10 bg-card/5 border-white/5 rounded-xl font-bold"
                  value={toleranciaDias}
                  onChange={(e) => setToleranciaDias(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-4">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-primary">Garantia de Idempotência</p>
                <p className="text-xs text-primary/70 leading-relaxed">
                  O sistema valida tokens de idempotência em todas as APIs críticas de pagamento 10/10.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none bg-primary shadow-[0_20px_50px_rgba(var(--primary),0.3)] rounded-[2rem] text-primary-foreground overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
              <Sparkles className="h-16 w-16 text-white" />
            </div>
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black uppercase tracking-tighter italic">Segurança Ativa</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <p className="text-sm text-foreground/80 leading-relaxed">
                As alterações nestas regras são aplicadas instantaneamente a todos os novos lançamentos e edições.
              </p>
              <Button 
                onClick={() => saveMutation.mutate({ fields: selectedFields, fuzzy: fuzzyMatching, tolerance: toleranciaDias })}
                disabled={saveMutation.isPending}
                className="w-full h-14 bg-card text-primary hover:bg-card/90 font-black rounded-xl gap-2 shadow-lg"
              >
                <Save className="h-5 w-5" /> Salvar & Versionar
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-white/10 bg-card/[0.02] backdrop-blur-xl rounded-[2rem]">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <History className="h-4 w-4" /> Histórico de Regras
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2 space-y-4">
               <div className="space-y-3">
                 <div className="flex items-center justify-between text-xs">
                   <span className="text-muted-foreground">v{config?.versao || 1} (Atual)</span>
                   <span className="font-bold">{config?.created_at ? format(new Date(config.created_at), 'dd/MM/yy') : '--/--'}</span>
                 </div>
                 <div className="h-1.5 w-full bg-card/5 rounded-full overflow-hidden">
                   <div className="h-full w-full bg-primary" />
                 </div>
                 <p className="text-[10px] text-muted-foreground italic">
                   Regra atual validando {selectedFields.length} parâmetros críticos.
                 </p>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}