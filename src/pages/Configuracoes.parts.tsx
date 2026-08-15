// Atalhos rápidos da página Configuracoes — extraídos para zerar max-lines.
import { Bell, ChevronRight, Database } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ATALHOS = [
  {
    href: '/configuracoes/preferencias',
    icone: Database,
    titulo: 'Minhas preferências',
    descricao: 'Gerencie presets de filtros e colunas que sincronizam entre dispositivos.',
  },
  {
    href: '/configuracoes/notificacoes/sino',
    icone: Bell,
    titulo: 'Sino dos filtros',
    descricao: 'Canais (in-app/push) por preset e estado de tempo real por módulo.',
  },
  {
    href: '/configuracoes/filtros-salvos',
    icone: Database,
    titulo: 'Diagnóstico de filtros',
    descricao: 'Status de hidratação por tela (Supabase + dispositivo).',
  },
  {
    href: '/configuracoes/notificacoes/historico',
    icone: Bell,
    titulo: 'Histórico de notificações',
    descricao: 'Veja, filtre por canal e marque como lidas as notificações recebidas.',
  },
] as const;

export function AtalhosRapidos() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {ATALHOS.map((atalho) => (
        <Card key={atalho.href} className="border-dashed">
          <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <atalho.icone className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm">{atalho.titulo}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {atalho.descricao}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={atalho.href} className="gap-1">
                Abrir painel
                <ChevronRight className="h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
