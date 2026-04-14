import {
  Building2, Calendar, DollarSign, FileText, Copy, ExternalLink,
  Banknote, QrCode, CreditCard, Wallet, Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CalculadoraJurosMulta } from './CalculadoraJurosMulta';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ContaReceberWithRelations } from './ContasReceberTableRow';

interface Props {
  conta: ContaReceberWithRelations;
  overdueDays: number;
  boletos: any[];
  acordos: any[];
}

export function DrawerDetailsTab({ conta, overdueDays, boletos, acordos }: Props) {
  const handleCopyPix = () => {
    if (conta.chave_pix) {
      navigator.clipboard.writeText(conta.chave_pix);
      toast.success('Chave PIX copiada!');
    }
  };

  return (
    <div className="space-y-4">
      {/* Juros/Multa Calculator for overdue */}
      {conta.status === 'vencido' && (
        <CalculadoraJurosMulta
          valorOriginal={conta.valor}
          dataVencimento={conta.data_vencimento}
          valorRecebido={conta.valor_recebido || 0}
        />
      )}

      {/* Client Info */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Cliente</h4>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{conta.cliente_nome}</p>
            <p className="text-xs text-muted-foreground">{conta.clientes?.nome_fantasia || '-'}</p>
          </div>
          {conta.clientes?.score && (
            <Badge variant="outline" className={cn(
              "ml-auto",
              conta.clientes.score >= 800 ? 'text-success border-success/30' :
              conta.clientes.score >= 600 ? 'text-warning border-warning/30' :
              'text-destructive border-destructive/30'
            )}>
              Score: {conta.clientes.score}
            </Badge>
          )}
        </div>
      </div>

      <Separator />

      {/* Dates */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Datas</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/30">
            <span className="text-xs text-muted-foreground">Emissão</span>
            <p className="text-sm font-medium mt-0.5">{formatDate(conta.data_emissao)}</p>
          </div>
          <div className={cn("p-3 rounded-lg", overdueDays > 0 && conta.status !== 'pago' ? 'bg-destructive/5 border border-destructive/20' : 'bg-muted/30')}>
            <span className="text-xs text-muted-foreground">Vencimento</span>
            <p className="text-sm font-medium mt-0.5">{formatDate(conta.data_vencimento)}</p>
            {overdueDays > 0 && conta.status !== 'pago' && (
              <p className="text-xs text-destructive font-medium">{overdueDays} dias em atraso</p>
            )}
          </div>
          {conta.data_recebimento && (
            <div className="p-3 rounded-lg bg-success/5 border border-success/20">
              <span className="text-xs text-muted-foreground">Recebimento</span>
              <p className="text-sm font-medium mt-0.5 text-success">{formatDate(conta.data_recebimento)}</p>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Details Grid */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Informações</h4>
        <div className="space-y-2">
          {conta.numero_documento && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Nº Documento</span>
              <span className="font-medium">{conta.numero_documento}</span>
            </div>
          )}
          {conta.numero_parcela_atual && conta.total_parcelas && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Parcela</span>
              <span className="font-medium">{conta.numero_parcela_atual}/{conta.total_parcelas}</span>
            </div>
          )}
          {conta.centros_custo && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Centro de Custo</span>
              <span className="font-medium">{conta.centros_custo.codigo} - {conta.centros_custo.nome}</span>
            </div>
          )}
          {conta.contas_bancarias && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Conta Bancária</span>
              <span className="font-medium">{conta.contas_bancarias.banco}</span>
            </div>
          )}
          {conta.chave_pix && (
            <div className="flex justify-between text-sm items-center">
              <span className="text-muted-foreground">Chave PIX</span>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={handleCopyPix}>
                <Copy className="h-3 w-3" /> {conta.chave_pix}
              </Button>
            </div>
          )}
          {conta.link_boleto && (
            <div className="flex justify-between text-sm items-center">
              <span className="text-muted-foreground">Boleto</span>
              <a href={conta.link_boleto} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-xs">
                <ExternalLink className="h-3 w-3" /> Abrir Boleto
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Boletos vinculados */}
      {boletos.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Banknote className="h-4 w-4" /> Boletos Emitidos
            </h4>
            {boletos.map((b: any) => (
              <div key={b.id} className="p-3 rounded-lg border bg-muted/20 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium">Nº {b.numero}</span>
                  <Badge variant="outline" className="text-xs">{b.status}</Badge>
                </div>
                <p className="text-muted-foreground text-xs">Venc: {formatDate(b.vencimento)} • {formatCurrency(b.valor)}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Acordos vinculados */}
      {acordos.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Users className="h-4 w-4" /> Acordos de Parcelamento
            </h4>
            {acordos.map((a: any) => (
              <div key={a.id} className="p-3 rounded-lg border bg-muted/20 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium">{a.numero_acordo}</span>
                  <Badge variant="outline" className="text-xs">{a.status}</Badge>
                </div>
                <p className="text-muted-foreground text-xs">
                  {a.numero_parcelas}x de {formatCurrency(a.valor_parcela)}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Observações */}
      {conta.observacoes && (
        <>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Observações</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{conta.observacoes}</p>
          </div>
        </>
      )}
    </div>
  );
}
