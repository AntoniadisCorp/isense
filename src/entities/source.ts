export default function buildMakeSource({ isValidIp }: any) {
    return function makeSource({ ip, browser, referrer }: any = {}) {
        if (!ip) {
            throw new Error('Book source must contain an IP.')
        }
        if (!isValidIp(ip)) {
            throw new RangeError('Book source must contain a valid IP.')
        }
        return Object.freeze({
            getIp: () => ip,
            getBrowser: () => browser,
            getReferrer: () => referrer
        })
    }
}