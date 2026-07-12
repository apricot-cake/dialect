import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/dialect/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      // GitHub Pagesはパスルーティングできないため、健康ボード(health.html)と
      // 対応表(matrix.html)をindex.htmlと並ぶ独立ページとしてマルチページビルドする
      input: {
        main: path.resolve(__dirname, 'index.html'),
        health: path.resolve(__dirname, 'health.html'),
        matrix: path.resolve(__dirname, 'matrix.html'),
        about: path.resolve(__dirname, 'about.html'),
      },
    },
  },
})
