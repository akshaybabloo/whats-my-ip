<script lang="ts">
	import { onMount } from 'svelte';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import Loader from '@lucide/svelte/icons/loader-circle';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import Heart from '@lucide/svelte/icons/heart';
	import RdapDetails from '$lib/components/rdap-details.svelte';
	import type { IpInfo } from '$lib/server/get-ip-info';

	let { data }: { data: IpInfo } = $props();

	let refreshed = $state<IpInfo | null>(null);
	let loading = $state(false);
	let isDark = $state(false);

	const ipData = $derived(loading ? undefined : (refreshed ?? data));

	const setTheme = (dark: boolean) => {
		const root = document.documentElement;
		if (dark) root.classList.add('dark');
		else root.classList.remove('dark');
		localStorage.setItem('theme', dark ? 'dark' : 'light');
	};

	const toggleTheme = () => {
		isDark = !isDark;
		setTheme(isDark);
	};

	const refresh = async () => {
		loading = true;
		try {
			const res = await fetch('/api/ip');
			refreshed = await res.json();
		} finally {
			loading = false;
		}
	};

	onMount(() => {
		isDark = document.documentElement.classList.contains('dark');

		try {
			(window.adsbygoogle = window.adsbygoogle || []).push({});
		} catch (e) {
			console.error('AdSense error:', e);
		}
	});
</script>

<main class="flex min-h-screen flex-col items-center justify-center bg-background p-4">
	<Card class="w-96">
		<CardContent>
			<div class="flex items-center justify-between">
				<img src="/logo.png" alt="Logo" class="h-10 w-10" />
				<Button variant="ghost" size="icon" onclick={toggleTheme} aria-label="Toggle theme">
					{#if isDark}
						<Moon class="size-5" />
					{:else}
						<Sun class="size-5" />
					{/if}
				</Button>
			</div>

			<ul
				class="mt-6 flex flex-col gap-1 text-center text-3xl font-extrabold"
				aria-live="polite"
				aria-busy={!ipData}
			>
				{#if !ipData}
					<li>
						<Loader
							class="mx-auto size-7 animate-spin text-muted-foreground"
							role="status"
							aria-label="Loading IP address"
						/>
					</li>
				{:else}
					<li class={ipData.ip.includes(':') ? 'text-xl break-all' : ''}>{ipData.ip}</li>
					<li>{ipData.country}</li>
				{/if}
			</ul>

			<div class="mt-6">
				<Button class="w-full" onclick={refresh} disabled={loading}>
					<RefreshCw class={loading ? 'size-4 animate-spin' : 'size-4'} />
					Refresh
				</Button>
			</div>

			<RdapDetails />
		</CardContent>
	</Card>

	<div class="mt-4 w-96 max-w-full">
		<ins
			class="adsbygoogle"
			style="display: block"
			data-ad-client="ca-pub-7450383714878520"
			data-ad-slot="5212548826"
			data-ad-format="auto"
			data-full-width-responsive="true"
		></ins>
	</div>
</main>

<footer class="fixed right-0 bottom-2 left-0 text-center text-sm text-muted-foreground">
	<p class="inline-flex items-center gap-1">
		Made with
		<Heart class="size-4 fill-red-600 text-red-600" />
		by
		<a
			href="https://gollahalli.com"
			class="underline decoration-dotted underline-offset-4 transition hover:opacity-80"
		>
			Akshay Raj Gollahalli
		</a>
	</p>
</footer>
