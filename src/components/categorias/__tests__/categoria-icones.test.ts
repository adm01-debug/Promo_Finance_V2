import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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

/**
 * Lê os ícones realmente gravados por `create_default_categories_for_user` em
 * 003_seed_data.sql, em vez de manter uma lista fixa: se o SQL passar a gravar
 * um ícone novo, este teste falha até o mapa ser atualizado.
 */
function iconesDaCargaInicial(): string[] {
  const sql = readFileSync(join(process.cwd(), 'supabase/migrations/003_seed_data.sql'), 'utf8');
  const linhaCategoria = /\(\s*'[^']*',\s*'[^']*',\s*'#[0-9a-fA-F]{3,8}',\s*'([a-z0-9-]+)'/g;
  const nomes = new Set<string>();
  for (const achado of sql.matchAll(linhaCategoria)) nomes.add(achado[1]);
  return [...nomes];
}

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
    const icones = iconesDaCargaInicial();
    expect(icones.length, 'nenhum ícone encontrado em 003_seed_data.sql').toBeGreaterThan(0);
    for (const iconName of icones) {
      expect(
        CATEGORIA_ICONES[pascal(iconName)],
        `ícone ausente no mapa: ${iconName}`
      ).toBeDefined();
    }
  });

  it('cai no Tag quando o nome não está no mapa', () => {
    expect(iconeCategoria('icone-inexistente')).toBe(Tag);
  });

  it('não resolve chaves herdadas do protótipo do objeto', () => {
    expect(iconeCategoria('constructor')).toBe(Tag);
  });
});
