// 虚拟模块类型声明
// 用户需要在他们的项目中引用这个文件来获得 'virtual:usb-ids' 的类型支持
// 例如：在 vite-env.d.ts 中添加：/// <reference types="vite-plugin-usb-ids/client" />
// 或在 tsconfig.json 中添加："types": ["vite-plugin-usb-ids/client"]
declare module 'virtual:usb-ids' {
  import type { UsbIdsData } from 'vite-plugin-usb-ids'

  const usbIdsData: UsbIdsData
  export default usbIdsData
}
