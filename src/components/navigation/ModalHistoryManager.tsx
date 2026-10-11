import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { hasForwardEntries } from '@/lib/navigation';
import {
  artificialHistoryState,
  hasUnsavedChanges,
  isGuardAwaitingPop,
  isPlannedGuardPop,
  MODAL_HISTORY_MARKER as MODAL_MARKER,
  registerMarkerResync,
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
  // Pilha de abertura real dos dialogs (base → topo): a ordem do DOM
  // mente a camada — portal Radix vai para o body DEPOIS do root onde
  // um ConfirmationDialog próprio (não-portalado) foi renderizado, e a
  // última ocorrência em querySelectorAll seria o Radix de baixo.
  const openOrderRef = useRef<HTMLElement[]>([]);

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
        while (markers.length < effective) {
          if (!pushMarker()) break;
        }
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
      // pushState descarta as entradas reais à frente do browser: com
      // Avançar pendente (A→B, Voltar, abrir dialog), prefere ficar sem
      // o marcador a destruir esse histórico — o Voltar aqui navega
      // normal e a página desmonta o dialog junto.
      if (hasForwardEntries()) return false;
      seqRef.current += 1;
      const state = artificialHistoryState(MODAL_MARKER);
      state[MODAL_MARKER] = seqRef.current;
      window.history.pushState(state, '');
      if (markers.length === 0) topmostRef.current = true;
      markers.push(seqRef.current);
      onTopMarkerRef.current = true;
      return true;
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
        // Sentinela órfã ACIMA do marcador (guarda desarmada por
        // setDirty(false), que só a remove do topo): chegar nela é
        // avanço, não Voltar — retorna ao marcador em vez de consumi-lo
        // e fechar o dialog. Sentinela viva (dirty) segue o consumo:
        // a travessia é para trás e a guarda trata a própria entrada.
        if (state?.[SENTINEL] && !hasUnsavedChanges()) {
          poppingOwnRef.current = true;
          window.history.back();
          return;
        }
        // Voltar enquanto a confirmação de não-salvos aguarda resposta:
        // a guarda desfaz este pop com forward() — a entrada não sai,
        // então o marcador e o dialog devem permanecer como estão.
        if (isGuardAwaitingPop()) return;
        markers.pop();
        // A entrada em que pousamos pode ser outro marcador (novo topo).
        onTopMarkerRef.current = cur !== undefined && cur === markers[markers.length - 1];
        // Pop planejado da guarda de não-salvos: ela remove marcadores e
        // fecha o que precisa — um Escape aqui reabriria a confirmação de
        // descarte no form que ela mesma está fechando.
        if (!isPlannedGuardPop() && openDialogCount() > 0) closeTopDialog();
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
        if (ghostDirRef.current > 0) {
          window.history.forward();
          // Marcador terminal (nada à frente): o forward é no-op e a
          // entrada artificial ficaria exposta — retorna à entrada real.
          // Inverte a direção ANTES de voltar: se a entrada abaixo também
          // é órfã, seguimos para trás até uma real — manter +1 aqui
          // avançaria de volta ao terminal e repetiria o ciclo para sempre.
          const landed = cur;
          window.setTimeout(() => {
            if (window.history.state?.[MODAL_MARKER] === landed) {
              ghostDirRef.current = -1;
              poppingOwnRef.current = true;
              window.history.back();
            }
          }, 150);
        } else window.history.back();
        return;
      }
      // Sentinela com guarda desarmada é tão artificial quanto um
      // marcador órfão: pousar nela no meio de um pulo de fantasmas (ou
      // por Avançar direto) exporia um beco com a mesma URL — segue a
      // direção da travessia até uma entrada real. Se ela é a última
      // entrada, o forward é no-op e o timeout inverte para trás.
      if (state?.[SENTINEL] && !hasUnsavedChanges()) {
        poppingOwnRef.current = true;
        if (ghostDirRef.current === 0) ghostDirRef.current = 1;
        if (ghostDirRef.current > 0) {
          window.history.forward();
          window.setTimeout(() => {
            if (window.history.state?.[SENTINEL] && !hasUnsavedChanges()) {
              ghostDirRef.current = -1;
              poppingOwnRef.current = true;
              window.history.back();
            }
          }, 150);
        } else window.history.back();
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
      // Mantém a pilha de abertura real: remove fechados e anexa novos
      // na ordem em que apareceram.
      const openEls = Array.from(document.querySelectorAll<HTMLElement>(OPEN_DIALOG_SELECTOR));
      const order = openOrderRef.current;
      for (let i = order.length - 1; i >= 0; i -= 1) {
        if (!openEls.includes(order[i])) order.splice(i, 1);
      }
      for (const el of openEls) {
        if (!order.includes(el)) order.push(el);
      }
      const effective = open - pendingCloseRef.current;
      while (markers.length < effective) {
        if (!pushMarker()) break;
      }
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
      // O topo real é o último a ABRIR, não o último no DOM: com o
      // portal do Radix anexado ao body depois do root, um dialog
      // próprio renderizado inline (ConfirmationDialog) apareceria
      // abaixo de um Radix que ele sobrepõe visualmente.
      const order = openOrderRef.current;
      const top =
        order[order.length - 1] ??
        document.querySelectorAll<HTMLElement>(OPEN_DIALOG_SELECTOR)[
          document.querySelectorAll(OPEN_DIALOG_SELECTOR).length - 1
        ];
      if (!top || top.dataset.escapeOwned === undefined) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const retargeted = new KeyboardEvent('keydown', { key: 'Escape', bubbles: false });
      forwarded.add(retargeted);
      top.dispatchEvent(retargeted);
    };
    document.addEventListener('keydown', onKeyDownCapture, true);

    // A pilha à frente pode voltar a aceitar marcadores (um pushState
    // de sentinela truncou o Avançar real que impedia o push): dialogs
    // abertos cujo marcador foi recusado — ou consumido por pop
    // planejado cujo back() final foi no-op — são marcados agora.
    // Digitar num input não dispara o observer; sem este sinal o form
    // continuaria fora do histórico.
    const offResync = registerMarkerResync(() => {
      syncMarkers();
    });

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
      offResync();
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
