import { describe, expect, it } from 'vitest';
import { Tag } from 'lucide-react';
import { CATEGORY_ICONS } from '@/hooks/useCategorias';
import { CATEGORIA_ICONES, iconeCategoria } from '../categoria-icones';

// Mesma conversão usada por CategoriaForm/CategoriaTable ('file-text' -> 'FileText').
const pascal = (iconName: string) =>
  iconName
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');

// Ícones gravados por create_default_categories_for_user (003_seed_data.sql).
const ICONES_DA_CARGA_INICIAL = [
  'clipboard',
  'cloud',
  'more-horizontal',
  'trending-up',
  'refresh-cw',
];

describe('iconeCategoria', () => {
  it('resolve todos os ícones oferecidos pelo seletor', () => {
    for (const iconName of CATEGORY_ICONS) {
      expect(
        CATEGORIA_ICONES[pascal(iconName)],
        `ícone ausente no mapa: ${iconName}`
      ).toBeDefined();
    }
  });

  it('resolve os ícones gravados pela carga inicial de categorias', () => {
    for (const iconName of ICONES_DA_CARGA_INICIAL) {
      expect(iconeCategoria(pascal(iconName)), `ícone ausente no mapa: ${iconName}`).not.toBe(Tag);
    }
  });

  it('cai no Tag quando o nome não está no mapa', () => {
    expect(iconeCategoria('icone-inexistente')).toBe(Tag);
  });

  it('não resolve chaves herdadas do protótipo do objeto', () => {
    expect(iconeCategoria('constructor')).toBe(Tag);
  });
});
