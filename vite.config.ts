import * as path from "path";
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
// import electron from 'vite-plugin-electron'
// import electronRenderer from 'vite-plugin-electron/renderer'
// import electronPolyfillExports from 'vite-plugin-electron/polyfill-exports'


const electronOptions = {
  entry: "app/main.ts",
  // main: {entry: "app/main.ts"},
  // preload: {input: path.join(__dirname, "app/preload.ts")}
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(), vueJsx(),
    // electron(electronOptions),
    // electronRenderer(),
    // electronPolyfillExports()
  ],
  server: {
    proxy: {
      "/rpc":{
        target: "http://10.8.7.6:8080",
        changeOrigin: true
      }
    },
  },
})
