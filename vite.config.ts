import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';
import { visualizer } from 'rollup-plugin-visualizer';
import dyadComponentTagger from '@dyad-sh/react-vite-component-tagger';

/**
 * Valida que as variáveis VITE_SUPABASE_* estão presentes em builds de produção.
 * Falha cedo, com mensagem clara, evitando publicar um bundle quebrado.
 */
function assertSupabaseEnv(mode: string, env: Record<string, string>) {
  if (mode !== 'production') return;
  const required = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
    'VITE_SUPABASE_PROJECT_ID',
  ] as const;
  const missing = required.filter((k) => !env[k] || !env[k].trim());
  if (missing.length > 0) {
    const msg = [
      '',
      '✖ [promo-finance] Build abortado: variáveis de ambiente ausentes.',
      `  Faltando: ${missing.join(', ')}`,
      '  Defina-as no ambiente de build (ex.: .env.production ou Settings → Build Secrets)',
      '  antes de rodar `vite build`. Veja .env.example para referência.',
      '',
    ].join('\n');
    throw new Error(msg);
  }
}

/**
 * Performance: build configurado para SPA grande (100+ rotas).
 * - SWC + Oxc minify para builds rápidos
 * - manualChunks por vendor para cache HTTP estável
 * - reportCompressedSize:false economiza ~30-50% no tempo de build
 * - assetsInlineLimit baixo evita inflar HTML/CSS com base64
 * - sourcemaps ocultos para diagnóstico sem expor referências no bundle
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  assertSupabaseEnv(mode, env);
  return {

  plugins: [dyadComponentTagger(), 
    react(),
    mode === 'development' && componentTagger(),
    // Analisador de bundle sob demanda: `ANALYZE=1 bun run build`
    // Gera dist/stats.html com treemap gzip/brotli para identificar
    // chunks acima de 200KB e candidatos a code-splitting.
    process.env.ANALYZE === '1' && visualizer({
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
      template: 'treemap',
      open: false,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  optimizeDeps: {
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
  build: {
    rolldownOptions: {
      output: {
        // Vite 8/Rolldown aceita apenas a variante em função. A tabela mantém
        // os mesmos agrupamentos estáveis usados para cache de fornecedores.
        manualChunks(id) {
          const chunks: Record<string, string[]> = {
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
          };

          for (const [chunk, packages] of Object.entries(chunks)) {
            if (packages.some((pkg) => id.includes(`/node_modules/${pkg}/`))) {
              return chunk;
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 1200,
    sourcemap: 'hidden',
    minify: 'oxc',
    target: 'es2020',
    cssMinify: true,
    cssCodeSplit: true,
    assetsInlineLimit: 2048,
    reportCompressedSize: false,
  },
  server: {
    host: '::',
    port: 8080,
  },
  };
});


