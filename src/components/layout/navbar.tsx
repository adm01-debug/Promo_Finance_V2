import { Menu, Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  onMenuClick?: () => void;
  className?: string;
}

export function Navbar({ onMenuClick, className }: NavbarProps) {
  return (
    <header className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 ${className || ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            Finance Hub
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
