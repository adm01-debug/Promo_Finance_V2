import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useCustomFieldDefinitions, type EntityType } from '@/hooks/useCustomFields';
import { useAuth } from '@/hooks/useAuth';

interface CustomFieldsRendererProps {
  entityType: EntityType;
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
  errors?: Record<string, string>;
}

export function CustomFieldsRenderer({ entityType, values, onChange, errors }: CustomFieldsRendererProps) {
  const { currentEmpresaId } = useAuth();
  const { data: definitions = [] } = useCustomFieldDefinitions(entityType, currentEmpresaId || undefined);

  if (definitions.length === 0) return null;

  return (
    <div className="space-y-4 pt-4 border-t border-white/5 mt-4">
      <h4 className="text-xs font-black uppercase tracking-widest text-primary/60 mb-4">Campos Adicionais</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {definitions.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.name} className="flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-destructive">*</span>}
            </Label>
            
            {field.field_type === 'text' && (
              <Input
                id={field.name}
                placeholder={field.placeholder || ''}
                value={values[field.name] || ''}
                onChange={(e) => onChange(field.name, e.target.value)}
                className="bg-card/5 border-border"
              />
            )}

            {field.field_type === 'number' && (
              <Input
                id={field.name}
                type="number"
                placeholder={field.placeholder || ''}
                value={values[field.name] || ''}
                onChange={(e) => onChange(field.name, Number(e.target.value))}
                className="bg-card/5 border-border"
              />
            )}

            {field.field_type === 'date' && (
              <Input
                id={field.name}
                type="date"
                value={values[field.name] || ''}
                onChange={(e) => onChange(field.name, e.target.value)}
                className="bg-card/5 border-border"
              />
            )}

            {field.field_type === 'boolean' && (
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id={field.name}
                  checked={!!values[field.name]}
                  onChange={(e) => onChange(field.name, e.target.checked)}
                />
                <Label htmlFor={field.name} className="text-sm font-normal text-foreground/60">
                  {field.placeholder || 'Ativado'}
                </Label>
              </div>
            )}

            {field.field_type === 'select' && field.options && (
              <Select
                value={values[field.name] || ''}
                onValueChange={(val) => onChange(field.name, val)}
              >
                <SelectTrigger className="bg-card/5 border-border">
                  <SelectValue placeholder={field.placeholder || 'Selecione...'} />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border text-foreground">
                  {field.options.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {errors?.[field.name] && (
              <p className="text-[10px] text-destructive font-medium">{errors[field.name]}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
