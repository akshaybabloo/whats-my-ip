import { getCountryData, type ICountryData, type TCountryCode } from 'countries-list';

export interface IpInfo {
	ip: string;
	country: string;
	info: ICountryData | string;
}

export function getIpInfo(request: Request): IpInfo {
	const ip = request.headers.get('cf-connecting-ip') ?? 'Unable to get IP';
	const countryCode = request.headers.get('cf-ipcountry');

	let country: string;
	let info: ICountryData | string;

	if (countryCode) {
		try {
			const data = getCountryData(countryCode as TCountryCode);
			if (data.name) {
				country = data.name;
				info = data;
			} else {
				country = 'Unable to get country';
				info = 'Unable to get country';
			}
		} catch {
			country = 'Unable to get country';
			info = 'Unable to get country';
		}
	} else {
		country = 'Unable to get country';
		info = 'Unable to get country';
	}

	return { ip, country, info };
}
