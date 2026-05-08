import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Shield, User, Clock, Zap, Link2, CheckCircle2 } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export function ConciliacaoAuditPanel() {
  const { data: auditData, isLoading } = useQuery({
    queryKey: ['conciliacao-audit'],
    queryFn: async () => {
      // Buscar compensações de centavos
      const { data: compensacoes } = await supabase
        .from('transacoes_bancarias')
        .select(`
          id, 
          descricao, 
          data, 
          valor, 
          compensacao_valor, 
          compensacao_motivo, 
          compensacao_classificacao, 
          compensacao_regra, 
          compensacao_aceita_por,
          compensacao_aceita_em,
          compensacao_evidencia_url
        `)
        .not('compensacao_valor', 'is', null)
        .neq('compensacao_valor', 0)
        .order('compensacao_aceita_em', { ascending: false });

      // Buscar divergências aceitas
      const { data: divergencias } = await supabase
        .from('divergencias_conciliacao')
        .select(`
          id,
          descricao,
          tipo_divergencia,
          valor_divergencia,
          created_at,
          status,
          resolvido_por,
          resolvido_em
        `)
        .eq('status', 'aceito')
        .order('resolvido_em', { ascending: false });

      return { compensacoes: compensacoes || [], divergencias: divergencias || [] };
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Ajustes de Centavos Auditados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{auditData?.compensacoes.length || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-warning/20 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4 text-warning" /> Divergências Aceitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{auditData?.divergencias.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Histórico de Auditoria de Ajustes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Regra/Motivo</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditData?.compensacoes.map((c) => (
                <TableRow key={`comp-${c.id}`}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-xs">Compensação: {c.descricao}</span>
                      <Badge variant="outline" className="w-fit text-[10px] mt-1">
                        {c.compensacao_classificacao}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(c.compensacao_valor)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs">
                      <User className="h-3 w-3 text-muted-foreground" />
                      {c.compensacao_aceita_por ? 'Usuário' : 'IA (Automático)'}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {formatDate(c.compensacao_aceita_em || c.data)}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">
                    {c.compensacao_regra}
                  </TableCell>
                  <TableCell className="text-right">
                    {c.compensacao_evidencia_url && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={c.compensacao_evidencia_url} target="_blank" rel="noopener noreferrer">
                          <Link2 className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              
              {auditData?.divergencias.map((d) => (
                <TableRow key={`div-${d.id}`} className="bg-warning/5">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-xs">Divergência Aceita: {d.descricao}</span>
                      <Badge variant="warning" className="w-fit text-[10px] mt-1">
                        {d.tipo_divergencia}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-destructive">
                    {formatCurrency(d.valor_divergencia)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs">
                      <User className="h-3 w-3 text-muted-foreground" />
                      {d.resolvido_por ? 'Usuário' : 'Sistema'}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {formatDate(d.resolvido_em || d.created_at)}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs italic">
                    Aceite manual de divergência de saldo
                  </TableCell>
                  <TableCell className="text-right">
                    <CheckCircle2 className="h-4 w-4 text-success inline-block" />
                  </TableCell>
                </TableRow>
              ))}

              {auditData?.compensacoes.length === 0 && auditData?.divergencias.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground italic">
                    Nenhum registro de auditoria encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
