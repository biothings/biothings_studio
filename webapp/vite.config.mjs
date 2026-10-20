import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // relative URLs: the same build is deployed to /master/, to each release's folder and to /
  base: './',
  plugins: [vue()],
  build: {
    sourcemap: true,
    rolldownOptions: {
      output: {
        // dependencies in their own chunk, which deploys changing only the app leave cached
        codeSplitting: {
          groups: [{ name: 'vendor', test: /node_modules/ }]
        }
      }
    }
  }
})
