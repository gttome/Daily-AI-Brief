(()=>{document.querySelectorAll('.subscription-guidance').forEach(root=>{
 const choices=[...root.querySelectorAll('[data-subscription-choice]')],panels=[...root.querySelectorAll('[data-subscription-panel]')];
 function choose(name){choices.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.subscriptionChoice===name)));panels.forEach(p=>p.hidden=p.dataset.subscriptionPanel!==name);}
 root.querySelector('.subscription-choices').hidden=false;choose(location.pathname.includes('/subscribe/')?'rss':'calendar');choices.forEach(b=>b.onclick=()=>choose(b.dataset.subscriptionChoice));
});})();
