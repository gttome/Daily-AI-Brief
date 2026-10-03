const problemId=/DAB-OPS-\d{8}-\d{3}/g;

export function latestLearningStatus(events=[]){
  const latest=new Map();
  for(const event of events){
    if(!event?.problem_id)continue;
    const at=Date.parse(event.recorded_at||event.occurred_at||0)||0;
    const prior=latest.get(event.problem_id),pt=prior?(Date.parse(prior.recorded_at||prior.occurred_at||0)||0):-1;
    if(!prior||at>=pt)latest.set(event.problem_id,event);
  }
  return latest;
}

export function reconcileImprovementKanban(board,events=[]){
  const next=structuredClone(board||{}),latest=latestLearningStatus(events),represented=new Set();
  next.cards=(next.cards||[]).map(card=>{
    const ids=[...new Set((card.sources||[]).flatMap(x=>String(x).match(problemId)||[]))];
    ids.forEach(id=>represented.add(id));
    const statuses=ids.map(id=>latest.get(id)).filter(Boolean);
    const resolved=ids.length>0&&statuses.length===ids.length&&statuses.every(x=>['permanently_fixed','superseded'].includes(x.status));
    return {...card,reconciliation:{problem_ids:ids,resolved_by_learning_ledger:resolved,latest_statuses:Object.fromEntries(statuses.map(x=>[x.problem_id,x.status]))}};
  });
  const unresolved=[];
  for(const [id,event] of latest)if(!['permanently_fixed','superseded'].includes(event.status)&&!represented.has(id))unresolved.push({problem_id:id,status:event.status,summary:event.summary||event.data?.symptom||'Unresolved operational-learning item'});
  next.reconciliation={generated_from:'production-continuous-improvement-ledger',unrepresented_unresolved_problems:unresolved,missing_problem_count:unresolved.length,lane_moves_automatic:false};
  return next;
}

export function parseLearningJsonl(text=''){
  return String(text).split(/\r?\n/).filter(Boolean).map((line,i)=>{try{return JSON.parse(line)}catch{throw Error('invalid_learning_jsonl_line:'+(i+1));}});
}
