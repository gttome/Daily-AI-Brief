#!/usr/bin/env node
import fs from 'node:fs';
const [semanticPath,evidencePath]=process.argv.slice(2);
if(!semanticPath||!evidencePath) throw new Error('usage: validate-qualification-semantic-receipt <semantic> <article-evidence>');
const semantic=JSON.parse(fs.readFileSync(semanticPath,'utf8'));
const evidence=JSON.parse(fs.readFileSync(evidencePath,'utf8'));
if(semantic.semantic_pass_count!==1) throw new Error('qualification_semantic_pass_count_invalid');
if(semantic.source_packet_frozen!==true||semantic.discovery_rerun!==false||semantic.article_evidence_rerun!==false) throw new Error('qualification_semantic_freeze_invalid');
if(!Array.isArray(semantic.selection)||semantic.selection.length!==6) throw new Error('qualification_semantic_exactly_six_required');
const ids=new Set((evidence.model_visible||[]).map(x=>x.candidate_id));
const outside=semantic.selection.filter(x=>!ids.has(x.candidate_id)).map(x=>x.candidate_id);
if(outside.length) throw new Error('qualification_semantic_selection_outside_article_evidence:'+outside.join(','));
const counts={technical_ai_engineering:0,applied_genai_knowledge_workers:0,agents_non_technical_people:0};
let skills=0;
for(const s of semantic.selection){
 if(!(s.focus in counts)) throw new Error('qualification_semantic_focus_invalid:'+s.candidate_id);
 counts[s.focus]++;
 if(s.agent_skills_story===true) skills++;
}
if(Object.values(counts).some(n=>n!==2)) throw new Error('qualification_semantic_2_2_2_invalid');
if(skills!==1) throw new Error('qualification_semantic_agent_skills_count_invalid');
console.log(JSON.stringify({result:'pass',selected_candidate_ids:semantic.selection.map(x=>x.candidate_id),article_evidence_count:ids.size},null,2));
