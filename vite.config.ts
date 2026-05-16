import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    }),
  ],

  server: {
    host: '0.0.0.0',
    port: 5174,
    proxy: {
      '/proxy/youtube': {
        target: 'https://www.youtube.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/proxy\/youtube/, ''),
        headers: {
          Origin: 'https://www.youtube.com',
          Referer: 'https://www.youtube.com/'
        }
      },
      '/proxy/music': {
        target: 'https://music.youtube.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/proxy\/music/, ''),
        headers: {
          Origin: 'https://music.youtube.com',
          Referer: 'https://music.youtube.com/'
        }
      },
      '/proxy/suggest': {
        target: 'https://suggestqueries.google.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/proxy\/suggest/, '')
      },
      '/proxy/jiosaavn': {
        target: 'https://www.jiosaavn.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/proxy\/jiosaavn/, ''),
        headers: {
          Origin: 'https://www.jiosaavn.com',
          Referer: 'https://www.jiosaavn.com/'
        }
      }
    }
  }
})