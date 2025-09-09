// Virtual module type declarations
// Users need to reference this file in their project to get type support for 'virtual:usb-ids'
// For example: Add in vite-env.d.ts: /// <reference types="vite-plugin-usb-ids/client" />
// Or add in tsconfig.json: "types": ["vite-plugin-usb-ids/client"]
declare module 'virtual:usb-ids' {
  import type { UsbIdsData } from 'vite-plugin-usb-ids'

  const usbIdsData: UsbIdsData
  export default usbIdsData
}
