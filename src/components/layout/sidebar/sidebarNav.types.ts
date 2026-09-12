import type { ElementType } from 'react';

export interface NavItem {
  label: string;
  icon: ElementType;
  href: string;
  badge?: number;
  badgeKey?: string;
  highlight?: boolean;
  sectionHeader?: string;
}

export interface NavGroup {
  id: string;
  label: string;
  icon: ElementType;
  items: NavItem[];
  defaultOpen?: boolean;
}
