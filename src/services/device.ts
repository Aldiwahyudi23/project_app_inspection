import { Device } from '@capacitor/device'
import { Storage } from './storage'

import axios from 'axios'
import { App } from '@capacitor/app'
import { Browser } from '@capacitor/browser'

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

/**
 * =========================================================
 * APP UPDATE
 * =========================================================
 */

const APP_UPDATE_API =
    // 'https://management.cekmobil.online/api/app'
    'http://127.0.0.1:8000/api/app'

/**
 * GET APP VERSION INFO
 */
export async function getAppVersion() {

    try {

        const info =
            await App.getInfo()

        return {

            success: true,

            data: {

                appName: info.name,

                packageName: info.id,

                version: info.version,

                build: Number(info.build),

            }

        }

    } catch (error) {

        console.log(
            'Get App Version Error:',
            error
        )

        return {

            success: false,
            data: null

        }

    }

}

/**
 * CHECK APP UPDATE
 */
export async function checkAppUpdate() {

    try {

        // version aplikasi sekarang
        const appInfo =
            await getAppVersion()

        if (
            !appInfo.success ||
            !appInfo.data
        ) {

            return {

                success: false,
                updateAvailable: false

            }

        }

        // request ke backend
        const response =
           await axios.get(
                `${APP_UPDATE_API}/version`,
                {
                    timeout: 10000
                }
            )

        const serverData =
            response.data.data

        const latestBuild =
            Number(
                serverData.version_code
            )

        const currentBuild =
            appInfo.data.build

        // compare version
        const updateAvailable =
            latestBuild > currentBuild

        return {

            success: true,

            updateAvailable,

            currentVersion:
                appInfo.data.version,

            currentBuild,

            latestVersion:
                serverData.version_name,

            latestBuild,

            forceUpdate:
                serverData.force_update,

            message:
                serverData.message,

            apkUrl:
                serverData.apk_url,

        }

    } catch (error) {

        console.log(
            'Check App Update Error:',
            error
        )

        return {

            success: false,
            updateAvailable: false

        }

    }

}

/**
 * DOWNLOAD UPDATE APK
 */
export async function downloadAppUpdate(
    apkUrl: string
) {

    try {

        await Browser.open({

            url: apkUrl

        })

        return {

            success: true

        }

    } catch (error) {

        console.log(
            'Download APK Error:',
            error
        )

        return {

            success: false

        }

    }

}