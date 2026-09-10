import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The dev server only serves the front end. Everything under /api is a Vercel
// function and everything under /media is a Vercel rewrite to Supabase
// Storage, and `vite dev` knows about neither — so on localhost the login
// POST hit Vite's own 404 and simply never signed anybody in, and every
// exercise photo was a broken image.
//
// These two proxies send both to production, so localhost runs THIS code
// against the real API and the real media. It is dev-only; the built site is
// served by Vercel, which applies vercel.json instead.
const ORIGIN = 'https://www.physicaldefinition.com'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: ORIGIN, changeOrigin: true, secure: true },
      '/media': { target: ORIGIN, changeOrigin: true, secure: true },
    },
  },
})
