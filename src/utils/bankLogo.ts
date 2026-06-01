export function getBankLogo(bankName?: string): string {
    if (!bankName) {
        return '/images/bank/default.jpg'
    }

    const name = bankName.toLowerCase()

    if (name.includes('bca'))
        return '/images/bank/bca.jpg'

    if (name.includes('bni'))
        return '/images/bank/bni.jpg'

    if (name.includes('bri'))
        return '/images/bank/bri.jpg'

    if (name.includes('mandiri'))
        return '/images/bank/mandiri.jpg'

    if (name.includes('dana'))
        return '/images/bank/dana.jpg'

    if (name.includes('gopay'))
        return '/images/bank/gopay.jpg'

    if (name.includes('ovo'))
        return '/images/bank/ovo.png'

    if (name.includes('linkaja'))
        return '/images/bank/linkaja.png'

    if (name.includes('shopee'))
        return '/images/bank/shopee.png'

    return '/images/bank/default.jpg'
}