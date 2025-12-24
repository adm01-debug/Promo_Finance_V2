import { useState } from 'react';
import { FileText, Calendar, RefreshCw, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Contrato {
  id: string;
  titulo: string;
  cliente: string;
  valor: number;
  frequencia: string;
  status: 'ativo' | 'pausado' | 'encerrado';
  proximaRenovacao: string;
}

export function GestaoContratos() {
  const { data: contratos = [] } = useQuery({
    queryKey: ['contratos-recorrentes'],
    queryFn: async () => {
      const { data } = await supabase.from('pagamentos_recorrentes').select('*').eq('ativo', true).limit(10);
      return (data || []).map(p => ({
        id: p.id,
        titulo: p.descricao,
        cliente: p.fornecedor_nome,
        valor: p.valor,
        frequencia: p.frequencia,
        status: 'ativo' as const,
        proximaRenovacao: p.proxima_geracao || p.data_inicio
      }));
    }
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <div>
              <CardTitle>Gestão de Contratos</CardTitle>
              <CardDescription>Contratos recorrentes e renovações</CardDescription>
            </div>
          </div>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo Contrato</Button>
        </div>
      </CardHeader>
      <CardContent>
        {contratos.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum contrato encontrado</p>
        ) : (
          <div className="space-y-3">
            {contratos.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">{c.titulo}</p>
                  <p className="text-sm text-muted-foreground">{c.cliente}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(c.valor)}/{c.frequencia}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <RefreshCw className="h-3 w-3" />
                    {formatDate(c.proximaRenovacao)}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost"><Eye className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost"><Edit className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
