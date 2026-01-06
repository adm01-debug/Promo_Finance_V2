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
    <div className="px-3 py-2 space-y-2 border-b border-sidebar-border">
      {/* Favoritos */}
      {favoriteItems.length > 0 && (
        <div className="space-y-1">
          <button
            onClick={() => setIsFavoritesOpen(!isFavoritesOpen)}
            className="w-full flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Star className="h-3 w-3 text-warning fill-warning" />
            <span className="flex-1 text-left">Favoritos</span>
            <motion.div
              animate={{ rotate: isFavoritesOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-3 w-3" />
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
                    <div key={item.path} className="flex items-center gap-1 group">
                      <NavLink
                        to={item.path}
                        className={cn(
                          'flex-1 px-2 py-1.5 text-xs rounded-md transition-colors truncate',
                          location.pathname === item.path
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        {item.label}
                      </NavLink>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => toggleFavorite(item.path, item.label)}
                      >
                        <StarOff className="h-3 w-3 text-muted-foreground" />
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
        <div className="space-y-1">
          <div className="flex items-center gap-2 px-2 py-1">
            <button
              onClick={() => setIsRecentOpen(!isRecentOpen)}
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Clock className="h-3 w-3" />
              <span>Recentes</span>
              <motion.div
                animate={{ rotate: isRecentOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-3 w-3" />
              </motion.div>
            </button>
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 opacity-50 hover:opacity-100"
              onClick={clearRecent}
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
                          'flex-1 px-2 py-1.5 text-xs rounded-md transition-colors truncate',
                          location.pathname === item.path
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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