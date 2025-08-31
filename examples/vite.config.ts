import { defineConfig } from 'vite'
import usbIdsPlugin from '../src'

export default defineConfig({
  plugins: [
    usbIdsPlugin({
      // skipInDev: false,
    }),
  ],
})
