import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      "/rpc":{
        target: "http://10.8.7.6:8080",
        changeOrigin: true
      }
    },
  },
})
