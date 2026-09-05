import { createHash } from 'node:crypto';
import { validatePayload, summarize, kitFields } from '../lib/booking-check.mjs';

const recent = new Map();
const response = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
export function configured(env) {
  return Boolean(env.KIT_API_KEY?.trim() && /^\d+$/.test(env.KIT_10X_FORM_ID || '') && env.KIT_10X_DELIVERY_READY === 'true');
}
export async function handle(request, { env = process.env, fetchImpl = fetch, now = Date.now } = {}) {
  if (request.method === 'GET') return response({ ready: configured(env) });
  if (request.method !== 'POST') return response({ error: 'Method not allowed.' }, 405);
  const allowedOrigins = ['https://tatassist.com', 'https://www.tatassist.com'];
  if (env.VERCEL_URL) allowedOrigins.push(`https://${env.VERCEL_URL}`);
  const origin = request.headers.get('origin');
  if (!origin || !allowedOrigins.includes(origin)) return response({ error: 'Submit from the Tatassist survey page.' }, 403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return response({ error: 'JSON is required.' }, 415);
  if (Number(request.headers.get('content-length')) > 16384) return response({ error: 'Submission is too large.' }, 413);
  if (!configured(env)) return response({ error: 'Email delivery is not connected yet. Your guide has not been sent. Please try later or contact syd@tatassist.com.', code: 'NOT_READY' }, 503);
  let payload;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 16384) return response({ error: 'Submission is too large.' }, 413);
    payload = validatePayload(JSON.parse(raw));
  } catch (error) { return response({ error: error instanceof SyntaxError ? 'Invalid submission.' : error.message }, 400); }
  // Soft per-instance abuse protection. Add a durable edge/WAF limit before substantial ad traffic.
  const ip = request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || 'unknown';
  const hash = createHash('sha256').update(ip).digest('hex');
  const time = now();
  for (const [key, entry] of recent) if (time - entry.start > 3600000) recent.delete(key);
  const attempts = recent.get(hash) || { start: time, count: 0 };
  if (attempts.count >= 6) return response({ error: 'Too many attempts. Please try again later.' }, 429);
  attempts.count += 1;
  if (recent.size < 10000 || recent.has(hash)) recent.set(hash, attempts);
  const kit = async (path, method, body) => {
    const res = await fetchImpl(`https://api.kit.com/v4/${path}`, {
      method, headers: { 'X-Kit-Api-Key': env.KIT_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error('KIT_REQUEST_FAILED');
    const data = await res.json();
    if (!data.subscriber?.id) throw new Error('KIT_INVALID_RESPONSE');
    return { status: res.status, data };
  };
  try {
    const fields = kitFields(payload, new Date(time));
    // Keep new leads unconfirmed until the confirmation/guide email is clicked.
    const created = await kit('subscribers', 'POST', { first_name: payload.contact.firstName, email_address: payload.contact.email, state: 'inactive', fields });
    const subscriber = created.data.subscriber;
    if (['cancelled', 'canceled', 'unsubscribed', 'bounced', 'complained'].includes(subscriber.state)) {
      return response({ error: 'This address cannot be enrolled automatically. Contact syd@tatassist.com for help.', code: 'CONTACT_SUPPORT' }, 409);
    }
    // The create endpoint can upsert an existing subscriber without updating custom fields.
    await kit(`subscribers/${subscriber.id}`, 'PUT', { first_name: payload.contact.firstName, fields });
    const referrer = new URL('https://tatassist.com/lp/10x-deposits');
    for (const [key, value] of Object.entries(payload.attribution)) referrer.searchParams.set(key, value);
    const enrolled = await kit(`forms/${env.KIT_10X_FORM_ID}/subscribers/${subscriber.id}`, 'POST', { referrer: referrer.href });
    // 200 means already enrolled. Do not claim that Kit sent another incentive email.
    return response({ ok: true, existing: enrolled.status === 200, emailDelivery: enrolled.status === 200 ? 'previous_request' : 'requested', review: summarize(payload.answers) });
  } catch {
    // Do not log contact data, answers, secrets, or upstream response bodies.
    return response({ error: 'We could not finish your guide request. Nothing has been unlocked. Your answers are still here so you can retry. Contact syd@tatassist.com if this continues.', code: 'PROVIDER_FAILED' }, 502);
  }
}
export default { fetch: request => handle(request) };
