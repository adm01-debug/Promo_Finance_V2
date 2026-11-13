import { ExtratoOFX } from '@/lib/ofx-parser';

export interface ImportarExtratoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: (extrato: ExtratoOFX) => void;
  contaBancariaId?: string;
}

export type Step = 'upload' | 'processing' | 'preview' | 'error' | 'open-finance-loading';
