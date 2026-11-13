import type { AuditoriaCFCResult } from '@/hooks/useAuditoriaCFC';
import type { EmpresaHeader } from '@/lib/export-contabil';

export interface Props {
  resultado: AuditoriaCFCResult;
  empresa?: EmpresaHeader;
  className?: string;
  /** Modo compacto, sem ações de exportação (usado inline nos wizards) */
  compact?: boolean;
}
