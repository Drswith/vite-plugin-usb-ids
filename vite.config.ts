import { defineConfig } from 'vite'
import usbIdsPlugin from './src/index'

export default defineConfig({
  plugins: [
    usbIdsPlugin(),
  ],
})
