import { Device } from '@capacitor/device'
import { Storage } from './storage'

export async function getDeviceId() {

  let deviceId = await Storage.get('device_id')

  if (!deviceId) {

    const info = await Device.getId()

    deviceId = info.identifier

    await Storage.set('device_id', deviceId)
  }

  return deviceId
}

export async function getDeviceInfo() {

  const deviceId = await getDeviceId()

  const info = await Device.getInfo()

  return {
    device_id: deviceId,
    device_name: info.model,
    device_platform: info.platform
  }
}