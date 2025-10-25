import { defineConfig } from 'vite'
import { copyFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

export default defineConfig({
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          game: [
            './src/js/game.js',
            './src/js/card.js',
            './src/js/battlefield.js',
            './src/js/dragdrop.js'
          ],
          ui: [
            './src/js/ui.js',
            './src/js/animations.js',
            './src/js/tutorial.js'
          ],
          systems: [
            './src/js/molecules.js',
            './src/js/fusionSystem.js',
            './src/js/starManagement.js',
            './src/js/onlineMatching.js'
          ]
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true
  },
  preview: {
    port: 3000,
    host: true
  },
  plugins: [
    {
      name: 'copy-data-files',
      writeBundle() {
        // 데이터 파일들을 dist 폴더로 복사
        try {
          mkdirSync('dist/src/data', { recursive: true });
          copyFileSync('src/data/elements.json', 'dist/src/data/elements.json');
          copyFileSync('src/data/molecules.json', 'dist/src/data/molecules.json');
          console.log('데이터 파일 복사 완료');
        } catch (error) {
          console.error('데이터 파일 복사 실패:', error);
        }
      }
    }
  ]
})