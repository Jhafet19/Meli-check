import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false  // Deshabilitamos VitePWA para usar solo Firebase SW
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {

        "name": "MeliCheck Operaciones",
        "short_name": "MeliCheck",
        "description": "Gestión de repartidores y visitas",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#ffffff",
        "theme_color": "#ffffff",
        "lang": "en",
        "scope": "/",
        "orientation": "portrait",
        "icons": [
          {
            "src": "/192.png",
            "sizes": "192x192",
            "type": "image/png"
          },
          {
            "src": "/512.png",
            "sizes": "512x512",
            "type": "image/png"
          }
        ]
      }
    })
  ],
})