import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Building2, Receipt, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface BIDrillDownProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any[];
  type: 'receber' | 'pagar' | 'bancario';
}

export function BIDrillDown({ isOpen, onClose, title, data, type }: BIDrillDownProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-white/10">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black">{title}</DialogTitle>
              <DialogDescription>Detalhamento dos lançamentos que compõem este indicador.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 pb-6">
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <Table>
              <TableHeader className="bg-card/5">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Documento / Cliente</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Data</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                  <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground font-medium">
                      Nenhum lançamento encontrado para este filtro.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item) => (
                    <TableRow key={item.id} className="border-white/5 hover:bg-card/5 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{item.cliente_nome || item.fornecedor_nome || 'Lançamento Direto'}</span>
                          <div className="flex items-center gap-1.5 opacity-60">
                            <Building2 className="h-3 w-3" />
                            <span className="text-[10px] font-medium truncate max-w-[200px]">{item.descricao || 'Sem descrição'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-medium">{formatDate(item.data_vencimento || item.data_pagamento || item.created_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md",
                            item.status === 'pago' ? "border-success/30 text-success bg-success/5" :
                            item.status === 'vencido' ? "border-destructive/30 text-destructive bg-destructive/5" :
                            "border-warning/30 text-warning bg-warning/5"
                          )}
                        >
                          {item.status || 'Pendente'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-black text-sm">
                        <div className="flex items-center justify-end gap-1.5">
                          {type === 'receber' ? <ArrowDownRight className="h-3 w-3 text-success" /> : <ArrowUpRight className="h-3 w-3 text-destructive" />}
                          {formatCurrency(item.valor || 0)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
