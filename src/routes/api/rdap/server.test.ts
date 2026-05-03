import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './+server';

type Event = Parameters<typeof GET>[0];

const buildEvent = (ip?: string): Event => {
	const headers = new Headers();
	if (ip !== undefined) headers.set('cf-connecting-ip', ip);
	return { request: new Request('http://localhost/api/rdap', { headers }) } as unknown as Event;
};

const okResponse = (body: unknown) =>
	new Response(JSON.stringify(body), {
		status: 200,
		headers: { 'content-type': 'application/rdap+json' }
	});

const originalFetch = globalThis.fetch;
const originalConsoleError = console.error;

const stubFetch = (impl: typeof fetch) => {
	const mock = vi.fn(impl);
	globalThis.fetch = mock as unknown as typeof fetch;
	return mock;
};

describe('GET /api/rdap', () => {
	beforeEach(() => {
		console.error = () => {};
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		console.error = originalConsoleError;
	});

	it('returns 400 when cf-connecting-ip is missing', async () => {
		await expect(GET(buildEvent())).rejects.toMatchObject({
			status: 400,
			body: { message: 'No valid connecting IP available' }
		});
	});

	it('returns 400 when cf-connecting-ip is malformed', async () => {
		await expect(GET(buildEvent('not-an-ip'))).rejects.toMatchObject({ status: 400 });
	});

	it('returns 400 for IPv6 forms zod accepts but the lookup cannot parse (IPv4-mapped IPv6)', async () => {
		await expect(GET(buildEvent('::ffff:192.0.2.1'))).rejects.toMatchObject({
			status: 400,
			body: { message: 'Unsupported IP address format' }
		});
	});

	it('returns 404 for IPs with no RIR mapping (e.g. loopback)', async () => {
		await expect(GET(buildEvent('127.0.0.1'))).rejects.toMatchObject({
			status: 404,
			body: { message: 'No RDAP service registered for this IP range' }
		});
	});

	it('routes APNIC IPs to rdap.apnic.net and proxies the response', async () => {
		const fetchMock = stubFetch(async () =>
			okResponse({ handle: 'AS-13335', name: 'CLOUDFLARENET' })
		);

		const res = await GET(buildEvent('1.1.1.1'));

		expect(res.status).toBe(200);
		expect(res.headers.get('cache-control')).toBe('private, max-age=3600');
		expect(await res.json()).toEqual({ handle: 'AS-13335', name: 'CLOUDFLARENET' });

		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('https://rdap.apnic.net/ip/1.1.1.1');
		const headers = (init?.headers ?? {}) as Record<string, string>;
		expect(headers.Accept).toBe('application/rdap+json');
		expect(headers['User-Agent']).toMatch(/whats-my-ip/);
		expect(init?.signal).toBeInstanceOf(AbortSignal);
	});

	it('routes ARIN IPs to rdap.arin.net', async () => {
		const fetchMock = stubFetch(async () => okResponse({}));

		await GET(buildEvent('8.8.8.8'));

		expect(fetchMock.mock.calls[0][0]).toBe('https://rdap.arin.net/registry/ip/8.8.8.8');
	});

	it('URL-encodes the IP in the upstream path', async () => {
		const fetchMock = stubFetch(async () => okResponse({}));

		await GET(buildEvent('2606:4700::1'));

		expect(fetchMock.mock.calls[0][0]).toBe('https://rdap.arin.net/registry/ip/2606%3A4700%3A%3A1');
	});

	it('returns 504 when the upstream fetch times out', async () => {
		const timeoutError = new DOMException('aborted', 'TimeoutError');
		stubFetch(async () => {
			throw timeoutError;
		});

		await expect(GET(buildEvent('1.1.1.1'))).rejects.toMatchObject({
			status: 504,
			body: { message: 'RDAP lookup timed out' }
		});
	});

	it('returns 502 when the upstream fetch fails for any other reason', async () => {
		stubFetch(async () => {
			throw new TypeError('network error');
		});

		await expect(GET(buildEvent('1.1.1.1'))).rejects.toMatchObject({
			status: 502,
			body: { message: 'Upstream RDAP service error' }
		});
	});

	it('passes through non-OK upstream statuses', async () => {
		stubFetch(async () => new Response('not found', { status: 404 }));

		await expect(GET(buildEvent('1.1.1.1'))).rejects.toMatchObject({ status: 404 });
	});

	it('returns 502 when the upstream body is not valid JSON', async () => {
		stubFetch(async () => new Response('<html>oops</html>', { status: 200 }));

		await expect(GET(buildEvent('1.1.1.1'))).rejects.toMatchObject({
			status: 502,
			body: { message: 'Invalid JSON from RDAP server' }
		});
	});
});
