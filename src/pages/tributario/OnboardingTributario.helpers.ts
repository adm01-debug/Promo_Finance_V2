// Helpers da página OnboardingTributario — extraídos para zerar max-lines.
import type { CnpjaData } from '@/hooks/useCnpjaLookup';

export function regimeLabel(r: CnpjaData['regimeAtual']): string {
  switch (r) {
    case 'mei':
      return 'MEI';
    case 'simples':
      return 'Simples Nacional';
    case 'presumido_real':
      return 'Presumido / Real';
    default:
      return r;
  }
}
