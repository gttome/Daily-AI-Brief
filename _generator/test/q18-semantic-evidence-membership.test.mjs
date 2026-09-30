import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const script='_tools/validate-qualification-semantic-receipt.mjs';
const write=(dir,name,obj)=>{const p=path.join(dir,name);fs.writeFileSync(p,JSON.stringify(obj));return p;};
const baseSemantic={
 semantic_pass_count:1,source_packet_frozen:true,discovery_rerun:false,article_evidence_rerun:false,
 selection:[
  {candidate_id:'t1',focus:'technical_ai_engineering'},{candidate_id:'t2',focus:'technical_ai_engineering'},
  {candidate_id:'a1',focus:'applied_genai_knowledge_workers'},{candidate_id:'a2',focus:'applied_genai_knowledge_workers'},
  {candidate_id:'g1',focus:'agents_non_technical_people',agent_skills_story:true},{candidate_id:'g2',focus:'agents_non_technical_people'}
 ]
};
test('semantic selection must be contained in frozen article evidence',()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'q18-semantic-'));
 const evidence=write(d,'e.json',{model_visible:['t1','t2','a1','a2','g1','g2'].map(candidate_id=>({candidate_id}))});
 const good=write(d,'s.json',baseSemantic);
 assert.doesNotThrow(()=>execFileSync(process.execPath,[script,good,evidence]));
 const bad=write(d,'bad.json',{...baseSemantic,selection:baseSemantic.selection.map((x,i)=>i===1?{...x,candidate_id:'m11'}:x)});
 assert.throws(()=>execFileSync(process.execPath,[script,bad,evidence],{stdio:'pipe'}),/qualification_semantic_selection_outside_article_evidence/);
});
