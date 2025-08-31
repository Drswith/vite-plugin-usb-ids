import { defineConfig } from 'vite'
import usbIdsPlugin from 'vite-plugin-usb-ids'

export default defineConfig({
  plugins: [
    usbIdsPlugin({
      // skipInDev: false,
    }),
  ],
})
