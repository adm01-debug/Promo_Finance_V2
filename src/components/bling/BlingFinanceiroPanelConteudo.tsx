import { Button } from '@/components/ui/button';
import { DollarSign, Tag, Receipt, CreditCard } from 'lucide-react';

/* eslint-disable @typescript-eslint/no-explicit-any -- tipos herdados dos valores de origem (já eram any) */
interface BlingFinanceiroPanelConteudoProps {
  subTab: 'contas' | 'formas' | 'portadores' | 'categorias' | 'borderos';
  setSubTab: import('react').Dispatch<
    import('react').SetStateAction<'contas' | 'formas' | 'portadores' | 'categorias' | 'borderos'>
  >;
  refetchFormas: (
    options?: import('@tanstack/react-query').RefetchOptions
  ) => Promise<import('@tanstack/react-query').QueryObserverResult<any, Error>>;
  refetchPortadores: (
    options?: import('@tanstack/react-query').RefetchOptions
  ) => Promise<import('@tanstack/react-query').QueryObserverResult<any, Error>>;
  refetchCategorias: (
    options?: import('@tanstack/react-query').RefetchOptions
  ) => Promise<import('@tanstack/react-query').QueryObserverResult<any, Error>>;
  refetchBorderos: (
    options?: import('@tanstack/react-query').RefetchOptions
  ) => Promise<import('@tanstack/react-query').QueryObserverResult<any, Error>>;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function BlingFinanceiroPanelConteudo({
  subTab,
  setSubTab,
  refetchFormas,
  refetchPortadores,
  refetchCategorias,
  refetchBorderos,
}: BlingFinanceiroPanelConteudoProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        variant={subTab === 'contas' ? 'default' : 'outline'}
        onClick={() => setSubTab('contas')}
        size="sm"
      >
        <DollarSign className="h-4 w-4 mr-1" /> Contas
      </Button>
      <Button
        variant={subTab === 'formas' ? 'default' : 'outline'}
        onClick={() => {
          setSubTab('formas');
          refetchFormas();
        }}
        size="sm"
      >
        <Tag className="h-4 w-4 mr-1" /> Formas de Pagamento
      </Button>
      <Button
        variant={subTab === 'portadores' ? 'default' : 'outline'}
        onClick={() => {
          setSubTab('portadores');
          refetchPortadores();
        }}
        size="sm"
      >
        <Receipt className="h-4 w-4 mr-1" /> Portadores
      </Button>
      <Button
        variant={subTab === 'categorias' ? 'default' : 'outline'}
        onClick={() => {
          setSubTab('categorias');
          refetchCategorias();
        }}
        size="sm"
      >
        <Tag className="h-4 w-4 mr-1" /> Categorias
      </Button>
      <Button
        variant={subTab === 'borderos' ? 'default' : 'outline'}
        onClick={() => {
          setSubTab('borderos');
          refetchBorderos();
        }}
        size="sm"
      >
        <CreditCard className="h-4 w-4 mr-1" /> Borderôs
      </Button>
    </div>
  );
}
