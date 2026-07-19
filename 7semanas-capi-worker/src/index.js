const PIXEL_ID = '1027488963474619';
const META_CAPI_URL = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`;

const ALLOWED_ORIGINS = [
	'https://clubmentesmaestras.online',
	'https://www.clubmentesmaestras.online',
	'http://127.0.0.1:5500',
	'http://localhost:5500',
	'http://localhost:8000',
	'http://localhost:3000',
];

export default {
	async fetch(request, env) {
		const origin = request.headers.get('Origin') || '';

		// CORS preflight
		if (request.method === 'OPTIONS') {
			return corsResponse(null, 204, origin);
		}

		// Solo aceptamos POST
		if (request.method !== 'POST') {
			return corsResponse(JSON.stringify({ error: 'Method not allowed' }), 405, origin);
		}

		// Validar origen
		if (!ALLOWED_ORIGINS.includes(origin)) {
			return corsResponse(JSON.stringify({ error: 'Origin not allowed' }), 403, origin);
		}

		try {
			const body = await request.json();
			const { event_name, event_id, event_data } = body;

			if (!event_name) {
				return corsResponse(JSON.stringify({ error: 'event_name is required' }), 400, origin);
			}

			const payload = {
				data: [
					{
						event_name,
						event_time: Math.floor(Date.now() / 1000),
						event_id: event_id || generateEventId(),
						event_source_url: event_data?.page_url || '',
						action_source: 'website',
						user_data: {
							client_ip_address: request.headers.get('CF-Connecting-IP') || '',
							client_user_agent: request.headers.get('User-Agent') || '',
							fbc: event_data?.fbc || '',
							fbp: event_data?.fbp || '',
							em: event_data?.em || '',
							ph: event_data?.ph || '',
							fn: event_data?.fn || '',
							ln: event_data?.ln || '',
						},
						custom_data: event_data?.custom_data || {},
					},
				],
			};

			const metaResponse = await fetch(META_CAPI_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${env.META_ACCESS_TOKEN}`,
				},
				body: JSON.stringify(payload),
			});

			const metaResult = await metaResponse.json();

			console.log(`[CAPI] Evento: ${event_name} | Estado: ${metaResponse.status} | ID: ${event_id}`);

			if (!metaResponse.ok) {
				console.error('[CAPI] Error de Meta:', JSON.stringify(metaResult));
				return corsResponse(JSON.stringify({ error: 'Meta API error', details: metaResult }), 500, origin);
			}

			return corsResponse(JSON.stringify({ success: true, event_name, event_id }), 200, origin);
		} catch (err) {
			console.error('[CAPI] Error interno:', err.message);
			return corsResponse(JSON.stringify({ error: 'Internal error' }), 500, origin);
		}
	},
};

function generateEventId() {
	return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function corsResponse(body, status, origin) {
	const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

	return new Response(body, {
		status,
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': allowedOrigin,
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		},
	});
}
