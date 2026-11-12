import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ListChecks } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CHECKLIST_ITEMS } from './ScimSetupGuide.helpers';

interface ScimSetupGuideChecklistConfiguracaoProps {
  completedCount: number;
  progressPct: number;
  isConfirmed: (key: string) => boolean;
  items: Record<
    string,
    import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/hooks/useScimChecklist').ScimChecklistItem
  >;
  saving: string;
  checklistLoading: boolean;
  toggle: (itemKey: string, confirmed: boolean) => Promise<void>;
}

export function ScimSetupGuideChecklistConfiguracao({
  completedCount,
  progressPct,
  isConfirmed,
  items,
  saving,
  checklistLoading,
  toggle,
}: ScimSetupGuideChecklistConfiguracaoProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Checklist de configuração</CardTitle>
              <CardDescription>
                Marque cada item ao concluí-lo. Suas confirmações ficam salvas no servidor e
                persistem entre sessões.
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={completedCount === CHECKLIST_ITEMS.length ? 'default' : 'outline'}
            className="shrink-0"
          >
            {completedCount}/{CHECKLIST_ITEMS.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progressPct} className="h-2" />
        <div className="space-y-2">
          {CHECKLIST_ITEMS.map((item) => {
            const checked = isConfirmed(item.key);
            const confirmedAt = items[item.key]?.confirmed_at;
            const isSaving = saving === item.key;
            return (
              <div
                key={item.key}
                className="flex items-start gap-3 p-3 rounded-md border bg-card hover:bg-accent/30 transition-colors"
              >
                <div className="flex-1">
                  <Checkbox
                    id={`scim-check-${item.key}`}
                    checked={checked}
                    disabled={checklistLoading || isSaving}
                    onChange={(e) => toggle(item.key, e.target.checked)}
                    label={
                      <span className="flex items-center gap-2">
                        <span>{item.label}</span>
                        {isSaving && (
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        )}
                      </span>
                    }
                    description={item.description}
                  />
                </div>
                {checked && confirmedAt && (
                  <span className="text-xs text-muted-foreground shrink-0 pt-1">
                    {formatDistanceToNow(new Date(confirmedAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
