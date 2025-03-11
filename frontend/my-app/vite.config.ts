import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Buffer polyfill'ini etkinleştir
      include: ['buffer', 'process', 'util', 'stream'],
      // Node.js global değişkenlerini ekle
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  // Ethers.js için gerekli olan resolve ayarları
  resolve: {
    alias: {
      process: "process/browser",
      stream: "stream-browserify",
      util: "util"
    }
  },
  // Ethers.js için gerekli olan define ayarları
  define: {
    'process.env': {},
    'global': {},
  },
  // Geliştirme sunucusu ayarları
  server: {
    port: 3000,
    open: true,
    // CORS hatalarını önlemek için proxy ayarları
    proxy: {
      '/api': {
        target: 'http://localhost:8545', // Ethereum RPC sunucusu
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
