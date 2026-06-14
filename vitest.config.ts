import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    // Limita a quantidade de ambientes jsdom em paralelo e isola cada arquivo
    // num fork (memória reciclada por arquivo). Sem isso, a execução paralela
    // da suíte (78 arquivos) estourava a heap do worker em CI
    // (ERR_WORKER_OUT_OF_MEMORY), mesmo com todos os testes passando.
    pool: 'forks',
    poolOptions: {
      forks: { minForks: 1, maxForks: 2 },
    },
    isolate: true,
    // Workers escrevem o console direto no stdout em vez de o processo
    // coordenador bufferizar/agrupar os logs de ~1185 testes — reduz bastante
    // a memória do coordenador (que, junto ao reporter HTML, causava o
    // "Reached heap limit" em CI).
    disableConsoleIntercept: true,
    setupFiles: ['./src/test/setup.ts'],
    // Valores fictícios para que o cliente Supabase inicialize sem lançar
    // durante os testes (o createClient não realiza chamadas de rede na
    // construção). Testes que exercitam o backend devem mockar o cliente.
    env: {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
      VITE_SUPABASE_PROJECT_ID: 'test-project',
    },
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['node_modules', 'dist', 'e2e'],
    coverage: {
      provider: 'v8',
      // 'html' gera uma página por arquivo (1100+ arquivos) — lento e pesado
      // em memória. Mantemos apenas text/json/lcov para o gate e tooling.
      reporter: ['text', 'json', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,
      },

    },
    testTimeout: 10000,
    hookTimeout: 10000,
    // O reporter 'html' acumulava todos os resultados + grafo de módulos de
    // ~1185 testes na memória do processo principal do vitest, estourando a
    // heap em CI (FATAL ERROR: Reached heap limit) e travando o teardown
    // localmente. Usamos apenas o reporter padrão.
    reporters: ['default'],
  },
});
