import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, User, Clock, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface VersionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recordId: string;
  tableName: string;
}

export function VersionHistory({ open, onOpenChange, recordId, tableName }: VersionHistoryProps) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['audit_logs', tableName, recordId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('table_name', tableName)
        .eq('record_id', recordId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: open && !!recordId,
  });

  const formatValue = (val: any) => {
    if (val === null) return 'null';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Histórico de Alterações
          </SheetTitle>
          <SheetDescription>
            Rastro de auditoria para o registro selecionado
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6 pr-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <History className="h-10 w-10 mb-2 opacity-20" />
              <p>Nenhuma alteração registrada</p>
            </div>
          ) : (
            <div className="relative space-y-6 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-border">
              {logs.map((log) => (
                <div key={log.id} className="relative pl-10">
                  <div className="absolute left-2 top-1.5 w-4 h-4 rounded-full bg-background border-2 border-primary z-10" />
                  <Card className="border-white/5 bg-card/5 shadow-none hover:bg-card/10 transition-colors">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold">
                          {log.action}
                        </Badge>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(log.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm font-medium">
                        <User className="h-4 w-4 text-primary" />
                        <span className="truncate">{log.user_email || 'Sistema / Automatizado'}</span>
                      </div>

                      {log.action === 'UPDATE' && log.new_data && log.old_data && (
                        <div className="space-y-2 mt-2">
                          {Object.keys(log.new_data as object).map(key => {
                            const oldVal = (log.old_data as any)[key];
                            const newVal = (log.new_data as any)[key];
                            if (oldVal === newVal) return null;
                            
                            return (
                              <div key={key} className="text-xs p-2 rounded bg-black/20 border border-white/5">
                                <p className="font-bold text-primary mb-1 uppercase tracking-tighter">{key.replace(/_/g, ' ')}</p>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <span className="line-through opacity-50">{formatValue(oldVal)}</span>
                                  <ChevronRight className="h-3 w-3" />
                                  <span className="text-foreground">{formatValue(newVal)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {log.details && (
                        <p className="text-xs text-muted-foreground italic mt-2 border-t border-white/5 pt-2">
                          {log.details}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// Re-using Card components for internal structure
import { Card, CardContent } from '@/components/ui/card';
