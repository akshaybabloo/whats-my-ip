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
        console.log('Fetching', env)
        await next()
    })
}

app.use('*', cfWorker());

app.get('/api/test', (c) => {
    return c.json({"Hello": 'Hono!'})
})

export default app