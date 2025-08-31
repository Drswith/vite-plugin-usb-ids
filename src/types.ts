export interface UsbDevicesPluginOptions {
  /** fallback文件路径，默认为 'src/assets/usb-device.json' */
  fallbackFile?: string
  /** USB IDs数据源URLs */
  usbIdsUrls?: string[]
  /** 是否在开发模式下跳过下载，默认为 true */
  skipInDev?: boolean
  /** 是否启用详细日志，默认为 true */
  verbose?: boolean
}

export interface UsbDevice {
  devid: string
  devname: string
}

export interface UsbVendor {
  name: string
  devices: Record<string, UsbDevice>
}

export type UsbDevicesData = Record<string, UsbVendor>

// 虚拟模块类型声明
// 用户需要在他们的项目中引用这个文件来获得 'virtual:usb-devices' 的类型支持
// 例如：在 vite-env.d.ts 中添加：/// <reference types="vite-plugin-usb-ids/types" />
// 或在 tsconfig.json 中添加："types": ["vite-plugin-usb-ids/types"]
// @ts-expect-error let it be
declare module 'virtual:usb-devices' {
  const usbDevicesData: UsbDevicesData
  export default usbDevicesData
}
