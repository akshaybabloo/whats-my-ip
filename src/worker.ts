import {Hono, MiddlewareHandler} from 'hono'
import { createMiddleware } from 'hono/factory'

import {Fetcher} from "@cloudflare/workers-types";

type Bindings = {
    ASSETS: Fetcher;
}

const app = new Hono<{ Bindings: Bindings }>()

const cfWorker = (): MiddlewareHandler<any, any, {}> => {
    return createMiddleware(async (c, next): Promise<void | Response> => {
        const env = c.env as { ASSETS: Fetcher };
        if (!c.req.path.startsWith('/api')) {
            const response = await env.ASSETS.fetch(c.req.url);
            return response as unknown as Response;
        }
        // Proceed to the next middleware without returning anything
        await next();
    });
};

app.use('*', cfWorker());

app.get('/api/ip', (c) => {
    return c.json({ip: c.req.header()})
})

export default app