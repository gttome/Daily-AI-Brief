(async()=>{
 const form=document.querySelector('#subscription-form');if(!form)return;
 const endpoint='https://daily-ai-brief-ratings.gtome.chatgpt.site/api/subscriptions';
 try{const r=await fetch(endpoint,{credentials:'omit'}),s=await r.json();if(!s.available)return;form.hidden=false;document.querySelector('#subscription-availability').textContent='Confirm once, then receive the daily link.';}catch{return;}
 form.onsubmit=async e=>{e.preventDefault();const button=form.querySelector('button');button.disabled=true;try{const r=await fetch(endpoint,{method:'POST',credentials:'omit',headers:{'content-type':'application/json'},body:JSON.stringify({email:form.querySelector('input').value})});if(!r.ok)throw Error();document.querySelector('#subscription-status').textContent='Check your inbox to confirm your subscription.';form.reset();}catch{document.querySelector('#subscription-status').textContent='Subscription could not be sent. Please try again.';}button.disabled=false;};
})();
