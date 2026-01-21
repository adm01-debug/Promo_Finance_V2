import { supabase } from '@/integrations/supabase/client';

export interface Categoria {
  id: string;
  user_id: string;
  nome: string;
  tipo: 'despesa' | 'receita';
  cor?: string;
  icone?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoriaInput {
  nome: string;
  tipo: 'despesa' | 'receita';
  cor?: string;
  icone?: string;
}

class CategoriasService {
  private table = 'categorias';

  /**
   * Get all categories
   */
  async getAll(tipo?: 'despesa' | 'receita'): Promise<Categoria[]> {
    let query = supabase
      .from(this.table)
      .select('*')
      .eq('ativo', true)
      .order('nome');

    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Get expense categories
   */
  async getDespesas(): Promise<Categoria[]> {
    return this.getAll('despesa');
  }

  /**
   * Get revenue categories
   */
  async getReceitas(): Promise<Categoria[]> {
    return this.getAll('receita');
  }

  /**
   * Get category by ID
   */
  async getById(id: string): Promise<Categoria> {
    const { data, error } = await supabase
      .from(this.table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a new category
   */
  async create(categoria: CategoriaInput): Promise<Categoria> {
    const { data, error } = await supabase
      .from(this.table)
      .insert(categoria)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a category
   */
  async update(id: string, categoria: Partial<CategoriaInput>): Promise<Categoria> {
    const { data, error } = await supabase
      .from(this.table)
      .update(categoria)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete (deactivate) a category
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(this.table)
      .update({ ativo: false })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Get categories with usage stats
   */
  async getWithStats(): Promise<(Categoria & { count: number; total: number })[]> {
    const [categorias, despesas, receitas] = await Promise.all([
      this.getAll(),
      supabase.from('contas_pagar').select('categoria, valor'),
      supabase.from('contas_receber').select('categoria, valor'),
    ]);

    return categorias.map((cat) => {
      let count = 0;
      let total = 0;

      const items = cat.tipo === 'despesa' 
        ? (despesas.data || []) 
        : (receitas.data || []);

      items.forEach((item: any) => {
        if (item.categoria === cat.nome) {
          count++;
          total += Number(item.valor) || 0;
        }
      });

      return { ...cat, count, total };
    });
  }

  /**
   * Get default categories
   */
  getDefaultCategories(): { despesas: string[]; receitas: string[] } {
    return {
      despesas: [
        'Aluguel',
        'Água',
        'Luz',
        'Internet',
        'Telefone',
        'Salários',
        'Fornecedores',
        'Material de Escritório',
        'Marketing',
        'Impostos',
        'Manutenção',
        'Transporte',
        'Alimentação',
        'Software/Assinaturas',
        'Outras Despesas',
      ],
      receitas: [
        'Vendas',
        'Serviços',
        'Consultoria',
        'Comissões',
        'Rendimentos',
        'Reembolsos',
        'Outras Receitas',
      ],
    };
  }

  /**
   * Initialize default categories for user
   */
  async initializeDefaultCategories(): Promise<void> {
    const defaults = this.getDefaultCategories();
    
    const categoriasToCreate: CategoriaInput[] = [
      ...defaults.despesas.map((nome) => ({ nome, tipo: 'despesa' as const })),
      ...defaults.receitas.map((nome) => ({ nome, tipo: 'receita' as const })),
    ];

    const { error } = await supabase
      .from(this.table)
      .upsert(
        categoriasToCreate.map((cat) => ({
          ...cat,
          ativo: true,
        })),
        { onConflict: 'user_id,nome,tipo' }
      );

    if (error) throw error;
  }
}

export const categoriasService = new CategoriasService();

export default categoriasService;
