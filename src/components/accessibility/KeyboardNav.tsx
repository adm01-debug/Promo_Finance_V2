import { useEffect } from 'react';

export function KeyboardNav() {
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Ctrl+K: Global Search
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        // Open search
      }
      
      // Ctrl+N: New Account
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        // Open new account modal
      }
      
      // Esc: Close modals
      if (e.key === 'Escape') {
        // Close all modals
      }
    };
    
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, []);
  
  return null;
}
