import { useMemo, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ShieldCheck, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  SSO_SYNC_FIELD_LABEL,
  useLastSsoProfileSync,
  type SsoSyncFieldKey,
} from '@/hooks/useLastSsoProfileSync';

interface Props {
  userId?: string | null;
}

const DISMISS_KEY = 'sso-profile-sync-banner-dismissed-id';

/**
 * Aviso exibido no painel do usuário quando o último login SSO sincronizou
 * e alterou full_name, avatar_url ou telefone. Mostra:
 *   - provider responsável (ex: "Azure AD")
 *   - lista dos campos atualizados
 *   - data/hora do login (relativa + absoluta)
 *
 * O banner é dispensável; a dispensa é por evento (id), então um novo sync
 * volta a exibir o aviso.
 */
export function SsoProfileSyncBanner({ userId }: Props) {
  const { data, isLoading } = useLastSsoProfileSync(userId);
  const [dismissed, setDismissed] = useState<string | null>(() =>
    typeof window !== 'undefined' ? window.localStorage.getItem(DISMISS_KEY) : null,
  );

  const dateInfo = useMemo(() => {
    if (!data) return null;
    const d = new Date(data.created_at);
    return {
      absolute: format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
      relative: formatDistanceToNow(d, { addSuffix: true, locale: ptBR }),
    };
  }, [data]);

  if (isLoading || !data || data.fields_changed.length === 0) return null;
  if (dismissed === data.id) return null;

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(DISMISS_KEY, data.id);
    }
    setDismissed(data.id);
  };

  return (
    <Alert className="border-primary/30 bg-primary/5 relative">
      <ShieldCheck className="h-4 w-4 text-primary" />
      <AlertTitle className="pr-8">
        Seu perfil foi sincronizado pelo login SSO
        {data.provider_nome ? <> · {data.provider_nome}</> : null}
      </AlertTitle>
      <AlertDescription className="space-y-2">
        <p className="text-sm">
          {dateInfo && (
            <>
              No último login ({dateInfo.relative}, {dateInfo.absolute}), os seguintes
              campos foram atualizados a partir do seu provedor de identidade:
            </>
          )}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {data.fields_changed.map((f: SsoSyncFieldKey) => (
            <Badge key={f} variant="outline" className="bg-background">
              {SSO_SYNC_FIELD_LABEL[f]}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Alterações manuais nestes campos podem ser substituídas no próximo login SSO.
        </p>
      </AlertDescription>
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={handleDismiss}
        aria-label="Dispensar aviso"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </Alert>
  );
}
