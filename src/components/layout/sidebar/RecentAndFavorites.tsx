/**
 * Seção de Recentes e Favoritos na Sidebar
 * Melhora a navegação com acesso rápido
 */

import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Star, StarOff, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useRecentItems } from '@/hooks/useRecentItems';
import { useState } from 'react';

interface RecentAndFavoritesProps {
  collapsed: boolean;
}

export function RecentAndFavorites({ collapsed }: RecentAndFavoritesProps) {
  const location = useLocation();
  const { recentItems, favoriteItems, toggleFavorite, isFavorite, clearRecent } = useRecentItems();
  const [isRecentOpen, setIsRecentOpen] = useState(true);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(true);

  const hasItems = recentItems.length > 0 || favoriteItems.length > 0;

  if (!hasItems || collapsed) return null;

  return (
    <div className="px-4 py-6 space-y-6 border-b border-white/5 bg-black/10">
      {/* Favoritos */}
      {favoriteItems.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setIsFavoritesOpen(!isFavoritesOpen)}
            className="w-full flex items-center gap-3 px-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 hover:text-foreground transition-all group"
          >
            <div className="p-1.5 rounded-lg bg-warning/10 text-warning group-hover:bg-warning/20 transition-colors shadow-sm">
              <Star className="h-3.5 w-3.5 fill-warning" />
            </div>
            <span className="flex-1 text-left">Priority Access</span>
            <motion.div
              animate={{ rotate: isFavoritesOpen ? 180 : 0 }}
              transition={{ duration: 0.4, ease: "backOut" }}
              className="opacity-40 group-hover:opacity-100"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </motion.div>
          </button>
          
          <AnimatePresence initial={false}>
            {isFavoritesOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-0.5 pl-2">
                  {favoriteItems.map(item => (
                    <div key={item.path} className="flex items-center gap-1 group/item">
                      <NavLink
                        to={item.path}
                        className={cn(
                          'flex-1 px-4 py-2.5 text-[11px] rounded-xl transition-all duration-500 truncate font-black tracking-tight uppercase',
                          location.pathname === item.path
                            ? 'bg-primary/10 text-primary shadow-[0_0_15px_rgba(var(--primary),0.1)] ring-1 ring-primary/30'
                            : 'text-muted-foreground/60 hover:bg-white/5 hover:text-foreground hover:translate-x-1'
                        )}
                      >
                        {item.label}
                      </NavLink>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover/item:opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive rounded-lg"
                        onClick={() => toggleFavorite(item.path, item.label)}
                      >
                        <StarOff className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Recentes */}
      {recentItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <button
              onClick={() => setIsRecentOpen(!isRecentOpen)}
              className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 hover:text-foreground transition-all group"
            >
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors shadow-sm">
                <Clock className="h-3.5 w-3.5" />
              </div>
              <span>Recent Activity</span>
              <motion.div
                animate={{ rotate: isRecentOpen ? 180 : 0 }}
                transition={{ duration: 0.4, ease: "backOut" }}
                className="opacity-40 group-hover:opacity-100"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </motion.div>
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-30 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive rounded-md transition-all"
              onClick={clearRecent}
              title="Clear history"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <AnimatePresence initial={false}>
            {isRecentOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-0.5 pl-2">
                  {recentItems.map(item => (
                    <div key={item.path} className="flex items-center gap-1 group">
                      <NavLink
                        to={item.path}
                        className={cn(
                          'flex-1 px-3 py-2 text-xs rounded-xl transition-all duration-300 truncate font-medium',
                          location.pathname === item.path
                            ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20'
                            : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                        )}
                      >
                        {item.label}
                      </NavLink>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity',
                          isFavorite(item.path) && 'opacity-100'
                        )}
                        onClick={() => toggleFavorite(item.path, item.label)}
                      >
                        <Star
                          className={cn(
                            'h-3 w-3',
                            isFavorite(item.path)
                              ? 'text-warning fill-warning'
                              : 'text-muted-foreground'
                          )}
                        />
                      </Button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}