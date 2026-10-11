import { useEffect } from 'react';
import {
  artificialHistoryState,
  hasUnsavedChanges,
  MODAL_HISTORY_MARKER as MODAL_MARKER,
} from '@/lib/unsaved-guard';

// Apenas [role="dialog"]: AlertDialog não fecha por Escape no Radix, então
// marcá-lo deixaria a confirmação aberta após o Voltar consumir o marcador.
const OPEN_DIALOG_SELECTOR = '[role="dialog"][data-state="open"]';

/**
 * Sincroniza dialogs modais com a pilha de histórico: ao abrir um modal,
 * empilha um marcador; o próximo "voltar" do browser/mobile fecha o modal
 * (via Escape, que o Radix já trata) em vez de sair da página.
 * Cobre todos os Radix Dialog/Sheet do app sem mudanças neles; AlertDialog
 * (confirmação que exige decisão explícita) não entra — o Voltar simplesmente
 * navega, abandonando a confirmação junto com a página.
 *
 * Coordenação com a guarda de não-salvos: enquanto há alterações pendentes,
 * o pop pertence à guarda (que pede confirmação) e o modal permanece aberto.
 */
export function ModalHistoryManager() {
  useEffect(() => {
    let depth = 0;
    let poppingOwnMarker = false;

    const anyDialogOpen = () => document.querySelector(OPEN_DIALOG_SELECTOR) !== null;
    const markerIsCurrent = () => Boolean(window.history.state?.[MODAL_MARKER]);

    const onPopState = () => {
      if (poppingOwnMarker) {
        poppingOwnMarker = false;
        return;
      }
      if (depth <= 0) return;
      // Formulário sujo: a guarda trata este Voltar; o modal não fecha.
      if (hasUnsavedChanges()) return;
      // Ainda estamos no marcador: o pop removeu uma entrada acima dele
      // (ex.: sentinela da guarda), não o próprio marcador.
      if (markerIsCurrent()) return;
      depth--;
      if (anyDialogOpen()) {
        // Consome o marcador: o modal fecha no lugar de sair a página.
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      }
    };

    const observer = new MutationObserver(() => {
      const open = anyDialogOpen();
      if (open && depth === 0) {
        window.history.pushState(artificialHistoryState(MODAL_MARKER), '');
        depth = 1;
      } else if (!open && depth === 1) {
        depth = 0;
        // Fechou pela UI (botão X, overlay): consome o marcador restante —
        // só se ele ainda for a entrada atual (se houve navegação, voltar
        // desfaria a nova rota).
        if (markerIsCurrent()) {
          poppingOwnMarker = true;
          window.history.back();
        }
      }
    });

    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
    window.addEventListener('popstate', onPopState);

    return () => {
      observer.disconnect();
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  return null;
}
