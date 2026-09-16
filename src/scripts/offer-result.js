import {RESULT_KEY,EDITIONS,readResult} from '../../lib/offer-quiz.mjs';
const root=document.getElementById('bas-main');
if(root){
  let stored=null;
  try{stored=readResult(sessionStorage.getItem(RESULT_KEY));}catch{}
  const fromQuery=new URLSearchParams(location.search).get('edition');
  const fromHash=location.hash.match(/^#tier-(essentials|working|complete)$/)?.[1];
  let selected=Object.hasOwn(EDITIONS,fromQuery) ? fromQuery : fromHash || stored?.tierId || 'working';
  const $=id=>document.getElementById(id);
  function show(tier,explicit=false){
    selected=tier;
    const edition=EDITIONS[tier];
    root.querySelectorAll('[data-offer]').forEach(el=>{
      el.hidden=el.dataset.offer!==tier;
      const matched=stored?.tierId===tier;
      el.querySelector('[data-match-label]').textContent=matched ? 'YOUR RECOMMENDED EDITION':(tier==='working'&&!explicit ? 'OUR RECOMMENDATION':'YOUR SELECTED EDITION');
      const reason=el.querySelector('[data-match-reason]');reason.hidden=!matched;reason.textContent=matched ? stored.reason:'';
    });
    root.querySelectorAll('[data-inventory]').forEach(el=>el.hidden=el.dataset.inventory!==tier);
    root.querySelectorAll('[data-edition-link]').forEach(el=>el.hidden=el.dataset.editionLink===tier);
    $('fq-included-name').textContent=edition.name;
    $('fq-mobile-cta').textContent=`GET ${edition.name.toUpperCase()} · $${edition.price}`;
    $('fq-mobile-cta').href=`#tier-${tier}`;
    $('fq-personal-intro').textContent=stored?.tierId===tier ? stored.intro : 'The sleeve that went quiet. The project buried in messages. Put a process behind the inquiries you’re already getting.';
  }
  if(stored){$('fq-guide-access').hidden=false;$('fq-guide-link').href='/lead-magnet/before-you-quote.pdf';$('fq-guide-link').target='_blank';$('fq-guide-link').rel='noopener noreferrer';}
  show(selected,Boolean(fromQuery || fromHash));
  root.querySelectorAll('[data-edition-link]').forEach(link=>link.addEventListener('click',event=>{
    event.preventDefault();const tier=link.dataset.editionLink;show(tier,true);
    const url=new URL(location.href);url.searchParams.set('edition',tier);url.hash='buy';history.pushState({},'',url);
    $('buy').scrollIntoView({behavior:'instant',block:'start'});
    root.querySelector(`[data-offer="${tier}"] h2`).setAttribute('tabindex','-1');root.querySelector(`[data-offer="${tier}"] h2`).focus({preventScroll:true});
    window.tatassistTrack?.({event:'booked_artist_edition_viewed',tier});
  }));
  window.addEventListener('popstate',()=>{const value=new URLSearchParams(location.search).get('edition');show(Object.hasOwn(EDITIONS,value)?value:stored?.tierId||'working',Boolean(value));});
}
