import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages serves this project from /BLACKVEIL/, not the domain root.
  base: '/BLACKVEIL/',
  plugins: [react()],
})
