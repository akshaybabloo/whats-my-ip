import { describe, expect, it } from 'vitest';
import { getIpInfo } from './get-ip-info';

const buildRequest = (headers: Record<string, string>): Request =>
	new Request('http://localhost/api/ip', { headers });

describe('getIpInfo', () => {
	it('returns the connecting IP and resolved country when both headers are present', () => {
		const info = getIpInfo(buildRequest({ 'cf-connecting-ip': '1.2.3.4', 'cf-ipcountry': 'NZ' }));
		expect(info.ip).toBe('1.2.3.4');
		expect(info.country).toBe('New Zealand');
		expect(typeof info.info).toBe('object');
	});

	it('returns the documented fallback string when cf-connecting-ip is missing', () => {
		const info = getIpInfo(buildRequest({ 'cf-ipcountry': 'NZ' }));
		expect(info.ip).toBe('Unable to get IP');
	});

	it('returns the documented fallback strings when cf-ipcountry is missing', () => {
		const info = getIpInfo(buildRequest({ 'cf-connecting-ip': '1.2.3.4' }));
		expect(info.country).toBe('Unable to get country');
		expect(info.info).toBe('Unable to get country');
	});

	it('falls back gracefully when cf-ipcountry is an unknown code', () => {
		const info = getIpInfo(buildRequest({ 'cf-connecting-ip': '1.2.3.4', 'cf-ipcountry': 'XX' }));
		expect(info.country).toBe('Unable to get country');
		expect(info.info).toBe('Unable to get country');
	});

	it('handles IPv6 addresses transparently', () => {
		const info = getIpInfo(
			buildRequest({ 'cf-connecting-ip': '2606:4700::1', 'cf-ipcountry': 'US' })
		);
		expect(info.ip).toBe('2606:4700::1');
		expect(info.country).toBe('United States');
	});
});
