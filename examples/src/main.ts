import usbIdsData from 'virtual:usb-ids'

console.log(usbIdsData)

if (globalThis.window) {
  document.querySelector<HTMLDivElement>('#code')!.innerHTML = JSON.stringify(usbIdsData, null, 2)
}
