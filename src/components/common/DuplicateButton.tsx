import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface DuplicateButtonProps<T> {
  data: T;
  onDuplicate: (duplicatedData: T) => void;
  label?: string;
  className?: string;
  variant?: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function DuplicateButton<T extends object>({ 
  data, 
  onDuplicate, 
  label, 
  className,
  variant = "ghost",
  size = "icon"
}: DuplicateButtonProps<T>) {
  
  const handleDuplicate = () => {
    // Deep clone and remove metadata
    const { 
      id, 
      created_at, 
      updated_at, 
      created_by,
      status,
      idempotency_key,
      ...rest 
    } = JSON.parse(JSON.stringify(data));
    
    // Add a hint to the description if it exists
    const duplicatedData = {
      ...rest,
      descricao: rest.descricao ? `${rest.descricao} (Cópia)` : undefined,
      nome: rest.nome ? `${rest.nome} (Cópia)` : undefined,
    };
    
    onDuplicate(duplicatedData);
    toast.info('Dados clonados para o formulário');
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant={variant} 
            size={size} 
            onClick={(e) => {
              e.stopPropagation();
              handleDuplicate();
            }}
            className={className}
          >
            <Copy className={size === 'icon' ? "h-4 w-4" : "h-4 w-4 mr-2"} />
            {label}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Duplicar registro</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
