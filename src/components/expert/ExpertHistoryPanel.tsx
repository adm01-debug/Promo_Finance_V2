import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, X, Search, Calendar, Filter, Loader2, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Conversation {
  id: string;
  titulo: string;
  resumo: string | null;
  created_at: string;
  updated_at: string;
}

interface ExpertHistoryPanelProps {
  show: boolean;
  onClose: () => void;
  conversations: Conversation[];
  filteredConversations: Conversation[];
  loadingConversations: boolean;
  currentConversationId: string | null;
  searchQuery: string;
  dateFilter: string;
  onSearchChange: (query: string) => void;
  onDateFilterChange: (filter: string) => void;
  onLoadConversation: (id: string) => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  clearSlot?: ReactNode;
}

export function ExpertHistoryPanel({ show, onClose, conversations, filteredConversations, loadingConversations, currentConversationId, searchQuery, dateFilter, onSearchChange, onDateFilterChange, onLoadConversation, onDeleteConversation, clearSlot }: ExpertHistoryPanelProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2"><History className="h-4 w-4" />Conversas Anteriores</h3>
              <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
            </div>
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar conversas..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="pl-9 h-9" />
              </div>
              <Select value={dateFilter} onValueChange={onDateFilterChange}>
                <SelectTrigger className="w-[140px] h-9"><Calendar className="h-4 w-4 mr-2" /><SelectValue placeholder="Período" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Esta semana</SelectItem>
                  <SelectItem value="month">Este mês</SelectItem>
                  <SelectItem value="older">Mais antigas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {loadingConversations ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filteredConversations.length > 0 ? (
              <ScrollArea className="max-h-48">
                <div className="space-y-2">
                  {filteredConversations.map((conv) => (
                    <div key={conv.id} onClick={() => onLoadConversation(conv.id)} className={cn("flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 group", currentConversationId === conv.id && "bg-muted border-primary")}>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{conv.titulo}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true, locale: ptBR })}</p>
                          {conv.resumo && <p className="text-xs text-muted-foreground truncate max-w-[200px]">• {conv.resumo}</p>}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => onDeleteConversation(conv.id, e)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : conversations.length > 0 ? (
              <div className="text-center py-4">
                <Filter className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhuma conversa encontrada com os filtros aplicados</p>
                {clearSlot ?? (
                  <Button variant="link" size="sm" onClick={() => { onSearchChange(''); onDateFilterChange('all'); }}>Limpar filtros</Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma conversa salva ainda</p>
            )}
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
