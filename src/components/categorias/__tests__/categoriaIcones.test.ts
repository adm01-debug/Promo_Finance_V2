import { describe, expect, it } from 'vitest';
import { Tag } from 'lucide-react';
import { CATEGORY_ICONS } from '@/hooks/useCategorias';
import { CATEGORIA_ICONES, iconeCategoria } from '../categoriaIcones';

// Mesma conversão usada por CategoriaForm/CategoriaTable ('file-text' -> 'FileText').
const pascal = (iconName: string) =>
  iconName
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');

describe('iconeCategoria', () => {
  it('resolve todos os ícones oferecidos pelo seletor', () => {
    for (const iconName of CATEGORY_ICONS) {
      expect(
        CATEGORIA_ICONES[pascal(iconName)],
        `ícone ausente no mapa: ${iconName}`
      ).toBeDefined();
    }
  });

  it('cai no Tag quando o nome não está no mapa', () => {
    expect(iconeCategoria('icone-inexistente')).toBe(Tag);
  });
});
