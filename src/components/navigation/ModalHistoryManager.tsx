import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  artificialHistoryState,
  hasUnsavedChanges,
  MODAL_HISTORY_MARKER as MODAL_MARKER,
  registerModalMarkerPopper,
  UNSAVED_GUARD_SENTINEL as SENTINEL,
} from '@/lib/unsaved-guard';

// Apenas [role="dialog"]: AlertDialog (role="alertdialog") não fecha por
// Escape no Radix, então marcá-lo deixaria a confirmação aberta após o
// Voltar consumir o marcador.
const OPEN_DIALOG_SELECTOR = '[role="dialog"][data-state="open"]';

/**
 * Sincroniza dialogs modais com a pilha de histórico: cada dialog aberto
 * empilha um marcador próprio; cada "voltar" consome o marcador do topo e
 * fecha o dialog do topo (Escape, que o Radix já trata) em vez de sair da
 * página. Cobre dialogs aninhados (ex.: leitor de código de barras sobre
 * o formulário) e todos os Radix Dialog/Sheet do app sem mudanças neles;
 * AlertDialog não entra — exige decisão explícita.
 *
 * Coordenação com a guarda de não-salvos: enquanto há alterações
 * pendentes, o pop pertence à guarda (que pede confirmação) e o dialog
 * permanece aberto; quando a saída é confirmada, a guarda consome os
 * marcadores contíguos do topo via `registerModalMarkerPopper` antes de
 * navegar, então um Voltar confirmado não para no marcador do form.
 */
export function ModalHistoryManager() {
  const location = useLocation();
  // Pilha de ids de marcadores (base → topo); cada dialog = um marcador.
  const markersRef = useRef<number[]>([]);
  const seqRef = useRef(0);
  // Próximo pop é consequência de um history.back() nosso — não reagir.
  const poppingOwnRef = useRef(false);
  // Entrada atual é o marcador do topo: diferencia "pop saindo do
  // marcador" (consumir) de "pop chegando ao marcador" (preservar).
  const onTopMarkerRef = useRef(false);
  // Marcadores formam o bloco contíguo do topo (só a sentinela pode estar
  // acima); uma rota empilhada por cima os torna fantasmas deferidos.
  const topmostRef = useRef(true);

  useEffect(() => {
    const markers = markersRef.current;
    const openDialogCount = () => document.querySelectorAll(OPEN_DIALOG_SELECTOR).length;
    const topMarkerIsCurrent = () => {
      const top = markers[markers.length - 1];
      return top !== undefined && window.history.state?.[MODAL_MARKER] === top;
    };
    const closeTopDialog = () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    };

    // Dialog fechou pela UI (X, overlay) com o marcador ainda no topo:
    // consome-o. Se outra entrada (ex.: sentinela) está acima, o marcador
    // fica pendente e é removido quando voltar ao topo — nunca deixa um
    // "voltar" extra invisível no histórico.
    const syncClosedDialogs = () => {
      if (markers.length > openDialogCount() && topMarkerIsCurrent()) {
        markers.pop();
        poppingOwnRef.current = true;
        window.history.back();
      }
    };

    const pushMarker = () => {
      seqRef.current += 1;
      const state = artificialHistoryState(MODAL_MARKER);
      state[MODAL_MARKER] = seqRef.current;
      window.history.pushState(state, '');
      markers.push(seqRef.current);
      onTopMarkerRef.current = true;
    };

    const onPopState = () => {
      const wasOnTopMarker = onTopMarkerRef.current;
      const cur = window.history.state?.[MODAL_MARKER] as number | undefined;
      const onMarker = cur !== undefined && cur === markers[markers.length - 1];
      onTopMarkerRef.current = onMarker;
      if (poppingOwnRef.current) {
        poppingOwnRef.current = false;
        syncClosedDialogs();
        return;
      }
      if (markers.length === 0) return;
      if (hasUnsavedChanges()) {
        // Formulário sujo: a guarda trata este Voltar; dialog fica aberto.
        return;
      }
      if (onMarker) {
        // Chegou ao marcador do topo: o pop só removeu o que estava acima
        // (sentinela ou rota). Se o dialog já fechou, o marcador é fantasma.
        syncClosedDialogs();
        return;
      }
      if (wasOnTopMarker) {
        // O pop consumiu o marcador do topo: fecha o dialog do topo.
        markers.pop();
        if (openDialogCount() > 0) closeTopDialog();
      }
      onTopMarkerRef.current = cur !== undefined && cur === markers[markers.length - 1];
    };

    const observer = new MutationObserver(() => {
      const open = openDialogCount();
      while (markers.length < open) pushMarker();
      syncClosedDialogs();
      if (markers.length === 0) topmostRef.current = true;
    });

    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
    window.addEventListener('popstate', onPopState);
    const unregister = registerModalMarkerPopper(() => {
      // Saída confirmada na guarda: consome os marcadores contíguos do topo
      // (logo abaixo da sentinela) para a navegação real não parar neles.
      // Marcadores soterrados por uma rota ficam — a navegação é deles.
      if (!topmostRef.current) return 0;
      const n = markers.length;
      for (let i = 0; i < n; i++) window.history.back();
      return n;
    });

    return () => {
      observer.disconnect();
      window.removeEventListener('popstate', onPopState);
      unregister();
    };
  }, []);

  // Rota real empilhada por cima dos marcadores quebra a contiguidade —
  // eles viram fantasmas a serem limpos quando o usuário voltar até eles.
  // (Pushes/pops de marcadores e sentinela não mudam location.key.)
  useEffect(() => {
    if (markersRef.current.length === 0) {
      topmostRef.current = true;
      return;
    }
    const state = window.history.state as Record<string, unknown> | null;
    const top = markersRef.current[markersRef.current.length - 1];
    if (state?.[MODAL_MARKER] !== top && !state?.[SENTINEL]) {
      topmostRef.current = false;
    }
  }, [location.key]);

  return null;
}
