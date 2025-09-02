export interface UsbIdsPluginOptions {
  /** USB IDs数据源URLs */
  usbIdsUrls?: string[]
  /** 是否启用详细日志，默认为 true */
  verbose?: boolean
}

export interface UsbDevice {
  devid: string
  devname: string
}

export interface UsbVendor {
  vendor: string
  name: string
  devices: Record<string, UsbDevice>
}

export type UsbIdsData = Record<string, UsbVendor>
