import { History } from 'lucide-react';
import { formatDateTime } from '@/lib/formatters';

const operacaoLabels: Record<string, string> = {
  INSERT: 'Criação',
  UPDATE: 'Atualização',
  DELETE: 'Exclusão',
};

interface AuditItem {
  id: string;
  operacao: string;
  created_at: string;
  dados_novos?: Record<string, unknown> | null;
}

export function DrawerTimelineTab({ auditHistory }: { auditHistory: AuditItem[] }) {
  if (auditHistory.length === 0) {
    return (
      <div className="text-center py-8">
        <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Nenhum histórico encontrado</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
      {auditHistory.map((item) => (
        <div key={item.id} className="relative pl-10 pb-4">
          <div className="absolute left-2.5 top-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
          <div className="text-sm">
            <p className="font-medium">{operacaoLabels[item.operacao] || item.operacao}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(item.created_at)}</p>
            {item.dados_novos && item.operacao === 'UPDATE' && (
              <div className="mt-1 p-2 rounded bg-muted/30 text-xs space-y-0.5">
                {Object.entries(item.dados_novos).slice(0, 5).map(([key, val]) => (
                  <div key={key} className="flex gap-2">
                    <span className="text-muted-foreground">{key}:</span>
                    <span>{String(val)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
