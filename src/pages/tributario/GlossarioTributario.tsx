import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader, PageBackground } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, ExternalLink, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function GlossarioTributario() {
  const [search, setSearch] = useState('');

  const { data: termos = [], isLoading } = useQuery({
    queryKey: ['glossario-tributario'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('glossario_tributario')
        .select('*')
        .order('termo');
      if (error) throw error;
      return data || [];
    },
  });

  const termosFiltrados = useMemo(() => {
    return termos.filter(t => 
      t.termo.toLowerCase().includes(search.toLowerCase()) ||
      t.significado.toLowerCase().includes(search.toLowerCase())
    );
  }, [termos, search]);

  return (
    <MainLayout>
      <div className="relative min-h-screen">
        <PageBackground />
        
        <div className="container mx-auto p-6 relative z-10 space-y-6">
          <PageHeader 
            title="Glossário Tributário" 
            subtitle="Termos e conceitos da Reforma Tributária (CBS, IBS, IS) explicados."
            badge="Educação Fiscal"
            icon={BookOpen}
            gradientFrom="from-blue-600"
            gradientVia="via-primary"
            gradientTo="to-indigo-600"
          />

          <div className="max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar termo ou conceito..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : termosFiltrados.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {termosFiltrados.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-xl font-bold text-primary">{item.termo}</CardTitle>
                      {item.categoria && (
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                          {item.categoria}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {item.significado}
                    </p>
                    
                    {item.base_legal && (
                      <div className="flex items-center gap-2 pt-2 border-t text-[11px] text-muted-foreground">
                        <Info className="h-3 w-3" />
                        <span>Base Legal: {item.base_legal}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/30 rounded-lg border-2 border-dashed">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">Nenhum termo encontrado para sua busca.</p>
            </div>
          )}

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Dúvidas sobre a Reforma?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Consulte também o site oficial da Reforma Tributária do Ministério da Fazenda para atualizações em tempo real sobre leis complementares e cronogramas.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
