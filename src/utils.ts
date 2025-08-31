import type { UsbIdsData } from './typing'
import fs from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import path from 'node:path'
import { consola } from 'consola'
import { pluginName } from './plugin'

/**
 * 创建带插件名前缀的日志函数
 */
function createLogger(level: 'start' | 'success' | 'info' | 'warn') {
  return (message: string, verbose = true): void => {
    if (!verbose)
      return
    consola[level](`[${pluginName}] ${message}`)
  }
}

export const startWithTime = createLogger('start')
export const successWithTime = createLogger('success')
export const logWithTime = createLogger('info')
export const warnWithTime = createLogger('warn')

/**
 * 下载文件
 */
export function downloadFile(url: string, verbose = true): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http

    logWithTime(`正在从 ${url} 下载USB设备数据...`, verbose)

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
  fallbackFile: string,
  root: string,
  verbose = true,
): Promise<{ data: UsbIdsData, source: 'api' | 'fallback' }> {
  const startTime = Date.now()

  try {
    startWithTime('开始获取USB设备数据...', verbose)

    let usbIdsContent: string | null = null
    const downloadStartTime = Date.now()

    // 尝试从多个URL下载
    for (const url of usbIdsUrls) {
      try {
        usbIdsContent = await downloadFile(url, verbose)
        const downloadTime = Date.now() - downloadStartTime
        logWithTime(`成功从 ${url} 下载数据 (耗时: ${downloadTime}ms)`, verbose)
        break
      }
      catch (error) {
        warnWithTime(`从 ${url} 下载失败: ${(error as Error).message}`, verbose)
      }
    }

    let data: UsbIdsData
    let source: 'api' | 'fallback'

    if (usbIdsContent) {
      const parseStartTime = Date.now()
      logWithTime('解析USB设备数据...', verbose)
      data = parseUsbIds(usbIdsContent)
      const parseTime = Date.now() - parseStartTime
      logWithTime(`解析完成，共 ${Object.keys(data).length} 个供应商 (耗时: ${parseTime}ms)`, verbose)
      source = 'api'
    }
    else {
      warnWithTime('所有公共API都无法访问，使用本地fallback文件', verbose)
      const fallbackPath = path.resolve(root, fallbackFile)
      if (fs.existsSync(fallbackPath)) {
        data = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'))
        logWithTime('使用本地fallback文件', verbose)
        source = 'fallback'
      }
      else {
        throw new Error('无法获取USB设备数据，本地fallback文件也不存在')
      }
    }

    const totalTime = Date.now() - startTime
    logWithTime(`数据获取完成 (总耗时: ${totalTime}ms)`, verbose)

    return { data, source }
  }
  catch (error) {
    consola.error(`[${pluginName}] 获取USB设备数据失败:`, error)
    throw error
  }
}

/**
 * 保存USB设备数据到JSON文件
 */
export async function saveUsbIdsToFile(
  data: UsbIdsData,
  filePath: string,
  verbose = true,
): Promise<void> {
  try {
    const jsonContent = JSON.stringify(data, null, 2)
    fs.writeFileSync(filePath, jsonContent, 'utf8')

    const vendorCount = Object.keys(data).length
    const deviceCount = Object.values(data).reduce((total, vendor) => {
      return total + Object.keys(vendor.devices || {}).length
    }, 0)

    successWithTime(`USB设备数据已保存到 ${filePath}，包含 ${vendorCount} 个供应商，${deviceCount} 个设备`, verbose)
  }
  catch (error) {
    consola.error(`[${pluginName}] 保存USB设备数据失败:`, error)
    throw error
  }
}
