import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  main: {
    build: {
      lib: { entry: resolve(__dirname, 'electron/main.js') },
      rollupOptions: {
        external: ['electron']
      }
    }
  },
  preload: {
    build: {
      lib: { entry: resolve(__dirname, 'electron/preload.js') },
      rollupOptions: {
        external: ['electron']
      }
    }
  },
  renderer: {
    root: '.',
    plugins: [react()],
    build: {
      sourcemap: true,
      rollupOptions: { input: resolve(__dirname, 'index.html') }
    },
    resolve: {
      alias: { '@': resolve(__dirname, 'src') }
    },
    server: { port: 5173 }
  }
})
