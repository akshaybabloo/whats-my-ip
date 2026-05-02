import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';

const IpSchema = z.union([z.ipv4(), z.ipv6()]);

export const GET: RequestHandler = async ({ request }) => {
	const parsed = IpSchema.safeParse(request.headers.get('cf-connecting-ip'));
	if (!parsed.success) {
		throw error(400, 'No valid connecting IP available');
	}

	const upstream = await fetch(`https://rdap.org/ip/${encodeURIComponent(parsed.data)}`, {
		headers: { Accept: 'application/rdap+json' }
	});

	if (!upstream.ok) {
		throw error(upstream.status, `RDAP lookup failed (${upstream.status})`);
	}

	const data = await upstream.json();
	return json(data, {
		headers: { 'cache-control': 'public, max-age=3600' }
	});
};
