// Article-only policy. Historical artifacts with no policy identity keep their original ceilings.
export const ARTICLE_FRESHNESS_POLICY='article-24-72-168-v1';
export const LEGACY_ARTICLE_FRESHNESS_POLICY='article-24-72-skills168-v1';
export const ARTICLE_PRIMARY_HOURS=24;
export const ARTICLE_NORMAL_FALLBACK_HOURS=72;
export const ARTICLE_EXTENDED_FALLBACK_HOURS=168;
const stamp=value=>typeof value==='string'&&value.trim()?Date.parse(value):NaN;
export function articleFreshness(publishedAt,cutoff,{policy=ARTICLE_FRESHNESS_POLICY,agentSkill=false}={}){
 if(![ARTICLE_FRESHNESS_POLICY,LEGACY_ARTICLE_FRESHNESS_POLICY].includes(policy))throw Error('unknown_article_freshness_policy');
 const published=stamp(publishedAt),now=stamp(cutoff),age=(now-published)/3600000;
 const max=policy===ARTICLE_FRESHNESS_POLICY||agentSkill?ARTICLE_EXTENDED_FALLBACK_HOURS:ARTICLE_NORMAL_FALLBACK_HOURS;
 if(!Number.isFinite(age)||age<0||age>max)return null;
 return {tier:age<=24?'primary':'fallback',fallback_band:age<=24?null:age<=72?'normal':'extended',age_hours:age};
}
export function compareArticleFreshness(a,b,cutoff){
 const rank=x=>{const f=articleFreshness(x.published_at,cutoff);return !f?3:f.tier==='primary'?0:f.fallback_band==='normal'?1:2;};
 return rank(a)-rank(b);
}
export function articleFallbackLabel(f){return f?.fallback_band==='extended'?'Extended recency fallback':'Recency fallback';}
export function balancedArticleEvidencePlan(gate){
 const focuses=['technical_ai_engineering','applied_genai_knowledge_workers','agents_non_technical_people'];
 const preferred=gate.preferred_agent_skill_candidate_id||gate.candidates.find(x=>x.agent_skill_story_ready)?.candidate_id;
 if(!preferred)throw Error('preferred_agent_skill_candidate_required');
 const plan=[];
 for(const focus of focuses){
  const pool=gate.candidates.filter(x=>x.focus_hint===focus&&x.background_only!==true&&x.production_novelty_eligible!==false&&(gate.article_freshness_policy!==ARTICLE_FRESHNESS_POLICY||articleFreshness(x.published_at,gate.cutoff))).sort((a,b)=>(gate.article_freshness_policy===ARTICLE_FRESHNESS_POLICY?compareArticleFreshness(a,b,gate.cutoff):0)||(b.prefilter_score||0)-(a.prefilter_score||0)||String(a.candidate_id).localeCompare(String(b.candidate_id)));
  if(focus==='agents_non_technical_people'){
   const skill=pool.find(x=>x.candidate_id===preferred);
   if(!skill)throw Error('preferred_agent_skill_candidate_not_in_agent_focus');
   plan.push(skill,...pool.filter(x=>x!==skill).slice(0,2));
  }else plan.push(...pool.slice(0,3));
 }
 if(plan.length!==9||focuses.some(f=>plan.filter(x=>x.focus_hint===f).length!==3))throw Error('nine_candidate_balanced_review_plan_required');
 return plan;
}
