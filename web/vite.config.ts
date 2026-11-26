import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Relative assets let the same build run as a Forge Custom UI resource.
export default defineConfig({
  base: './',
  plugins: [react()],
})
