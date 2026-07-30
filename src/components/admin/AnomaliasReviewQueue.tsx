import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, ListChecks, ScrollText } from "lucide-react";
import { Link } from "react-router-dom";
import { AnomaliaDetailCard } from "./anomalias-review-queue/AnomaliaDetailCard";
import { ConflitoBannerCard } from "./anomalias-review-queue/ConflitoBannerCard";
import {
  EmptyState,
  LoadingState,
  SummaryState,
  TransitionState,
} from "./anomalias-review-queue/QueueStates";
import { QueueProgressHeader } from "./anomalias-review-queue/QueueProgressHeader";
import { ReviewActionsBar } from "./anomalias-review-queue/ReviewActionsBar";
import { useReviewQueue } from "./anomalias-review-queue/useReviewQueue";
import type { ReviewQueueProps } from "./anomalias-review-queue/types";

export function AnomaliasReviewQueue({
  open,
  onOpenChange,
  severidadeFilter = "todas",
}: ReviewQueueProps) {
  const q = useReviewQueue({ open, severidadeFilter });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            Revisão em fila
          </DialogTitle>
          <DialogDescription>
            Revise cada anomalia pendente. Comentário obrigatório (mínimo 10 caracteres) antes de
            confirmar ou rejeitar.
          </DialogDescription>
          <div className="pt-1">
            <Button asChild variant="link" size="sm" className="h-auto px-0 text-xs">
              <Link
                to="/audit-logs?table=anomalias_detectadas&action=APPROVE"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ScrollText className="h-3 w-3 mr-1" />
                Ver log de auditoria das revisões (confirmações e rejeições)
                <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        </DialogHeader>

        {q.isLoading ? (
          <LoadingState />
        ) : q.total === 0 ? (
          <EmptyState />
        ) : q.finalizado ? (
          <SummaryState stats={q.stats} onClose={() => onOpenChange(false)} />
        ) : q.transicionando ? (
          <TransitionState />
        ) : q.atual ? (
          <div className="space-y-4">
            <QueueProgressHeader
              atual={q.atual}
              total={q.total}
              index={q.index}
              hasNextPage={q.hasNextPage}
              isFetchingNextPage={q.isFetchingNextPage}
              stats={q.stats}
              progressoPorSeveridade={q.progressoPorSeveridade}
              outrasSeveridades={q.outrasSeveridades}
              contagemPorSeveridade={q.contagemPorSeveridade}
              recarregando={q.recarregando}
              onPularParaSeveridade={q.pularParaSeveridade}
            />

            {q.conflito && (
              <ConflitoBannerCard conflito={q.conflito} onDismiss={q.dismissConflito} />
            )}

            <AnomaliaDetailCard anomalia={q.atual} dadosFormatados={q.dadosFormatados} />

            <ReviewActionsBar
              comentario={q.comentario}
              onComentarioChange={q.setComentario}
              onComentarioTocado={() => q.setComentarioTocado(true)}
              onKeyDown={q.handleKey}
              textareaRef={q.textareaRef}
              comentarioLength={q.comentarioTrim.length}
              mostrarErroComentario={q.mostrarErroComentario}
              erroComentario={q.erroComentario}
              validoConfirmar={q.validoConfirmar}
              validoFalsoPositivo={q.validoFalsoPositivo}
              isPending={q.isPending}
              recarregando={q.recarregando}
              onConfirmar={() => void q.handleAcao("confirmada")}
              onFalsoPositivo={() => void q.handleAcao("falso_positivo")}
              onPular={() => void q.handlePular()}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
