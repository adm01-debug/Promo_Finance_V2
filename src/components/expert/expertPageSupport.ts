import { isThisMonth, isThisWeek, isToday, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { env } from '@/config/env';
import type { ExpertAction } from '@/hooks/useExpertActions';
import type { ExpertConversation } from '@/hooks/useExpertConversations';

export interface LocalExpertMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: ExpertAction[];
  actionsExecuted?: boolean;
}

export const EXPERT_CHAT_URL = `${env.SUPABASE_URL}/functions/v1/expert-agent`;

export function filtrarConversasExpert(
  conversations: ExpertConversation[] | undefined,
  searchQuery: string,
  dateFilter: string
): ExpertConversation[] {
  if (!conversations) return [];

  return conversations.filter((conversation) => {
    const matchesSearch =
      searchQuery === '' ||
      conversation.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conversation.resumo &&
        conversation.resumo.toLowerCase().includes(searchQuery.toLowerCase()));
    const conversationDate = new Date(conversation.created_at);
    const matchesDate =
      dateFilter === 'today'
        ? isToday(conversationDate)
        : dateFilter === 'week'
          ? isThisWeek(conversationDate, { locale: ptBR })
          : dateFilter === 'month'
            ? isThisMonth(conversationDate)
            : dateFilter === 'older'
              ? conversationDate < subDays(new Date(), 30)
              : true;

    return matchesSearch && matchesDate;
  });
}
