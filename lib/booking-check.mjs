export const VERSION = 'booking-check-2026-09-04-v1';
export const DELIVERY_CONSENT = 'Send me the free guide and use my answers to prepare my booking-process review. I have read the Privacy Policy.';
export const MARKETING_CONSENT = 'Also send me tattoo-business tips and Tatassist offers. I can unsubscribe anytime.';
const options = (...pairs) => pairs.map(([value, label]) => ({ value, label }));
export const QUESTIONS = [
  { id: 'role', title: 'Which best describes you?', hint: 'Answer for your own tattooing work, even if you also run a studio.', type: 'choice', options: options(['solo', 'Independent / private-studio artist'], ['shop_artist', 'Artist working in a shop'], ['owner', 'Artist and studio owner'], ['starting', 'Apprentice / getting started']) },
  { id: 'channel', title: 'Where do most of your new inquiries start?', hint: 'Think about people asking you for a tattoo, not likes or comments.', type: 'choice', options: options(['instagram', 'Instagram DMs'], ['messages', 'Texts, Facebook, or other messages'], ['form', 'A website or inquiry form'], ['booking_app', 'A booking app'], ['mixed', 'A mix of places']) },
  { id: 'inquiries', title: 'How many new people asked you about a tattoo in the last 30 days?', hint: 'Count each person once, not each message. Exclude spam and existing-project messages. An estimate is fine.', type: 'number', label: 'New tattoo inquiries', max: 10000, unknown: "I don't know / I don't track this" },
  { id: 'deposits', title: 'Of those same people, how many have paid a deposit so far?', hint: 'Only count deposits from the inquiry group you just entered. Do not include deposits from older inquiries. Some conversations may still be open.', type: 'number', label: 'People who paid a deposit', max: 10000, unknown: "I don't know / I don't use deposits" },
  { id: 'process', title: 'Do new inquiries go through the same basic process?', hint: 'Having an app or saved replies is not quite the same as knowing what happens next.', type: 'choice', options: options(['repeatable', 'Yes, I follow a clear process consistently'], ['partial', 'I have pieces of one, but it is inconsistent'], ['improvised', 'Mostly, I figure it out as I go']) },
  { id: 'followup', title: 'When a promising client goes quiet, what usually happens?', hint: 'Choose what actually happens during a busy week.', type: 'choice', options: options(['consistent', 'I track it and follow up consistently'], ['memory', 'I follow up when I remember'], ['unsure', "I want to follow up, but don't know when or how"], ['none', 'Usually, that is the end of it']) },
  { id: 'income', title: 'Is tattooing bringing in what you want each month?', hint: 'Think of a typical recent month. Use your own tattoo revenue before expenses, not studio-wide sales. Amounts are optional, in USD.', type: 'income', options: options(['yes', 'Yes, I am where I want to be'], ['close', 'Close, but not consistently'], ['below', 'No, I am below my goal'], ['unknown', "I'm not sure / I'd rather not say"]) },
  { id: 'feeling', title: 'How does handling your bookings usually feel?', hint: 'The time and energy this takes count too.', type: 'choice', options: options(['confident', 'Clear, manageable, and under control'], ['inconsistent', 'Fine some days, frustrating on others'], ['overwhelmed', 'Draining, scattered, or overwhelming'], ['discouraged', 'Discouraging when good conversations disappear']) },
  { id: 'pain', title: 'What would you most like to change?', hint: 'Pick the biggest problem, not the answer you think you should give.', type: 'choice', options: options(['more_inquiries', 'Get more of the right inquiries'], ['price', 'Stop losing people after the price conversation'], ['deposit', 'Turn good conversations into paid deposits'], ['followup', 'Stop forgetting or chasing follow-ups'], ['consistency', 'Spend less time reinventing the process'], ['insight', 'Know what is working and what is not']) },
];
export function activeQuestions(answers) { return QUESTIONS.filter(q => q.id !== 'deposits' || answers.inquiries !== 0); }
export function validateStep(id, a) {
  const q = QUESTIONS.find(item => item.id === id);
  if (!q) return 'Unknown question.';
  if (q.options && !q.options.some(o => o.value === a[id])) return 'Choose the answer that fits you best.';
  if (q.type === 'number') {
    const n = a[id];
    if (n !== null && (!Number.isInteger(n) || n < 0 || n > q.max)) return 'Enter a whole number, or select the option below.';
    if (id === 'deposits' && a.inquiries !== null && n !== null && n > a.inquiries) return 'Deposits cannot exceed the people in this same inquiry group. Check either answer.';
  }
  if (id === 'income') for (const key of ['currentRevenue', 'targetRevenue']) {
    const n = a[key];
    if (n !== null && (!Number.isFinite(n) || n < 0 || n > 10000000)) return 'Enter a monthly amount, or leave the optional amount blank.';
  }
  return '';
}
export function validatePayload(input) {
  if (!input || typeof input !== 'object' || !input.answers || !input.contact) throw new Error('Complete the survey and contact details.');
  if (input.website) throw new Error('Submission could not be accepted.');
  const a = {};
  for (const q of QUESTIONS) a[q.id] = input.answers[q.id];
  a.currentRevenue = input.answers.currentRevenue;
  a.targetRevenue = input.answers.targetRevenue;
  if (a.inquiries === 0) a.deposits = null;
  for (const q of activeQuestions(a)) { const error = validateStep(q.id, a); if (error) throw new Error(`${q.title} ${error}`); }
  const firstName = String(input.contact.firstName || '').trim();
  const email = String(input.contact.email || '').trim().toLowerCase();
  const instagram = String(input.contact.instagram || '').trim();
  if (!firstName || firstName.length > 80 || /[<>\r\n]/.test(firstName)) throw new Error('Enter your first name.');
  if (email.length > 254 || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email)) throw new Error('Enter a valid email address.');
  if (instagram && !/^@?[a-zA-Z0-9._]{1,30}$/.test(instagram)) throw new Error('Use an Instagram handle, or leave it blank.');
  if (input.contact.deliveryConsent !== true) throw new Error('Confirm that we may email your guide and use your survey answers.');
  const attribution = {};
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
    const value = input.attribution?.[key];
    if (typeof value === 'string' && /^[a-zA-Z0-9 _.-]{1,100}$/.test(value)) attribution[key] = value;
  }
  return { answers: a, contact: { firstName, email, instagram, deliveryConsent: true, marketingConsent: input.contact.marketingConsent === true }, attribution };
}
export function summarize(a) {
  const conversion = a.inquiries > 0 && a.deposits !== null ? Math.round(a.deposits / a.inquiries * 1000) / 10 : null;
  const revenueGap = a.currentRevenue !== null && a.targetRevenue !== null ? Math.max(0, a.targetRevenue - a.currentRevenue) : null;
  let focus = 'measure';
  let title = 'Start with a clear baseline.';
  let body = 'Your answers are a starting point, not a verdict. Track inquiry outcomes before deciding whether you need more demand, a different process, or both.';
  if (a.inquiries === 0) { focus = 'demand'; title = 'There is no inquiry group to measure yet.'; body = 'You reported no new inquiries in the last 30 days. A booking process can help you prepare, but it cannot create demand on its own. It would be wrong to call this a conversion problem from these answers.'; }
  else if (a.process === 'improvised' || a.process === 'partial') { focus = 'process'; title = 'Your process is not consistent yet.'; body = 'You said the process is improvised or only partly in place. That gives you a concrete area to examine: what depends on your memory, mood, or time that day? It does not prove why any individual client went quiet.'; }
  else if (a.followup !== 'consistent') { focus = 'followup'; title = 'Follow-up depends on memory or uncertainty.'; body = 'You described a repeatable process, but follow-up is not consistent. Keeping track of open conversations is worth examining before assuming you need to replace every quiet lead.'; }
  else if (conversion === null) { focus = 'measure'; title = 'Your process has structure. Its conversion is still unclear.'; body = 'You described a consistent process and follow-up, but the inquiry-to-deposit rate is unknown. That is useful information: you need a baseline before judging where the process falls short.'; }
  else { focus = 'review'; title = 'You already have a process to review.'; body = 'You reported consistent booking and follow-up, and supplied a conversion baseline. The next question is fit, demand, project value, timing, or capacity, not automatically a complete system rebuild.'; }
  return { focus, title, body, conversion, revenueGap };
}
export function kitFields(payload, now = new Date()) {
  const a = payload.answers; const s = summarize(a);
  return {
    ta_role: a.role, ta_channel: a.channel,
    ta_inquiries_30d: a.inquiries === null ? 'unknown' : String(a.inquiries),
    ta_deposits_from_inquiries: a.deposits === null ? 'unknown_or_not_applicable' : String(a.deposits),
    ta_conversion_percent: s.conversion === null ? 'unknown' : String(s.conversion),
    ta_process: a.process, ta_followup: a.followup, ta_income_satisfaction: a.income,
    ta_current_monthly_revenue: a.currentRevenue === null ? 'not_provided' : String(a.currentRevenue),
    ta_target_monthly_revenue: a.targetRevenue === null ? 'not_provided' : String(a.targetRevenue),
    ta_feeling: a.feeling, ta_primary_pain: a.pain, ta_review_focus: s.focus,
    ta_instagram: payload.contact.instagram,
    ta_marketing_consent: payload.contact.marketingConsent ? 'yes' : 'no',
    ta_consent_version: VERSION, ta_submitted_at: now.toISOString(),
    ta_attribution: JSON.stringify(payload.attribution),
    ta_survey_answers: JSON.stringify(a),
  };
}
export const CUSTOM_FIELD_KEYS = Object.keys(kitFields({ answers: { inquiries: null, deposits: null, currentRevenue: null, targetRevenue: null }, contact: {}, attribution: {} }));
