import type { UsbIdsData } from './typing'
import http from 'node:http'
import https from 'node:https'
import { pluginName } from './plugin'

/**
 * ANSI 颜色代码
 */
const colors = {
  reset: '\x1B[0m',
  cyan: '\x1B[36m',
  green: '\x1B[32m',
  blue: '\x1B[34m',
  yellow: '\x1B[33m',
  red: '\x1B[31m',
}

/**
 * 格式化时间戳
 */
function formatTimestamp(): string {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const seconds = now.getSeconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

/**
 * 手动实现的日志函数
 */
function createLogger(level: 'start' | 'success' | 'info' | 'warn' | 'error') {
  return (message: string, verbose = true): void => {
    if (!verbose)
      return

    const timestamp = formatTimestamp()
    const prefix = `[${pluginName}]`

    switch (level) {
      case 'start':
        console.log(`${colors.cyan}◐${colors.reset} ${colors.blue}${timestamp}${colors.reset} ${prefix} ${message}`)
        break
      case 'success':
        console.log(`${colors.green}✔${colors.reset} ${colors.blue}${timestamp}${colors.reset} ${prefix} ${message}`)
        break
      case 'info':
        console.log(`${colors.blue}ℹ${colors.reset} ${colors.blue}${timestamp}${colors.reset} ${prefix} ${message}`)
        break
      case 'warn':
        console.warn(`${colors.yellow}⚠${colors.reset} ${colors.blue}${timestamp}${colors.reset} ${prefix} ${message}`)
        break
      case 'error':
        console.error(`${colors.red}✖${colors.reset} ${colors.blue}${timestamp}${colors.reset} ${prefix} ${message}`)
        break
    }
  }
}

export const logger = {
  start: createLogger('start'),
  success: createLogger('success'),
  info: createLogger('info'),
  warn: createLogger('warn'),
  error: createLogger('error'),
}

/**
 * 下载文件
 */
export function downloadFile(url: string, verbose = true): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http

    logger.info(`正在从 ${url} 下载USB设备数据...`, verbose)

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
export function parseUsbIds(content: string): UsbIdsData {
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
export async function fetchUsbIdsData(
  usbIdsUrls: string[],
  verbose = true,
): Promise<{ data: UsbIdsData }> {
  const startTime = Date.now()

  try {
    logger.info('开始获取USB设备数据...', verbose)

    let usbIdsContent: string | null = null
    const downloadStartTime = Date.now()

    // 尝试从多个URL下载
    for (const url of usbIdsUrls) {
      try {
        usbIdsContent = await downloadFile(url, verbose)
        const downloadTime = Date.now() - downloadStartTime
        logger.info(`成功从 ${url} 下载数据 (耗时: ${downloadTime}ms)`, verbose)
        break
      }
      catch (error) {
        logger.warn(`从 ${url} 下载失败: ${(error as Error).message}`, verbose)
      }
    }

    let data: UsbIdsData

    if (usbIdsContent) {
      const parseStartTime = Date.now()
      logger.info('解析USB设备数据...', verbose)
      data = parseUsbIds(usbIdsContent)
      const parseTime = Date.now() - parseStartTime
      logger.info(`解析完成，共 ${Object.keys(data).length} 个供应商 (耗时: ${parseTime}ms)`, verbose)
    }
    else {
      throw new Error('未找到USB设备数据')
    }

    const totalTime = Date.now() - startTime
    logger.info(`数据获取完成 (总耗时: ${totalTime}ms)`, verbose)

    return { data }
  }
  catch (error) {
    logger.error(`获取USB设备数据失败: ${(error as Error).message}`)
    throw error
  }
}
