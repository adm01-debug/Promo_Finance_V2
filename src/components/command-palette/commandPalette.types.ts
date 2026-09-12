import type { LucideIcon } from 'lucide-react';

export interface PaletteCommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  action: () => void;
  keywords?: string[];
  shortcut?: string[];
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export interface PaletteCommandGroup {
  heading: string;
  items: PaletteCommandItem[];
}
