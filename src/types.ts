// 虚拟模块类型声明
// 用户需要在他们的项目中引用这个文件来获得 'virtual:usb-devices' 的类型支持
// 例如：在 vite-env.d.ts 中添加：/// <reference types="vite-plugin-usb-ids/types" />
// 或在 tsconfig.json 中添加："types": ["vite-plugin-usb-ids/types"]
// @ts-expect-error let it be
declare module 'virtual:usb-devices' {
  import type { UsbDevicesData } from './index'

  const usbDevicesData: UsbDevicesData
  export default usbDevicesData
}
