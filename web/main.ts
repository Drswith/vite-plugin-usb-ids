import usbDevicesData from 'virtual:usb-devices'

console.log(usbDevicesData)

if (globalThis.window) {
  document.querySelector<HTMLDivElement>('#code')!.innerHTML = JSON.stringify(usbDevicesData, null, 2)
}
