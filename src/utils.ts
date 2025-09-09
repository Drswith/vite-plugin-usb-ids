import type { UsbIdsData } from './typing'
import http from 'node:http'
import https from 'node:https'
import { pluginName } from './plugin'

/**
 * ANSI color codes
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
 * Format timestamp
 */
function formatTimestamp(): string {
  const now = new Date()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const seconds = now.getSeconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

/**
 * Manually implemented logger function
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
 * Download file
 */
export function downloadFile(url: string, verbose = true): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http

    logger.info(`Downloading USB device data from ${url}...`, verbose)

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
 * Parse usb.ids file format and convert to JSON format required by the project
 */
export function parseUsbIds(content: string): UsbIdsData {
  const lines = content.split('\n')
  const result: UsbIdsData = {}
  let currentVendor: string | null = null

  for (const line of lines) {
    // Skip comments and empty lines
    if (line.startsWith('#') || line.trim() === '') {
      continue
    }

    // Vendor line (not starting with tab)
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
    // Device line (starting with one tab)
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
 * Get USB device data
 */
export async function fetchUsbIdsData(
  usbIdsUrls: string[],
  verbose = true,
): Promise<{ data: UsbIdsData }> {
  const startTime = Date.now()

  try {
    logger.info('Starting to fetch USB device data...', verbose)

    let usbIdsContent: string | null = null
    const downloadStartTime = Date.now()

    // Try downloading from multiple URLs
    for (const url of usbIdsUrls) {
      try {
        usbIdsContent = await downloadFile(url, verbose)
        const downloadTime = Date.now() - downloadStartTime
        logger.info(`Successfully downloaded data from ${url} (time: ${downloadTime}ms)`, verbose)
        break
      }
      catch (error) {
        logger.warn(`Failed to download from ${url}: ${(error as Error).message}`, verbose)
      }
    }

    let data: UsbIdsData

    if (usbIdsContent) {
      const parseStartTime = Date.now()
      logger.info('Parsing USB device data...', verbose)
      data = parseUsbIds(usbIdsContent)
      const parseTime = Date.now() - parseStartTime
      logger.info(`Parsing completed, total ${Object.keys(data).length} vendors (time: ${parseTime}ms)`, verbose)
    }
    else {
      throw new Error('USB device data not found')
    }

    const totalTime = Date.now() - startTime
    logger.info(`Data fetching completed (total time: ${totalTime}ms)`, verbose)

    return { data }
  }
  catch (error) {
    logger.error(`Failed to fetch USB device data: ${(error as Error).message}`)
    throw error
  }
}
