# vite-plugin-usb-ids

[简体中文](./README_zh.md) | English

A Vite plugin that injects remote USB IDs data as a virtual module into your Vite project.

## Features

- 🚀 **Virtual Module Injection** - Import USB device data directly through the `virtual:usb-ids` virtual module
- 📦 **Zero Configuration** - Works out of the box with no additional setup required
- 🌐 **Multiple Data Sources** - Supports fetching the latest USB IDs data from multiple URLs with automatic fallback
- 🔧 **TypeScript Support** - Automatic type definition generation for virtual modules
- ⚡ **Build-time Data Fetching** - Downloads and parses USB IDs data during the build process

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
      // Configuration options (all optional)
      usbIdsUrls: ['https://custom-source.com/usb.ids'], // Custom USB IDs data sources
      verbose: true, // Enable verbose logging (default: true)
    }),
  ],
})
```

### 2. Use in Your Code

#### Recommended: Async Import (Dynamic Import)

```typescript
// Recommended: Use dynamic import for better performance
async function loadUsbData() {
  const usbIdsData = await import('virtual:usb-ids').then(m => m.default)

  // Use the data
  console.log(usbIdsData)

  // Find a specific vendor
  const vendor = usbIdsData['1d6b'] // Linux Foundation
  console.log(vendor.name) // "Linux Foundation"

  // Find a specific device
  const device = vendor.devices['0001']
  console.log(device.devname) // "1.1 root hub"
}

// Call when needed
loadUsbData()
```

#### Alternative: Sync Import (Static Import)

```typescript
// Alternative: Direct import (loaded at module parse time)
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

#### Why Async Import is Recommended

**Performance Benefits:**
- **Code Splitting**: Dynamic imports create separate chunks, reducing initial bundle size
- **Lazy Loading**: USB IDs data is only loaded when actually needed
- **Better UX**: Faster initial page load as the USB data (which can be large) doesn't block the main bundle

**Use Cases:**
- **Conditional Loading**: Only load USB data when user interacts with USB-related features
- **Route-based Loading**: Load USB data only in specific routes that need it
- **On-demand Features**: Perfect for features like device detection or hardware management panels

### 3. TypeScript Support

The plugin includes TypeScript definitions in the package. To get type support for the virtual module, add the type reference to your `vite-env.d.ts` file:

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

**Note**: The `client.d.ts` file is included in the published package and provides type definitions for the `virtual:usb-ids` module.

## Configuration Options

```typescript
interface UsbIdsPluginOptions {
  /** USB IDs data source URLs */
  usbIdsUrls?: string[]

  /** Whether to enable verbose logging, defaults to true */
  verbose?: boolean
}
```

### Default Data Sources

The plugin uses the following default USB IDs data sources:
- `http://www.linux-usb.org/usb.ids`
- `https://raw.githubusercontent.com/systemd/systemd/main/hwdb.d/usb.ids`

If you provide custom `usbIdsUrls`, they will be tried first, followed by the default sources as fallback.

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

1. **Build-time Initialization**: During Vite's `buildStart` phase, the plugin fetches USB IDs data from configured sources
2. **Data Fetching**: Attempts to download from custom URLs first, then falls back to default sources
3. **Data Parsing**: Parses the raw USB IDs format into structured JSON data
4. **Type Generation**: Automatically generates TypeScript definitions for the virtual module
5. **Virtual Module**: Injects the parsed data as a `virtual:usb-ids` module through Vite's virtual module mechanism
6. **Fallback Handling**: If all network requests fail, the plugin provides empty data to prevent build errors

## Development Mode

The plugin fetches USB IDs data during both development and production builds. The data fetching happens during Vite's build start phase, ensuring consistent behavior across different modes.

If you want to reduce console output during development, you can disable verbose logging:

```typescript
usbIdsPlugin({
  verbose: false
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
