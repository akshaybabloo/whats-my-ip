import { Hono } from 'hono'
import { Fetcher } from '@cloudflare/workers-types'
import { getCountryData, ICountryData, TCountryCode } from 'countries-list'

type Bindings = {
    ASSETS: Fetcher
}

interface IpInfo {
    ip: string
    country: string
    info?: ICountryData | string
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/api/ip', (c) => {
    const headers = c.req.header()
    const ip = headers['cf-connecting-ip'] || 'Unable to get IP'
    const countryCode = headers['cf-ipcountry']

    let country: string
    let info: ICountryData | string

    if (countryCode) {
        try {
            const countryData = getCountryData(countryCode as TCountryCode)
            country = countryData.name
            info = countryData
        } catch (error) {
            country = 'Unable to get country'
            info = 'Unable to get country'
        }
    } else {
        country = 'Unable to get country'
        info = 'Unable to get country'
    }

    return c.json<IpInfo>({
        ip,
        country,
        info,
    })
})

export default app
