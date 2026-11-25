import {
  Briefcase,
  Car,
  Clipboard,
  Cloud,
  CreditCard,
  DollarSign,
  Droplet,
  FileText,
  Folder,
  Gift,
  Heart,
  Home,
  Megaphone,
  Monitor,
  MoreHorizontal,
  Package,
  Percent,
  Phone,
  RefreshCw,
  ShoppingCart,
  Star,
  Tag,
  TrendingUp,
  Truck,
  Utensils,
  Users,
  Wifi,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';

/**
 * Mapa explícito dos ícones de categoria para componentes Lucide.
 *
 * Cobre `CATEGORY_ICONS` (o seletor do formulário) mais os ícones gravados pela
 * carga inicial `create_default_categories_for_user` (003_seed_data.sql):
 * clipboard, cloud, more-horizontal, trending-up e refresh-cw.
 *
 * Substitui `import * as Icons from 'lucide-react'`, que retinha a biblioteca
 * inteira no chunk de Categorias e estourava o gate de bundle de ci.yml.
 */
export const CATEGORIA_ICONES: Record<string, LucideIcon> = {
  Home,
  Droplet,
  Zap,
  Wifi,
  Phone,
  Users,
  Truck,
  Package,
  Megaphone,
  FileText,
  Wrench,
  Car,
  Utensils,
  Monitor,
  ShoppingCart,
  Briefcase,
  CreditCard,
  DollarSign,
  Percent,
  Gift,
  Heart,
  Star,
  Tag,
  Folder,
  Clipboard,
  Cloud,
  MoreHorizontal,
  TrendingUp,
  RefreshCw,
};

export function iconeCategoria(pascalName: string): LucideIcon {
  return Object.prototype.hasOwnProperty.call(CATEGORIA_ICONES, pascalName)
    ? CATEGORIA_ICONES[pascalName]
    : Tag;
}
