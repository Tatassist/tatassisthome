import { createHash } from 'node:crypto';

const DEFAULT_LEAD_EMAIL = 'support@tatassist.com';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BODY_BYTES = 24_000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_STORE = globalThis.__beforeYouQuoteRateLimitStore || new Map();
globalThis.__beforeYouQuoteRateLimitStore = RATE_LIMIT_STORE;

const cleanText = (value, maxLength = 240) => {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, maxLength);
};

const parseBody = (request) => {
  if (request.body && typeof request.body === 'object') return request.body;
  if (typeof request.body === 'string') {
    if (Buffer.byteLength(request.body, 'utf8') > MAX_BODY_BYTES) throw new Error('Payload too large');
    return JSON.parse(request.body);
  }
  return {};
};

const getClientIp = (request) => {
  const forwarded = request.headers['x-forwarded-for'];
  const raw = Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded || request.headers['x-real-ip'] || request.socket?.remoteAddress || 'unknown';
  return String(raw).split(',')[0].trim().slice(0, 96);
};

const getRateLimitKey = (request) => {
  const ip = getClientIp(request);
  return createHash('sha256').update(ip).digest('hex');
};

const enforceRateLimit = (request, response) => {
  const now = Date.now();
  const key = getRateLimitKey(request);

  if (RATE_LIMIT_STORE.size > 1_000) {
    for (const [storedKey, entry] of RATE_LIMIT_STORE.entries()) {
      if (!entry || entry.resetAt <= now) RATE_LIMIT_STORE.delete(storedKey);
    }
  }

  const current = RATE_LIMIT_STORE.get(key);
  if (!current || current.resetAt <= now) {
    RATE_LIMIT_STORE.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    response.setHeader('Retry-After', String(retryAfter));
    return false;
  }

  current.count += 1;
  RATE_LIMIT_STORE.set(key, current);
  return true;
};

const isSameOriginRequest = (request) => {
  const origin = cleanText(request.headers.origin, 300);
  if (!origin) return true;

  const forwardedHost = cleanText(request.headers['x-forwarded-host'], 240);
  const host = forwardedHost || cleanText(request.headers.host, 240);
  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
};

const buildSubmission = (body) => {
  const answers = body.answers && typeof body.answers === 'object' ? body.answers : {};
  const attribution = body.attribution && typeof body.attribution === 'object' ? body.attribution : {};
  return {
    name: cleanText(body.firstName, 80),
    email: cleanText(body.email, 160),
    lead_magnet: 'Before You Quote',
    survey_completed: body.skipped ? 'No — guide requested directly' : 'Yes',
    quote_outcome: cleanText(answers.quote_outcome),
    price_timing: cleanText(answers.price_timing),
    inquiry_process: cleanText(answers.inquiry_process),
    biggest_cost: cleanText(answers.biggest_cost),
    utm_source: cleanText(attribution.utm_source, 120),
    utm_medium: cleanText(attribution.utm_medium, 120),
    utm_campaign: cleanText(attribution.utm_campaign, 160),
    utm_content: cleanText(attribution.utm_content, 160),
    utm_term: cleanText(attribution.utm_term, 160),
    gclid: cleanText(attribution.gclid, 240),
    fbclid: cleanText(attribution.fbclid, 240),
    msclkid: cleanText(attribution.msclkid, 240),
    landing_url: cleanText(attribution.landing_url, 500),
    referrer: cleanText(attribution.referrer, 500),
    submitted_at_utc: new Date().toISOString(),
    _subject: 'New Before You Quote lead',
    _template: 'table',
    _captcha: 'false',
  };
};

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ ok: false, message: 'Method not allowed.' });
  }

  try {
    const declaredLength = Number(request.headers['content-length']);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
      return response.status(413).json({ ok: false, message: 'Submission is too large.' });
    }

    if (!isSameOriginRequest(request)) {
      return response.status(403).json({ ok: false, message: 'Request origin is not allowed.' });
    }

    if (!enforceRateLimit(request, response)) {
      return response.status(429).json({ ok: false, message: 'Too many requests. Please wait a few minutes and try again.' });
    }

    const body = parseBody(request);

    if (cleanText(body.website, 200)) return response.status(200).json({ ok: true });

    const submission = buildSubmission(body);
    if (!submission.name || !EMAIL_PATTERN.test(submission.email)) {
      return response.status(400).json({ ok: false, message: 'Enter a valid first name and email address.' });
    }

    const destination = cleanText(process.env.BEFORE_YOU_QUOTE_LEAD_EMAIL || DEFAULT_LEAD_EMAIL, 160);
    if (!EMAIL_PATTERN.test(destination)) throw new Error('Lead destination is not a valid email address');

    const upstream = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(destination)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'Tatassist-Before-You-Quote/1.0',
      },
      body: JSON.stringify(submission),
    });

    const upstreamData = await upstream.json().catch(() => ({}));
    if (!upstream.ok || upstreamData?.success === 'false' || upstreamData?.success === false) {
      console.error('Before You Quote lead delivery failed', {
        status: upstream.status,
        message: upstreamData?.message || 'Unknown upstream error',
      });
      return response.status(502).json({ ok: false, message: 'We could not save your information. Please try again.' });
    }

    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error('Before You Quote lead endpoint error', error);
    return response.status(500).json({ ok: false, message: 'We could not save your information. Please try again.' });
  }
}
