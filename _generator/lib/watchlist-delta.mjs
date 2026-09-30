import {sha256,normalizeUrl} from './util.mjs';

function canonicalEvidence(evidence=[]){
 return evidence.map(item=>({
  title:item.title||null,
  url:item.url?normalizeUrl(item.url):null,
  publisher:item.publisher||null,
  kind:item.kind||null,
  publication_date:item.publication_date||null,
  development_id:item.development_id||null,
  review_depth:item.review_depth||null
 })).sort((a,b)=>String(a.url).localeCompare(String(b.url))||String(a.title).localeCompare(String(b.title)));
}

export function topicEvidenceHashes(topic){
 const evidence=canonicalEvidence(topic?.evidence||[]);
 const sourceSet=[...new Set(evidence.map(x=>`${x.publisher||''}|${x.url||''}`))].sort();
 return {evidence_hash:sha256(JSON.stringify(evidence)),source_set_hash:sha256(JSON.stringify(sourceSet)),evidence_count:evidence.length};
}

export function classifyTopicDelta(prior,next){
 if(!prior)return {topic_id:next.topic_id,status:'new',semantic_refresh_required:true,prior_hash:null,...topicEvidenceHashes(next)};
 const before=topicEvidenceHashes(prior),after=topicEvidenceHashes(next);
 const changed=before.evidence_hash!==after.evidence_hash||before.source_set_hash!==after.source_set_hash;
 return {topic_id:next.topic_id,status:changed?'changed':'carried',semantic_refresh_required:changed,prior_hash:before.evidence_hash,...after};
}

export function watchlistDeltaPlan(priorTopics,nextTopics){
 const prior=new Map((priorTopics||[]).map(topic=>[topic.topic_id,topic]));
 const next=new Map((nextTopics||[]).map(topic=>[topic.topic_id,topic]));
 const topics=[...next.values()].map(topic=>classifyTopicDelta(prior.get(topic.topic_id),topic));
 const removed=[...prior.keys()].filter(id=>!next.has(id));
 return {schema_version:'1.0.0',topics,changed_topics:topics.filter(x=>x.semantic_refresh_required).map(x=>x.topic_id),carried_topics:topics.filter(x=>!x.semantic_refresh_required).map(x=>x.topic_id),removed_topics:removed,normal_semantic_input_topic_ids:topics.filter(x=>x.semantic_refresh_required).map(x=>x.topic_id),rule:'Only changed/new topic evidence enters semantic refresh. Carried topics retain prior semantic text and require no model call.'};
}
