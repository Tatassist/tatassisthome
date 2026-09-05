import { CUSTOM_FIELD_KEYS } from '../lib/booking-check.mjs';
const key = process.env.KIT_API_KEY;
if (!key) throw new Error('Set KIT_API_KEY in the shell environment. Never commit it.');
for (const label of CUSTOM_FIELD_KEYS) {
  const res = await fetch('https://api.kit.com/v4/custom_fields', { method: 'POST', headers: { 'X-Kit-Api-Key': key, 'Content-Type': 'application/json' }, body: JSON.stringify({ label }), signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Custom-field setup failed for ${label}: HTTP ${res.status}`);
  const data = await res.json();
  if (data.custom_field?.key !== label) throw new Error(`Unexpected field key for ${label}. Check Kit before enabling the survey.`);
  console.log(`Ready: ${label}`);
}
console.log('Fields are ready. Configure the form confirmation email and test delivery before setting KIT_10X_DELIVERY_READY=true.');
