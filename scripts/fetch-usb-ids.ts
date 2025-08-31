#!/usr/bin/env tsx

import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { fetchUsbIdsData, saveUsbIdsToFile } from '../src/utils'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')

// 默认配置
const DEFAULT_USB_IDS_URLS = [
  'https://raw.githubusercontent.com/systemd/systemd/main/hwdb.d/usb.ids',
  'http://www.linux-usb.org/usb.ids',
]

const FALLBACK_FILE = 'usb.ids.json'

async function main() {
  try {
    console.log('🚀 开始获取最新的USB设备数据...')

    const { data, source } = await fetchUsbIdsData(
      DEFAULT_USB_IDS_URLS,
      FALLBACK_FILE,
      projectRoot,
      true,
    )

    const outputPath = path.resolve(projectRoot, FALLBACK_FILE)
    await saveUsbIdsToFile(data, outputPath, true)

    console.log(`✅ USB设备数据获取完成！数据源: ${source === 'api' ? '远程API' : '本地fallback'}`)

    // 输出统计信息
    const vendorCount = Object.keys(data).length
    const deviceCount = Object.values(data).reduce((total, vendor) => {
      return total + Object.keys(vendor.devices || {}).length
    }, 0)

    console.log(`📊 数据统计: ${vendorCount} 个供应商，${deviceCount} 个设备`)

    process.exit(0)
  }
  catch (error) {
    console.error('❌ 获取USB设备数据失败:', error)
    process.exit(1)
  }
}

main()
