export interface UsbIdsPluginOptions {
  /** USB IDs data source URLs */
  usbIdsUrls?: string[]
  /** Whether to enable verbose logging, defaults to true */
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
