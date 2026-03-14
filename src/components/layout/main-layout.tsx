import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';
import { cn } from '@/lib/utils';

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div
        className={cn(
          'flex min-h-screen flex-col transition-all duration-300',
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        )}
      >
        {/* Navbar */}
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-col items-center justify-between gap-2 text-sm text-gray-500 dark:text-gray-400 sm:flex-row">
            <p>© 2026 Finance Hub. Todos os direitos reservados.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-gray-700 dark:hover:text-gray-300">
                Termos
              </a>
              <a href="#" className="hover:text-gray-700 dark:hover:text-gray-300">
                Privacidade
              </a>
              <a href="#" className="hover:text-gray-700 dark:hover:text-gray-300">
                Suporte
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
