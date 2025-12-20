import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Lightbulb, TrendingUp, Check, X, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export function RecomendacoesMetasIA() {
  const { data: recomendacoes, isLoading, refetch } = useQuery({
    queryKey: ['recomendacoes-metas-ia'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recomendacoes_metas_ia')
        .select('*')
        .is('aceita', null)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const handleAceitar = async (id: string, tipoMeta: string, valorSugerido: number) => {
    const mesAtual = new Date().getMonth() + 1;
    const anoAtual = new Date().getFullYear();

    const { error: metaError } = await supabase.from('metas_financeiras').insert({
      tipo: tipoMeta,
      titulo: `Meta ${tipoMeta} (sugerida por IA)`,
      valor_meta: valorSugerido,
      mes: mesAtual,
      ano: anoAtual,
      ativo: true,
    });

    if (metaError) {
      toast.error('Erro ao criar meta');
      return;
    }

    await supabase.from('recomendacoes_metas_ia').update({ aceita: true }).eq('id', id);
    toast.success('Meta criada com sucesso!');
    refetch();
  };

  const handleRejeitar = async (id: string) => {
    await supabase.from('recomendacoes_metas_ia').update({ aceita: false }).eq('id', id);
    toast.info('Recomendação ignorada');
    refetch();
  };

  const getConfiancaColor = (confianca: number) => {
    if (confianca >= 80) return 'bg-green-100 text-green-700';
    if (confianca >= 60) return 'bg-blue-100 text-blue-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  if (isLoading) {
    return <Card><CardContent className="p-6"><div className="animate-pulse h-32 bg-muted rounded" /></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Recomendações de Metas (IA)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!recomendacoes?.length ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Lightbulb className="w-10 h-10 mb-2 opacity-50" />
            <p>Nenhuma recomendação pendente</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {recomendacoes.map((rec) => (
                <div key={rec.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Badge variant="outline" className="mb-1 capitalize">{rec.tipo_meta}</Badge>
                      <p className="text-xl font-bold text-primary">
                        R$ {Number(rec.valor_sugerido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <Badge className={getConfiancaColor(rec.confianca || 0)}>
                      {rec.confianca}% confiança
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{rec.justificativa}</p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAceitar(rec.id, rec.tipo_meta, Number(rec.valor_sugerido))}>
                      <Check className="w-4 h-4 mr-1" /> Aceitar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleRejeitar(rec.id)}>
                      <X className="w-4 h-4 mr-1" /> Ignorar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
