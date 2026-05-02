import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';

const IpSchema = z.union([z.ipv4(), z.ipv6()]);

export const GET: RequestHandler = async ({ request }) => {
	const parsed = IpSchema.safeParse(request.headers.get('cf-connecting-ip'));
	if (!parsed.success) {
		throw error(400, 'No valid connecting IP available');
	}

	let upstream: Response;
	try {
		upstream = await fetch(`https://rdap.org/ip/${encodeURIComponent(parsed.data)}`, {
			headers: { Accept: 'application/rdap+json' },
			signal: AbortSignal.timeout(5000)
		});
	} catch (e) {
		if (e instanceof DOMException && e.name === 'TimeoutError') {
			throw error(504, 'RDAP lookup timed out');
		}
		throw e;
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
		headers: { 'cache-control': 'public, max-age=3600' }
	});
};
