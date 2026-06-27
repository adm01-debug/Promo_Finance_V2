import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

/**
 * Performance: build configurado para SPA grande (100+ rotas).
 * - SWC + esbuild minify para builds rápidos
 * - manualChunks por vendor para cache HTTP estável
 * - reportCompressedSize:false economiza ~30-50% no tempo de build
 * - assetsInlineLimit baixo evita inflar HTML/CSS com base64
 * - drop console/debugger em produção
 */
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020',
    },
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'date-fns',
      'framer-motion',
    ],
  },
  esbuild: mode === 'production'
    ? { drop: ['console', 'debugger'], legalComments: 'none' }
    : undefined,
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-popover',
            '@radix-ui/react-tooltip',
          ],
          'chart-vendor': ['recharts'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'date-vendor': ['date-fns'],
          'animation-vendor': ['framer-motion'],
          'form-vendor': ['react-hook-form', 'zod', '@hookform/resolvers'],
          'pdf-vendor': ['jspdf', 'jspdf-autotable'],
          'confetti-vendor': ['canvas-confetti'],
        },
      },
    },
    chunkSizeWarningLimit: 1200,
    sourcemap: 'hidden',
    minify: 'esbuild',
    target: 'es2020',
    cssMinify: 'lightningcss' as unknown as boolean,
    cssCodeSplit: true,
    assetsInlineLimit: 2048,
    reportCompressedSize: false,
  },
  server: {
    host: '::',
    port: 8080,
  },
}));
