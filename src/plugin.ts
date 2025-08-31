import type { Plugin } from 'vite'
import type { UsbIdsData, UsbIdsPluginOptions } from './typing'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fetchUsbIdsData, logWithTime } from './utils'

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
  let isDev = false
  let usbIdsData: UsbIdsData | null = null

  const {
    fallbackFile = path.resolve(root, 'node_modules', 'vite-plugin-usb-ids', 'usb.ids.json'),
    usbIdsUrls = [
      'https://raw.githubusercontent.com/systemd/systemd/main/hwdb.d/usb.ids',
      'http://www.linux-usb.org/usb.ids',
    ],
    skipInDev = true,
    verbose = true,
  } = options
  /**
   * 初始化USB设备数据
   */
  async function initializeUsbIdsData(): Promise<void> {
    try {
      const { data } = await fetchUsbIdsData(usbIdsUrls, fallbackFile, root, verbose)

      usbIdsData = data

      // 输出统计信息
      const vendorCount = Object.keys(data).length
      const deviceCount = Object.values(data).reduce((total, vendor) => {
        return total + Object.keys(vendor.devices || {}).length
      }, 0)

      logWithTime(`数据初始化完成! 包含 ${vendorCount} 个供应商，${deviceCount} 个设备`, verbose)
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
    const typesFilePath = path.resolve(root, 'node_modules', 'vite-plugin-usb-ids', 'types.d.ts')
    const typesContent = `
// 虚拟模块类型声明
// 用户需要在他们的项目中引用这个文件来获得 'virtual:usb-ids' 的类型支持
// 例如：在 vite-env.d.ts 中添加：/// <reference types="vite-plugin-usb-ids/types" />
// 或在 tsconfig.json 中添加："types": ["vite-plugin-usb-ids/types"]
declare module 'virtual:usb-ids' {
  import type { UsbIdsData } from 'vite-plugin-usb-ids'
  const usbIdsData: UsbIdsData
  export default usbIdsData
}`
    // 创建
    fs.mkdirSync(path.dirname(typesFilePath), { recursive: true })
    // 写入类型定义文件
    fs.writeFileSync(typesFilePath, typesContent)
    logWithTime(`类型定义文件已生成: ${typesFilePath}`, verbose)
  }

  return {
    name: pluginName,
    configResolved(config) {
      root = config.root
      isDev = config.command === 'serve'
    },
    async buildStart() {
      // 生成虚拟模块类型定义文件
      await generateTypesFile()

      // 在开发模式下，如果设置了跳过，则不执行
      if (isDev && skipInDev) {
        logWithTime('开发模式下跳过USB设备数据生成', verbose)
        // 在开发模式下使用本地fallback数据
        const fallbackPath = path.resolve(root, 'node_modules', 'vite-plugin-usb-ids', fallbackFile)
        // 检查是否存在本地fallback文件
        logWithTime(`检查fallback文件: ${fallbackPath}`, verbose)
        if (fs.existsSync(fallbackPath)) {
          usbIdsData = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'))
          logWithTime('开发模式使用本地fallback数据', verbose)
        }
        else {
          usbIdsData = {}
        }
        return
      }

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
