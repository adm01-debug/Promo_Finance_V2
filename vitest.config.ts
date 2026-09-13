import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
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
    maxWorkers: 2,
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
      VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_key_1234567890', // gitleaks:allow — fixture
      VITE_SUPABASE_PROJECT_ID: 'test-project-fixture',
    },
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['node_modules', 'dist', 'e2e'],
    coverage: {
      provider: 'v8',
      // 'html' gera uma página por arquivo (1100+ arquivos) — lento e pesado
      // em memória. Mantemos apenas text/json/lcov para o gate e tooling.
      reporter: ['text', 'json', 'json-summary', 'lcov'],
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
      // Trava de não-regressão calibrada à cobertura REAL medida em 2026-09-13:
      // 71,76% linhas / 70,58% statements / 63,57% funções / 64,70% branches.
      //
      // Os pisos anteriores (6/6/18/50) vinham de uma medição de ~6,8% que há
      // muito deixou de valer: a cobertura podia despencar de 71% para 7% sem
      // o CI reclamar — o gate não protegia contra nada.
      //
      // Margem de ~5 pontos abaixo do medido para absorver variação legítima
      // (arquivo novo ainda sem teste). Elevar por degraus conforme sobe.
      thresholds: {
        lines: 66,
        functions: 58,
        branches: 59,
        statements: 65,
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
