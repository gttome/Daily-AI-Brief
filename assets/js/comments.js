(()=>{
 const endpoint='https://daily-ai-brief-ratings.gtome.chatgpt.site/api/comments';
 document.querySelectorAll('.story-feedback').forEach(panel=>{
  const button=document.createElement('button');button.type='button';button.className='comment-open';button.textContent='Add a comment';panel.append(button);
  button.addEventListener('click',()=>{
   const dialog=document.createElement('dialog');dialog.className='comment-dialog';dialog.setAttribute('aria-labelledby','comment-title');
   dialog.innerHTML='<form><h2 id="comment-title">Add a comment</h2><label for="comment-body">What helped, what was missing, or what should we cover next?</label><textarea id="comment-body" maxlength="1000" rows="5" required></textarea><p>Sent privately to the brief’s editor. Please avoid personal or confidential information. Comments are retained for 90 days.</p><p class="comment-status" role="status"></p><button type="submit">Submit</button> <button type="button" class="comment-cancel">Cancel</button></form>';
   document.body.append(dialog);dialog.showModal();dialog.querySelector('textarea').focus();
   let operation=crypto.randomUUID(),submittedBody=null;
   const close=()=>{dialog.close();dialog.remove();button.focus();};
   dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.querySelector('.comment-cancel').onclick=close;
   dialog.querySelector('form').onsubmit=async e=>{
    e.preventDefault();const body=dialog.querySelector('textarea').value.trim();if(!body)return;
    if(submittedBody!==null && submittedBody!==body)operation=crypto.randomUUID();submittedBody=body;
    const submit=dialog.querySelector('[type=submit]');submit.disabled=true;
    try{const r=await fetch(endpoint,{method:'POST',credentials:'omit',headers:{'content-type':'application/json','x-operation-id':operation},body:JSON.stringify({brief_date:panel.dataset.feedbackBriefDate,item_id:panel.dataset.feedbackStoryId,body})});const data=await r.json();if(!r.ok||data.recorded!==true)throw Error();close();panel.querySelector('.feedback-status').textContent='Comment sent privately. Thank you.';}
    catch{dialog.querySelector('.comment-status').textContent='Could not send. Your comment is still here; please try again.';submit.disabled=false;}
   };
  });
 });
})();
