import { Hono, MiddlewareHandler } from 'hono'

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
    var request = c.req.header()
    var ip = request['cf-connecting-ip'] ? request['cf-connecting-ip'] : 'Unable to get IP'
    var country = request['cf-ipcountry']
        ? getCountryData(request['cf-ipcountry'] as TCountryCode).name
        : 'Unable to get country'
    var info = request['cf-ipcountry']
        ? getCountryData(request['cf-ipcountry'] as TCountryCode)
        : 'Unable to get country'

    return c.json<IpInfo>({
        ip: ip,
        country: country,
        info: info,
    })
})

export default app
