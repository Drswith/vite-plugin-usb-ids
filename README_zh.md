# vite-plugin-usb-ids

简体中文 | [English](./README.md)

一个将远程或本地 USB IDs 数据作为虚拟模块注入 Vite 项目的插件。

## 特性

- 🚀 **虚拟模块注入** - 通过虚拟模块 `virtual:usb-ids` 直接导入 USB 设备数据
- 📦 **零配置** - 开箱即用，无需额外配置
- 🌐 **多数据源** - 支持从多个 URL 获取最新的 USB IDs 数据
- 💾 **本地缓存** - 自动缓存数据，提升构建性能
- 🔧 **TypeScript 支持** - 完整的类型定义
- ⚡ **开发友好** - 开发模式下可选择跳过网络请求

## 安装

```bash
npm install -D vite-plugin-usb-ids
# 或
pnpm add -D vite-plugin-usb-ids
# 或
yarn add -D vite-plugin-usb-ids
```

## 使用方法

### 1. 配置插件

在 `vite.config.ts` 中添加插件：

```typescript
import { defineConfig } from 'vite'
import usbIdsPlugin from 'vite-plugin-usb-ids'

export default defineConfig({
  plugins: [
    usbIdsPlugin({
      // 配置选项（可选）
      skipInDev: true, // 开发模式下跳过下载
      verbose: true, // 启用详细日志
    }),
  ],
})
```

### 2. 在代码中使用

```typescript
// 导入 USB IDs 数据
import usbIdsData from 'virtual:usb-ids'

// 使用数据
console.log(usbIdsData)

// 查找特定厂商
const vendor = usbIdsData['1d6b'] // Linux Foundation
console.log(vendor.name) // "Linux Foundation"

// 查找特定设备
const device = vendor.devices['0001']
console.log(device.devname) // "1.1 root hub"
```

### 3. TypeScript 类型支持

创建 `vite-env.d.ts` 文件（如果还没有）：

```typescript
/// <reference types="vite/client" />
/// <reference types="vite-plugin-usb-ids/client" />
```

或在 `tsconfig.json` 中添加：
```json
{
  "compilerOptions": {
    "types": [
      "vite-plugin-usb-ids/client"
    ]
  }
}
```

## 配置选项

```typescript
interface UsbIdsPluginOptions {
  /** fallback文件路径，默认为插件包内的 usb.ids.json */
  fallbackFile?: string

  /** USB IDs数据源URLs */
  usbIdsUrls?: string[]

  /** 是否在开发模式下跳过下载，默认为 true */
  skipInDev?: boolean

  /** 是否启用详细日志，默认为 true */
  verbose?: boolean
}
```

## 数据结构

插件提供的数据结构如下：

```typescript
interface UsbDevice {
  devid: string // 设备ID
  devname: string // 设备名称
}

interface UsbVendor {
  vendor: string // 厂商ID
  name: string // 厂商名称
  devices: Record<string, UsbDevice>
}

type UsbIdsData = Record<string, UsbVendor>
```

### 数据示例

```json
{
  "1d6b": {
    "vendor": "1d6b",
    "name": "Linux Foundation",
    "devices": {
      "0001": {
        "devid": "0001",
        "devname": "1.1 root hub"
      },
      "0002": {
        "devid": "0002",
        "devname": "2.0 root hub"
      }
    }
  }
}
```

## 工作原理

1. **数据获取**：插件启动时从配置的 URL 列表依次尝试下载最新的 USB IDs 数据
2. **数据解析**：将原始的 USB IDs 格式解析为结构化的 JSON 数据
3. **虚拟模块**：通过 Vite 的虚拟模块机制，将数据注入为 `virtual:usb-ids` 模块
4. **缓存机制**：解析后的数据会缓存到本地，避免重复处理
5. **降级处理**：如果网络请求失败，会使用插件包内置的备用数据

## 开发模式

默认情况下，插件在开发模式下会跳过网络请求（`skipInDev: true`），直接使用本地缓存或备用数据，以提升开发体验。如需在开发时也获取最新数据，可设置：

```typescript
usbIdsPlugin({
  skipInDev: false
})
```

## 示例项目

查看 `examples` 目录中的完整示例：

```bash
cd examples
pnpm install
pnpm dev
```

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！

## 相关链接

- [USB ID Repository](http://www.linux-usb.org/usb-ids.html)
- [Systemd USB IDs](https://github.com/systemd/systemd/blob/main/hwdb.d/usb.ids)
- [Vite Plugin API](https://vitejs.dev/guide/api-plugin.html)
