import fs from 'node:fs';
import path from 'node:path';
import {normalizeUrl, sha256} from './util.mjs';

export const RESEARCH_VERSION = 'efficiency-phase-2-v1';
export const FOCUSES = ['technical_ai_engineering','applied_genai_knowledge_workers','agents_non_technical_people'];
export const PRIMARY_FRESHNESS_HOURS = 24;
export const DEFAULT_FALLBACK_HOURS = 72;
export const AGENT_SKILLS_FALLBACK_HOURS = 168;
export const DEFAULT_METADATA_CANDIDATE_LIMIT = 20;
export const DEFAULT_DEEP_CANDIDATE_TARGET = 9;
export const MAX_DEEP_CANDIDATE_EXCEPTION = 12;
export const NORMAL_RETRIEVED_CHAR_BUDGET = 1500000;
export const ABSOLUTE_RETRIEVED_CHAR_BUDGET = 2500000;
const time = value => typeof value === 'string' && value.trim() ? Date.parse(value) : NaN;
const compactText=(value,max)=>typeof value==='string'?value.normalize('NFC').replace(/\u0000/g,'').replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,'').slice(0,max):value;

export function researchUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) throw Error('Research URL must be public HTTPS without credentials');
  return normalizeUrl(url.href);
}

export function freshnessTier(publishedAt, now, {primaryAgeHours=PRIMARY_FRESHNESS_HOURS,maxAgeHours=AGENT_SKILLS_FALLBACK_HOURS}={}) {
  const published=time(publishedAt),stamp=time(now);
  if(!Number.isFinite(published)||!Number.isFinite(stamp)||!Number.isFinite(primaryAgeHours)||primaryAgeHours<=0||!Number.isFinite(maxAgeHours)||maxAgeHours<primaryAgeHours) return null;
  const ageHours=(stamp-published)/3600000;
  if(ageHours<0||ageHours>maxAgeHours)return null;
  return {tier:ageHours<=primaryAgeHours?'primary':'fallback',age_hours:Number(ageHours.toFixed(3))};
}

export function filterCandidates(candidates, {now, primaryAgeHours = PRIMARY_FRESHNESS_HOURS, maxAgeHours = AGENT_SKILLS_FALLBACK_HOURS, coveredEvents = []} = {}) {
  if (!Number.isFinite(time(now)) || !Number.isFinite(primaryAgeHours) || primaryAgeHours <= 0 || !Number.isFinite(maxAgeHours) || maxAgeHours < primaryAgeHours) throw Error('Explicit valid research time/windows required');
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
    } else {
      const freshness=freshnessTier(item.published_at,now,{primaryAgeHours,maxAgeHours});
      accepted.push({...item,freshness_tier:freshness.tier,freshness_age_hours:freshness.age_hours});
    }
  }
  const fresh=accepted.filter(item=>item.freshness_tier==='primary');
  const fallback=accepted.filter(item=>item.freshness_tier==='fallback');
  return {accepted,fresh,fallback,needs_review,rejected,note:'Primary research window is the previous 24 hours. Older candidates are retained only as bounded fallback leads and must not outrank qualifying primary-window candidates.'};
}

export function researchSufficiency(packets, {now, primaryAgeHours=PRIMARY_FRESHNESS_HOURS} = {}) {
  if (!Number.isFinite(time(now)) || !Number.isFinite(primaryAgeHours) || primaryAgeHours<=0) throw Error('Explicit valid time/primary freshness window required');
  const unique = new Map();
  for (const p of packets) {
    const published=time(p.published_at);
    if (p.schema_version !== '1.0.0' || p.verification_status !== 'reviewed' || p.novelty_status !== 'pass' ||
        p.confidence !== 'high' || !p.verified_claims?.length || !Number.isFinite(published) ||
        published > time(now) || time(now)-published > primaryAgeHours*3600000 || !FOCUSES.includes(p.category)) continue;
    let url; try { url=researchUrl(p.canonical_url); } catch { continue; }
    if (!unique.has(url)) unique.set(url,p);
  }
  const values=[...unique.values()];
  const counts=Object.fromEntries(FOCUSES.map(f=>[f,values.filter(p=>p.category===f).length]));
  const skill=values.some(p=>p.agent_skill_relevance === true);
  return {sufficient:FOCUSES.every(f=>counts[f]>=3)&&skill,counts,qualifying_agent_skill:skill,
    rule:'Three reviewed high-confidence novel primary-window candidates per category (two finalists plus a backup), including a qualifying Agent Skills candidate. Older fallback candidates never satisfy the fresh early-stop gate.'};
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
    freshness_tier:candidate.freshness_tier||null,freshness_age_hours:Number.isFinite(candidate.freshness_age_hours)?candidate.freshness_age_hours:null,
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
  constructor({directory=null, now=()=>new Date().toISOString(), ttlMs=3600000, normalCharBudget=NORMAL_RETRIEVED_CHAR_BUDGET, absoluteCharBudget=ABSOLUTE_RETRIEVED_CHAR_BUDGET}={}) {
    if (!Number.isFinite(ttlMs)||ttlMs<=0) throw Error('Positive finite cache TTL required');
    if(!Number.isInteger(normalCharBudget)||normalCharBudget<1||!Number.isInteger(absoluteCharBudget)||absoluteCharBudget<normalCharBudget)throw Error('Valid retrieval character budgets required');
    this.directory=directory;this.now=now;this.ttlMs=ttlMs;this.normalCharBudget=normalCharBudget;this.absoluteCharBudget=absoluteCharBudget;this.entries=new Map();this.pending=new Map();
    this.metrics={cache_hits:0,cache_misses:0,conditional_revalidations:0,not_modified_304:0,source_text_chars_retrieved:0,fulltext_retrievals:0,metadata_retrievals:0,failed_retrievals:0,normal_char_budget:normalCharBudget,absolute_char_budget:absoluteCharBudget,normal_char_budget_exceeded:false};
  }
  file(key) { return path.join(this.directory,sha256(key)+'.json'); }
  key(url,kind) { if(!['metadata','fulltext'].includes(kind)) throw Error('Explicit retrieval kind required'); return kind+':'+researchUrl(url); }
  readStored(key){
    let entry=this.entries.get(key);
    if(!entry&&this.directory){try{entry=JSON.parse(fs.readFileSync(this.file(key),'utf8'));}catch{return null;}}
    if(!entry)return null;
    const fetched=time(entry.fetched_at);
    if(entry.key!==key||typeof entry.text!=='string'||sha256(entry.text)!==entry.content_hash||!Number.isFinite(fetched))return null;
    return entry;
  }
  load(key) {
    const entry=this.readStored(key);if(!entry)return null;
    const now=time(this.now()),fetched=time(entry.fetched_at),expires=time(entry.expires_at);
    if(!Number.isFinite(now)||!Number.isFinite(expires)||fetched>now||expires<=now||now-fetched>=this.ttlMs||expires-fetched>this.ttlMs)return null;
    return entry;
  }
  persist(key,entry){
    this.entries.set(key,entry);
    if(this.directory){fs.mkdirSync(this.directory,{recursive:true});const temp=this.file(key)+'.'+process.pid+'.'+Math.random().toString(16).slice(2)+'.tmp';fs.writeFileSync(temp,JSON.stringify(entry));fs.renameSync(temp,this.file(key));}
  }
  async retrieve(url,fetcher,{kind='fulltext',force=false}={}) {
    const normalized=researchUrl(url),key=this.key(url,kind);
    if(!force) {
      const hit=this.load(key);
      if(hit) {this.metrics.cache_hits++;return {...hit,cache_status:'hit'};}
      if(this.pending.has(key)) {this.metrics.cache_hits++;return {...await this.pending.get(key),cache_status:'coalesced'};}
    }
    this.metrics.cache_misses++;
    const stale=!force?this.readStored(key):null;
    const conditional=stale?{etag:stale.etag||null,last_modified:stale.last_modified||null}:null;
    if(conditional?.etag||conditional?.last_modified)this.metrics.conditional_revalidations++;
    const task=(async()=>{
      try {
        const result=await fetcher(normalized,{kind,conditional});
        const fetched_at=this.now(),stamp=time(fetched_at);
        if(!Number.isFinite(stamp)) throw Error('Invalid cache clock');
        if(result?.not_modified===true){
          if(!stale)throw Error('304 revalidation requires a prior cached representation');
          const entry={...stale,fetched_at,expires_at:new Date(stamp+this.ttlMs).toISOString(),attempts:result.attempts||stale.attempts||[]};
          this.metrics.not_modified_304++;this.persist(key,entry);return {...entry,cache_status:'not_modified'};
        }
        if(typeof result?.text!=='string'||!result.text.trim()) throw Error('Empty retrieved source');
        const text=compactText(result.text,Math.max(result.text.length,1));
        const next=this.metrics.source_text_chars_retrieved+text.length;
        if(next>this.absoluteCharBudget)throw Error(`retrieval_character_budget_exceeded:${next}>${this.absoluteCharBudget}`);
        this.metrics.normal_char_budget_exceeded=next>this.normalCharBudget;
        const entry={schema_version:'1.0.0',key,canonical_url:normalized,resolved_url:result.url||normalized,
          fetched_at,expires_at:new Date(stamp+this.ttlMs).toISOString(),content_hash:sha256(text),
          published_at:result.published_at||null,metadata:result.metadata||null,etag:result.etag||null,last_modified:result.last_modified||null,attempts:result.attempts||[],text};
        this.metrics[kind==='fulltext'?'fulltext_retrievals':'metadata_retrievals']++;
        this.metrics.source_text_chars_retrieved=next;this.persist(key,entry);
        return {...entry,cache_status:'miss'};
      } catch(error) {this.metrics.failed_retrievals++;throw error;}
    })();
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

export async function runSelectiveResearch(candidates, {now,cache,fetcher,reviewer,primaryAgeHours=PRIMARY_FRESHNESS_HOURS,maxAgeHours=AGENT_SKILLS_FALLBACK_HOURS,minDeepCandidates=DEFAULT_DEEP_CANDIDATE_TARGET,metadataCandidateLimit=DEFAULT_METADATA_CANDIDATE_LIMIT,maxDeepCandidates=MAX_DEEP_CANDIDATE_EXCEPTION}={}) {
  if(!cache || typeof fetcher!=='function' || typeof reviewer!=='function') throw Error('Cache, retriever and explicit editorial reviewer required');
  if(!Number.isInteger(minDeepCandidates)||minDeepCandidates!==DEFAULT_DEEP_CANDIDATE_TARGET) throw Error(`Normal deep target must be ${DEFAULT_DEEP_CANDIDATE_TARGET}`);
  if(!Number.isInteger(metadataCandidateLimit)||metadataCandidateLimit<minDeepCandidates)throw Error('Metadata candidate limit must cover the normal deep target');
  if(!Number.isInteger(maxDeepCandidates)||maxDeepCandidates<minDeepCandidates||maxDeepCandidates>MAX_DEEP_CANDIDATE_EXCEPTION)throw Error(`Deep exception ceiling cannot exceed ${MAX_DEEP_CANDIDATE_EXCEPTION}`);
  const startedAt=new Date().toISOString(),plan=filterCandidates(candidates,{now,primaryAgeHours,maxAgeHours});
  const score=c=>Number.isFinite(c.preliminary_score)?c.preliminary_score:Number.isFinite(c.candidate_score?.total)?c.candidate_score.total:Number.isFinite(c.score)?c.score:0;
  const queues=FOCUSES.map(f=>[
    ...plan.fresh.filter(c=>c.focus===f).sort((a,b)=>score(b)-score(a)),
    ...plan.fallback.filter(c=>c.focus===f).sort((a,b)=>score(b)-score(a))
  ]);
  const ranked=[];
  while(queues.some(q=>q.length))for(const queue of queues)if(queue.length)ranked.push(queue.shift());
  const ordered=ranked.slice(0,metadataCandidateLimit),packets=[],failures=[],pending_review=[],processed=[];
  let earlyStop=false,hardStopReason=null;
  for(const candidate of ordered) {
    if(processed.length>=minDeepCandidates&&researchSufficiency(packets,{now,primaryAgeHours}).sufficient){earlyStop=true;hardStopReason='fresh_sufficiency_met';break;}
    if(processed.length>=maxDeepCandidates){hardStopReason='deep_exception_ceiling';break;}
    processed.push(candidate.candidate_id);
    try{
      const source=await cache.retrieve(candidate.canonical_url,fetcher,{kind:'fulltext'});
      const review=await reviewer(candidate,source);
      if(!review||review.status!=='reviewed'){pending_review.push(candidate.candidate_id);continue;}
      packets.push(createEvidencePacket(candidate,{...source,evidence_kind:'retrieved_source_text'},review));
    }catch(e){failures.push({candidate_id:candidate.candidate_id,reason:e.message});}
  }
  const sufficiency=researchSufficiency(packets,{now,primaryAgeHours});
  if(!hardStopReason&&processed.length>=maxDeepCandidates&&!sufficiency.sufficient)hardStopReason='deep_exception_ceiling';
  const telemetry=researchTelemetry({startedAt,endedAt:new Date().toISOString(),cache,packets,scope:'selective_research'});
  telemetry.research.metadata_candidates_considered=ordered.length;
  telemetry.research.metadata_candidates_deferred=Math.max(0,ranked.length-ordered.length);
  telemetry.research.deep_candidates=processed.length;
  telemetry.research.early_stop_triggered=earlyStop;
  telemetry.research.hard_stop_reason=hardStopReason;
  return {plan,packets,failures,pending_review,processed,
    deferred:[...ordered.filter(c=>!processed.includes(c.candidate_id)),...ranked.slice(metadataCandidateLimit)],sufficiency,telemetry,
    selection_status:sufficiency.sufficient?'ready_for_single_editorial_pass':'requires_targeted_exception_or_additional_evidence'};
}
