import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { resolveRdapServer } from '$lib/server/rdap-lookup';
import type { RequestHandler } from './$types';

const IpSchema = z.union([z.ipv4(), z.ipv6()]);

export const GET: RequestHandler = async ({ request }) => {
	const parsed = IpSchema.safeParse(request.headers.get('cf-connecting-ip'));
	if (!parsed.success) {
		throw error(400, 'No valid connecting IP available');
	}

	let base: string | null;
	try {
		base = resolveRdapServer(parsed.data);
	} catch {
		throw error(400, 'Unsupported IP address format');
	}
	if (!base) {
		throw error(404, 'No RDAP service registered for this IP range');
	}

	let upstream: Response;
	try {
		upstream = await fetch(`${base}ip/${encodeURIComponent(parsed.data)}`, {
			headers: {
				Accept: 'application/rdap+json',
				'User-Agent': 'whats-my-ip/1.0 (+https://ip.gollahalli.com)'
			},
			signal: AbortSignal.timeout(8000)
		});
	} catch (e) {
		if (e instanceof DOMException && e.name === 'TimeoutError') {
			throw error(504, 'RDAP lookup timed out');
		}
		console.error('RDAP upstream fetch failed', e);
		throw error(502, 'Upstream RDAP service error');
	}

	if (!upstream.ok) {
		throw error(upstream.status, `RDAP lookup failed (${upstream.status})`);
	}

	let data: unknown;
	try {
		data = await upstream.json();
	} catch {
		throw error(502, 'Invalid JSON from RDAP server');
	}

	return json(data, {
		headers: { 'cache-control': 'private, max-age=3600' }
	});
};
