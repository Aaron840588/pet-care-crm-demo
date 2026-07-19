import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const isDemo = env.VITE_DEMO_MODE !== 'false'
  const firebaseStub = fileURLToPath(new URL('./src/demo/firebaseStub.js', import.meta.url))

  return {
    plugins: [react()],
    resolve: {
      alias: isDemo
        ? [
            { find: 'firebase/app', replacement: firebaseStub },
            { find: 'firebase/auth', replacement: firebaseStub },
            { find: 'firebase/firestore', replacement: firebaseStub },
          ]
        : [],
    },
  }
})
