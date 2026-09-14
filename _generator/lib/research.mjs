import fs from 'node:fs';
import path from 'node:path';
import {normalizeUrl, sha256} from './util.mjs';

export const RESEARCH_VERSION = 'efficiency-phase-1-v1';
export const FOCUSES = ['technical_ai_engineering','applied_genai_knowledge_workers','agents_non_technical_people'];
const time = value => typeof value === 'string' && value.trim() ? Date.parse(value) : NaN;

export function researchUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) throw Error('Research URL must be public HTTPS without credentials');
  return normalizeUrl(url.href);
}

export function filterCandidates(candidates, {now, maxAgeHours = 120, coveredEvents = []} = {}) {
  if (!Number.isFinite(time(now)) || !Number.isFinite(maxAgeHours) || maxAgeHours <= 0) throw Error('Explicit valid research time/window required');
  const seen = new Set(), events = new Set(coveredEvents), accepted = [], rejected = [], needs_review = [];
  for (const candidate of candidates) {
    let url;
    try { url = researchUrl(candidate.canonical_url || candidate.url); }
    catch { rejected.push({candidate,reason:'invalid_url'}); continue; }
    if (seen.has(url)) { rejected.push({candidate,reason:'duplicate_url'}); continue; }
    seen.add(url);
    const item = {...candidate,canonical_url:url};
    const published = time(item.published_at);
    let reason = null;
    if (item.source_status === 'unsupported') reason = 'unsupported_source';
    else if (item.editorial_disposition === 'topic_mismatch' || item.editorial_disposition === 'promotional_filler') reason = item.editorial_disposition;
    else if (item.novelty_disposition === 'already_covered' && item.novelty_reviewed === true) reason = 'already_covered';
    else if (item.event_fingerprint && events.has(item.event_fingerprint) && item.material_update !== true) reason = 'covered_event_requires_material_update';
    else if (Number.isFinite(published) && (published > time(now) || time(now)-published > maxAgeHours*3600000)) reason = 'outside_freshness_window';
    if (reason) { rejected.push({candidate:item,reason}); continue; }
    if ((item.date_conflict && item.date_reviewed !== true) || !Number.isFinite(published) || !FOCUSES.includes(item.focus) || !item.source_reliability) {
      needs_review.push({candidate:item,reason:'date_category_or_reliability_unverified'});
    } else accepted.push(item);
  }
  return {accepted,needs_review,rejected,note:'No category cap or unknown-metadata rejection. Review unresolved candidates before selection.'};
}

export function researchSufficiency(packets, {now, maxAgeHours=120} = {}) {
  if (!Number.isFinite(time(now))) throw Error('Explicit valid time required');
  const unique = new Map();
  for (const p of packets) {
    const published=time(p.published_at);
    if (p.schema_version !== '1.0.0' || p.verification_status !== 'reviewed' || p.novelty_status !== 'pass' ||
        p.confidence !== 'high' || !p.verified_claims?.length || !Number.isFinite(published) ||
        published > time(now) || time(now)-published > maxAgeHours*3600000 || !FOCUSES.includes(p.category)) continue;
    let url; try { url=researchUrl(p.canonical_url); } catch { continue; }
    if (!unique.has(url)) unique.set(url,p);
  }
  const values=[...unique.values()];
  const counts=Object.fromEntries(FOCUSES.map(f=>[f,values.filter(p=>p.category===f).length]));
  const skill=values.some(p=>p.agent_skill_relevance === true);
  return {sufficient:FOCUSES.every(f=>counts[f]>=3)&&skill,counts,qualifying_agent_skill:skill,
    rule:'Three reviewed high-confidence novel candidates per category (two finalists plus a backup), including a qualifying Agent Skills candidate. Existing editorial gates still apply.'};
}

export function createEvidencePacket(candidate, source, review) {
  const url=researchUrl(candidate.canonical_url || candidate.url);
  if (researchUrl(source.canonical_url)!==url || typeof source.text!=='string' || !source.text.trim()) throw Error('Matching source text required');
  if (!review || review.status!=='reviewed' || !review.reviewer || !Number.isFinite(time(review.reviewed_at))) throw Error('Explicit completed evidence review required');
  if (review.source_content_hash!==sha256(source.text)) throw Error('Review does not match source content hash');
  if (candidate.date_conflict && review.date_reviewed !== true) throw Error('Conflicting publication dates require explicit date review');
  if (!Number.isFinite(time(candidate.published_at)) || !FOCUSES.includes(candidate.focus) || !candidate.source_reliability) throw Error('Verified date, category and source reliability required');
  if (!Array.isArray(review.claims) || !review.claims.length) throw Error('At least one reviewed claim required');
  const claims=review.claims.map(c=>{
    if (typeof c.claim!=='string' || !c.claim.trim() || typeof c.excerpt!=='string' || !c.excerpt.trim() || !source.text.includes(c.excerpt)) throw Error('Every claim needs an exact traceable source excerpt');
    return {claim:c.claim.trim(),evidence:c.excerpt,source_url:url};
  });
  if (!['pass','review_required','fail'].includes(review.novelty_status) || !['high','medium','low'].includes(review.confidence)) throw Error('Explicit novelty and confidence required');
  return {
    schema_version:'1.0.0',pipeline_version:RESEARCH_VERSION,candidate_id:candidate.candidate_id,
    headline:candidate.headline,publisher:candidate.publisher || null,published_at:candidate.published_at,
    canonical_url:url,category:candidate.focus,source_reliability:candidate.source_reliability,
    verified_claims:claims,why_it_matters:review.why_it_matters || null,
    limitations:review.limitations || [],availability:review.availability || null,
    novelty_fingerprint:review.novelty_fingerprint || null,novelty_status:review.novelty_status,
    entities:review.entities || [],event_type:review.event_type || null,confidence:review.confidence,
    agent_skill_relevance:review.agent_skill_relevance === true,
    source_reading_minutes:Number.isFinite(review.source_reading_minutes)&&review.source_reading_minutes>0?review.source_reading_minutes:null,
    verification_status:'reviewed',reviewer:review.reviewer,reviewed_at:review.reviewed_at,
    source_content_hash:sha256(source.text),source_fetched_at:source.fetched_at,
    evidence_kind:source.evidence_kind || 'retrieved_source_text'
  };
}

export class RetrievalCache {
  constructor({directory=null, now=()=>new Date().toISOString(), ttlMs=3600000}={}) {
    if (!Number.isFinite(ttlMs)||ttlMs<=0) throw Error('Positive finite cache TTL required');
    this.directory=directory;this.now=now;this.ttlMs=ttlMs;this.entries=new Map();this.pending=new Map();
    this.metrics={cache_hits:0,cache_misses:0,source_text_chars_retrieved:0,fulltext_retrievals:0,metadata_retrievals:0,failed_retrievals:0};
  }
  file(key) { return path.join(this.directory,sha256(key)+'.json'); }
  key(url,kind) { if(!['metadata','fulltext'].includes(kind)) throw Error('Explicit retrieval kind required'); return kind+':'+researchUrl(url); }
  load(key) {
    let entry=this.entries.get(key);
    if (!entry && this.directory) { try {entry=JSON.parse(fs.readFileSync(this.file(key),'utf8'));} catch {return null;} }
    if (!entry) return null;
    const now=time(this.now()),fetched=time(entry.fetched_at),expires=time(entry.expires_at);
    if(entry.key!==key || typeof entry.text!=='string' || sha256(entry.text)!==entry.content_hash ||
      !Number.isFinite(now)||!Number.isFinite(fetched)||!Number.isFinite(expires) || fetched>now || expires<=now ||
      now-fetched>=this.ttlMs || expires-fetched>this.ttlMs) return null;
    return entry;
  }
  async retrieve(url,fetcher,{kind='fulltext',force=false}={}) {
    const normalized=researchUrl(url),key=this.key(url,kind);
    if(!force) {
      const hit=this.load(key);
      if(hit) {this.metrics.cache_hits++;return {...hit,cache_status:'hit'};}
      if(this.pending.has(key)) {this.metrics.cache_hits++;return {...await this.pending.get(key),cache_status:'coalesced'};}
    }
    this.metrics.cache_misses++;
    const task=(async()=>{
      try {
        const result=await fetcher(normalized);
        if(typeof result.text!=='string'||!result.text.trim()) throw Error('Empty retrieved source');
        const fetched_at=this.now(),stamp=time(fetched_at);
        if(!Number.isFinite(stamp)) throw Error('Invalid cache clock');
        const entry={schema_version:'1.0.0',key,canonical_url:normalized,resolved_url:result.url||normalized,
          fetched_at,expires_at:new Date(stamp+this.ttlMs).toISOString(),content_hash:sha256(result.text),
          published_at:result.published_at||null,metadata:result.metadata||null,attempts:result.attempts||[],text:result.text};
        this.metrics[kind==='fulltext'?'fulltext_retrievals':'metadata_retrievals']++;
        this.metrics.source_text_chars_retrieved+=result.text.length;
        this.entries.set(key,entry);
        if(this.directory) {
          fs.mkdirSync(this.directory,{recursive:true});
          const temp=this.file(key)+'.'+process.pid+'.'+Math.random().toString(16).slice(2)+'.tmp';
          fs.writeFileSync(temp,JSON.stringify(entry));
          fs.renameSync(temp,this.file(key));
        }
        return {...entry,cache_status:'miss'};
      } catch(error) {this.metrics.failed_retrievals++;throw error;}
    })();
    // Forced verification is independent and must not remove another in-flight request.
    if(!force)this.pending.set(key,task);
    try {return await task;} finally {if(this.pending.get(key)===task)this.pending.delete(key);}
  }
}

export function researchTelemetry({startedAt,endedAt,cache,packets=[],metadataSourcesScanned=null,sufficiency=null,scope='research_shadow'}) {
  const elapsed=time(endedAt)-time(startedAt);
  return {schema_version:'1.0.0',pipeline_version:RESEARCH_VERSION,scope,started_at:startedAt,ended_at:endedAt,
    wall_seconds:Number.isFinite(elapsed)&&elapsed>=0?elapsed/1000:null,
    research:{metadata_sources_scanned:metadataSourcesScanned,...cache.metrics,deep_candidates:packets.length,early_stop_triggered:sufficiency?.sufficient??null},
    context:{evidence_packets_created:packets.length,evidence_packet_chars:packets.reduce((n,p)=>n+JSON.stringify(p).length,0),input_tokens_observable:null,output_tokens_observable:null},
    quality:{final_public_qa:null,overall_run_status:null,private_operations:null,subscriber_delivery:'Disabled by choice / Not applicable'},
    usage:{exact_platform_tokens:null,exact_platform_credits:null,weekly_usage_measurement_status:'unavailable'}};
}

export async function runSelectiveResearch(candidates, {now,cache,fetcher,reviewer,maxAgeHours=120,minDeepCandidates=12}={}) {
  if(!cache || typeof fetcher!=='function' || typeof reviewer!=='function') throw Error('Cache, retriever and explicit editorial reviewer required');
  if(!Number.isInteger(minDeepCandidates)||minDeepCandidates<9) throw Error('Deep target must preserve category backups');
  const startedAt=new Date().toISOString(),plan=filterCandidates(candidates,{now,maxAgeHours});
  const queues=FOCUSES.map(f=>plan.accepted.filter(c=>c.focus===f));
  const ordered=[];
  while(queues.some(q=>q.length))for(const queue of queues)if(queue.length)ordered.push(queue.shift());
  const packets=[],failures=[],pending_review=[],processed=[];
  let earlyStop=false;
  for(const candidate of ordered) {
    if(processed.length>=minDeepCandidates&&researchSufficiency(packets,{now,maxAgeHours}).sufficient){earlyStop=true;break;}
    processed.push(candidate.candidate_id);
    try{
      const source=await cache.retrieve(candidate.canonical_url,fetcher,{kind:'fulltext'});
      const review=await reviewer(candidate,source);
      if(!review||review.status!=='reviewed'){pending_review.push(candidate.candidate_id);continue;}
      packets.push(createEvidencePacket(candidate,{...source,evidence_kind:'retrieved_source_text'},review));
    }catch(e){failures.push({candidate_id:candidate.candidate_id,reason:e.message});}
  }
  const sufficiency=researchSufficiency(packets,{now,maxAgeHours});
  const telemetry=researchTelemetry({startedAt,endedAt:new Date().toISOString(),cache,packets,scope:'selective_research'});
  telemetry.research.deep_candidates=processed.length;
  telemetry.research.early_stop_triggered=earlyStop;
  return {plan,packets,failures,pending_review,processed,
    deferred:ordered.filter(c=>!processed.includes(c.candidate_id)),sufficiency,telemetry,
    selection_status:'requires_existing_candidate_scoring_and_canonical_gates'};
}
