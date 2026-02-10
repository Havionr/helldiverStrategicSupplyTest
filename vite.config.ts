import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Default to empty string if undefined to prevent "Cannot read properties of undefined (reading 'includes')"
      'process.env.API_KEY': JSON.stringify(env.API_KEY || "")
    }
  }
})