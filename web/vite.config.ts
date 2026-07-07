import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.PORT) || 5173,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      // M2: widened from src/cv/** to make the core analysis/session/eval
      // pipeline the official regression net. Thresholds sit below the
      // measured aggregate (lines/stmts ~83.7%, branches ~84.4%, funcs ~92.1%)
      // with margin, so the real-tape suites skipping in a tape-less
      // environment cannot flip the gate red.
      include: ['src/cv/**', 'src/analysis/**', 'src/session/**', 'src/eval/**'],
      thresholds: { lines: 75, functions: 80, branches: 75, statements: 75 },
    },
  },
})
