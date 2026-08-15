import { useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();

  // Ref espelha o navigate atual: o listener global de keydown é registrado
  // UMA vez (deps estáveis) e as actions sempre usam o navigate mais recente.
  const navigateRef = useRef(navigate);
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  const shortcuts = useMemo<ShortcutConfig[]>(() => [
    // Navigation shortcuts (Alt + key)
    { key: 'd', alt: true, action: () => navigateRef.current('/'), description: 'Ir para Dashboard' },
    { key: 'r', alt: true, action: () => navigateRef.current('/contas-receber'), description: 'Contas a Receber' },
    { key: 'p', alt: true, action: () => navigateRef.current('/contas-pagar'), description: 'Contas a Pagar' },
    { key: 'f', alt: true, action: () => navigateRef.current('/fluxo-caixa'), description: 'Fluxo de Caixa' },
    { key: 'c', alt: true, action: () => navigateRef.current('/conciliacao'), description: 'Conciliação' },
    { key: 'e', alt: true, action: () => navigateRef.current('/expert'), description: 'Expert (IA)' },
    { key: 'b', alt: true, action: () => navigateRef.current('/bi'), description: 'BI Gestão' },
    { key: 'a', alt: true, action: () => navigateRef.current('/alertas'), description: 'Alertas' },
    { key: 'l', alt: true, action: () => navigateRef.current('/relatorios'), description: 'Relatórios' },
    { key: 'o', alt: true, action: () => navigateRef.current('/aprovacoes'), description: 'Aprovações' },
    { key: 'i', alt: true, action: () => navigateRef.current('/clientes'), description: 'Clientes' },
    { key: 'u', alt: true, action: () => navigateRef.current('/fornecedores'), description: 'Fornecedores' },
    { key: 'n', alt: true, action: () => navigateRef.current('/notas-fiscais'), description: 'Notas Fiscais' },
    
    // Quick actions (Ctrl + Shift + key)
    { key: 'n', ctrl: true, shift: true, action: () => {
      const addBtn = document.querySelector('[data-add-new]') as HTMLButtonElement;
      if (addBtn) addBtn.click();
    }, description: 'Novo registro' },
    { key: 's', ctrl: true, shift: true, action: () => {
      const saveBtn = document.querySelector('[data-save]') as HTMLButtonElement;
      if (saveBtn) saveBtn.click();
    }, description: 'Salvar' },
    { key: 'e', ctrl: true, shift: true, action: () => {
      const exportBtn = document.querySelector('[data-export]') as HTMLButtonElement;
      if (exportBtn) exportBtn.click();
    }, description: 'Exportar' },
    
    // Search shortcut
    { key: 'k', ctrl: true, action: () => {
      const searchInput = document.querySelector('input[placeholder*="Buscar"]') as HTMLInputElement;
      if (searchInput) { searchInput.focus(); searchInput.select(); }
    }, description: 'Focar na busca' },
    
    // Theme toggle
    { key: 't', alt: true, shift: true, action: () => {
      const themeBtn = document.querySelector('[data-theme-toggle]') as HTMLButtonElement;
      if (themeBtn) themeBtn.click();
    }, description: 'Alternar tema' },
    
    // Refresh data
    { key: 'r', ctrl: true, shift: true, action: () => {
      window.dispatchEvent(new CustomEvent('refresh-data'));
      toast.info('Atualizando dados...');
    }, description: 'Atualizar dados' },
    
    // Global shortcuts
    { key: '?', shift: true, action: () => {
      toast.info('Atalhos de Teclado', { description: 'Pressione Alt + ? para ver a lista completa', duration: 3000 });
    }, description: 'Mostrar ajuda' },
    
    // Escape to close modals
    { key: 'Escape', action: () => {
      const closeButton = document.querySelector('[data-state="open"] button[data-radix-collection-item]') as HTMLButtonElement;
      if (closeButton) closeButton.click();
    }, description: 'Fechar modal/dropdown' },
  ], []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if user is typing in an input
    const target = event.target as HTMLElement;
    const isInputFocused = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.isContentEditable;

    // Allow Ctrl+K even when in input for search focus
    if (isInputFocused && !(event.ctrlKey && event.key === 'k')) {
      return;
    }

    for (const shortcut of shortcuts) {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;

      if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
        event.preventDefault();
        shortcut.action();
        break;
      }
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return shortcuts;
};

export const getShortcutsList = () => [
  { category: 'Navegação', shortcuts: [
    { keys: ['Alt', 'D'], description: 'Dashboard' },
    { keys: ['Alt', 'R'], description: 'Contas a Receber' },
    { keys: ['Alt', 'P'], description: 'Contas a Pagar' },
    { keys: ['Alt', 'F'], description: 'Fluxo de Caixa' },
    { keys: ['Alt', 'C'], description: 'Conciliação' },
    { keys: ['Alt', 'E'], description: 'Expert (IA)' },
    { keys: ['Alt', 'B'], description: 'BI Gestão' },
    { keys: ['Alt', 'A'], description: 'Alertas' },
    { keys: ['Alt', 'L'], description: 'Relatórios' },
    { keys: ['Alt', 'O'], description: 'Aprovações' },
    { keys: ['Alt', 'I'], description: 'Clientes' },
    { keys: ['Alt', 'U'], description: 'Fornecedores' },
    { keys: ['Alt', 'N'], description: 'Notas Fiscais' },
  ]},
  { category: 'Ações Rápidas', shortcuts: [
    { keys: ['Ctrl', 'Shift', 'N'], description: 'Novo registro' },
    { keys: ['Ctrl', 'Shift', 'S'], description: 'Salvar' },
    { keys: ['Ctrl', 'Shift', 'E'], description: 'Exportar' },
    { keys: ['Ctrl', 'Shift', 'R'], description: 'Atualizar dados' },
    { keys: ['Alt', 'Shift', 'T'], description: 'Alternar tema' },
  ]},
  { category: 'Geral', shortcuts: [
    { keys: ['Ctrl', 'K'], description: 'Focar na busca' },
    { keys: ['Esc'], description: 'Fechar modal/dropdown' },
    { keys: ['Alt', '?'], description: 'Lista de atalhos' },
  ]},
];
