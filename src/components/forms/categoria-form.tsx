import { useZodForm } from '@/hooks/useZodForm';
import { categoriaSchema } from '@/lib/schemas';
import { FormField } from './form-field';
import { cn } from '@/lib/utils';

interface CategoriaFormProps {
  initialValues?: Partial<CategoriaValues>;
  onSubmit: (values: CategoriaValues) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  categoriaPai?: Array<{ id: string; nome: string }>;
  className?: string;
}

interface CategoriaValues {
  nome: string;
  tipo: 'receita' | 'despesa';
  cor: string;
  icone?: string;
  descricao?: string;
  categoriaPaiId?: string;
  ativo: boolean;
}

const defaultValues: CategoriaValues = {
  nome: '', tipo: 'despesa', cor: '#3B82F6', icone: '', descricao: '', categoriaPaiId: '', ativo: true,
};

const coresPredefinidas = [
  { value: '#EF4444', label: 'Vermelho' }, { value: '#F97316', label: 'Laranja' },
  { value: '#F59E0B', label: 'Âmbar' }, { value: '#EAB308', label: 'Amarelo' },
  { value: '#84CC16', label: 'Lima' }, { value: '#22C55E', label: 'Verde' },
  { value: '#10B981', label: 'Esmeralda' }, { value: '#14B8A6', label: 'Turquesa' },
  { value: '#06B6D4', label: 'Ciano' }, { value: '#0EA5E9', label: 'Azul Claro' },
  { value: '#3B82F6', label: 'Azul' }, { value: '#6366F1', label: 'Índigo' },
  { value: '#8B5CF6', label: 'Violeta' }, { value: '#A855F7', label: 'Roxo' },
  { value: '#D946EF', label: 'Fúcsia' }, { value: '#EC4899', label: 'Rosa' },
];

const iconesPredefinidos = [
  { value: 'shopping-cart', label: '🛒 Compras' }, { value: 'utensils', label: '🍽️ Alimentação' },
  { value: 'car', label: '🚗 Transporte' }, { value: 'home', label: '🏠 Moradia' },
  { value: 'heart', label: '❤️ Saúde' }, { value: 'book', label: '📚 Educação' },
  { value: 'film', label: '🎬 Entretenimento' }, { value: 'briefcase', label: '💼 Trabalho' },
  { value: 'plane', label: '✈️ Viagem' }, { value: 'gift', label: '🎁 Presentes' },
  { value: 'tool', label: '🔧 Manutenção' }, { value: 'dollar-sign', label: '💰 Investimentos' },
  { value: 'credit-card', label: '💳 Cartão' }, { value: 'file-text', label: '📄 Impostos' },
  { value: 'users', label: '👥 Pessoal' }, { value: 'star', label: '⭐ Outros' },
];

export function CategoriaForm({ initialValues, onSubmit, onCancel, isLoading = false, categoriaPai = [], className }: CategoriaFormProps) {
  const form = useZodForm({ schema: categoriaSchema, initialValues: { ...defaultValues, ...initialValues }, onSubmit });

  return (
    <form onSubmit={form.handleSubmit} className={cn('space-y-6', className)}>
      {/* Informações Básicas */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">Informações da Categoria</h3>
        <FormField label="Nome da Categoria" error={form.errors.nome} required>
          <input type="text" {...form.getFieldProps('nome')} placeholder="Ex: Alimentação, Transporte, Vendas..."
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground" />
        </FormField>

        <FormField label="Tipo" error={form.errors.tipo} required>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="tipo" value="despesa" checked={form.values.tipo === 'despesa'}
                onChange={() => form.setFieldValue('tipo', 'despesa')} className="w-4 h-4 text-destructive border-border focus:ring-destructive" />
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <span className="w-3 h-3 bg-destructive rounded-full"></span>Despesa
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="tipo" value="receita" checked={form.values.tipo === 'receita'}
                onChange={() => form.setFieldValue('tipo', 'receita')} className="w-4 h-4 text-success border-border focus:ring-success" />
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <span className="w-3 h-3 bg-success rounded-full"></span>Receita
              </span>
            </label>
          </div>
        </FormField>

        <FormField label="Descrição" error={form.errors.descricao}>
          <textarea {...form.getFieldProps('descricao')} rows={2} placeholder="Descrição opcional da categoria..."
            className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground resize-none" />
        </FormField>
      </div>

      {/* Aparência */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">Aparência</h3>
        <FormField label="Cor" error={form.errors.cor}>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {coresPredefinidas.map((cor) => (
                <button key={cor.value} type="button" onClick={() => form.setFieldValue('cor', cor.value)}
                  className={cn('w-8 h-8 rounded-full border-2 transition-transform hover:scale-110',
                    form.values.cor === cor.value ? 'border-foreground scale-110' : 'border-transparent'
                  )} style={{ backgroundColor: cor.value }} title={cor.label} />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input type="color" value={form.values.cor} onChange={(e) => form.setFieldValue('cor', e.target.value)}
                className="w-10 h-10 p-1 border border-border rounded cursor-pointer" />
              <input type="text" value={form.values.cor} onChange={(e) => form.setFieldValue('cor', e.target.value)} placeholder="#000000"
                className="w-28 px-3 py-2 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground" />
              <div className="flex items-center justify-center w-10 h-10 rounded-lg text-white font-bold text-sm" style={{ backgroundColor: form.values.cor }}>
                {form.values.nome?.charAt(0)?.toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </FormField>

        <FormField label="Ícone" error={form.errors.icone}>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {iconesPredefinidos.map((icone) => (
              <button key={icone.value} type="button" onClick={() => form.setFieldValue('icone', icone.value)}
                className={cn('p-2 text-xl rounded-lg border-2 transition-colors hover:bg-muted',
                  form.values.icone === icone.value ? 'border-primary bg-primary/5' : 'border-border'
                )} title={icone.label}>
                {icone.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </FormField>
      </div>

      {/* Hierarquia */}
      {categoriaPai.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">Hierarquia</h3>
          <FormField label="Categoria Pai" error={form.errors.categoriaPaiId} hint="Opcional - selecione para criar uma subcategoria">
            <select {...form.getFieldProps('categoriaPaiId')}
              className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground">
              <option value="">Nenhuma (categoria principal)</option>
              {categoriaPai.map((cat) => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
            </select>
          </FormField>
        </div>
      )}

      {/* Status */}
      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
        <input type="checkbox" id="ativo" checked={form.values.ativo}
          onChange={(e) => form.setFieldValue('ativo', e.target.checked)}
          className="w-4 h-4 text-primary border-border rounded focus:ring-primary" />
        <label htmlFor="ativo" className="text-sm font-medium text-foreground">Categoria ativa</label>
        <span className="text-xs text-muted-foreground">(categorias inativas não aparecem nas listas de seleção)</span>
      </div>

      {/* Preview */}
      <div className="p-4 border border-border rounded-lg">
        <p className="text-sm text-muted-foreground mb-3">Preview:</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg text-white" style={{ backgroundColor: form.values.cor }}>
            {form.values.icone ? (
              <span className="text-lg">{iconesPredefinidos.find((i) => i.value === form.values.icone)?.label.split(' ')[0] || '⭐'}</span>
            ) : (
              <span className="font-bold">{form.values.nome?.charAt(0)?.toUpperCase() || 'C'}</span>
            )}
          </div>
          <div>
            <p className="font-medium text-foreground">{form.values.nome || 'Nome da categoria'}</p>
            <p className="text-xs text-muted-foreground">
              {form.values.tipo === 'receita' ? '📈 Receita' : '📉 Despesa'}
              {!form.values.ativo && ' • Inativa'}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50">
            Cancelar
          </button>
        )}
        <button type="submit" disabled={isLoading || !form.isValid}
          className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary border border-transparent rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Salvando...
            </span>
          ) : 'Salvar Categoria'}
        </button>
      </div>
    </form>
  );
}
