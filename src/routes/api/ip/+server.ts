import { json } from '@sveltejs/kit';
import { getIpInfo } from '$lib/server/get-ip-info';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request }) => {
	return json(getIpInfo(request));
};
