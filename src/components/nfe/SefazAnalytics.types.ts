export type Periodo = '24h' | '7d' | '30d' | '90d';

export interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
}

export interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}
