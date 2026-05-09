import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { Checkbox } from '@/components/ui/checkbox';
import { ContasPagarTableRow } from '@/components/contas-pagar/ContasPagarTableRow';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sparkles } from 'lucide-react';

interface ContasPagarListProps {
  contas: any[];
  isLoading: boolean;
  isAllSelected: boolean;
  selectAll: (checked: boolean) => void;
  isSelected: (id: string) => boolean;
  toggleSelect: (id: string) => void;
  onEdit: (conta: any) => void;
  onDelete: (conta: any) => void;
  onRegistrarPagamento: (conta: any) => void;
  onSolicitarAprovacao: (conta: any) => void;
  getApprovalStatus: (conta: any) => any;
  historicoAprovacaoPorConta: Map<string, any[]>;
  profilesMap: Map<string, any>;
  valorMinimoAprovacao: number;
  getRowAnimation: (index: number) => any;
}

export const ContasPagarList: React.FC<ContasPagarListProps> = ({
  contas,
  isLoading,
  isAllSelected,
  selectAll,
  isSelected,
  toggleSelect,
  onEdit,
  onDelete,
  onRegistrarPagamento,
  onSolicitarAprovacao,
  getApprovalStatus,
  historicoAprovacaoPorConta,
  profilesMap,
  valorMinimoAprovacao,
  getRowAnimation,
}) => {
  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground animate-pulse">Carregando inteligência financeira...</div>;
  }

  if (contas.length === 0) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center space-y-4">
        <Sparkles className="h-12 w-12 text-muted-foreground/20 animate-pulse" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">Global Vault Cleared</p>
      </div>
    );
  }

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const conta = contas[index];
    const approvalStatus = getApprovalStatus(conta);
    const historico = historicoAprovacaoPorConta.get(conta.id) || [];

    return (
      <div style={style} className="border-b border-white/5">
        <Table className="table-fixed">
          <TableBody>
            <ContasPagarTableRow
              conta={conta}
              index={index}
              isSelected={isSelected(conta.id)}
              onToggleSelect={() => toggleSelect(conta.id)}
              onEdit={() => onEdit(conta)}
              onDelete={() => onDelete(conta)}
              onRegistrarPagamento={() => onRegistrarPagamento(conta)}
              onSolicitarAprovacao={() => onSolicitarAprovacao(conta)}
              {...approvalStatus}
              historico={historico}
              profilesMap={profilesMap}
              valorMinimoAprovacao={valorMinimoAprovacao}
              getRowAnimation={getRowAnimation}
              isVirtual
            />
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[1200px]">
        <TableHeader>
          <tr className="bg-white/[0.02] border-b border-white/5">
            <th className="w-16 p-6 text-center">
              <Checkbox 
                checked={isAllSelected}
                onCheckedChange={selectAll}
                aria-label="Selecionar todos"
              />
            </th>
            <th className="w-[300px] p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 text-left">Supplier / Entity</th>
            <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 text-left">Internal Reference</th>
            <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 text-left">Gross Value</th>
            <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 text-left">Maturity Horizon</th>
            <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 text-left">Operational Unit</th>
            <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 text-center">Governance</th>
            <th className="p-6 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 text-center">Ledger Status</th>
            <th className="w-20 p-6"></th>
          </tr>
        </TableHeader>
      </Table>
      <List
        height={600}
        itemCount={contas.length}
        itemSize={100} // Altura aproximada de cada linha
        width="100%"
        className="min-w-[1200px] custom-scrollbar"
      >
        {Row}
      </List>
    </div>
  );
};
