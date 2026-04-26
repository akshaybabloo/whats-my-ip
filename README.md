# whats-my-ip

A small "What's my IP?" web app — shows your public IP and country. Live at [ip.gollahalli.com](https://ip.gollahalli.com).

The IP and country are read from Cloudflare's edge headers (`cf-connecting-ip`, `cf-ipcountry`) and rendered server-side on first paint, so the answer appears in the initial HTML with no client roundtrip. The Refresh button re-fetches from `/api/ip` for the same data without a full page reload.

## Stack

- [SvelteKit](https://svelte.dev/docs/kit) (SSR) on [Cloudflare Workers](https://developers.cloudflare.com/workers/) via `@sveltejs/adapter-cloudflare`
- [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn-svelte](https://shadcn-svelte.com/) (nova / neutral)
- [`countries-list`](https://www.npmjs.com/package/countries-list) for ISO-code → country-name lookup
- [Bun](https://bun.com/) for installs and scripts; [Wrangler](https://developers.cloudflare.com/workers/wrangler/) for typegen and deploy

## Develop

```sh
bun install
bun run dev
```

## Build & preview

```sh
bun run build      # wrangler types && vite build
bun run preview    # serves the built worker via wrangler dev
```

## Other scripts

| Script          | What it does                                               |
| --------------- | ---------------------------------------------------------- |
| `bun run check` | regenerates Cloudflare types and runs `svelte-check`       |
| `bun run lint`  | `prettier --check` + `eslint`                              |
| `bun run fmt`   | `prettier --write`                                         |
| `bun run gen`   | `wrangler types` (regenerates `worker-configuration.d.ts`) |

## Deploy

Pushes to `main` are picked up by the Cloudflare Pages/Workers build, which runs `bun install --frozen-lockfile` then `bun run build`. The build command intentionally uses `wrangler types` (not `--check`) so the committed `worker-configuration.d.ts` is regenerated against whatever workerd version Cloudflare currently ships, avoiding byte-equality drift between local and CI.

For a one-shot manual deploy:

```sh
bun run build && bunx wrangler deploy
```

## Adding shadcn-svelte components

```sh
bunx shadcn-svelte@latest add <component>
```

Components land under `src/lib/components/ui/**` and are owned by the upstream registry — they are excluded from prettier and eslint and should not be hand-edited (any local change is wiped the next time you `add` the component). Customise from the call site instead.

## Project layout

```
src/
├── app.html                       # ssr template (title, no-flash theme bootstrap, AdSense script)
├── lib/
│   ├── components/ui/             # shadcn-svelte (vendored, do not edit)
│   └── server/get-ip-info.ts      # cf-header → IpInfo helper
└── routes/
    ├── +layout.svelte
    ├── layout.css                 # tailwind v4 + shadcn theme tokens
    ├── +page.server.ts            # SSR load — initial IP/country
    ├── +page.svelte               # card UI, theme toggle, refresh
    └── api/ip/+server.ts          # JSON endpoint used by the Refresh button
```
