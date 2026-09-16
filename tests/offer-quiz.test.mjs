import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {QUESTIONS,EDITIONS,QUIZ_VERSION,validatePayload,recommend,kitFields,CUSTOM_FIELD_KEYS,makeResult,readResult} from '../lib/offer-quiz.mjs';
import {configured,handle} from '../api/offer-quiz.js';
const sample=()=>({answers:{goal:'bookings',revenue:'10k_20k',projectValue:'1500_3000',inquiries:'11_30',bottleneck:'pause'},contact:{firstName:'Test',lastName:'Artist',email:'test@example.com',marketingConsent:false},website:'',attribution:{utm_source:'meta'}});
const env={KIT_API_KEY:'test',KIT_BOOKING_FORM_ID:'11',KIT_BOOKING_NURTURE_FORM_ID:'22',KIT_BOOKING_DELIVERY_READY:'true'};
let ip=0;
const request=(p=sample(),origin='https://tatassist.com')=>new Request('https://tatassist.com/api/offer-quiz',{method:'POST',headers:{origin,'content-type':'application/json','x-vercel-forwarded-for':`192.0.2.${++ip}`},body:JSON.stringify(p)});
const upstream=(status=201,state='inactive')=>Response.json({subscriber:{id:7,state}},{status});
test('five questions default to Working, reserving Complete for larger busy workflows',()=>{
 assert.equal(QUESTIONS.length,5);assert.ok(!QUESTIONS.some(q=>q.id==='tools'));
 let total=0,complete=0;function visit(a,i){if(i===QUESTIONS.length){const r=recommend(a);assert.ok(['working','complete'].includes(r.tierId));if(r.tierId==='complete')complete++;assert.ok(r.reason && r.intro);total++;return;}for(const o of QUESTIONS[i].options)visit({...a,[QUESTIONS[i].id]:o.value},i+1);}visit({},0);assert.equal(total,2500);assert.equal(complete,120);
 const large={...sample().answers,projectValue:'over_3000',inquiries:'31_60',bottleneck:'price'};
 assert.equal(recommend(large).tierId,'complete');
 for(const change of [{projectValue:'1500_3000'},{inquiries:'11_30'},{bottleneck:'details'}])assert.equal(recommend({...large,...change}).tierId,'working');
 assert.equal(recommend({...sample().answers,revenue:'over_20k',tools:'complete'}).tierId,'working');
 const manifest=JSON.parse(readFileSync(new URL('../src/data/booking-funnel/offer-manifest.json',import.meta.url)));
 for(const t of manifest.tiers)assert.deepEqual([EDITIONS[t.id].name,EDITIONS[t.id].price,EDITIONS[t.id].count],[t.name,t.price,t.count]);
});
test('contact requires first and last name plus email; guide-only remains valid',()=>{
 assert.equal(validatePayload(sample()).contact.marketingConsent,false);
 for(const key of ['firstName','lastName','email']){const p=sample();p.contact[key]='';assert.throws(()=>validatePayload(p));}
 for(const key of ['firstName','lastName']){const p=sample();p.contact[key]='<img>';assert.throws(()=>validatePayload(p));}
 const p=sample();p.contact.firstName='Éric';p.contact.lastName="O’Neill";assert.equal(validatePayload(p).contact.firstName,'Éric');
});
test('tampered options, skipped steps, honeypots and PII in attribution are rejected or removed',()=>{
 for(const q of QUESTIONS){const p=sample();delete p.answers[q.id];assert.throws(()=>validatePayload(p));p.answers[q.id]='<script>';assert.throws(()=>validatePayload(p));}
 const p=sample();p.website='bot';assert.throws(()=>validatePayload(p));p.website='';p.attribution.utm_content='name@example.com';assert.equal(validatePayload(p).attribution.utm_content,undefined);
});
test('saved result contains no contact; expires, validates enums, and preserves matching after a reload',()=>{
 const r=makeResult(sample().answers,10000000);assert.equal(readResult(JSON.stringify(r),10000001).tierId,'working');assert.equal(readResult(r,10000000+7200001),null);assert.equal(readResult({...r,completedAt:Infinity}),null);assert.equal(readResult({...r,answers:{}}),null);assert.equal(readResult('{'),null);assert.equal(readResult({...r,version:'old'}),null);assert.ok(!JSON.stringify(r).includes('test@example.com'));
});
test('Kit fields exactly match setup and include names, choices, tier and consent',()=>{
 const f=kitFields(validatePayload(sample()));assert.deepEqual(Object.keys(f).sort(),[...CUSTOM_FIELD_KEYS].sort());assert.equal(f.bas_last_name,'Artist');assert.equal(f.bas_recommended_tier,'working');assert.equal(f.bas_marketing_consent,'no');assert.equal(f.bas_edition_price,'47');assert.equal(f.bas_result_url,'https://tatassist.com/lp/booked-artist?edition=working');
});
test('unconfigured endpoint never reports a captured lead or releases a guide',async()=>{
 assert.equal(configured({}),false);assert.equal(configured(env),true);let calls=0;const res=await handle(request(),{env:{},fetchImpl:()=>calls++});assert.equal(res.status,503);assert.equal(calls,0);assert.ok(!(await res.text()).includes('guideUrl'));
});
test('separate form enrollment controls guide-only versus requested follow-up; fields save first',async()=>{
 for(const consent of [false,true]){const p=sample();p.contact.marketingConsent=consent;const calls=[];const res=await handle(request(p),{env,fetchImpl:async(url,args)=>{calls.push({url,method:args.method,body:JSON.parse(args.body)});return upstream();}});assert.equal(res.status,200);assert.equal(calls.length,3);assert.equal(calls[0].body.state,'inactive');assert.equal(calls[1].method,'PUT');assert.equal(calls[1].body.fields.bas_marketing_consent,consent?'yes':'no');assert.ok(calls[2].url.endsWith(`/forms/${consent?'22':'11'}/subscribers/7`));const body=await res.json();assert.equal(body.recommendation.tierId,'working');assert.equal(body.guideUrl,'/lead-magnet/before-you-quote.pdf');assert.equal(body.emailDelivery,'requested');assert.ok(!JSON.stringify(body).includes('test@example.com'));}
});
test('failures at each provider step retain failure state; repeat and unsubscribe states are handled',async()=>{
 for(const failAt of [0,1,2]){let i=0;const res=await handle(request(),{env,fetchImpl:async()=>i++===failAt?Response.json({error:'no'}, {status:422}):upstream()});assert.equal(res.status,502);assert.ok(!(await res.text()).includes('guideUrl'));assert.equal(i,failAt+1);}
 let n=0;const stopped=await handle(request(),{env,fetchImpl:async()=>{n++;return upstream(200,'cancelled');}});assert.equal(stopped.status,409);assert.equal(n,1);
 const repeat=await handle(request(),{env,fetchImpl:async()=>upstream(200,'active')});assert.equal((await repeat.json()).emailDelivery,'previous_request');
});
test('rejects offsite, oversized, invalid JSON and non-JSON requests',async()=>{
 assert.equal((await handle(request(sample(),'https://bad.example'),{env})).status,403);
 const p=sample();p.extra='x'.repeat(13000);assert.equal((await handle(request(p),{env})).status,413);
 const r=new Request('https://tatassist.com/api/offer-quiz',{method:'POST',headers:{origin:'https://tatassist.com','content-type':'application/json'},body:'{' });assert.equal((await handle(r,{env})).status,400);
});
