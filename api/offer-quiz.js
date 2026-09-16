import { createHash } from 'node:crypto';
import { validatePayload, recommend, kitFields } from '../lib/offer-quiz.mjs';
const recent = new Map();
const reply = (data,status=200) => Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export function configured(env) {
  return Boolean(env.KIT_API_KEY?.trim() && /^\d+$/.test(env.KIT_BOOKING_FORM_ID || '') && /^\d+$/.test(env.KIT_BOOKING_NURTURE_FORM_ID || '') && env.KIT_BOOKING_DELIVERY_READY === 'true');
}
export async function handle(request,{env=process.env,fetchImpl=fetch,now=Date.now}={}) {
  if (request.method === 'GET') return reply({ready:configured(env)});
  if (request.method !== 'POST') return reply({error:'Method not allowed.'},405);
  const origins = ['https://tatassist.com','https://www.tatassist.com'];
  if (env.VERCEL_URL) origins.push(`https://${env.VERCEL_URL}`);
  if (!origins.includes(request.headers.get('origin'))) return reply({error:'Send your request from the Tatassist quiz.'},403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return reply({error:'Invalid request format.'},415);
  if (Number(request.headers.get('content-length')) > 12000) return reply({error:'Request is too large.'},413);
  if (!configured(env)) return reply({error:'Guide requests are not open yet. Please try again later or email syd@tatassist.com.',code:'NOT_READY'},503);
  let payload;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 12000) return reply({error:'Request is too large.'},413);
    payload = validatePayload(JSON.parse(raw));
  } catch(error) { return reply({error:error instanceof SyntaxError ? 'Check your answers and try again.' : error.message},400); }
  const time = now();
  const ip = request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || 'unknown';
  const hash = createHash('sha256').update(ip).digest('hex');
  for (const [key,entry] of recent) if (time-entry.start > 3600000) recent.delete(key);
  const attempts = recent.get(hash) || {start:time,count:0};
  if (attempts.count >= 6) return reply({error:'Too many requests. Try again later.'},429);
  attempts.count++;
  if (recent.size < 10000 || recent.has(hash)) recent.set(hash,attempts);
  async function kit(path,method,body) {
    const response = await fetchImpl(`https://api.kit.com/v4/${path}`,{method,headers:{'X-Kit-Api-Key':env.KIT_API_KEY,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(8000)});
    if (!response.ok) throw new Error('Provider request failed');
    const data = await response.json();
    if (!Number.isSafeInteger(data.subscriber?.id) || data.subscriber.id <= 0) throw new Error('Invalid provider response');
    return {status:response.status,data};
  }
  try {
    const fields = kitFields(payload,new Date(time));
    const created = await kit('subscribers','POST',{first_name:payload.contact.firstName,email_address:payload.contact.email,state:'inactive',fields});
    const subscriber = created.data.subscriber;
    if (['cancelled','canceled','unsubscribed','bounced','complained'].includes(subscriber.state)) return reply({error:'Email syd@tatassist.com and we’ll help you get the guide.',code:'CONTACT_SUPPORT'},409);
    await kit(`subscribers/${subscriber.id}`,'PUT',{first_name:payload.contact.firstName,fields});
    const referrer = new URL('https://tatassist.com/lp/before-you-quote');
    for (const [key,value] of Object.entries(payload.attribution)) referrer.searchParams.set(key,value);
    const form = payload.contact.marketingConsent ? env.KIT_BOOKING_NURTURE_FORM_ID : env.KIT_BOOKING_FORM_ID;
    const enrolled = await kit(`forms/${form}/subscribers/${subscriber.id}`,'POST',{referrer:referrer.href});
    return reply({ok:true,emailDelivery:enrolled.status === 200 ? 'previous_request':'requested',recommendation:recommend(payload.answers),guideUrl:'/lead-magnet/before-you-quote.pdf'});
  } catch { return reply({error:'Your request didn’t go through. Your answers are still here. Please try again.',code:'PROVIDER_FAILED'},502); }
}
export default {fetch:request => handle(request)};
