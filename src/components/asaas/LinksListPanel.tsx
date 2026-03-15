// ============================================
// PANEL: Gerenciar Links de Pagamento ASAAS
// ============================================

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Link2, Loader2, Trash2, Copy, ExternalLink, Search } from 'lucide-react';
import { useAsaas } from '@/hooks/useAsaas';
import { formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  empresaId?: string;
}

export function LinksListPanel({ empresaId }: Props) {
  const { excluirLinkPagamento } = useAsaas(empresaId);
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('asaas-proxy', {
        body: { action: 'listar_links_pagamento', data: { limit: '50' } },
      });
      if (error) throw error;
      setLinks(data?.data || []);
    } catch (e: any) {
      toast.error('Erro ao buscar links: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (empresaId) fetchLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await excluirLinkPagamento.mutateAsync(deleteConfirm);
      setLinks(prev => prev.filter(l => l.id !== deleteConfirm));
    } catch { /* hook handles */ }
    setDeleteConfirm(null);
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" /> Links de Pagamento
            </CardTitle>
            <CardDescription>Links compartilháveis criados no ASAAS</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLinks} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : links.length === 0 ? (
            <EmptyState icon={Link2} title="Nenhum link" description="Crie links de pagamento para compartilhar com clientes" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map((link: any) => (
                    <TableRow key={link.id}>
                      <TableCell className="font-medium text-sm">{link.name || '-'}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(link.value || 0)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {link.chargeType === 'RECURRENT' ? 'Recorrente' : link.chargeType === 'INSTALLMENT' ? 'Parcelado' : 'Avulso'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={link.active ? 'default' : 'outline'}>
                          {link.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {link.url && (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyLink(link.url)} title="Copiar link">
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" asChild title="Abrir link">
                                <a href={link.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteConfirm(link.id)} title="Excluir">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Excluir Link"
        message="Tem certeza que deseja excluir este link de pagamento?"
        type="danger"
        confirmText="Excluir"
        onConfirm={handleDelete}
        isLoading={excluirLinkPagamento.isPending}
      />
    </>
  );
}
