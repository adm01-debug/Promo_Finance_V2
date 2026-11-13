import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function SpedHistoricoTableConteudo() {
  return (
    <TableHeader className="bg-card/5">
      <TableRow className="border-white/5 hover:bg-transparent">
        <TableHead className="w-12 p-6"></TableHead>
        <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] opacity-40 text-left">
          Período Fiscal
        </TableHead>
        <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] opacity-40 text-left">
          Geração / Lote
        </TableHead>
        <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] opacity-40 text-left">
          Métricas
        </TableHead>
        <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] opacity-40 text-left">
          Status Auditoria
        </TableHead>
        <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] opacity-40 text-left">
          Protocolo / Hash
        </TableHead>
        <TableHead className="p-6 font-black text-[10px] uppercase tracking-[0.2em] opacity-40 text-right pr-8">
          Governança
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
