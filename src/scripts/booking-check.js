import { VERSION, DELIVERY_CONSENT, MARKETING_CONSENT, activeQuestions, validateStep, summarize } from '../../lib/booking-check.mjs';
const $ = id => document.getElementById(id);
const answers = { currentRevenue: null, targetRevenue: null };
const contact = { firstName: '', email: '', instagram: '', deliveryConsent: false, marketingConsent: false };
let index = 0;
let busy = false;
let completed = false;
let deliveryReady = false;
const attribution = {};
for (const [key, value] of new URLSearchParams(location.search)) {
  if (['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].includes(key) && /^[a-zA-Z0-9 _.-]{1,100}$/.test(value)) attribution[key] = value;
}
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const track = (event, extra = {}) => window.tatassistTrack?.({ event, survey_version: VERSION, ...extra });
const showError = message => { $('bc-error').textContent = message; $('bc-error').hidden = !message; };
const currency = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
function question() { return activeQuestions(answers)[index]; }
function choices(q) {
  return `<fieldset class="bc-options" aria-labelledby="bc-question-title">${q.options.map(o => `<label class="bc-option"><input type="radio" name="${q.id}" value="${o.value}" ${answers[q.id] === o.value ? 'checked' : ''}/><span>${escape(o.label)}</span></label>`).join('')}</fieldset>`;
}
function read() {
  const q = question();
  if (!q) {
    for (const key of ['firstName', 'email', 'instagram']) contact[key] = $(key).value.trim();
    contact.deliveryConsent = $('deliveryConsent').checked;
    contact.marketingConsent = $('marketingConsent').checked;
    return;
  }
  if (q.options) answers[q.id] = document.querySelector(`input[name="${q.id}"]:checked`)?.value;
  if (q.type === 'number') answers[q.id] = $('bc-unknown').checked ? null : ($('bc-number').value.trim() === '' ? undefined : Number($('bc-number').value));
  if (q.type === 'income') for (const key of ['currentRevenue', 'targetRevenue']) answers[key] = $(key).value.trim() === '' ? null : Number($(key).value);
  if (answers.inquiries === 0) answers.deposits = null;
}
function render(focus = true) {
  const qs = activeQuestions(answers); const q = qs[index];
  $('bc-progress-text').textContent = q ? `Question ${index + 1} of ${qs.length + 1}` : `Final step of ${qs.length + 1}`;
  $('bc-progress').max = qs.length + 1; $('bc-progress').value = index;
  $('bc-next').textContent = q ? 'Continue →' : 'Email my guide + show my review';
  $('bc-back').textContent = index ? 'Back' : 'Introduction';
  showError('');
  const s = summarize(answers);
  const insight = $('bc-insight'); insight.hidden = true;
  if (q?.id === 'process' && s.conversion !== null) {
    insight.textContent = `${answers.deposits} of ${answers.inquiries} recent inquiries have paid a deposit so far: ${s.conversion}%. The others may still be deciding. This is your reported baseline, not an industry comparison.`; insight.hidden = false;
  } else if (q?.id === 'process' && answers.inquiries !== 0) {
    insight.textContent = "Not knowing your conversion rate is useful information too. Without tracking it, it is hard to tell a lead problem from a booking problem."; insight.hidden = false;
  }
  if (q) {
    let inputs = '';
    if (q.options) inputs = choices(q);
    if (q.type === 'number') inputs = `<div class="bc-number"><label class="bc-number-label" for="bc-number">${q.label}</label><input id="bc-number" class="bc-input" type="number" inputmode="numeric" min="0" max="${q.max}" step="1" value="${answers[q.id] ?? ''}" ${answers[q.id] === null ? 'disabled' : ''}/><label class="bc-unknown"><input id="bc-unknown" type="checkbox" ${answers[q.id] === null ? 'checked' : ''}/><span>${q.unknown}</span></label></div>`;
    if (q.type === 'income') inputs += `<div class="bc-money-fields"><div><label class="bc-field" for="currentRevenue">Usual monthly revenue <span class="bc-optional">(optional)</span></label><input class="bc-input" id="currentRevenue" type="number" inputmode="decimal" min="0" max="10000000" step="any" placeholder="USD per month" value="${answers.currentRevenue ?? ''}"/></div><div><label class="bc-field" for="targetRevenue">Monthly goal <span class="bc-optional">(optional)</span></label><input class="bc-input" id="targetRevenue" type="number" inputmode="decimal" min="0" max="10000000" step="any" placeholder="USD per month" value="${answers.targetRevenue ?? ''}"/></div></div>`;
    $('bc-question').innerHTML = `<h2 id="bc-question-title" tabindex="-1">${escape(q.title)}</h2><p class="bc-hint">${escape(q.hint)}</p>${inputs}`;
    $('bc-unknown')?.addEventListener('change', () => { $('bc-number').disabled = $('bc-unknown').checked; if (!$('bc-unknown').checked) $('bc-number').focus(); });
  } else {
    $('bc-question').innerHTML = `<h2 id="bc-question-title" tabindex="-1">Where should I send your free guide?</h2><p class="bc-hint">I'll email you the free guide and show you a review based on your answers. No payment required.</p><div class="bc-contact-grid"><div><label class="bc-field" for="firstName">First name</label><input class="bc-input" id="firstName" name="first_name" autocomplete="given-name" maxlength="80" value="${escape(contact.firstName)}" required/></div><div><label class="bc-field" for="email">Email address</label><input class="bc-input" id="email" name="email" type="email" autocomplete="email" maxlength="254" value="${escape(contact.email)}" required/></div><div class="bc-wide"><label class="bc-field" for="instagram">Instagram handle <span class="bc-optional">(optional)</span></label><input class="bc-input" id="instagram" name="instagram" placeholder="@yourhandle" maxlength="31" value="${escape(contact.instagram)}"/></div></div><label class="bc-consent"><input type="checkbox" id="deliveryConsent" ${contact.deliveryConsent ? 'checked' : ''} required/><span>${DELIVERY_CONSENT.replace('Privacy Policy', '<a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>')}</span></label><label class="bc-consent"><input type="checkbox" id="marketingConsent" ${contact.marketingConsent ? 'checked' : ''}/><span>${MARKETING_CONSENT}</span></label><div class="bc-honey" aria-hidden="true"><label for="website">Leave this blank</label><input id="website" name="website" tabindex="-1" autocomplete="off"/></div>`;
  }
  if (!q && !deliveryReady) { $('bc-next').disabled = true; showError('Guide delivery is being connected. Submissions are not open yet; no details have been saved.'); }
  else $('bc-next').disabled = false;
  if (focus) { $('bc-question-title').focus({ preventScroll: true }); $('bc-survey').scrollIntoView({ behavior: 'instant', block: 'start' }); }
}
$('bc-start').addEventListener('click', () => {
  $('bc-intro').hidden = true; $('bc-survey').hidden = false; render(); track('tatassist_survey_started');
});
$('bc-back').addEventListener('click', () => {
  if (busy) return;
  read();
  if (index === 0) { $('bc-intro').hidden = false; $('bc-survey').hidden = true; $('bc-start').focus(); return; }
  index -= 1; render();
});
$('bc-form').addEventListener('submit', async event => {
  event.preventDefault(); if (busy || completed) return;
  const q = question(); read();
  if (q) {
    const error = validateStep(q.id, answers); if (error) { showError(error); return; }
    track('tatassist_survey_step_completed', { question_id: q.id });
    index += 1; render(); return;
  }
  if (!contact.firstName || /[<>\r\n]/.test(contact.firstName)) { showError('Enter your first name.'); $('firstName').focus(); return; }
  if (!/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(contact.email)) { showError('Enter a valid email address.'); $('email').focus(); return; }
  if (contact.instagram && !/^@?[a-zA-Z0-9._]{1,30}$/.test(contact.instagram)) { showError('Use an Instagram handle, or leave it blank.'); return; }
  if (!contact.deliveryConsent) { showError('Confirm that we may email your guide and use your survey answers.'); return; }
  if (!deliveryReady) { showError('Guide delivery is not connected yet. Nothing has been submitted.'); return; }
  busy = true; $('bc-next').disabled = true; $('bc-back').disabled = true; $('bc-next').textContent = 'Submitting…'; showError('');
  try {
    const res = await fetch('/api/booking-check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers, contact, attribution, website: $('website').value }), signal: AbortSignal.timeout(30000) });
    const data = await res.json();
    if (!res.ok || data.ok !== true) throw new Error(data.error || 'Your request was not completed. Please try again.');
    const review = data.review;
    $('bc-result-title').textContent = review.title; $('bc-result-body').textContent = review.body;
    $('bc-delivery-status').textContent = data.existing ? 'Your details are saved. Kit already has a guide request for this address, so it may not send a second confirmation email. Check the original email, or contact syd@tatassist.com for help.' : 'Your details are saved and your guide email has been requested. Look for the confirmation email from Joker Ink / Tatassist, then click its button to get the PDF. Check spam or promotions if it does not appear.';
    const numbers = [];
    if (review.conversion !== null) numbers.push(`<p><strong>${review.conversion}% inquiry-to-deposit so far</strong>${answers.deposits} of the ${answers.inquiries} people who first inquired in the last 30 days have paid a deposit. Open conversations are not necessarily lost.</p>`);
    else numbers.push('<p><strong>No conversion percentage calculated</strong>You did not provide both counts, or there were no new inquiries. Unknown is not the same as zero.</p>');
    if (review.revenueGap !== null) numbers.push(`<p><strong>${currency(review.revenueGap)} remaining to your monthly goal</strong>This is arithmetic from your optional answers, not lost revenue or a prediction of what a system will earn.</p>`);
    $('bc-result-numbers').innerHTML = numbers.join('');
    const productUrl = new URL('/lp/booked-artist-system', document.baseURI);
    for (const [key, value] of Object.entries(attribution)) productUrl.searchParams.set(key, value);
    $('bc-product-link').href = productUrl.href;
    $('bc-survey').hidden = true; $('bc-result').hidden = false; $('bc-result-title').focus(); completed = true;
    track('tatassist_lead_captured'); track('tatassist_survey_completed');
  } catch (error) { showError(error.name === 'TimeoutError' ? 'The request timed out. Your guide has not been confirmed. Please retry; your answers are still here.' : (error.message || 'Unable to submit. Please try again.')); }
  finally { busy = false; $('bc-next').disabled = false; $('bc-back').disabled = false; $('bc-next').textContent = 'Email my guide + show my review'; }
});

$('bc-form').addEventListener('input', () => { if (question() || deliveryReady) showError(''); });
$('bc-start').disabled = true;
fetch('/api/booking-check', { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(5000) })
  .then(async res => { const data = await res.json(); deliveryReady = res.ok && data.ready === true; })
  .catch(() => { deliveryReady = false; })
  .finally(() => {
    $('bc-start').disabled = false;
    if (!deliveryReady) {
      $('bc-availability').hidden = false;
      $('bc-availability').textContent = 'Guide delivery is being connected. You can preview the questions, but submissions are not open yet.';
      $('bc-start').textContent = 'Preview the booking check';
    }
  });
