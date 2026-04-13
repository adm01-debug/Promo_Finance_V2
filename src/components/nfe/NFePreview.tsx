import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, Download, Copy, Check, Printer, Mail, 
  Building2, FileCode, AlertTriangle, Package, User, Calendar
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { toast } from 'sonner';
import { DANFEGenerator } from '@/components/nfe/DANFEGenerator';
import { NotaFiscal, statusConfig } from './nfe-types';

export function NFePreview({ nfe }: { nfe: NotaFiscal }) {
  const [copied, setCopied] = useState(false);
  const [danfeOpen, setDanfeOpen] = useState(false);

  const handleCopyChave = () => {
    navigator.clipboard.writeText(nfe.chaveAcesso);
    setCopied(true);
    toast.success('Chave de acesso copiada!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">NF-e #{nfe.numero}</h3>
              <p className="text-sm text-muted-foreground">Série {nfe.serie}</p>
            </div>
          </div>
          <Badge variant="outline" className={statusConfig[nfe.status].color}>
            {statusConfig[nfe.status].label}
          </Badge>
        </div>

        <div className="bg-background rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">Chave de Acesso</div>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono flex-1 break-all">{nfe.chaveAcesso}</code>
            <Button variant="ghost" size="sm" onClick={handleCopyChave}>
              {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {nfe.protocolo && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">Protocolo:</span>
            <span className="font-mono">{nfe.protocolo}</span>
          </div>
        )}
      </div>

      {/* Emitente e Destinatário */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Emitente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{nfe.emitenteNome}</p>
            <p className="text-muted-foreground">{nfe.cnpjEmitente}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" /> Destinatário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{nfe.destinatarioNome}</p>
            <p className="text-muted-foreground">{nfe.cnpjDestinatario}</p>
            <p className="text-muted-foreground text-xs">{nfe.destinatarioEndereco}</p>
          </CardContent>
        </Card>
      </div>

      {/* Informações */}
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Data Emissão</span>
          <p className="font-medium">{formatDateTime(nfe.dataEmissao)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Natureza da Operação</span>
          <p className="font-medium">{nfe.naturezaOperacao}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Valor Total</span>
          <p className="font-bold text-lg text-primary">{formatCurrency(nfe.valorTotal)}</p>
        </div>
      </div>

      {/* Itens */}
      <div>
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <Package className="h-4 w-4" /> Itens ({nfe.itens.length})
        </h4>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-2">Código</th>
                <th className="text-left p-2">Descrição</th>
                <th className="text-center p-2">Qtd</th>
                <th className="text-right p-2">Valor Unit.</th>
                <th className="text-right p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {nfe.itens.map((item, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-2 font-mono text-xs">{item.codigo}</td>
                  <td className="p-2">{item.descricao}</td>
                  <td className="p-2 text-center">{item.quantidade} {item.unidade}</td>
                  <td className="p-2 text-right">{formatCurrency(item.valorUnitario)}</td>
                  <td className="p-2 text-right font-medium">{formatCurrency(item.valorTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totais */}
      <div className="bg-muted/30 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-muted-foreground">Produtos</span><p className="font-medium">{formatCurrency(nfe.valorProdutos)}</p></div>
          <div><span className="text-muted-foreground">Frete</span><p className="font-medium">{formatCurrency(nfe.valorFrete)}</p></div>
          <div><span className="text-muted-foreground">Desconto</span><p className="font-medium text-destructive">-{formatCurrency(nfe.valorDesconto)}</p></div>
          <div><span className="text-muted-foreground">ICMS</span><p className="font-medium">{formatCurrency(nfe.valorICMS)}</p></div>
        </div>
        <Separator className="my-3" />
        <div className="flex items-center justify-between">
          <span className="font-medium">Valor Total da NF-e</span>
          <span className="text-2xl font-bold text-primary">{formatCurrency(nfe.valorTotal)}</span>
        </div>
      </div>

      {nfe.status === 'cancelada' && nfe.motivoCancelamento && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">Nota Fiscal Cancelada</span>
          </div>
          <p className="text-sm text-muted-foreground">{nfe.motivoCancelamento}</p>
        </div>
      )}

      {/* Ações */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => toast.success('XML da NF-e baixado com sucesso!')} variant="outline" className="gap-2">
          <FileCode className="h-4 w-4" /> Download XML
        </Button>
        <Button onClick={() => setDanfeOpen(true)} className="gap-2">
          <Download className="h-4 w-4" /> Download DANFE
        </Button>
        <Button variant="outline" onClick={() => { window.print(); toast.success('Enviado para impressão!'); }} className="gap-2">
          <Printer className="h-4 w-4" /> Imprimir
        </Button>
        <Button variant="outline" onClick={() => toast.success('NF-e enviada por e-mail!')} className="gap-2">
          <Mail className="h-4 w-4" /> Enviar
        </Button>
      </div>

      <DANFEGenerator 
        nota={{
          numero: nfe.numero, serie: nfe.serie, chaveAcesso: nfe.chaveAcesso,
          naturezaOperacao: nfe.naturezaOperacao, dataEmissao: nfe.dataEmissao,
          cnpjEmitente: nfe.cnpjEmitente, emitenteNome: nfe.emitenteNome,
          cnpjDestinatario: nfe.cnpjDestinatario, destinatarioNome: nfe.destinatarioNome,
          destinatarioEndereco: nfe.destinatarioEndereco,
          valorProdutos: nfe.valorProdutos, valorFrete: nfe.valorFrete,
          valorSeguro: nfe.valorSeguro, valorDesconto: nfe.valorDesconto,
          valorIPI: nfe.valorIPI, valorICMS: nfe.valorICMS, valorTotal: nfe.valorTotal,
          status: nfe.status, protocolo: nfe.protocolo, itens: nfe.itens,
        }}
        open={danfeOpen}
        onOpenChange={setDanfeOpen}
      />
    </div>
  );
}
