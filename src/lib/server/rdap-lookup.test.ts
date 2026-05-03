import { describe, expect, it } from 'vitest';
import { ipv4ToBigInt, ipv6ToBigInt, resolveRdapServer } from './rdap-lookup';

describe('ipv4ToBigInt', () => {
	it('converts the zero address', () => {
		expect(ipv4ToBigInt('0.0.0.0')).toBe(0n);
	});

	it('converts the broadcast address', () => {
		expect(ipv4ToBigInt('255.255.255.255')).toBe(0xffffffffn);
	});

	it('converts arbitrary addresses correctly', () => {
		expect(ipv4ToBigInt('1.2.3.4')).toBe(0x01020304n);
		expect(ipv4ToBigInt('8.8.8.8')).toBe(0x08080808n);
		expect(ipv4ToBigInt('192.168.1.1')).toBe(0xc0a80101n);
	});

	it.each([
		['1.2.3', 'too few octets'],
		['1.2.3.4.5', 'too many octets'],
		['256.0.0.1', 'octet > 255'],
		['-1.0.0.0', 'negative octet'],
		['1.2.3.a', 'non-numeric octet'],
		['1.2.3.4.', 'trailing dot'],
		['', 'empty string'],
		['1.2.3.04a', 'mixed octet']
	])('rejects %s (%s)', (ip) => {
		expect(() => ipv4ToBigInt(ip)).toThrow(/Invalid IPv4/);
	});
});

describe('ipv6ToBigInt', () => {
	it('converts the unspecified address', () => {
		expect(ipv6ToBigInt('::')).toBe(0n);
	});

	it('converts the loopback', () => {
		expect(ipv6ToBigInt('::1')).toBe(1n);
	});

	it('converts a leading-:: address', () => {
		expect(ipv6ToBigInt('::ffff')).toBe(0xffffn);
	});

	it('converts a trailing-:: address', () => {
		expect(ipv6ToBigInt('1::')).toBe(1n << 112n);
	});

	it('treats canonical and uncompressed forms as equal', () => {
		expect(ipv6ToBigInt('2001:db8::1')).toBe(
			ipv6ToBigInt('2001:0db8:0000:0000:0000:0000:0000:0001')
		);
	});

	it('handles :: in the middle', () => {
		expect(ipv6ToBigInt('2001:db8::1:2')).toBe(
			ipv6ToBigInt('2001:0db8:0000:0000:0000:0000:0001:0002')
		);
	});

	it('handles full uncompressed addresses', () => {
		const v = ipv6ToBigInt('1:2:3:4:5:6:7:8');
		expect(v).toBe(
			(1n << 112n) |
				(2n << 96n) |
				(3n << 80n) |
				(4n << 64n) |
				(5n << 48n) |
				(6n << 32n) |
				(7n << 16n) |
				8n
		);
	});

	it('treats hex case-insensitively', () => {
		expect(ipv6ToBigInt('2001:DB8::1')).toBe(ipv6ToBigInt('2001:db8::1'));
	});

	it.each([
		['1:2:3:4:5:6:7:8:9', '9 groups, no compression'],
		['1::2::3', 'multiple ::'],
		['gggg::', 'non-hex characters'],
		['10000::', 'group > 0xffff'],
		['1:2:3:4:5:6:7', '7 groups, no compression'],
		['', 'empty string'],
		[':1:2:3:4:5:6:7:8', 'leading single colon'],
		['1:2:3:4:5:6:7:8:', 'trailing single colon']
	])('rejects %s (%s)', (ip) => {
		expect(() => ipv6ToBigInt(ip)).toThrow(/Invalid IPv6/);
	});
});

describe('resolveRdapServer — IPv4', () => {
	it.each([
		['1.1.1.1', 'https://rdap.apnic.net/'],
		['1.0.0.255', 'https://rdap.apnic.net/'],
		['8.8.8.8', 'https://rdap.arin.net/registry/'],
		['4.4.4.4', 'https://rdap.arin.net/registry/'],
		['62.0.0.1', 'https://rdap.db.ripe.net/'],
		['41.0.0.1', 'https://rdap.afrinic.net/rdap/'],
		['196.10.10.10', 'https://rdap.afrinic.net/rdap/'],
		['200.0.0.1', 'https://rdap.lacnic.net/rdap/'],
		['201.255.255.255', 'https://rdap.lacnic.net/rdap/']
	])('routes %s to %s', (ip, url) => {
		expect(resolveRdapServer(ip)).toBe(url);
	});

	it('returns null for ranges not in the bootstrap (e.g. 0.0.0.0/8)', () => {
		expect(resolveRdapServer('0.1.2.3')).toBeNull();
	});

	it('matches both ends of a /8 range', () => {
		expect(resolveRdapServer('1.0.0.0')).toBe('https://rdap.apnic.net/');
		expect(resolveRdapServer('1.255.255.255')).toBe('https://rdap.apnic.net/');
	});

	it('does not match special-use ranges (loopback, private, multicast)', () => {
		expect(resolveRdapServer('127.0.0.1')).toBeNull();
		expect(resolveRdapServer('10.0.0.1')).toBeNull();
		expect(resolveRdapServer('224.0.0.1')).toBeNull();
	});
});

describe('resolveRdapServer — IPv6', () => {
	it.each([
		['2400::1', 'https://rdap.apnic.net/'],
		['2001:c00::1', 'https://rdap.apnic.net/'],
		['2600::1', 'https://rdap.arin.net/registry/'],
		['2606:4700::1', 'https://rdap.arin.net/registry/'],
		['2620::1', 'https://rdap.arin.net/registry/'],
		['2a00::1', 'https://rdap.db.ripe.net/'],
		['2003::1', 'https://rdap.db.ripe.net/'],
		['2c00::1', 'https://rdap.afrinic.net/rdap/'],
		['2001:4200::1', 'https://rdap.afrinic.net/rdap/'],
		['2800::1', 'https://rdap.lacnic.net/rdap/'],
		['2001:1200::1', 'https://rdap.lacnic.net/rdap/']
	])('routes %s to %s', (ip, url) => {
		expect(resolveRdapServer(ip)).toBe(url);
	});

	it('returns null for unallocated v6 ranges', () => {
		// fc00::/7 (unique local) isn't in any RIR's bootstrap entry.
		expect(resolveRdapServer('fc00::1')).toBeNull();
		// fe80::/10 (link-local) likewise.
		expect(resolveRdapServer('fe80::1')).toBeNull();
	});

	it('matches both edges of a /12 prefix', () => {
		// 2c00::/12 covers 2c00:: through 2c0f:ffff:ffff:ffff:ffff:ffff:ffff:ffff.
		expect(resolveRdapServer('2c00::')).toBe('https://rdap.afrinic.net/rdap/');
		expect(resolveRdapServer('2c0f:ffff:ffff:ffff:ffff:ffff:ffff:ffff')).toBe(
			'https://rdap.afrinic.net/rdap/'
		);
		// 2c10:: is one bit past the /12 boundary — not in any RIR's bootstrap.
		expect(resolveRdapServer('2c10::')).toBeNull();
	});

	it('correctly distinguishes /23 from /12 sibling ranges', () => {
		// 2001:1200::/23 is LACNIC, 2001:1400::/22 is RIPE — adjacent prefixes.
		expect(resolveRdapServer('2001:1200::1')).toBe('https://rdap.lacnic.net/rdap/');
		expect(resolveRdapServer('2001:1400::1')).toBe('https://rdap.db.ripe.net/');
	});
});

describe('resolveRdapServer — input validation', () => {
	it('throws on malformed IPv4', () => {
		expect(() => resolveRdapServer('999.0.0.1')).toThrow(/Invalid IPv4/);
	});

	it('throws on malformed IPv6', () => {
		expect(() => resolveRdapServer('1::2::3')).toThrow(/Invalid IPv6/);
	});
});
