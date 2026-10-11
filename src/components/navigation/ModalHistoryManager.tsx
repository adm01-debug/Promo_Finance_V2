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
export const OPEN_DIALOG_SELECTOR = '[role="dialog"][data-state="open"]';
// O tratamento do marcador órfão pós-reload roda uma única vez por
// sessão — StrictMode remonta o efeito e um segundo history.back()
// ultrapassaria a entrada real.
let orphanHandled = false;

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
  // Direção do pulo de fantasmas: travada na primeira chegada para
  // cadeias de fantasmas seguirem na mesma direção até uma entrada real.
  const ghostDirRef = useRef<0 | -1 | 1>(0);
  const lastIdxRef = useRef<number | null>(null);
  // Dialogs com Escape despachado que ainda não saíram do DOM — evita
  // o observer re-empilhar marcador na janela entre o pop e o unmount.
  const pendingCloseRef = useRef(0);
  const prevOpenRef = useRef(0);

  useEffect(() => {
    const markers = markersRef.current;
    const openDialogCount = () => document.querySelectorAll(OPEN_DIALOG_SELECTOR).length;
    const topMarkerIsCurrent = () => {
      const top = markers[markers.length - 1];
      return top !== undefined && window.history.state?.[MODAL_MARKER] === top;
    };
    const closeTopDialog = () => {
      pendingCloseRef.current += 1;
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      // Se o dialog recusar o Escape (ex.: confirmação processando), a
      // contagem não cai: libera o pendente e reempilha o marcador,
      // senão o dialog ficaria aberto sem entrada no histórico.
      window.setTimeout(() => {
        pendingCloseRef.current = Math.max(0, pendingCloseRef.current - 1);
        const open = openDialogCount();
        prevOpenRef.current = open;
        const effective = open - pendingCloseRef.current;
        while (markers.length < effective) pushMarker();
      }, 150);
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
      if (markers.length === 0) topmostRef.current = true;
      markers.push(seqRef.current);
      onTopMarkerRef.current = true;
    };

    const onPopState = () => {
      const state = window.history.state as Record<string, unknown> | null;
      const cur = state?.[MODAL_MARKER] as number | undefined;
      const idx = state?.idx as number | undefined;
      const prevIdx = lastIdxRef.current;
      if (idx !== undefined) lastIdxRef.current = idx;
      const wasOnTopMarker = onTopMarkerRef.current;
      const onMarker = cur !== undefined && cur === markers[markers.length - 1];
      onTopMarkerRef.current = onMarker;

      // Pop que consumiu o marcador do topo: fecha o dialog do topo —
      // inclusive com form sujo (marcador acima da sentinela: o Voltar
      // era do modal, não da guarda de não-salvos). Pop auto-emitido por
      // syncClosedDialogs já descontou o marcador na pilha — pousar na
      // sentinela não pode remover o marcador do dialog de baixo.
      if (wasOnTopMarker && !onMarker && !poppingOwnRef.current) {
        markers.pop();
        // A entrada em que pousamos pode ser outro marcador (novo topo).
        onTopMarkerRef.current = cur !== undefined && cur === markers[markers.length - 1];
        if (openDialogCount() > 0) closeTopDialog();
        return;
      }
      // Qualquer entrada com marcador que não é o topo ativo é
      // transparente — fantasma soterrado por rota ou órfã de sessão
      // anterior (recarregamento esvazia a pilha): segue na direção do
      // pop até uma entrada real, em qualquer direção e quantas vezes
      // a entrada for atravessada.
      if (cur !== undefined && !onMarker) {
        poppingOwnRef.current = true;
        if (ghostDirRef.current === 0) {
          // O fantasma tem o idx da entrada que o originou: chegar com idx
          // igual só acontece vindo debaixo (avançar); idx maior = voltar.
          ghostDirRef.current = prevIdx !== null && idx !== undefined && idx > prevIdx ? 1 : -1;
          if (prevIdx !== null && idx !== undefined && idx === prevIdx) {
            ghostDirRef.current = 1;
          }
        }
        if (ghostDirRef.current > 0) window.history.forward();
        else window.history.back();
        return;
      }
      ghostDirRef.current = 0;
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
    };

    const syncMarkers = () => {
      const open = openDialogCount();
      const dropped = prevOpenRef.current - open;
      if (dropped > 0) {
        pendingCloseRef.current = Math.max(0, pendingCloseRef.current - dropped);
      }
      prevOpenRef.current = open;
      const effective = open - pendingCloseRef.current;
      while (markers.length < effective) pushMarker();
      syncClosedDialogs();
      if (markers.length === 0) topmostRef.current = true;
    };

    const observer = new MutationObserver(syncMarkers);

    // Só data-state e inserções/remoções interessam — reagir a qualquer
    // atributo (class, style, ARIA) recontava dialogs a cada frame de
    // animação em dashboards.
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-state'],
      childList: true,
      subtree: true,
    });

    // Marcador órfão de sessão anterior (reload com dialog aberto): se
    // nenhum dialog está aberto a entrada é inútil — remove-a do topo,
    // senão o próximo Voltar pousaria numa entrada com a mesma URL e
    // pareceria não fazer nada. Com dialog aberto, adota-o como marcador.
    if (!orphanHandled) {
      orphanHandled = true;
      const orphan = window.history.state?.[MODAL_MARKER] as number | undefined;
      if (orphan !== undefined) {
        if (openDialogCount() > 0) {
          markers.push(orphan);
          if (orphan > seqRef.current) seqRef.current = orphan;
          onTopMarkerRef.current = true;
        } else {
          poppingOwnRef.current = true;
          window.history.back();
        }
      }
    }

    window.addEventListener('popstate', onPopState);

    // Dialogs já abertos antes da montagem (ex.: paleta aberta enquanto
    // o chunk da rota carregava) recebem seus marcadores agora — sem a
    // sincronização inicial o Voltar sairia da página com eles abertos.
    syncMarkers();

    // Escape só pode fechar o dialog do TOPO. Dialogs próprios
    // (data-escape-owned) não estão na pilha de camadas do Radix: um
    // Escape propagado fecharia os dois — o deles e o nosso. Na fase de
    // captura (antes de qualquer listener do documento), retargetamos o
    // evento só para o elemento do topo quando ele é nosso.
    // O evento sintético (mesmo com bubbles:false) atravessa o document
    // na captura — marcamos os já encaminhados para não reinterceptar.
    const forwarded = new WeakSet<KeyboardEvent>();
    const onKeyDownCapture = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || forwarded.has(e)) return;
      const dialogs = document.querySelectorAll<HTMLElement>(OPEN_DIALOG_SELECTOR);
      const top = dialogs[dialogs.length - 1];
      if (!top || top.dataset.escapeOwned === undefined) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const retargeted = new KeyboardEvent('keydown', { key: 'Escape', bubbles: false });
      forwarded.add(retargeted);
      top.dispatchEvent(retargeted);
    };
    document.addEventListener('keydown', onKeyDownCapture, true);

    const unregister = registerModalMarkerPopper(() => {
      // A guarda só precisa da contagem: ela mesma emite os history.
      // back() um a um, por popstate — vários backs síncronos podem ser
      // coalescidos pelo browser e a saída confirmada travaria.
      // Marcadores soterrados por uma rota não entram (não são do topo).
      if (!topmostRef.current) return 0;
      return markers.length;
    });

    return () => {
      observer.disconnect();
      window.removeEventListener('popstate', onPopState);
      document.removeEventListener('keydown', onKeyDownCapture, true);
      unregister();
    };
  }, []);

  // Rota real empilhada por cima dos marcadores quebra a contiguidade:
  // eles saem da pilha e viram fantasmas (entradas transparentes puladas
  // quando o usuário voltar até eles — qualquer entrada com marcador
  // fora do topo é tratada como tal no popstate). Sem isso,
  // markers.length ficaria >= openDialogCount() na nova rota e nenhum
  // marcador seria criado para dialogs abertos nela.
  // (Pushes/pops de marcadores e sentinela não mudam location.key.)
  useEffect(() => {
    // Navegações PUSH não disparam popstate: atualiza o índice aqui ou
    // a inferência de direção dos fantasmas usaria um valor obsoleto.
    const state = window.history.state as Record<string, unknown> | null;
    const idx = state?.idx as number | undefined;
    if (idx !== undefined) lastIdxRef.current = idx;
    if (markersRef.current.length === 0) {
      topmostRef.current = true;
      return;
    }
    const top = markersRef.current[markersRef.current.length - 1];
    if (state?.[MODAL_MARKER] !== top && !state?.[SENTINEL]) {
      // Esvazia sem trocar a identidade: os closures do efeito do
      // observer seguram esta mesma lista.
      markersRef.current.length = 0;
      topmostRef.current = false;
      onTopMarkerRef.current = false;
    }
  }, [location.key]);

  return null;
}
