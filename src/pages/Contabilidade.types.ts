import { BookOpen } from 'lucide-react';
import { VALID_TABS } from './Contabilidade.helpers';

export type TabId = (typeof VALID_TABS)[number];

export interface HistoricoMin {
  tipo: string;
  ano_calendario: number;
  status: string;
}

export interface HomeCard {
  id: TabId;
  label: string;
  description: string;
  icon: typeof BookOpen;
  accent: string;
}

export interface ContabilidadeHomeProps {
  onSelect: (tab: string) => void;
  ecfPendente: boolean;
  ano: number;
  empresaSelecionada: boolean;
}
