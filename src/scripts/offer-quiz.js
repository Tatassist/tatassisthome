import { QUESTIONS, QUIZ_VERSION, RESULT_KEY, MARKETING_LABEL, validateAnswer, validateContact, makeResult } from '../../lib/offer-quiz.mjs';
const $ = id => document.getElementById(id);
const form = $('fq-form');
if (form) {
  const answers = {};
  const contact = {firstName:'',lastName:'',email:'',marketingConsent:false};
  let step=0,busy=false,complete=false;
  const attribution = {};
  for (const [key,value] of new URLSearchParams(location.search)) {
    if (['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].includes(key) && /^[a-zA-Z0-9 _.-]{1,100}$/.test(value)) attribution[key]=value;
  }
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const track = (event,detail={}) => window.tatassistTrack?.({event,quiz_version:QUIZ_VERSION,...detail});
  function error(message) { $('fq-error').textContent=message; $('fq-error').hidden=!message; }
  function read() {
    const q=QUESTIONS[step];
    if (q) answers[q.id]=form.querySelector(`input[name="${q.id}"]:checked`)?.value;
    else {
      for (const key of ['firstName','lastName','email']) contact[key]=$(key).value;
      contact.marketingConsent=$('marketingConsent').checked;
    }
  }
  function render() {
    const q=QUESTIONS[step];
    $('fq-step-label').textContent=q ? `${step+1} OF ${QUESTIONS.length} / ${q.label.toUpperCase()}` : 'FINAL STEP / GET YOUR GUIDE';
    document.querySelectorAll('[data-progress-step]').forEach((el,i)=>el.classList.toggle('is-current',i<=step));
    $('fq-back').hidden=step===0;
    $('fq-next').textContent=q ? (step===0 ? 'START MY BOOKING CHECK':'CONTINUE') : 'SEND MY GUIDE & SHOW MY MATCH';
    $('fq-guide-teaser').hidden=!q;
    if (q) {
      $('fq-question').innerHTML=`<fieldset><legend id="fq-question-title" tabindex="-1">${esc(q.title)}</legend>${q.hint ? `<p class="fq-hint">${esc(q.hint)}</p>`:''}<div class="fq-options">${q.options.map(o=>`<label class="fq-option"><input type="radio" name="${q.id}" value="${o.value}" ${answers[q.id]===o.value ? 'checked':''}/><span>${esc(o.label)}</span></label>`).join('')}</div></fieldset>`;
    } else {
      $('fq-question').innerHTML=`<div class="fq-contact-layout"><div><h2 id="fq-question-title" tabindex="-1">Where should we send your guide?</h2><p class="fq-hint">Get Before You Quote free and see your matched recommendation.</p><div class="fq-contact-fields"><label>First name<input id="firstName" name="firstName" autocomplete="given-name" maxlength="80" value="${esc(contact.firstName)}" required /></label><label>Last name<input id="lastName" name="lastName" autocomplete="family-name" maxlength="80" value="${esc(contact.lastName)}" required /></label><label class="fq-wide">Email<input id="email" name="email" type="email" autocomplete="email" maxlength="254" value="${esc(contact.email)}" required /></label></div><label class="fq-consent"><input id="marketingConsent" name="marketingConsent" type="checkbox" ${contact.marketingConsent ? 'checked':''}/><span>${MARKETING_LABEL}</span></label><p class="fq-small"><a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy</a> · Unsubscribe from tips anytime.</p><div class="fq-honey" aria-hidden="true"><label>Website<input id="website" name="website" tabindex="-1" autocomplete="off" /></label></div></div><img class="fq-contact-cover" src="/lead-magnet/before-you-quote-cover.png" width="420" height="560" alt="Before You Quote free PDF guide" /></div>`;
    }
    error('');
    $('fq-question-title').focus({preventScroll:true});
    form.scrollIntoView({behavior:'instant',block:'start'});
  }
  $('fq-back').addEventListener('click',()=>{if (busy || step===0) return; read();step--;render();});
  form.addEventListener('input',()=>error(''));
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy || complete)return;read();
    const q=QUESTIONS[step];
    if(q) {
      const issue=validateAnswer(q.id,answers[q.id]);if(issue){error(issue);return;}
      if(step===0)track('tatassist_booking_quiz_started');
      track('tatassist_booking_quiz_step',{question_id:q.id});step++;render();return;
    }
    try { validateContact(contact); } catch(e) {error(e.message);return;}
    busy=true;$('fq-next').disabled=true;$('fq-back').disabled=true;$('fq-next').textContent='SENDING…';
    try {
      const res=await fetch('/api/offer-quiz',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({answers,contact,attribution,website:$('website').value}),signal:AbortSignal.timeout(30000)});
      const data=await res.json();
      if(!res.ok || data.ok!==true)throw new Error(data.error || 'Your request didn’t go through. Please try again.');
      const result=makeResult(answers);
      // Keep only anonymous answer codes for this tab. Names and email never enter storage or URLs.
      try{sessionStorage.setItem(RESULT_KEY,JSON.stringify(result));}catch{}
      track('tatassist_booking_lead_captured');complete=true;
      const url=new URL('/lp/booked-artist',location.origin);
      url.searchParams.set('edition',data.recommendation.tierId);
      location.assign(url.pathname+url.search);
    }catch(e){error(e.name==='TimeoutError' ? 'That took too long. Please try again. Your answers are still here.':(e instanceof SyntaxError ? 'Guide requests are not open yet. Please try again later.':e.message));}
    finally{busy=false;$('fq-next').disabled=false;$('fq-back').disabled=false;$('fq-next').textContent='SEND MY GUIDE & SHOW MY MATCH';}
  });
}
