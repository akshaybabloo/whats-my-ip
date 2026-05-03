import { RDAP_BOOTSTRAP_V4, RDAP_BOOTSTRAP_V6, type RdapBootstrap } from './rdap-bootstrap';

const IPV4_OCTET = /^\d{1,3}$/;

export const ipv4ToBigInt = (ip: string): bigint => {
	const parts = ip.split('.');
	if (parts.length !== 4) throw new Error(`Invalid IPv4: ${ip}`);
	let result = 0n;
	for (const p of parts) {
		if (!IPV4_OCTET.test(p)) throw new Error(`Invalid IPv4: ${ip}`);
		const n = parseInt(p, 10);
		if (n > 255) throw new Error(`Invalid IPv4: ${ip}`);
		result = (result << 8n) | BigInt(n);
	}
	return result;
};

const IPV6_HEXTET = /^[0-9A-Fa-f]{1,4}$/;

export const ipv6ToBigInt = (ip: string): bigint => {
	const sides = ip.split('::');
	if (sides.length > 2) throw new Error(`Invalid IPv6: ${ip}`);
	const left = sides[0] ? sides[0].split(':') : [];
	const right = sides.length === 2 && sides[1] ? sides[1].split(':') : [];
	const missing = 8 - left.length - right.length;
	if (missing < 0) throw new Error(`Invalid IPv6: ${ip}`);
	const groups = sides.length === 2 ? [...left, ...Array(missing).fill('0'), ...right] : left;
	if (groups.length !== 8) throw new Error(`Invalid IPv6: ${ip}`);
	let result = 0n;
	for (const g of groups) {
		if (!IPV6_HEXTET.test(g)) throw new Error(`Invalid IPv6: ${ip}`);
		result = (result << 16n) | BigInt(parseInt(g, 16));
	}
	return result;
};

const inRange = (ipInt: bigint, range: string, totalBits: number, isV6: boolean): boolean => {
	const [base, lenStr] = range.split('/');
	const len = Number(lenStr);
	if (!Number.isInteger(len) || len < 0 || len > totalBits) return false;
	const baseInt = isV6 ? ipv6ToBigInt(base) : ipv4ToBigInt(base);
	if (len === 0) return true;
	const shift = BigInt(totalBits - len);
	return ipInt >> shift === baseInt >> shift;
};

const resolve = (ip: string, bootstrap: RdapBootstrap, isV6: boolean): string | null => {
	const ipInt = isV6 ? ipv6ToBigInt(ip) : ipv4ToBigInt(ip);
	const totalBits = isV6 ? 128 : 32;
	for (const service of bootstrap.services) {
		for (const range of service.ranges) {
			if (inRange(ipInt, range, totalBits, isV6)) return service.url;
		}
	}
	return null;
};

export const resolveRdapServer = (ip: string): string | null => {
	const isV6 = ip.includes(':');
	return resolve(ip, isV6 ? RDAP_BOOTSTRAP_V6 : RDAP_BOOTSTRAP_V4, isV6);
};
