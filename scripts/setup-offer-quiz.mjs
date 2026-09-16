import {CUSTOM_FIELD_KEYS} from '../lib/offer-quiz.mjs';
const key=process.env.KIT_API_KEY;
if(!key)throw new Error('Set server-only KIT_API_KEY before configuring Kit.');
for(const label of CUSTOM_FIELD_KEYS){
 const response=await fetch('https://api.kit.com/v4/custom_fields',{method:'POST',headers:{'X-Kit-Api-Key':key,'Content-Type':'application/json'},body:JSON.stringify({label}),signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw new Error(`Field setup failed for ${label}: HTTP ${response.status}`);
 const data=await response.json();if(data.custom_field?.key!==label)throw new Error(`Unexpected field key for ${label}`);
 console.log(`Ready: ${label}`);
}
console.log('Fields prepared. Configure both guide forms and the nurture sequence before enabling delivery.');
