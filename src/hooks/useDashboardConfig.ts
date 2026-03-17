import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

export interface DashboardWidget {
  id: string;
  type: 'kpi-saldo' | 'kpi-receber' | 'kpi-pagar' | 'kpi-vencidas' | 'fluxo-caixa' | 'composicao' | 'vencimentos' | 'previsao-ia' | 'aprovacoes' | 'top-clientes';
  title: string;
  visible: boolean;
  order: number;
  size: 'sm' | 'md' | 'lg';
}

const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'fluxo-caixa', type: 'fluxo-caixa', title: 'Fluxo de Caixa', visible: true, order: 0, size: 'lg' },
  { id: 'composicao', type: 'composicao', title: 'Saldo por Banco', visible: true, order: 1, size: 'sm' },
  { id: 'top-clientes', type: 'top-clientes', title: 'Top Clientes', visible: true, order: 2, size: 'sm' },
  { id: 'vencimentos', type: 'vencimentos', title: 'Status Contas', visible: true, order: 3, size: 'sm' },
  { id: 'aprovacoes', type: 'aprovacoes', title: 'Centros de Custo', visible: true, order: 4, size: 'sm' },
  { id: 'previsao-ia', type: 'previsao-ia', title: 'Previsão IA', visible: true, order: 5, size: 'lg' },
  { id: 'alertas-preditivos', type: 'kpi-vencidas', title: 'Alertas Preditivos', visible: true, order: 6, size: 'md' },
  { id: 'metas', type: 'kpi-saldo', title: 'Metas Financeiras', visible: true, order: 7, size: 'md' },
];

const STORAGE_KEY = 'dashboard-widgets-config';

export function useDashboardConfig() {
  const { user } = useAuth();
  const [widgets, setWidgets] = useState<DashboardWidget[]>(DEFAULT_WIDGETS);
  const [isEditing, setIsEditing] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (user?.id) {
      const stored = localStorage.getItem(`${STORAGE_KEY}-${user.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Merge with defaults to handle new widgets
          const merged = DEFAULT_WIDGETS.map(defaultWidget => {
            const saved = parsed.find((w: DashboardWidget) => w.id === defaultWidget.id);
            return saved ? { ...defaultWidget, ...saved } : defaultWidget;
          });
          setWidgets(merged);
        } catch {
          setWidgets(DEFAULT_WIDGETS);
        }
      }
    }
  }, [user?.id]);

  // Save to localStorage whenever widgets change
  const saveConfig = useCallback((newWidgets: DashboardWidget[]) => {
    if (user?.id) {
      localStorage.setItem(`${STORAGE_KEY}-${user.id}`, JSON.stringify(newWidgets));
    }
    setWidgets(newWidgets);
  }, [user?.id]);

  const toggleWidget = useCallback((widgetId: string) => {
    setWidgets(prev => {
      const updated = prev.map(w => 
        w.id === widgetId ? { ...w, visible: !w.visible } : w
      );
      saveConfig(updated);
      return updated;
    });
  }, [saveConfig]);

  const reorderWidgets = useCallback((activeId: string, overId: string) => {
    setWidgets(prev => {
      const oldIndex = prev.findIndex(w => w.id === activeId);
      const newIndex = prev.findIndex(w => w.id === overId);
      
      if (oldIndex === -1 || newIndex === -1) return prev;
      
      const reordered = [...prev];
      const [removed] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, removed);
      
      const updated = reordered.map((w, idx) => ({ ...w, order: idx }));
      saveConfig(updated);
      return updated;
    });
  }, [saveConfig]);

  const resizeWidget = useCallback((widgetId: string, size: 'sm' | 'md' | 'lg') => {
    setWidgets(prev => {
      const updated = prev.map(w => 
        w.id === widgetId ? { ...w, size } : w
      );
      saveConfig(updated);
      return updated;
    });
  }, [saveConfig]);

  const resetToDefault = useCallback(() => {
    saveConfig(DEFAULT_WIDGETS);
  }, [saveConfig]);

  const visibleWidgets = widgets
    .filter(w => w.visible)
    .sort((a, b) => a.order - b.order);

  return {
    widgets,
    visibleWidgets,
    isEditing,
    setIsEditing,
    toggleWidget,
    reorderWidgets,
    resizeWidget,
    resetToDefault,
  };
}
