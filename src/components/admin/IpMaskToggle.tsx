import { Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useIpMaskPreference } from '@/hooks/useIpMaskPreference';
import { cn } from '@/lib/utils';

interface Props {
  className?: string;
  /** Texto curto, ex.: "Mascarar IPs". */
  label?: string;
}

export function IpMaskToggle({ className, label = 'Mascarar IPs' }: Props) {
  const { enabled, setEnabled } = useIpMaskPreference();
  const id = 'ip-mask-toggle';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center gap-2', className)}>
            {enabled ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
            <Label htmlFor={id} className="text-sm cursor-pointer">
              {label}
            </Label>
            <Switch id={id} checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          Os filtros continuam funcionando com o IP original.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
