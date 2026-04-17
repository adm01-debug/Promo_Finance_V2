import { Sparkles, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PrevisaoClienteCard, ClienteRisco } from './PrevisaoClienteCard';

interface PrevisaoClientesListProps {
  tabAtiva: string;
  onTabChange: (value: string) => void;
  clientesFiltrados: ClienteRisco[];
  totalEmRisco: number;
  clientesAltoRisco: number;
  clientesMedioRisco: number;
  clientesBaixoRisco: number;
}

export function PrevisaoClientesList({
  tabAtiva,
  onTabChange,
  clientesFiltrados,
  totalEmRisco,
  clientesAltoRisco,
  clientesMedioRisco,
  clientesBaixoRisco,
}: PrevisaoClientesListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Clientes por Nível de Risco
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={tabAtiva} onValueChange={onTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="todos">Todos ({totalEmRisco})</TabsTrigger>
            <TabsTrigger value="alto" className="text-destructive">
              Alto ({clientesAltoRisco})
            </TabsTrigger>
            <TabsTrigger value="medio" className="text-warning">
              Médio ({clientesMedioRisco})
            </TabsTrigger>
            <TabsTrigger value="baixo" className="text-success">
              Baixo ({clientesBaixoRisco})
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px]">
            {clientesFiltrados.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum cliente nesta categoria</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clientesFiltrados.map((cliente) => (
                  <PrevisaoClienteCard key={cliente.id} cliente={cliente} />
                ))}
              </div>
            )}
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}
