export const QUIZ_VERSION = 'booked-artist-quiz-2026-09-16-five';
export const RESULT_KEY = 'tatassist-booking-match-v1';
export const MARKETING_LABEL = 'Email me practical booking tips and offers from Tatassist.';
export const SALES_INTRO = 'Maybe you need more bookings. Maybe you’re booked with small pieces while the work you want stays in your sketchbook. Build a client process around the tattoo career you want.';
const choices = (...pairs) => pairs.map(([value, label]) => ({ value, label }));
export const QUESTIONS = [
  { id:'goal', label:'Your goal', title:'What do you want more of?', options:choices(['bookings','Booked clients'],['projects','Higher-value projects'],['time','Time to draw and tattoo'],['income','Steady monthly income']) },
  { id:'revenue', label:'Your monthly goal', title:'What do you want tattooing to bring in each month?', hint:'Your own tattoo revenue, before expenses.', options:choices(['under_5k','Under $5,000'],['5k_10k','$5,000–$10,000'],['10k_20k','$10,000–$20,000'],['over_20k','Over $20,000'],['skip','I’d rather skip this one']) },
  { id:'projectValue', label:'Your projects', title:'What is a typical project worth to you?', hint:'The whole tattoo, including all sessions.', options:choices(['under_500','Under $500'],['500_1500','$500–$1,500'],['1500_3000','$1,500–$3,000'],['over_3000','Over $3,000'],['starting','I’m still getting started']) },
  { id:'inquiries', label:'Your inbox', title:'How many new tattoo inquiries do you get in a month?', options:choices(['0_10','Up to 10'],['11_30','11–30'],['31_60','31–60'],['over_60','More than 60'],['unknown','I’m not tracking that yet']) },
  { id:'bottleneck', label:'Where it stalls', title:'Where do client conversations get stuck?', options:choices(['details','Getting the idea, photos, and project details together'],['fit','Figuring out which projects fit the work I want to do'],['price','After I send the estimate'],['pause','When they need time or go quiet'],['scattered','It’s scattered from the first message']) },
];
export const EDITIONS = {
  essentials: { name:'Essentials', price:27, count:6, description:'Give your inquiry and consultation decisions a starting point. Six core tools plus guides, from gathering details through the project summary, to adapt to your work.' },
  working: { name:'Working System', price:47, count:13, description:'Understand the project, recognize fit, and make the next step clear. Practical frameworks and 13 numbered tools for consultations, changes, pauses, and deposit confirmation. Adapt them to your clients and goals.' },
  complete: { name:'Complete System', price:77, count:22, description:'Build a deeper process for the custom work you want to be known for. Everything in Working, plus tools for creative freedom, replies, consultation notes, body maps, estimates, closing, and follow-up. Adapt the full inquiry-to-deposit workflow to your practice.' },
};
export function validateAnswer(id, value) {
  return QUESTIONS.find(q => q.id === id)?.options.some(o => o.value === value) ? '' : 'Choose the answer that fits you best.';
}
export function validateAnswers(input) {
  if (!input || typeof input !== 'object') throw new Error('Answer the five questions first.');
  const answers = {};
  for (const q of QUESTIONS) {
    if (validateAnswer(q.id, input[q.id])) throw new Error(`Choose an answer for ${q.label.toLowerCase()}.`);
    answers[q.id] = input[q.id];
  }
  return answers;
}
export function recommend(input) {
  const a = validateAnswers(input);
  const largerWorkflow = a.projectValue === 'over_3000' && ['31_60','over_60'].includes(a.inquiries) && ['price','pause','scattered'].includes(a.bottleneck);
  const tierId = largerWorkflow ? 'complete' : 'working';
  const goal = {bookings:'more booked clients',projects:'higher-value projects',time:'more time to draw and tattoo',income:'steadier monthly income'}[a.goal];
  const pain = {details:'getting the project details together',fit:'deciding which projects fit',price:'the estimate conversation',pause:'clients who pause or go quiet',scattered:'a process scattered across messages'}[a.bottleneck];
  const reason = tierId === 'complete'
    ? 'Your answers describe larger projects and a higher inquiry volume. Complete adds depth for creative direction, estimates, consultation close, and follow-up. Use the parts that fit your practice.'
    : 'Working gives you a practical starting point for your goals: understand the inquiry, prepare for the consultation, and handle changes and pauses. You can adapt the questions and use a shorter path for straightforward work.';
  return { tierId, goal, pain, intro:`You want ${goal}. You identified ${pain} as a sticking point. Build a client process around where you want to go.`, reason, ...EDITIONS[tierId] };
}
export function validateContact(input) {
  const c = input || {};
  const firstName = String(c.firstName || '').trim();
  const lastName = String(c.lastName || '').trim();
  for (const [name, value] of [['first',firstName],['last',lastName]]) {
    if (!value || value.length > 80 || /[<>\r\n\u0000-\u001f]/.test(value)) throw new Error(`Enter your ${name} name.`);
  }
  const email = String(c.email || '').trim().toLowerCase();
  if (email.length > 254 || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(email)) throw new Error('Enter a valid email address.');
  return {firstName,lastName,email,marketingConsent:c.marketingConsent === true};
}
export function validatePayload(input) {
  if (!input || input.website) throw new Error('Your request could not be accepted.');
  const answers = validateAnswers(input.answers);
  const contact = validateContact(input.contact);
  const attribution = {};
  for (const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term']) {
    const value = input.attribution?.[key];
    if (typeof value === 'string' && /^[a-zA-Z0-9 _.-]{1,100}$/.test(value)) attribution[key] = value;
  }
  return { answers,contact,attribution };
}
export function kitFields(payload, now = new Date()) {
  const r = recommend(payload.answers);
  return {
    bas_last_name:payload.contact.lastName,
    ...Object.fromEntries(Object.entries(payload.answers).map(([key,value]) => [`bas_${key.replace(/[A-Z]/g, c => "_" + c.toLowerCase())}`,value])),
    bas_recommended_tier:r.tierId, bas_edition_name:r.name, bas_edition_price:String(r.price), bas_edition_count:String(r.count),
    bas_goal_phrase:r.goal, bas_recommendation_reason:r.reason,
    bas_result_url:`https://tatassist.com/lp/booked-artist?edition=${r.tierId}`,
    bas_marketing_consent:payload.contact.marketingConsent ? 'yes':'no',
    bas_quiz_version:QUIZ_VERSION, bas_submitted_at:now.toISOString(), bas_attribution:JSON.stringify(payload.attribution),
  };
}
export const CUSTOM_FIELD_KEYS = ['bas_last_name',...QUESTIONS.map(q => `bas_${q.id.replace(/[A-Z]/g, c => "_" + c.toLowerCase())}`),'bas_recommended_tier','bas_edition_name','bas_edition_price','bas_edition_count','bas_goal_phrase','bas_recommendation_reason','bas_result_url','bas_marketing_consent','bas_quiz_version','bas_submitted_at','bas_attribution'];
export function makeResult(answers, now = Date.now()) { return {version:QUIZ_VERSION, answers:validateAnswers(answers), completedAt:now}; }
export function readResult(value, now = Date.now()) {
  try {
    const r = typeof value === 'string' ? JSON.parse(value) : value;
    if (r?.version !== QUIZ_VERSION || !Number.isFinite(r.completedAt) || now - r.completedAt > 2 * 60 * 60 * 1000 || r.completedAt > now) return null;
    return {...recommend(r.answers),answers:validateAnswers(r.answers)};
  } catch { return null; }
}
