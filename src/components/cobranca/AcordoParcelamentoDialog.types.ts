import { z } from 'zod';
import { formSchema } from './AcordoParcelamentoDialog.helpers';

export type FormValues = z.infer<typeof formSchema>;

export interface AcordoParcelamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contasReceberId?: string[];
  valorTotal?: number;
  clienteNome?: string;
  empresaId: string;
}
