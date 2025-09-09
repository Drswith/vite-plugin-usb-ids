import type { Plugin } from 'vite'
import type { UsbIdsData, UsbIdsPluginOptions } from './typing'
import { USB_IDS_SOURCE } from './config'
import { fetchUsbIdsData, logger } from './utils'

// Virtual module ID
const VIRTUAL_USB_IDS_ID = 'virtual:usb-ids'
const RESOLVED_USB_IDS_ID = `\0${VIRTUAL_USB_IDS_ID}`

const pluginName = 'vite-plugin-usb-ids'

/**
 * USB device data Vite plugin - Virtual module version
 * Inject USB device data through virtual modules without generating physical files
 */
function usbIdsPlugin(options: UsbIdsPluginOptions = {}): Plugin {
  let usbIdsData: UsbIdsData | null = null

  const {
    usbIdsUrls = [],
    verbose = true,
  } = options
  /**
   * Initialize USB device data
   */
  async function initializeUsbIdsData(): Promise<void> {
    try {
      const { data } = await fetchUsbIdsData([...usbIdsUrls, ...USB_IDS_SOURCE], verbose)

      usbIdsData = data

      // Output statistics
      const vendorCount = Object.keys(data).length
      const deviceCount = Object.values(data).reduce((total, vendor) => {
        return total + Object.keys(vendor.devices || {}).length
      }, 0)

      logger.success(`Data initialization completed! Contains ${vendorCount} vendors, ${deviceCount} devices`, verbose)
    }
    catch (error) {
      console.error('[usb-devices] Failed to initialize USB device data:', error)
      // Use empty data as fallback
      usbIdsData = {}
    }
  }

  return {
    name: pluginName,
    async buildStart() {
      // Initialize USB device data
      await initializeUsbIdsData()
    },
    resolveId(id) {
      if (id === VIRTUAL_USB_IDS_ID) {
        return RESOLVED_USB_IDS_ID
      }
    },
    load(id) {
      if (id === RESOLVED_USB_IDS_ID) {
        // Return USB IDs data as ES module
        return `export default ${JSON.stringify(usbIdsData || {})}`
      }
    },
  }
}

export { pluginName, RESOLVED_USB_IDS_ID, usbIdsPlugin, VIRTUAL_USB_IDS_ID }
