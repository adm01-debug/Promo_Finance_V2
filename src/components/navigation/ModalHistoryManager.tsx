import { useEffect } from 'react';

const MODAL_MARKER = '__modal_history__';
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
 */
export function ModalHistoryManager() {
  useEffect(() => {
    let depth = 0;
    let poppingOwnMarker = false;

    const anyDialogOpen = () => document.querySelector(OPEN_DIALOG_SELECTOR) !== null;

    const onPopState = () => {
      if (poppingOwnMarker) {
        poppingOwnMarker = false;
        return;
      }
      if (depth <= 0) return;
      depth--;
      if (anyDialogOpen()) {
        // Consome o marcador: o modal fecha no lugar de sair a página.
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      }
    };

    const observer = new MutationObserver(() => {
      const open = anyDialogOpen();
      if (open && depth === 0) {
        // Preserva idx/key do histórico do React Router na entrada marcador.
        window.history.pushState({ ...window.history.state, [MODAL_MARKER]: true }, '');
        depth = 1;
      } else if (!open && depth === 1) {
        // Fechou pela UI (botão X, overlay): consome o marcador restante.
        depth = 0;
        poppingOwnMarker = true;
        window.history.back();
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
