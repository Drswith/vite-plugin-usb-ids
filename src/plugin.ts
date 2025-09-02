import type { Plugin } from 'vite'
import type { UsbIdsData, UsbIdsPluginOptions } from './typing'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { USB_IDS_SOURCE } from './config'
import { fetchUsbIdsData, logger } from './utils'

// 虚拟模块ID
const VIRTUAL_USB_IDS_ID = 'virtual:usb-ids'
const RESOLVED_USB_IDS_ID = `\0${VIRTUAL_USB_IDS_ID}`

const pluginName = 'vite-plugin-usb-ids'

/**
 * USB设备数据Vite插件 - 虚拟模块版本
 * 通过虚拟模块注入USB设备数据，无需生成物理文件
 */
function usbIdsPlugin(options: UsbIdsPluginOptions = {}): Plugin {
  let root = process.cwd()
  let usbIdsData: UsbIdsData | null = null

  const {
    usbIdsUrls = [],
    verbose = true,
  } = options
  /**
   * 初始化USB设备数据
   */
  async function initializeUsbIdsData(): Promise<void> {
    try {
      const { data } = await fetchUsbIdsData([...usbIdsUrls, ...USB_IDS_SOURCE], verbose)

      usbIdsData = data

      // 输出统计信息
      const vendorCount = Object.keys(data).length
      const deviceCount = Object.values(data).reduce((total, vendor) => {
        return total + Object.keys(vendor.devices || {}).length
      }, 0)

      logger.success(`数据初始化完成! 包含 ${vendorCount} 个供应商，${deviceCount} 个设备`, verbose)
    }
    catch (error) {
      console.error('[usb-devices] 初始化USB设备数据失败:', error)
      // 使用空数据作为fallback
      usbIdsData = {}
    }
  }

  /**
   * 生成虚拟模块类型定义文件
   */
  async function generateTypesFile(): Promise<void> {
    const typesFilePath = path.resolve(root, 'node_modules', 'vite-plugin-usb-ids', 'client.d.ts')
    const typesContent = `
// 虚拟模块类型声明
// 用户需要在他们的项目中引用这个文件来获得 'virtual:usb-ids' 的类型支持
// 例如：在 vite-env.d.ts 中添加：/// <reference types="vite-plugin-usb-ids/client" />
// 或在 tsconfig.json 中添加："types": ["vite-plugin-usb-ids/client"]
declare module 'virtual:usb-ids' {
  import type { UsbIdsData } from 'vite-plugin-usb-ids'
  const usbIdsData: UsbIdsData
  export default usbIdsData
}`
    // 创建
    fs.mkdirSync(path.dirname(typesFilePath), { recursive: true })
    // 写入类型定义文件
    fs.writeFileSync(typesFilePath, typesContent)
    logger.info(`类型定义文件已生成: ${typesFilePath}`, verbose)
  }

  return {
    name: pluginName,
    configResolved(config) {
      root = config.root
    },
    async buildStart() {
      // 生成虚拟模块类型定义文件
      await generateTypesFile()

      // 初始化USB设备数据
      await initializeUsbIdsData()
    },
    resolveId(id) {
      if (id === VIRTUAL_USB_IDS_ID) {
        return RESOLVED_USB_IDS_ID
      }
    },
    load(id) {
      if (id === RESOLVED_USB_IDS_ID) {
        // 返回USB IDs数据作为ES模块
        return `export default ${JSON.stringify(usbIdsData || {})}`
      }
    },
  }
}

export { pluginName, RESOLVED_USB_IDS_ID, usbIdsPlugin, VIRTUAL_USB_IDS_ID }
