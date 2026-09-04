const DEFAULT_LEAD_EMAIL = 'support@tatassist.com';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BODY_BYTES = 24_000;

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
    const body = parseBody(request);

    if (cleanText(body.website, 200)) return response.status(200).json({ ok: true });

    const submission = buildSubmission(body);
    if (!submission.name || !EMAIL_PATTERN.test(submission.email)) {
      return response.status(400).json({ ok: false, message: 'Enter a valid first name and email address.' });
    }

    const elapsedMs = Number(body.elapsedMs);
    if (Number.isFinite(elapsedMs) && elapsedMs > 0 && elapsedMs < 1200) {
      return response.status(400).json({ ok: false, message: 'Please wait a moment and try again.' });
    }

    const destination = cleanText(process.env.BEFORE_YOU_QUOTE_LEAD_EMAIL || DEFAULT_LEAD_EMAIL, 160);
    if (!EMAIL_PATTERN.test(destination)) throw new Error('Lead destination is not a valid email address');

    const upstream = await fetch(`https://formsubmit.co/ajax/${destination}`, {
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
