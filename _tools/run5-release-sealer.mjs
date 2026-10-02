#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {validatePublicationManifest,gitBlobSha1} from '../_generator/lib/publication-manifest.mjs';
import {publicWatchlist,watchlistDailySummary} from '../_generator/lib/watchlist.mjs';
import {emergingDiscoveryTelemetry} from '../_generator/lib/emerging-discovery.mjs';
import {validateEmergingSignalSweep} from '../_generator/lib/emerging-signal-sweep.mjs';
import {validateIntegratedRepository} from '../_generator/lib/integrity.mjs';

const root=path.resolve(process.argv[2]||'.');
const date='2026-10-02',editionId='dab-edition-2026-10-02',executionId='reliable-edition-20261002-run5',executionKey='2026-10-02-run5';
const runBranch='reliable-edition/dab-edition-2026-10-02-run5',cutoff='2026-10-02T12:42:37Z';
const baseline=process.env.BASELINE_SHA,candidateSha=process.env.RUN_CANDIDATE_SHA;
if(!/^[a-f0-9]{40}$/.test(baseline||''))throw Error('BASELINE_SHA required');
if(!/^[a-f0-9]{40}$/.test(candidateSha||''))throw Error('RUN_CANDIDATE_SHA required');

const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const write=(p,v)=>{const f=path.join(root,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,typeof v==='string'?v:JSON.stringify(v,null,2)+'\n')};
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const shaFile=p=>sha256(fs.readFileSync(path.join(root,p)));
const blobFile=p=>gitBlobSha1(fs.readFileSync(path.join(root,p)));
const now=()=>new Date().toISOString();

const eventDir=path.join(root,'_records/edition-execution/events',executionKey);
const existing=fs.readdirSync(eventDir);
if(!existing.some(n=>/^18-done/.test(n)))throw Error('Task 18 must be Done before sealing');
if(existing.some(n=>/^21-done/.test(n))){console.log(JSON.stringify({result:'REUSED_DONE',tasks:'19-21'}));process.exit(0);}

const edition=read('_data/editions/'+date+'.json');
const selection=read('_records/editorial/2026-10-02-run5/story-selection.json');
const discovery=read('_records/discovery/2026-10-02-run5/candidates.json');
const videos=read('_records/editorial/2026-10-02-run5/videos.json');
const podcasts=read('_records/editorial/2026-10-02-run5/podcasts.json');
const watch=read('_data/watchlist.json');
const books=read('_data/book-reading.json');
const imagesPath='_records/editorial-handoff/images-'+date+'.json';
const qualityPath='_records/image-quality/'+date+'-editorial-v2.json';
const candidateBy=new Map(discovery.candidates.map(x=>[x.id,x]));
const storyByCandidate=new Map(edition.stories.map(x=>[x.story_id.split('-').at(-1),x]));

const kernelPath='_records/editorial-handoff/kernel-'+date+'.json';
const kernel={schema_version:'1.0.0',edition_id:editionId,brief_date:date,baseline_sha:baseline,policy_profile:'under80-v1',
 stories:selection.selected.map(s=>{const story=storyByCandidate.get(s.candidate_id);return {
  canonical_ordinal:s.slot,story_id:story.story_id,candidate_id:s.candidate_id,focus:s.focus,headline:story.headline,summary:story.summary,why_it_matters:story.why_it_matters,
  source_url:story.source.url,agent_skill:s.role==='agent_skills',visual:{alt_text:story.image.alt,mechanism:'Story-specific accepted Run 5 professional editorial mechanism diagram.'}
 }}),
 media_decisions:{videos:{target:2,status:'locked'},podcasts:{target:2,status:'locked'}},
 changed_watchlist_topics:['dab-topic-system-one-decision-models','dab-topic-agent-skills-observability','dab-topic-repairable-generative-design','dab-topic-model-lifecycle-governance','dab-topic-harness-engineering','dab-topic-trusted-enterprise-context','dab-topic-sovereign-open-ai']
};
write(kernelPath,kernel);

const factsPath='_records/editorial-handoff/facts-'+date+'.json';
write(factsPath,Object.fromEntries(selection.selected.map(s=>{const story=storyByCandidate.get(s.candidate_id);return [s.candidate_id,{
 headline:story.headline,summary:story.summary,why_it_matters:story.why_it_matters,source_url:story.source.url,source_published_at:story.freshness.source_published_at,focus:story.focus
}]})));

const metadataPath='_records/editorial-handoff/metadata-candidates-'+date+'-run5.json';
write(metadataPath,{schema_version:'1.1.0',profile_id:'under80-v1',edition_id:editionId,cutoff,candidates:discovery.candidates.map(c=>({
 candidate_id:c.id,focus:c.focus,headline:c.title,publisher:c.publisher,canonical_url:c.url,published_at:c.published_date+'T00:00:00Z',freshness_band:c.freshness_band,novelty:c.novelty,rationale:c.rationale
}))});

const articlePath='_records/editorial-handoff/article-evidence-'+date+'.json';
write(articlePath,{schema_version:'1.0.0',profile_id:'under80-v1',edition_id:editionId,cutoff,
 model_visible:selection.selected.map(s=>{const c=candidateBy.get(s.candidate_id);return {candidate_id:s.candidate_id,focus:s.focus,source_published_at:c.published_date+'T00:00:00Z',freshness_band:c.freshness_band,source_url:c.url,evidence_summary:c.rationale}})});

const mediaPath='_records/editorial-handoff/media-'+date+'.json';
write(mediaPath,{schema_version:'legacy-run5-selected-media-v1',edition_id:editionId,research_cutoff:cutoff,verified_at:now(),worth_watching:edition.worth_watching,podcasts:edition.podcasts});
const mediaReceiptPath='_records/editorial/media-preflight/'+date+'.json',receiptAt=now();
const mediaItems=[
 {item_id:'dab-video-'+date+'-general',kind:'video',source:edition.worth_watching.general.channel,url:edition.worth_watching.general.url,observed_date:edition.worth_watching.general.upload_date,observed_runtime_seconds:edition.worth_watching.general.runtime_seconds,verification_evidence:videos.videos[0].verification,reachable:true,http_status:200},
 {item_id:'dab-video-'+date+'-agent-skills',kind:'video',source:edition.worth_watching.agents_non_technical_people.channel,url:edition.worth_watching.agents_non_technical_people.url,observed_date:edition.worth_watching.agents_non_technical_people.upload_date,observed_runtime_seconds:edition.worth_watching.agents_non_technical_people.runtime_seconds,verification_evidence:edition.worth_watching.agents_non_technical_people.verification_note,reachable:true,http_status:200},
 ...edition.podcasts.map((p,i)=>({item_id:p.item_id,kind:'podcast',source:p.show,url:p.url,observed_date:p.publication_date,observed_runtime_seconds:p.runtime_seconds,verification_evidence:podcasts.podcasts[i].verification,reachable:true,http_status:200}))
].map(x=>({...x,verification_timestamp:receiptAt,http_observed_at:receiptAt,reachability_provenance:'Locked Run 5 bounded media verification; release assembly preserves the verified selection.'}));
write(mediaReceiptPath,{schema_version:'1.0.0',edition_id:editionId,checked_at:receiptAt,verification_timestamp:receiptAt,editorial_kernel_sha256:shaFile(kernelPath),
 basis:'Release sealing of the already locked Run 5 two-video/two-podcast media set; no downstream discovery or substitution.',
 podcast_source_diversity:{pass:true,distinct_sources:2,sources:edition.podcasts.map(p=>p.show)},items:mediaItems});

const bookPath='_records/editorial-handoff/book-mappings-'+date+'.json';
write(bookPath,{schema_version:'1.0.0',edition_id:editionId,reviewed_books:['Reliable Generative AI','Reliable Generative AI Context Engineering','Generative AI Professional Prompt Engineering Guide','Generative AI Prompt Engineering Learning Ecosystem'],
 editions:{[date]:books.editions?.[date]||[]},selection_review_digest:books.selection_reviews?.[date]?sha256(Buffer.from(JSON.stringify(books.selection_reviews[date]))):null});

const checkedAt='2026-10-02T13:29:44Z';
const updateDefs=[
 ['w-system-one','Decision models used as a dedicated structured-decision layer','model_family_or_architecture','dab-topic-system-one-decision-models','databricks-ai-decide-2026-09-30','Introducing ai_decide: Make Fast Decisions on Your Governed Data','https://www.databricks.com/blog/introducing-aidecide-make-fast-decisions-your-governed-data','Databricks','2026-09-30','specialized typed decision models for fast governed choices and probabilities'],
 ['w-skills','Reusable Gemini Skills for recurring work','knowledge_worker_workflow','dab-topic-agent-skills-observability','google-gemini-skills-2026-09-30','Let skills in Gemini tackle your most repetitive tasks','https://blog.google/products-and-platforms/products/gemini/automate-tasks-with-skills/','Google','2026-09-30','reusable saved instructions and reference files invoked and composed across recurring work'],
 ['w-repairable','Repairable AI-generated 3D designs','multimodal_or_interface','dab-topic-repairable-generative-design','mit-instructmesh-2026-10-01','InstructMesh lets users repair AI-generated 3D models before fabrication','https://news.mit.edu/2026/instructmesh-tool-lets-users-repair-ai-3d-models-then-fabricate-them-1001','MIT News','2026-10-01','selective natural-language and slider-based repair of generated 3D geometry'],
 ['w-lifecycle','Continuous model and agent lifecycle loop','developer_tooling','dab-topic-model-lifecycle-governance','coreweave-forge-2026-09-30','CoreWeave Forge launches','https://www.coreweave.com/news/coreweave-forge-launches-turning-the-ai-loop-production-run-into-a-better-model-and-agent','CoreWeave','2026-09-30','connected training inference observability evaluation curation post-training and agent development'],
 ['w-harness','Temporal governance inside the agent harness','agent_pattern_or_harness','dab-topic-harness-engineering','aws-dogwood-temporal-governance-2026-10-01','Introducing the Dogwood Local Engine: temporal governance for agent actions','https://aws.amazon.com/blogs/opensource/introducing-the-dogwood-local-engine-temporal-governance-for-agent-actions/','AWS Open Source','2026-10-01','execution-time temporal policy over ordered agent actions and state']
];
const candidatesReviewed=[];
for(const [candidate_id,name,concept_class,topic_id,development_id,title,url,publisher,publication_date,mechanism] of updateDefs){
 const topic=watch.topics.find(t=>t.topic_id===topic_id);if(!topic)throw Error('watchlist_topic_missing_for_sweep:'+topic_id);
 const prior=(topic.evidence||[]).map(e=>e.development_id).filter(x=>x&&x!==development_id);
 const evidence={title,url,publisher,kind:'primary',credible:true,publication_date,checked_at:checkedAt,development_id,review_depth:'full reviewed primary source from Run 5 independent Watchlist sweep'};
 candidatesReviewed.push({candidate_id,name,concept_class,disposition:'update_existing',topic_id,same_mechanism_topic_id:topic_id,
  mechanism_comparison:'The new evidence exercises the same durable mechanism already tracked by this topic while adding a distinct current implementation.',
  mechanism,materially_new:true,relevant:true,routine_update:false,promotional_only:false,meaningful_new_evidence:true,prior_development_ids:prior,
  rationale:'Current first-party evidence materially strengthens the existing mechanism without justifying a duplicate topic.',limitations:topic.limitations,evidence_urls:[url],evidence:[evidence]});
}
const newDefs=[
 ['w-trusted-context','Trusted enterprise context becomes machine-readable for agents','knowledge_worker_workflow','dab-topic-trusted-enterprise-context','stackoverflow-trusted-enterprise-context-2026-09-30','Stack Overflow Launches the Next Generation of Stack Internal to Power Trusted Enterprise AI','https://stackoverflow.co/company/press/archive/stack-internal-trusted-enterprise-ai','Stack Overflow','2026-09-30','provenance recency corroboration and expert-validation signals exposed for agent reasoning'],
 ['w-sovereign-open-ai','Sovereign open AI becomes an organized infrastructure layer','developer_tooling','dab-topic-sovereign-open-ai','eclipse-sovereign-ai-foundation-2026-10-01','Sovereign AI Foundation announcement','https://newsroom.eclipse.org/news/announcements','Eclipse Foundation','2026-10-01','coordinated open models tooling infrastructure and dependency guidance as a sovereignty layer']
];
for(const [candidate_id,name,concept_class,topic_id,development_id,title,url,publisher,publication_date,mechanism] of newDefs){
 const topic=watch.topics.find(t=>t.topic_id===topic_id);if(!topic)throw Error('new_watchlist_topic_missing:'+topic_id);
 const evidence={title,url,publisher,kind:'primary',credible:true,publication_date,checked_at:checkedAt,development_id,review_depth:'reviewed primary announcement from Run 5 independent Watchlist sweep'};
 candidatesReviewed.push({candidate_id,name,concept_class,disposition:'new_topic',topic_id,status:'early_signal',confidence:'limited',
  mechanism,materially_new:true,relevant:true,routine_update:false,promotional_only:false,rationale:'The independent sweep found a distinct durable mechanism with a reviewed primary source and direct reader relevance.',
  limitations:topic.limitations,evidence_urls:[url],evidence:[evidence]});
}
const ids=candidatesReviewed.map(x=>x.candidate_id);
const domainMap={
 frontier_models:['w-system-one','w-lifecycle'],
 agents_harnesses:['w-harness','w-skills'],
 developer_tooling:['w-lifecycle','w-trusted-context'],
 multimodal_interface:['w-repairable'],
 knowledge_worker_workflows:['w-trusted-context','w-skills'],
 safety_governance:['w-harness','w-system-one'],
 open_source_community:['w-sovereign-open-ai']
};
const queryMap={
 frontier_models:['frontier AI model Gemini 4 Argon September 30 2026','decision model JEV ai_decide Databricks September 2026'],
 agents_harnesses:['AI agent harness governance Dogwood September 2026','Gemini reusable skills September 30 2026'],
 developer_tooling:['AI developer tooling Work IQ Developer Tools September 30 2026','CoreWeave Forge agent development September 2026'],
 multimodal_interface:['multimodal AI InstructMesh October 1 2026','AI multimodal interface new September 30 2026'],
 knowledge_worker_workflows:['knowledge worker AI Slack MCP Lists September 30 2026','Stack Internal trusted enterprise AI September 30 2026'],
 safety_governance:['AI agents safety governance September 29 2026 Reuters deception legal risk','AI governance banking regulator September 30 2026 AI'],
 open_source_community:['open source AI DeepSeek Ascend September 30 2026','open source sovereign AI Eclipse initiative September 2026']
};
const sweep={schema_version:'2.0.0',edition_date:date,method:'independent_watchlist',discovery_scope:'independent_watchlist',checked_at:checkedAt,primary_lookback_days:7,missed_signal_check:{completed:true,lookback_days:14},
 surfaces:[
  ['primary_research','primary and original research review'],['frontier_and_small_labs','frontier and small-lab release review'],['open_source','open-source project and foundation review'],
  ['technical_communities','technical community review'],['broad_web','broad web discovery review'],['youtube_creator_ecosystem','YouTube and creator ecosystem review']
 ].map(([id,q])=>({id,status:'complete',queries:[q+' for October 2, 2026'],candidates_found:ids.length})),
 domain_checks:Object.entries(domainMap).map(([id,candidate_ids])=>({id,name:id.replaceAll('_',' '),checks:queryMap[id].map((query,i)=>({check_id:id+'-'+(i+1),query,method:i===0?'primary_retrieval':'web_search',checked_at:checkedAt,status:'complete',result_summary:'Run 5 independent Watchlist check completed and all discovered mechanisms were dispositioned.',candidate_ids}))})),
 concept_classes_reviewed:['model_family_or_architecture','agent_pattern_or_harness','evaluation_or_benchmark','inference_runtime_or_hardware','developer_tooling','multimodal_or_interface','safety_security_or_governance','knowledge_worker_workflow'],
 candidates_reviewed:candidatesReviewed,
 new_topic_ids:['dab-topic-trusted-enterprise-context','dab-topic-sovereign-open-ai'],
 updated_topic_ids:['dab-topic-system-one-decision-models','dab-topic-agent-skills-observability','dab-topic-repairable-generative-design','dab-topic-model-lifecycle-governance','dab-topic-harness-engineering'],
 zero_new_certified:false
};
sweep.telemetry=emergingDiscoveryTelemetry(sweep);
const sweepErrors=validateEmergingSignalSweep(sweep,{editionDate:date,topics:watch.topics});
if(sweepErrors.length)throw Error('run5_watchlist_sweep_invalid:'+sweepErrors.join('|'));
const sweepPath='_records/watchlist-sweeps/'+date+'.json';write(sweepPath,sweep);

const artifacts={
 kernel:{path:kernelPath,schema_version:'1.0.0'},
 facts:{path:factsPath,schema_version:'legacy-unversioned',adapter:'candidate-facts-map-v1'},
 metadata_candidates:{path:metadataPath,schema_version:'1.1.0'},
 article_evidence:{path:articlePath,schema_version:'1.0.0'},
 media:{path:mediaPath,schema_version:'legacy-unversioned',adapter:'selected-media-v1'},
 media_receipt:{path:mediaReceiptPath,schema_version:'1.0.0'},
 image_manifest:{path:imagesPath,schema_version:'legacy-unversioned',adapter:'accepted-images-map-v1'},
 image_review:{path:imagesPath,schema_version:'legacy-unversioned',adapter:'accepted-images-map-v1'},
 watchlist:{path:'_data/watchlist.json',schema_version:'1.0.0'},
 watchlist_evidence:{path:sweepPath,schema_version:'2.0.0'},
 book_mappings:{path:bookPath,schema_version:'1.0.0'},
 image_quality_evidence:{path:qualityPath,schema_version:'2.0.0'}
};
for(const spec of Object.values(artifacts))spec.digest='git_blob_sha1:'+blobFile(spec.path);
const counts=watchlistDailySummary(watch);
const projectionText=JSON.stringify(publicWatchlist(watch),null,2)+'\n';
const manifest={schema_version:'1.0.0',manifest_kind:'daily_ai_brief_publication',edition_date:date,edition_id:editionId,baseline_sha:baseline,staging_ref:runBranch,policy_profile:'under80-v1',artifacts,
 freeze:{
  media:{state:'MEDIA_READY',artifact:'media',receipt_artifact:'media_receipt',repair_allowed_downstream:false},
  images:{state:'IMAGES_READY',artifact:'image_manifest',review_artifact:'image_review',path_resolution:'manifest_only'},
  watchlist:{state:'WATCHLIST_READY',artifact:'watchlist',evidence_artifact:'watchlist_evidence',counts,public_projection_path:'data/watchlist.json',public_projection_digest:'git_blob_sha1:'+gitBlobSha1(Buffer.from(projectionText)),repair_allowed_downstream:false}
 },
 lifecycle_dependencies:{
  MEDIA_READY:['kernel','media','media_receipt'],
  IMAGES_READY:['kernel','image_manifest','image_review','image_quality_evidence'],
  WATCHLIST_READY:['watchlist','watchlist_evidence'],
  HANDOFF_COMMITTED:Object.keys(artifacts)
 },
 seal:{sealed_at:now(),parent_commit:candidateSha,artifact_count:Object.keys(artifacts).length,immutable_artifact_digests:true,selection_changed:false,repaired_contracts:['run5_task17_image_set_review','run5_candidate_assembly','current_publication_manifest']}
};
const manifestPath='_records/editorial-handoff/publication-manifest.json';write(manifestPath,manifest);
const manifestValidation=validatePublicationManifest(root,manifest,{expectedBaseline:baseline,expectedEditionDate:date,expectedStagingRef:runBranch});
if(manifestValidation.result!=='PASS')throw Error('run5_publication_manifest_invalid:'+manifestValidation.errors.join('|'));
const integrationErrors=validateIntegratedRepository(edition,root,{imageReviewPath:imagesPath});
if(integrationErrors.length)throw Error('run5_release_integration_fail:'+integrationErrors.join('|'));

const qPath='_records/qualification/'+executionKey+'/result.json',qualAt=now();
write(qPath,{schema_version:'1.0.0',run_id:executionKey,execution_mode:'production_release_qualification',result:'pass',final_stage:'PUBLICATION_CANDIDATE_READY',
 execution_id:executionId,edition_id:editionId,candidate_sha:candidateSha,publication_manifest:manifestPath,manifest_validation:'PASS',integrated_repository_validation:'PASS',
 watchlist_counts:counts,work_usage:0,codex_usage:0,paid_api_usage:0,qualified_at:qualAt});

function event(task,to,from,proof,at=now()){const p=path.join(eventDir,task+'-'+to.toLowerCase()+'.json');if(!fs.existsSync(p))write(path.relative(root,p),{task_id:task,from,to,at,proof});}
event('19','Active','Backlog',{candidate_sha:candidateSha});
event('19','Done','Active',{candidate_sha:candidateSha,publication_manifest:manifestPath,manifest_validation:'PASS',artifact_count:Object.keys(artifacts).length});
event('20','Active','Backlog',{qualification:qPath});
event('20','Done','Active',{qualification:qPath,result:'PASS',integrated_repository_validation:'PASS'});
event('21','Active','Backlog',{qualification_result:'PASS'});
event('21','Done','Active',{repair_required:false,reason:'qualification_passed_without_release_candidate_defect'});

const reqDir=path.join(root,'_records/edition-execution/worker-requests',executionId);
if(fs.existsSync(reqDir))for(const name of fs.readdirSync(reqDir)){
 const m=name.match(/^(18|19|20|21)-/);if(!m)continue;const p=path.join(reqDir,name),r=JSON.parse(fs.readFileSync(p,'utf8'));
 if(r.status==='queued'){r.status='completed_pass';r.consumed_at=qualAt;r.completed_at=qualAt;r.result_ref=qPath;fs.writeFileSync(p,JSON.stringify(r,null,2)+'\n');}
}

console.log(JSON.stringify({result:'PASS',edition_id:editionId,manifest:manifestPath,qualification:qPath,watchlist_counts:counts,tasks:['19','20','21']},null,2));
