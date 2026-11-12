import { FileText, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { SolicitacaoAprovacao } from '@/hooks/useAprovacoes';
import { formatCurrency, formatDateTime } from '@/lib/formatters';
import { WorkflowVisualizer } from './WorkflowVisualizer';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AprovacoesPendentesConteudoProps {
  detailsDialog: { open: boolean; solicitacao: SolicitacaoAprovacao | null };
  comentarios: import('/home/joaquim_ataides/projetos/_worktrees/Promo_Finance_V2-lint-zero/src/hooks/useAprovacoes').ComentarioAprovacao[];
  novoComentario: string;
  setNovoComentario: import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').Dispatch<
    import('/home/joaquim_ataides/.cache/repo-maintenance-deps/Promo_Finance_V2/node_modules/@types/react/index').SetStateAction<string>
  >;
  handleAddComentario: () => void;
}

export function AprovacoesPendentesConteudo({
  detailsDialog,
  comentarios,
  novoComentario,
  setNovoComentario,
  handleAddComentario,
}: AprovacoesPendentesConteudoProps) {
  return (
    <div className="space-y-8 py-4">
      {/* Visualizador de Workflow */}
      <div className="p-6 rounded-xl bg-muted/30 border border-border/50">
        <h5 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
          Progresso do Workflow
        </h5>
        <WorkflowVisualizer
          steps={[
            {
              id: '1',
              nome: 'Solicitação',
              status: 'completo',
              aprovador: detailsDialog.solicitacao?.solicitante?.full_name || 'Usuário',
            },
            { id: '2', nome: 'Gestor Direto', status: 'atual' },
            { id: '3', nome: 'Diretoria Financeira', status: 'pendente' },
            { id: '4', nome: 'Finalizado', status: 'pendente' },
          ]}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Informações Gerais */}
        <div className="space-y-4">
          <h5 className="font-bold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Dados do Título
          </h5>
          <div className="space-y-3 p-4 rounded-lg border bg-background/50">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Descrição:</span>
              <span className="text-sm font-bold">
                {detailsDialog.solicitacao?.conta_pagar?.descricao}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Fornecedor:</span>
              <span className="text-sm font-bold">
                {detailsDialog.solicitacao?.conta_pagar?.fornecedor_nome}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">Valor Total:</span>
              <span className="text-lg font-black text-primary">
                {formatCurrency(detailsDialog.solicitacao?.conta_pagar?.valor || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Discussão / Comentários */}
        <div className="space-y-4 flex flex-col h-[300px]">
          <h5 className="font-bold flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Trilha de Auditoria & Chat
          </h5>
          <ScrollArea className="flex-1 p-3 rounded-lg border bg-muted/10">
            <div className="space-y-4">
              {comentarios?.length ? (
                comentarios.map((coment) => (
                  <div key={coment.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase">
                        {coment.user_id ? 'Usuário ' + coment.user_id.slice(0, 8) : '—'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDateTime(coment.created_at)}
                      </span>
                    </div>
                    <p className="text-xs bg-background p-2 rounded border border-border/30">
                      {coment.comentario}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-muted-foreground py-10 italic">
                  Nenhum comentário registrado
                </p>
              )}
            </div>
          </ScrollArea>
          <div className="flex gap-2">
            <Input
              placeholder="Adicionar nota..."
              value={novoComentario}
              onChange={(e) => setNovoComentario(e.target.value)}
              className="text-xs h-9"
              onKeyDown={(e) => e.key === 'Enter' && handleAddComentario()}
            />
            <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleAddComentario}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
