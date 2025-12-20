import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    // TODO: プロジェクトに応じてカスタムプラグインを追加
  ],
  root: './src/client',
  publicDir: './public',
  envDir: resolve(__dirname, '.'), // プロジェクトルートから.envファイルを読み込む
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/client/index.html'),
        // TODO: プロジェクトに応じてエントリーポイントを追加
      },
    },
    target: 'esnext',
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: ['localhost', '.ngrok-free.app', '.ngrok-free.dev', '.ngrok.io'],
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
    proxy: {
      // API のプロキシ
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // TODO: プロジェクトに応じてプロキシを追加
    },
    watch: {
      ignored: [
        '**/src/server/**',
        '**/prisma/**',
        '**/scripts/**',
        '**/dist/**',
        '**/node_modules/**',
        '**/.git/**',
        '**/openspec/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@client': resolve(__dirname, './src/client'),
      '@shared': resolve(__dirname, './src/shared'),
      '@contracts': resolve(__dirname, './src/server/contracts'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
  esbuild: {
    target: 'esnext',
  },
})
