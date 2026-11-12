export interface Props {
  onOpenInSimulator: (claims: Record<string, unknown>, base: BasePayload) => void;
}

export interface BasePayload {
  provider_id?: string;
  claim_mapping?: { email?: string; full_name?: string; groups?: string };
  default_role?: string;
  allowed_domains?: string[];
  role_mappings?: Array<{ idp_group: string; app_role: string }>;
}
