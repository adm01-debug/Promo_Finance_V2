import { useEffect, useCallback } from 'react';
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

  const shortcuts: ShortcutConfig[] = [
    // Navigation shortcuts (Alt + key)
    { key: 'd', alt: true, action: () => navigate('/'), description: 'Ir para Dashboard' },
    { key: 'r', alt: true, action: () => navigate('/contas-receber'), description: 'Contas a Receber' },
    { key: 'p', alt: true, action: () => navigate('/contas-pagar'), description: 'Contas a Pagar' },
    { key: 'f', alt: true, action: () => navigate('/fluxo-caixa'), description: 'Fluxo de Caixa' },
    { key: 'c', alt: true, action: () => navigate('/conciliacao'), description: 'Conciliação' },
    { key: 'e', alt: true, action: () => navigate('/expert'), description: 'Expert (IA)' },
    { key: 'b', alt: true, action: () => navigate('/bi'), description: 'BI Gestão' },
    { key: 'a', alt: true, action: () => navigate('/alertas'), description: 'Alertas' },
    { key: 'l', alt: true, action: () => navigate('/relatorios'), description: 'Relatórios' },
    { key: 'o', alt: true, action: () => navigate('/aprovacoes'), description: 'Aprovações' },
    { key: 'i', alt: true, action: () => navigate('/clientes'), description: 'Clientes' },
    { key: 'u', alt: true, action: () => navigate('/fornecedores'), description: 'Fornecedores' },
    { key: 'n', alt: true, action: () => navigate('/notas-fiscais'), description: 'Notas Fiscais' },
    
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
  ];

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
  }, [navigate, shortcuts]);

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
