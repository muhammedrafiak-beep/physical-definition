import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The dev server only serves the front end. Everything under /api is a Vercel
// function and everything under /media is a Vercel rewrite to Supabase
// Storage, and `vite dev` knows about neither — so on localhost the login
// POST hit Vite's own 404 and never signed anybody in, and every exercise
// photo was a broken image.
//
// These two proxies send both to a deployed copy, so localhost runs THIS code
// against the real API and the real media. Dev-only; the built site is served
// by Vercel, which applies vercel.json instead.
//
// PD_API_ORIGIN overrides the target. Set it to the branch's own preview URL
// while working on anything under /api — production is still running main, so
// a new endpoint does not exist there yet and the screen calling it just says
// "Unknown action":
//
//   set PD_API_ORIGIN=https://physical-definition-git-faster-map-rafi-s-projects19.vercel.app
//   npm run dev
const ORIGIN = process.env.PD_API_ORIGIN || 'https://www.physicaldefinition.com'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // P0: lets the app show "Preview: changes are not saved" on Vercel Previews.
  define: { __PD_ENV__: JSON.stringify(process.env.VERCEL_ENV || '') },
  server: {
    proxy: {
      '/api': { target: ORIGIN, changeOrigin: true, secure: true },
      '/media': { target: ORIGIN, changeOrigin: true, secure: true },
    },
  },
})
