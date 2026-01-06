import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  X, 
  Trash2, 
  AlertTriangle, 
  Info, 
  AlertCircle,
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { sounds } from '@/lib/sound-feedback';
import { triggerHaptic } from '@/components/ui/micro-interactions';
import { useNavigate } from 'react-router-dom';

const priorityConfig = {
  alta: { 
    icon: AlertCircle, 
    color: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive/20',
  },
  media: { 
    icon: AlertTriangle, 
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/20',
  },
  baixa: { 
    icon: Info, 
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
};

const typeIcons: Record<string, React.ElementType> = {
  vencimento: Clock,
  pagamento: Check,
  alerta: AlertTriangle,
  sistema: Sparkles,
  default: Bell,
};

function NotificationItem({ 
  notification, 
  onMarkRead, 
  onDelete,
  onNavigate,
}: { 
  notification: Notification;
  onMarkRead: () => void;
  onDelete: () => void;
  onNavigate: (url: string) => void;
}) {
  const priority = priorityConfig[notification.prioridade as keyof typeof priorityConfig] || priorityConfig.baixa;
  const PriorityIcon = priority.icon;
  const TypeIcon = typeIcons[notification.tipo] || typeIcons.default;
  
  const handleClick = () => {
    if (!notification.lido) {
      onMarkRead();
    }
    if (notification.acao_url) {
      onNavigate(notification.acao_url);
    }
  };
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-all duration-200 group",
        notification.lido 
          ? "bg-muted/30 border-border/50" 
          : cn(priority.bg, priority.border, "border"),
        "hover:shadow-md"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          "p-2 rounded-lg flex-shrink-0",
          notification.lido ? "bg-muted" : priority.bg
        )}>
          <TypeIcon className={cn(
            "h-4 w-4",
            notification.lido ? "text-muted-foreground" : priority.color
          )} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn(
              "text-sm font-medium truncate",
              notification.lido && "text-muted-foreground"
            )}>
              {notification.titulo}
            </h4>
            {!notification.lido && (
              <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
            )}
          </div>
          
          <p className={cn(
            "text-xs mt-0.5 line-clamp-2",
            notification.lido ? "text-muted-foreground/70" : "text-muted-foreground"
          )}>
            {notification.mensagem}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(notification.created_at), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </span>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!notification.lido && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkRead();
                  }}
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              {notification.acao_url && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(notification.acao_url!);
                  }}
                >
                  <ArrowRight className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function NotificationCenter({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();
  
  const { 
    notifications, 
    unreadCount, 
    isLoading,
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();
  
  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.lido)
    : notifications;
  
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      sounds.notification();
      triggerHaptic('light');
    }
  };
  
  const handleNavigate = (url: string) => {
    setOpen(false);
    navigate(url);
  };
  
  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn("relative", className)}
        >
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-96 p-0" 
        align="end"
        sideOffset={8}
      >
        <div className="flex flex-col h-[500px]">
          {/* Header */}
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Notificações</h3>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5">
                    {unreadCount} novas
                  </Badge>
                )}
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1 h-7"
                  onClick={() => {
                    markAllAsRead();
                    sounds.success();
                  }}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Marcar todas
                </Button>
              )}
            </div>
            
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-3">
              <TabsList className="w-full grid grid-cols-2 h-8">
                <TabsTrigger value="all" className="text-xs">
                  Todas ({notifications.length})
                </TabsTrigger>
                <TabsTrigger value="unread" className="text-xs">
                  Não lidas ({unreadCount})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Bell className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h4 className="font-medium text-muted-foreground">
                    {activeTab === 'unread' 
                      ? 'Nenhuma notificação não lida' 
                      : 'Nenhuma notificação'}
                  </h4>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Você está em dia!
                  </p>
                </motion.div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkRead={() => markAsRead(notification.id)}
                      onDelete={() => deleteNotification(notification.id)}
                      onNavigate={handleNavigate}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </ScrollArea>
          
          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t bg-muted/20">
              <Button 
                variant="ghost" 
                className="w-full text-xs h-8"
                onClick={() => {
                  setOpen(false);
                  navigate('/alertas');
                }}
              >
                Ver todos os alertas
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default NotificationCenter;
