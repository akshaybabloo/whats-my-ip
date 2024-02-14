import {Hono, MiddlewareHandler} from 'hono'
import { createMiddleware } from 'hono/factory'

import {Fetcher} from "@cloudflare/workers-types";

type Bindings = {
    ASSETS: Fetcher;
}

const app = new Hono<{ Bindings: Bindings }>()

const cfWorker = () => {
    return createMiddleware(async (c, next) => {
        const env = c.env as { ASSETS: Fetcher }
        if (!c.req.path.startsWith('/api')) {
            return await env.ASSETS.fetch(c.req.url)
        }
        await next()
    })
}

app.use('*', cfWorker());

app.get('/api/ip', (c) => {
    return c.json({ip: c.req.header()})
})

export default app