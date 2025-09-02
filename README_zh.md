# vite-plugin-usb-ids

简体中文 | [English](./README.md)

一个将远程 USB IDs 数据作为虚拟模块注入 Vite 项目的插件。

## 特性

- 🚀 **虚拟模块注入** - 通过虚拟模块 `virtual:usb-ids` 直接导入 USB 设备数据
- 📦 **零配置** - 开箱即用，无需额外配置
- 🌐 **多数据源** - 支持从多个 URL 获取最新的 USB IDs 数据，自动回退机制
- 🔧 **TypeScript 支持** - 自动生成虚拟模块的类型定义
- ⚡ **构建时数据获取** - 在构建过程中下载和解析 USB IDs 数据

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
      // 配置选项（全部可选）
      usbIdsUrls: ['https://custom-source.com/usb.ids'], // 自定义 USB IDs 数据源
      verbose: true, // 启用详细日志（默认：true）
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

插件会自动生成 TypeScript 类型定义。要获得虚拟模块的类型支持，请在您的 `vite-env.d.ts` 文件中添加类型引用：

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

**注意**：插件会在构建过程中自动在您的 `node_modules/vite-plugin-usb-ids/` 目录下生成 `client.d.ts` 文件。

## 配置选项

```typescript
interface UsbIdsPluginOptions {
  /** USB IDs数据源URLs */
  usbIdsUrls?: string[]

  /** 是否启用详细日志，默认为 true */
  verbose?: boolean
}
```

### 默认数据源

插件使用以下默认 USB IDs 数据源：
- `http://www.linux-usb.org/usb.ids`
- `https://raw.githubusercontent.com/systemd/systemd/main/hwdb.d/usb.ids`

如果您提供了自定义的 `usbIdsUrls`，插件会首先尝试这些 URL，然后回退到默认数据源。

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

1. **构建时初始化**：在 Vite 的 `buildStart` 阶段，插件从配置的数据源获取 USB IDs 数据
2. **数据获取**：首先尝试从自定义 URL 下载，然后回退到默认数据源
3. **数据解析**：将原始的 USB IDs 格式解析为结构化的 JSON 数据
4. **类型生成**：自动为虚拟模块生成 TypeScript 类型定义
5. **虚拟模块**：通过 Vite 的虚拟模块机制，将解析后的数据注入为 `virtual:usb-ids` 模块
6. **错误处理**：如果所有网络请求都失败，插件提供空数据以防止构建错误

## 开发模式

插件在开发和生产构建期间都会获取 USB IDs 数据。数据获取发生在 Vite 的构建启动阶段，确保不同模式下的行为一致。

如果您想在开发期间减少控制台输出，可以禁用详细日志：

```typescript
usbIdsPlugin({
  verbose: false
})
```

## 示例项目

### 在线演示

🚀 **[在 StackBlitz 上在线体验](https://stackblitz.com/edit/vite-plugin-usb-ids)**

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！

## 相关链接

- [USB ID Repository](http://www.linux-usb.org/usb-ids.html)
- [Systemd USB IDs](https://github.com/systemd/systemd/blob/main/hwdb.d/usb.ids)
- [Vite Plugin API](https://vitejs.dev/guide/api-plugin.html)
