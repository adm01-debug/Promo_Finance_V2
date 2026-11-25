import {
  Briefcase,
  Car,
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
  Package,
  Percent,
  Phone,
  ShoppingCart,
  Star,
  Tag,
  Truck,
  Utensils,
  Users,
  Wifi,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';

/**
 * Mapa explícito de `CATEGORY_ICONS` (src/hooks/useCategorias.ts) para componentes Lucide.
 * Substitui `import * as Icons from 'lucide-react'`, que retinha a biblioteca inteira
 * no chunk de Categorias e estourava o gate de bundle de .github/workflows/ci.yml.
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
};

export function iconeCategoria(pascalName: string): LucideIcon {
  return CATEGORIA_ICONES[pascalName] ?? Tag;
}
