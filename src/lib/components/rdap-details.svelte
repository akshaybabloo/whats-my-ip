<script lang="ts">
	import { z } from 'zod';
	import { Button } from '$lib/components/ui/button';
	import Loader from '@lucide/svelte/icons/loader-circle';
	import Globe from '@lucide/svelte/icons/globe';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';

	const Cidr = z.object({
		v4prefix: z.string().optional(),
		v6prefix: z.string().optional(),
		length: z.number()
	});

	const Event = z.object({
		eventAction: z.string(),
		eventDate: z.string()
	});

	const VcardField = z.tuple([
		z.string(),
		z.record(z.string(), z.unknown()),
		z.string(),
		z.unknown()
	]);

	const Entity = z.object({
		handle: z.string().optional(),
		roles: z.array(z.string()).optional(),
		vcardArray: z.tuple([z.literal('vcard'), z.array(VcardField)]).optional()
	});

	const RdapResponse = z
		.object({
			handle: z.string().optional(),
			name: z.string().optional(),
			country: z.string().optional(),
			type: z.string().optional(),
			ipVersion: z.string().optional(),
			startAddress: z.string().optional(),
			endAddress: z.string().optional(),
			cidr0_cidrs: z.array(Cidr).optional(),
			events: z.array(Event).optional(),
			entities: z.array(Entity).optional(),
			port43: z.string().optional()
		})
		.loose();

	type Rdap = z.infer<typeof RdapResponse>;

	let open = $state(false);
	let loading = $state(false);
	let errorMsg = $state<string | null>(null);
	let data = $state<Rdap | null>(null);
	let raw = $state<unknown>(null);
	let showRaw = $state(false);

	const load = async () => {
		if (data) return;
		loading = true;
		errorMsg = null;
		try {
			const res = await fetch('/api/rdap');
			const text = await res.text();
			let body: unknown;
			try {
				body = JSON.parse(text);
			} catch {
				errorMsg = res.ok
					? 'Invalid JSON from RDAP service'
					: text || `Request failed (${res.status})`;
				return;
			}
			if (!res.ok) {
				const msg =
					body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
						? body.message
						: `Request failed (${res.status})`;
				errorMsg = msg;
				return;
			}
			raw = body;
			const parsed = RdapResponse.safeParse(body);
			if (!parsed.success) {
				errorMsg = 'Unexpected RDAP response shape';
				return;
			}
			data = parsed.data;
		} catch (e) {
			errorMsg = e instanceof Error ? e.message : 'Failed to load RDAP data';
		} finally {
			loading = false;
		}
	};

	const toggle = () => {
		open = !open;
		if (open) load();
	};

	const eventDate = (action: string) =>
		data?.events?.find((e) => e.eventAction === action)?.eventDate?.split('T')[0];

	const cidr = $derived.by(() => {
		const c = data?.cidr0_cidrs?.[0];
		const prefix = c?.v4prefix ?? c?.v6prefix;
		if (!c || !prefix) return undefined;
		return `${prefix}/${c.length}`;
	});

	const abuse = $derived.by(() => {
		const e = data?.entities?.find((x) => x.roles?.includes('abuse'));
		if (!e?.vcardArray) return null;
		let fn: string | undefined;
		let email: string | undefined;
		for (const f of e.vcardArray[1]) {
			const [name, , , value] = f;
			if (name === 'fn' && typeof value === 'string') fn = value;
			if (name === 'email' && typeof value === 'string') email = value;
		}
		return { fn, email };
	});
</script>

<div class="mt-2">
	<Button variant="outline" class="w-full justify-between" onclick={toggle} aria-expanded={open}>
		<span class="inline-flex items-center gap-2">
			<Globe class="size-4" />
			RDAP details
		</span>
		<ChevronDown class={open ? 'size-4 rotate-180 transition' : 'size-4 transition'} />
	</Button>

	{#if open}
		<div class="mt-2 rounded-md border p-3 text-sm">
			{#if loading}
				<div class="flex items-center justify-center py-4">
					<Loader class="size-5 animate-spin text-muted-foreground" />
				</div>
			{:else if errorMsg}
				<p class="text-destructive">{errorMsg}</p>
			{:else if data}
				<dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
					{#if data.name}
						<dt class="text-muted-foreground">Network</dt>
						<dd class="break-all">{data.name}</dd>
					{/if}
					{#if data.handle}
						<dt class="text-muted-foreground">Handle</dt>
						<dd class="break-all">{data.handle}</dd>
					{/if}
					{#if cidr}
						<dt class="text-muted-foreground">CIDR</dt>
						<dd>{cidr}</dd>
					{/if}
					{#if data.country}
						<dt class="text-muted-foreground">Country</dt>
						<dd>{data.country}</dd>
					{/if}
					{#if data.type}
						<dt class="text-muted-foreground">Type</dt>
						<dd>{data.type}</dd>
					{/if}
					{#if eventDate('registration')}
						<dt class="text-muted-foreground">Registered</dt>
						<dd>{eventDate('registration')}</dd>
					{/if}
					{#if eventDate('last changed')}
						<dt class="text-muted-foreground">Updated</dt>
						<dd>{eventDate('last changed')}</dd>
					{/if}
					{#if abuse?.email}
						<dt class="text-muted-foreground">Abuse</dt>
						<dd class="break-all">
							<a href="mailto:{abuse.email}" class="underline decoration-dotted underline-offset-4">
								{abuse.email}
							</a>
						</dd>
					{/if}
				</dl>

				<div class="mt-3">
					<Button
						variant="ghost"
						size="sm"
						class="w-full text-xs"
						onclick={() => (showRaw = !showRaw)}
						aria-expanded={showRaw}
					>
						{showRaw ? 'Hide' : 'Show'} raw JSON
					</Button>
					{#if showRaw}
						<pre class="mt-2 max-h-64 overflow-auto rounded bg-muted p-2 text-xs">{JSON.stringify(
								raw,
								null,
								2
							)}</pre>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>
