import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // relative URLs: the same build is deployed to /master/, to each release's folder and to /
  base: './',
  plugins: [vue()],
  build: {
    sourcemap: true,
    // Lightning CSS, Vite's CSS minifier, merges rules with the same selector as if !important
    // didn't count: .m-1 { margin: .15rem !important } lost to a later .m-1 { margin: .25rem }.
    // Unminified, the CSS gzips to 7.5 kB instead of 5.7
    cssMinify: false,
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
