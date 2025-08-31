import type { Plugin } from 'vite'
import type { UsbIdsData, UsbIdsPluginOptions } from './typing'
import fs from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import path from 'node:path'
import dayjs from 'dayjs'

// 虚拟模块ID
const VIRTUAL_USB_IDS_ID = 'virtual:usb-ids'
const RESOLVED_USB_IDS_ID = `\0${VIRTUAL_USB_IDS_ID}`

const pluginName = 'vite-plugin-usb-ids'

/**
 * USB设备数据Vite插件 - 虚拟模块版本
 * 通过虚拟模块注入USB设备数据，无需生成物理文件
 */
function usbIdsPlugin(options: UsbIdsPluginOptions = {}): Plugin {
  const {
    fallbackFile = 'usb.ids.json',
    usbIdsUrls = [
      'https://raw.githubusercontent.com/systemd/systemd/main/hwdb.d/usb.ids',
      'http://www.linux-usb.org/usb.ids',
    ],
    skipInDev = true,
    verbose = true,
  } = options

  let root = ''
  let isDev = false
  let usbIdsData: UsbIdsData | null = null

  /**
   * 带时间戳的日志输出
   */
  function logWithTime(message: string): void {
    if (!verbose)
      return
    const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss')
    console.log(`[${timestamp}] [usb-devices] ${message}`)
  }

  /**
   * 带时间戳的警告输出
   */
  function warnWithTime(message: string): void {
    if (!verbose)
      return
    const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss')
    console.warn(`[${timestamp}] [usb-devices] ${message}`)
  }

  /**
   * 下载文件
   */
  function downloadFile(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http

      logWithTime(`正在从 ${url} 下载USB设备数据...`)

      client.get(`${url}?_t=${Date.now()}`, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`))
          return
        }

        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })

        res.on('end', () => {
          resolve(data)
        })
      }).on('error', reject)
    })
  }

  /**
   * 解析usb.ids文件格式并转换为项目所需的JSON格式
   */
  function parseUsbIds(content: string): UsbIdsData {
    const lines = content.split('\n')
    const result: UsbIdsData = {}
    let currentVendor: string | null = null

    for (const line of lines) {
      // 跳过注释和空行
      if (line.startsWith('#') || line.trim() === '') {
        continue
      }

      // 供应商行（不以制表符开头）
      if (!line.startsWith('\t')) {
        const match = line.match(/^([0-9a-f]{4})\s(.+)$/i)
        if (match) {
          const [, vendorId, vendorName] = match
          currentVendor = vendorId.toLowerCase()
          result[currentVendor] = {
            vendor: vendorId.toLowerCase(),
            name: vendorName.trim(),
            devices: {},
          }
        }
      }
      // 设备行（以一个制表符开头）
      else if (line.startsWith('\t') && !line.startsWith('\t\t') && currentVendor) {
        const match = line.match(/^\t([0-9a-f]{4})\s(.+)$/i)
        if (match) {
          const [, deviceId, deviceName] = match
          result[currentVendor].devices[deviceId.toLowerCase()] = {
            devid: deviceId.toLowerCase(),
            devname: deviceName.trim(),
          }
        }
      }
    }

    return result
  }

  /**
   * 获取USB设备数据
   */
  async function fetchUsbIdsData(): Promise<{ data: UsbIdsData, source: 'api' | 'fallback' }> {
    const startTime = Date.now()

    try {
      logWithTime('开始获取USB设备数据...')

      let usbIdsContent: string | null = null
      const downloadStartTime = Date.now()

      // 尝试从多个URL下载
      for (const url of usbIdsUrls) {
        try {
          usbIdsContent = await downloadFile(url)
          const downloadTime = Date.now() - downloadStartTime
          logWithTime(`成功从 ${url} 下载数据 (耗时: ${downloadTime}ms)`)
          break
        }
        catch (error) {
          warnWithTime(`从 ${url} 下载失败: ${(error as Error).message}`)
        }
      }

      let data: UsbIdsData
      let source: 'api' | 'fallback'

      if (usbIdsContent) {
        const parseStartTime = Date.now()
        logWithTime('解析USB设备数据...')
        data = parseUsbIds(usbIdsContent)
        const parseTime = Date.now() - parseStartTime
        logWithTime(`解析完成，共 ${Object.keys(data).length} 个供应商 (耗时: ${parseTime}ms)`)
        source = 'api'
      }
      else {
        warnWithTime('所有公共API都无法访问，使用本地fallback文件')
        const fallbackPath = path.resolve(root, fallbackFile)
        if (fs.existsSync(fallbackPath)) {
          data = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'))
          logWithTime('使用本地fallback文件')
          source = 'fallback'
        }
        else {
          throw new Error('无法获取USB设备数据，本地fallback文件也不存在')
        }
      }

      const totalTime = Date.now() - startTime
      logWithTime(`数据获取完成 (总耗时: ${totalTime}ms)`)

      return { data, source }
    }
    catch (error) {
      console.error('[usb-devices] 获取USB设备数据失败:', error)
      throw error
    }
  }

  /**
   * 初始化USB设备数据
   */
  async function initializeUsbIdsData(): Promise<void> {
    try {
      const { data } = await fetchUsbIdsData()

      usbIdsData = data

      // 输出统计信息
      const vendorCount = Object.keys(data).length
      const deviceCount = Object.values(data).reduce((total, vendor) => {
        return total + Object.keys(vendor.devices || {}).length
      }, 0)

      logWithTime(`数据初始化完成! 包含 ${vendorCount} 个供应商，${deviceCount} 个设备`)
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
    logWithTime(`类型定义文件已生成: ${typesFilePath}`)
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
        logWithTime('开发模式下跳过USB设备数据生成')
        // 在开发模式下使用本地fallback数据
        const fallbackPath = path.resolve(root, fallbackFile)
        if (fs.existsSync(fallbackPath)) {
          usbIdsData = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'))
          logWithTime('开发模式使用本地fallback数据')
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
