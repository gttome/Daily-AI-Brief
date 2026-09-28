#!/usr/bin/env node
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {retrieveSource,extractCandidateMetadata,compactDiscoveryHtml} from './discovery-links.mjs';
const req=JSON.parse(fs.readFileSync('_records/qualification-feed-probe/request.json','utf8'));
if(!/^\d{4}-\d{2}-\d{2}-D\d+$/.test(req.diagnostic_id||'')||req.production_mutation!==false)throw Error('invalid_probe_request');
const dir='_records/qualification-feed-probe/'+req.diagnostic_id;
if(fs.existsSync(dir+'/report.json'))throw Error('probe_already_terminal');
fs.mkdirSync(dir,{recursive:true});
const endpoints=[
 ['google-workspace-current','https://workspaceupdates.googleblog.com/atom.xml','atom'],
 ['google-workspace-direct-atom','https://workspaceupdates.googleblog.com/feeds/posts/default?alt=atom&max-results=20','atom'],
 ['google-workspace-direct-rss','https://workspaceupdates.googleblog.com/feeds/posts/default?alt=rss&max-results=20','rss'],
 ['atlassian-current','https://www.atlassian.com/blog/feed','rss'],
 ['atlassian-query-feed','https://www.atlassian.com/blog/?feed=rss2','rss'],
 ['copilot-all-feed','https://www.microsoft.com/en-us/copilot/blog/feed/','rss']
];
const report={schema_version:'1.0.0',diagnostic_id:req.diagnostic_id,started_at:new Date().toISOString(),workflow_run_id:process.env.GITHUB_RUN_ID,production_mutation:false,model_calls:0,semantic_pass_started:false,qualification_pass:false,probes:[]};
for(const [id,url,format] of endpoints){
 try{
  const r=await retrieveSource(url,{maxResponseBytes:1500000,maxNormalizedChars:900000});
  const source={source_id:id,owner:id,format,evidence_class:'publisher_authored'};
  const raw=extractCandidateMetadata(r.text,r.url||url,source),compact=extractCandidateMetadata(compactDiscoveryHtml(r.text),r.url||url,source);
  const ai=list=>list.filter(x=>/agent|AI|chatgpt|gpt|codex|context|retrieval|evaluation|copilot|gemini|claude|skill|prompt|LLM/i.test(x.headline||''));
  const fresh=list=>list.filter(x=>{const t=Date.parse(x.published_at);return Number.isFinite(t)&&Date.now()-t>=0&&Date.now()-t<=72*3600000;});
  report.probes.push({source_id:id,requested_url:url,resolved_url:r.url,body_sha256:createHash('sha256').update(r.text).digest('hex'),body_chars:r.text.length,body_kind:/<(rss|feed)\b/i.test(r.text)?'xml_feed':/<html\b/i.test(r.text)?'html':'other',entry_count:(r.text.match(/<(item|entry)\b/gi)||[]).length,http_link_count:(r.text.match(/(?:href=["']|<link>)http:\/\//gi)||[]).length,raw_extracted:raw.length,compact_extracted:compact.length,raw_ai:ai(raw).length,compact_ai:ai(compact).length,raw_fresh_ai:fresh(ai(raw)).length,compact_fresh_ai:fresh(ai(compact)).length,result:'checked'});
 }catch(e){report.probes.push({source_id:id,requested_url:url,result:'unavailable',error:e.message});}
 fs.writeFileSync(dir+'/report.json',JSON.stringify(report,null,2)+'\n');
}
report.completed_at=new Date().toISOString();report.result='probe_complete';fs.writeFileSync(dir+'/report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
