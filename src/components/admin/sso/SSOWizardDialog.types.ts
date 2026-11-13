import type { SSOProvider } from '@/hooks/useSSO';

export interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: SSOProvider | null;
}
