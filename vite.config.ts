import path from 'node:path'
import fs from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// サイト別ガイド(sites/<platformId>.html)はプラットフォームを1つ追加するたびに増えるため、
// 手書きの入力リストに足し忘れないようディレクトリから機械的に列挙する(#45)
const siteGuideEntries = Object.fromEntries(
  fs
    .readdirSync(path.resolve(__dirname, 'sites'))
    .filter((f) => f.endsWith('.html'))
    .map((f) => [`sites/${f.replace(/\.html$/, '')}`, path.resolve(__dirname, 'sites', f)]),
)

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
      // GitHub Pagesはパスルーティングできないため、健康ボード(health.html)・
      // 対応表(matrix.html)・サイト別ガイド(sites/*.html)をindex.htmlと並ぶ
      // 独立ページとしてマルチページビルドする
      input: {
        main: path.resolve(__dirname, 'index.html'),
        health: path.resolve(__dirname, 'health.html'),
        matrix: path.resolve(__dirname, 'matrix.html'),
        about: path.resolve(__dirname, 'about.html'),
        recipes: path.resolve(__dirname, 'recipes.html'),
        guides: path.resolve(__dirname, 'guides.html'),
        ...siteGuideEntries,
      },
    },
  },
})
