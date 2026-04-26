import { getIpInfo } from '$lib/server/get-ip-info';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ request }) => {
	return getIpInfo(request);
};
