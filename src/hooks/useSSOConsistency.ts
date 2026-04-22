import { useMemo } from 'react';
import { validateSSOConfig, summarizeIssues, type SSOConfigInput } from '@/lib/sso/consistency';

export function useSSOConsistency(config: SSOConfigInput) {
  return useMemo(() => summarizeIssues(validateSSOConfig(config)), [config]);
}
