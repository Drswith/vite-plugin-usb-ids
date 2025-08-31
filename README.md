# vite-plugin-usb-ids

[简体中文](./README_zh.md) | English

A Vite plugin that injects remote or local USB IDs data as a virtual module into your Vite project.

## Features

- 🚀 **Virtual Module Injection** - Import USB device data directly through the `virtual:usb-ids` virtual module
- 📦 **Zero Configuration** - Works out of the box with no additional setup required
- 🌐 **Multiple Data Sources** - Supports fetching the latest USB IDs data from multiple URLs
- 💾 **Local Caching** - Automatically caches data to improve build performance
- 🔧 **TypeScript Support** - Complete type definitions included
- ⚡ **Development Friendly** - Option to skip network requests in development mode

## Installation

```bash
npm install -D vite-plugin-usb-ids
# or
pnpm add -D vite-plugin-usb-ids
# or
yarn add -D vite-plugin-usb-ids
```

## Usage

### 1. Configure the Plugin

Add the plugin to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import usbIdsPlugin from 'vite-plugin-usb-ids'

export default defineConfig({
  plugins: [
    usbIdsPlugin({
      // Configuration options (optional)
      skipInDev: true, // Skip download in development mode
      verbose: true, // Enable verbose logging
    }),
  ],
})
```

### 2. Use in Your Code

```typescript
// Import USB IDs data
import usbIdsData from 'virtual:usb-ids'

// Use the data
console.log(usbIdsData)

// Find a specific vendor
const vendor = usbIdsData['1d6b'] // Linux Foundation
console.log(vendor.name) // "Linux Foundation"

// Find a specific device
const device = vendor.devices['0001']
console.log(device.devname) // "1.1 root hub"
```

### 3. TypeScript Support

Create a `vite-env.d.ts` file (if you don't have one already):

```typescript
/// <reference types="vite/client" />
/// <reference types="vite-plugin-usb-ids/client" />
```

Or add to your `tsconfig.json`:
```json
{
  "compilerOptions": {
    "types": [
      "vite-plugin-usb-ids/client"
    ]
  }
}
```

## Configuration Options

```typescript
interface UsbIdsPluginOptions {
  /** Fallback file path, defaults to usb.ids.json in the plugin package */
  fallbackFile?: string

  /** USB IDs data source URLs */
  usbIdsUrls?: string[]

  /** Whether to skip download in development mode, defaults to true */
  skipInDev?: boolean

  /** Whether to enable verbose logging, defaults to true */
  verbose?: boolean
}
```

## Data Structure

The plugin provides data with the following structure:

```typescript
interface UsbDevice {
  devid: string // Device ID
  devname: string // Device name
}

interface UsbVendor {
  vendor: string // Vendor ID
  name: string // Vendor name
  devices: Record<string, UsbDevice>
}

type UsbIdsData = Record<string, UsbVendor>
```

### Data Example

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

## How It Works

1. **Data Fetching**: The plugin attempts to download the latest USB IDs data from the configured URL list when it starts
2. **Data Parsing**: Parses the raw USB IDs format into structured JSON data
3. **Virtual Module**: Injects the data as a `virtual:usb-ids` module through Vite's virtual module mechanism
4. **Caching**: Parsed data is cached locally to avoid repeated processing
5. **Fallback**: If network requests fail, the plugin uses built-in backup data

## Development Mode

By default, the plugin skips network requests in development mode (`skipInDev: true`) and uses local cache or fallback data to improve development experience. To fetch the latest data during development, set:

```typescript
usbIdsPlugin({
  skipInDev: false
})
```

## Example Project

### Online Demo

🚀 **[Try it online on StackBlitz](https://stackblitz.com/edit/vite-plugin-usb-ids)**

## License

MIT

## Contributing

Issues and Pull Requests are welcome!

## Related Links

- [USB ID Repository](http://www.linux-usb.org/usb-ids.html)
- [Systemd USB IDs](https://github.com/systemd/systemd/blob/main/hwdb.d/usb.ids)
- [Vite Plugin API](https://vitejs.dev/guide/api-plugin.html)
