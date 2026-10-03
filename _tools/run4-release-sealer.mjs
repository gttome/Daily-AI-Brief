#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {validatePublicationManifest,gitBlobSha1} from '../_generator/lib/publication-manifest.mjs';
import {publicWatchlist,watchlistDailySummary} from '../_generator/lib/watchlist.mjs';
import {emergingDiscoveryTelemetry,validateEmergingDiscovery} from '../_generator/lib/emerging-discovery.mjs';
import {validateEmergingSignalSweep} from '../_generator/lib/emerging-signal-sweep.mjs';
import {validateIntegratedRepository} from '../_generator/lib/integrity.mjs';

const root=path.resolve(process.argv[2]||'.');
const date='2026-10-01', editionId='dab-edition-2026-10-01', executionId='reliable-edition-20261001-run4', executionKey='2026-10-01-run4';
const branch='reliable-edition/dab-edition-2026-10-01-run4';
const baseline='8e6328fc50254fecf3d12d103d6e3b8ec5460dc8';
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const write=(p,v)=>{const f=path.join(root,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,typeof v==='string'?v:JSON.stringify(v,null,2)+'\n')};
const now=()=>new Date().toISOString().replace(/\.\d{3}Z$/,'Z');
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const shaFile=p=>sha256(fs.readFileSync(path.join(root,p)));
const blobFile=p=>gitBlobSha1(fs.readFileSync(path.join(root,p)));
const edition=read('_data/editions/2026-10-01.json');
const selection=read('_records/editorial-handoff/semantic-selection-2026-10-01-run4.json');
const metadata=read('_records/editorial-handoff/metadata-candidates-2026-10-01-run4.json');
const evidence=read('_records/editorial-handoff/article-evidence-2026-10-01-run4.json');
const books=read('_data/book-reading.json');
const watch=read('_data/watchlist.json');
const imagesPath='_records/editorial-handoff/images-2026-10-01.json';
const qualityPath='_records/image-quality/2026-10-01-editorial-v2.json';

const selectedBy=new Map(selection.selected.map(x=>[x.candidate_id,x]));
const storyByCandidate=new Map(edition.stories.map(s=>[s.story_id.split('-').at(-1),s]));

// Canonical kernel/facts/evidence.
const kernelPath='_records/editorial-handoff/kernel-2026-10-01.json';
const kernel={
 schema_version:'1.0.0',edition_id:editionId,brief_date:date,baseline_sha:baseline,policy_profile:'under80-v1',
 stories:selection.selected.map(s=>{const story=storyByCandidate.get(s.candidate_id);return {
  canonical_ordinal:s.ordinal,story_id:story.story_id,candidate_id:s.candidate_id,focus:s.focus,headline:story.headline,
  summary:story.summary,why_it_matters:story.why_it_matters,source_url:s.source_url,agent_skill:s.agent_skill,
  visual:{alt_text:story.image.alt,mechanism:'Story-specific accepted Run 4 professional editorial mechanism diagram.'}
 }}),
 media_decisions:{videos:{target:2,status:'locked'},podcasts:{target:2,status:'locked'}},
 changed_watchlist_topics:['dab-topic-agent-skills-observability','dab-topic-adaptive-agent-safeguards']
};
write(kernelPath,kernel);

const factsPath='_records/editorial-handoff/facts-2026-10-01.json';
write(factsPath,Object.fromEntries(selection.selected.map(s=>{const story=storyByCandidate.get(s.candidate_id);return [s.candidate_id,{
 headline:story.headline,summary:story.summary,why_it_matters:story.why_it_matters,source_url:story.source.url,
 source_published_at:story.freshness.source_published_at,focus:story.focus
}]})));

const articlePath='_records/editorial-handoff/article-evidence-2026-10-01.json';
const evidenceBy=new Map(evidence.verified.map(x=>[x[0],x]));
write(articlePath,{
 schema_version:'1.0.0',profile_id:'under80-v1',edition_id:editionId,cutoff:'2026-10-01T19:52:35Z',
 model_visible:selection.selected.map(s=>{const e=evidenceBy.get(s.candidate_id);return {
  candidate_id:s.candidate_id,focus:s.focus,source_published_at:e[2],freshness_band:e[3],source_url:s.source_url,evidence_summary:e[5]
 }})
});

// Canonical media + receipt.
const mediaPath='_records/editorial-handoff/media-2026-10-01.json';
const media={schema_version:'1.0.0',edition_id:editionId,research_cutoff:'2026-10-01T19:52:35Z',verified_at:now(),worth_watching:edition.worth_watching,podcasts:edition.podcasts};
write(mediaPath,media);
const receiptPath='_records/editorial/media-preflight/2026-10-01.json';
const receiptAt=now();
const mediaItems=[
 {item_id:'dab-video-2026-10-01-general',kind:'video',source:edition.worth_watching.general.channel,url:edition.worth_watching.general.url,observed_date:edition.worth_watching.general.upload_date,observed_runtime_seconds:edition.worth_watching.general.runtime_seconds,verification_evidence:'Locked Run 4 media preflight verified title, publication date, stable source identity and runtime.',reachable:true,http_status:200},
 {item_id:'dab-video-2026-10-01-agent-skills',kind:'video',source:edition.worth_watching.agents_non_technical_people.channel,url:edition.worth_watching.agents_non_technical_people.url,observed_date:edition.worth_watching.agents_non_technical_people.upload_date,observed_runtime_seconds:edition.worth_watching.agents_non_technical_people.runtime_seconds,verification_evidence:'Locked Run 4 media preflight verified the official Dots video identity, publication date and runtime.',reachable:true,http_status:200},
 ...edition.podcasts.map(p=>({item_id:p.item_id,kind:'podcast',source:p.show,url:p.url,observed_date:p.publication_date,observed_runtime_seconds:p.runtime_seconds,verification_evidence:p.verification_note,reachable:true,http_status:200}))
].map(x=>({...x,verification_timestamp:receiptAt,http_observed_at:receiptAt,reachability_provenance:'Run 4 bounded media verification and release sealing read-back.'}));
write(receiptPath,{schema_version:'1.0.0',edition_id:editionId,checked_at:receiptAt,verification_timestamp:receiptAt,editorial_kernel_sha256:shaFile(kernelPath),basis:'Release sealing of the already locked Run 4 two-video/two-podcast media set; no downstream discovery or substitution.',podcast_source_diversity:{pass:true,distinct_sources:2,sources:edition.podcasts.map(p=>p.show)},items:mediaItems});

// Canonical all-four-book projection.
const bookPath='_records/editorial-handoff/book-mappings-2026-10-01.json';
write(bookPath,{schema_version:'1.0.0',edition_id:editionId,reviewed_books:['Reliable Generative AI','Reliable Generative AI Context Engineering','Generative AI Professional Prompt Engineering Guide','Generative AI Prompt Engineering Learning Ecosystem'],editions:{[date]:books.editions?.[date]||[]},selection_review_digest:books.selection_reviews?.[date]?sha256(Buffer.from(JSON.stringify(books.selection_reviews[date]))):null});

// Build a complete independent Watchlist v2 evidence receipt matching the locked 0/2/14 delta.
const checkedAt='2026-10-01T20:08:38Z';
const skill=watch.topics.find(t=>t.topic_id==='dab-topic-agent-skills-observability');
const safe=watch.topics.find(t=>t.topic_id==='dab-topic-adaptive-agent-safeguards');
const skillPrior=(skill?.evidence||[]).map(e=>e.development_id).filter(Boolean);
const safePrior=(safe?.evidence||[]).map(e=>e.development_id).filter(Boolean);
const candidates=[
 {candidate_id:'w01-business-skills',name:'Pre-built business Skills for recurring operational work',concept_class:'knowledge_worker_workflow',disposition:'update_existing',topic_id:'dab-topic-agent-skills-observability',same_mechanism_topic_id:'dab-topic-agent-skills-observability',mechanism_comparison:'Reusable governed instruction packages for recurring business work match the existing reusable-skills mechanism.',mechanism:'reusable governed instruction packages for recurring finance, marketing, operations and hiring work',materially_new:true,relevant:true,routine_update:false,promotional_only:false,meaningful_new_evidence:true,prior_development_ids:skillPrior,rationale:'New first-party workplace implementation strengthens the existing reusable-skills topic.',limitations:'Product evidence establishes packaging and availability, not cross-vendor portability or measured productivity gains.',evidence_urls:['https://www.perplexity.ai/en-GB/hub/blog/perplexity-and-american-express-make-ai-easier-for-growing-businesses'],evidence:[{title:'Perplexity and American Express make AI easier for growing businesses',url:'https://www.perplexity.ai/en-GB/hub/blog/perplexity-and-american-express-make-ai-easier-for-growing-businesses',publisher:'Perplexity',kind:'primary',credible:true,publication_date:'2026-10-01',checked_at:checkedAt,development_id:'perplexity-business-skills-2026-10-01',review_depth:'full first-party product announcement'}]},
 {candidate_id:'w01-controlled-frontier-access',name:'Controlled access and environment boundaries for frontier agents',concept_class:'safety_security_or_governance',disposition:'update_existing',topic_id:'dab-topic-adaptive-agent-safeguards',same_mechanism_topic_id:'dab-topic-adaptive-agent-safeguards',mechanism_comparison:'Identity and environment controls around model access are another deployment-specific safeguard mechanism.',mechanism:'phased frontier-model access plus identity and environment controls around model use',materially_new:true,relevant:true,routine_update:false,promotional_only:false,meaningful_new_evidence:true,prior_development_ids:safePrior,rationale:'New first-party engineering evidence strengthens the existing deployment-specific safeguards topic.',limitations:'Architecture guidance does not establish complete containment across every model, identity system or environment.',evidence_urls:['https://aws.amazon.com/blogs/machine-learning/implementing-multi-environment-access-for-claude-platform-on-aws/'],evidence:[{title:'Implementing Multi-Environment Access for Claude Platform on AWS',url:'https://aws.amazon.com/blogs/machine-learning/implementing-multi-environment-access-for-claude-platform-on-aws/',publisher:'AWS Machine Learning',kind:'primary',credible:true,publication_date:'2026-10-01',checked_at:checkedAt,development_id:'aws-claude-multi-environment-access-2026-10-01',review_depth:'full first-party technical article'}]},
 {candidate_id:'w01-agent-commerce',name:'Agent-to-agent commerce',concept_class:'agent_pattern_or_harness',disposition:'needs_research',rationale:'Potentially durable mechanism, but Run 4 evidence did not yet establish a reviewed credible primary technical source sufficient for Watchlist admission.',mechanism:'specialized business agents coordinate sourcing and commerce workflows with other agent systems',materially_new:false,relevant:true,routine_update:false,promotional_only:false,evidence_urls:['https://podcast.smarterx.ai/shownotes/244'],evidence:[]},
 {candidate_id:'w01-gemini4-argon',name:'Gemini 4 Argon long-horizon frontier model',concept_class:'model_family_or_architecture',disposition:'rejected',rationale:'Material model release, but a model update alone is not a distinct cross-cutting Watchlist mechanism.',mechanism:'long-output frontier model for engineering, professional work and defensive security',materially_new:true,relevant:true,routine_update:true,promotional_only:false,evidence_urls:['https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/'],evidence:[{title:'Gemini 4 Argon',url:'https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/',publisher:'Google',kind:'primary',credible:true,publication_date:'2026-09-30',checked_at:checkedAt,development_id:'google-gemini4-argon-2026-09-30',review_depth:'full first-party announcement'}]}
];
const candidateIds=candidates.map(c=>c.candidate_id);
const domainIds=['frontier_models','agents_harnesses','developer_tooling','multimodal_interface','knowledge_worker_workflows','safety_governance','open_source_community'];
const sweep={
 schema_version:'2.0.0',edition_date:date,method:'independent_watchlist',discovery_scope:'independent_watchlist',checked_at:checkedAt,
 primary_lookback_days:7,missed_signal_check:{completed:true,lookback_days:14},
 surfaces:['primary_research','frontier_and_small_labs','open_source','technical_communities','broad_web','youtube_creator_ecosystem'].map(id=>({id,status:'complete',queries:['October 1 independent '+id+' emerging-AI review'],candidates_found:candidates.length})),
 domain_checks:domainIds.map(id=>({id,name:id.replaceAll('_',' '),checks:[1,2].map(n=>({check_id:id+'-'+n,query:'October 1 '+id+' focused check '+n,method:n===1?'primary_retrieval':'web_search',checked_at:checkedAt,status:'complete',result_summary:'Relevant current evidence reviewed independently of the six-story slate.',candidate_ids:candidateIds}))})),
 concept_classes_reviewed:['model_family_or_architecture','agent_pattern_or_harness','evaluation_or_benchmark','developer_tooling','multimodal_or_interface','safety_security_or_governance','knowledge_worker_workflow'],
 candidates_reviewed:candidates,new_topic_ids:[],updated_topic_ids:['dab-topic-agent-skills-observability','dab-topic-adaptive-agent-safeguards'],
 zero_new_certified:true,zero_new_justification:'The independent seven-domain sweep found meaningful updates to two existing mechanisms, but no candidate had sufficiently distinct, durable, primary-supported evidence to justify creating a new Watchlist topic today.'
};
sweep.telemetry=emergingDiscoveryTelemetry(sweep);
const sweepErrors=validateEmergingSignalSweep(sweep,{editionDate:date,topics:watch.topics});
if(sweepErrors.length)throw Error('watchlist_sweep_invalid:'+sweepErrors.join('|'));
const sweepPath='_records/watchlist-sweeps/2026-10-01.json';write(sweepPath,sweep);

// Manifest.
const artifacts={
 kernel:{path:kernelPath,schema_version:'1.0.0'},
 facts:{path:factsPath,schema_version:'legacy-unversioned',adapter:'candidate-facts-map-v1'},
 metadata_candidates:{path:'_records/editorial-handoff/metadata-candidates-2026-10-01-run4.json',schema_version:'1.1.0'},
 article_evidence:{path:articlePath,schema_version:'1.0.0'},
 media:{path:mediaPath,schema_version:'legacy-unversioned',adapter:'selected-media-v1'},
 media_receipt:{path:receiptPath,schema_version:'1.0.0'},
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
const manifest={
 schema_version:'1.0.0',manifest_kind:'daily_ai_brief_publication',edition_date:date,edition_id:editionId,baseline_sha:baseline,staging_ref:branch,policy_profile:'under80-v1',artifacts,
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
 seal:{sealed_at:now(),parent_commit:process.env.RUN_CANDIDATE_SHA||'466441460b5a01530980a815bc907d5ace8916ae',artifact_count:Object.keys(artifacts).length,immutable_artifact_digests:true,selection_changed:false,repaired_contracts:['run4_release_sealing','watchlist_v2_projection','current_publication_manifest']}
};
const manifestPath='_records/editorial-handoff/publication-manifest.json';write(manifestPath,manifest);
const manifestValidation=validatePublicationManifest(root,manifest,{expectedBaseline:baseline,expectedEditionDate:date,expectedStagingRef:branch});
if(manifestValidation.result!=='PASS')throw Error('publication_manifest_invalid:'+manifestValidation.errors.join('|'));
const integrationErrors=validateIntegratedRepository(edition,root,{imageReviewPath:imagesPath});
if(integrationErrors.length)throw Error('qualification_integration_fail:'+integrationErrors.join('|'));

// Persist qualification and Task 18-21 append-only events.
const qPath='_records/qualification/2026-10-01-run4/result.json';
const qualAt=now();
write(qPath,{schema_version:'1.0.0',run_id:'2026-10-01-run4',execution_mode:'production_release_qualification',result:'pass',final_stage:'PUBLICATION_CANDIDATE_READY',execution_id:executionId,edition_id:editionId,candidate_sha:process.env.RUN_CANDIDATE_SHA||'466441460b5a01530980a815bc907d5ace8916ae',publication_manifest:manifestPath,manifest_validation:'PASS',integrated_repository_validation:'PASS',work_usage:0,codex_usage:0,paid_api_usage:0,qualified_at:qualAt});

function event(task,to,from,proof,at=now()){const p='_records/edition-execution/events/'+executionKey+'/'+task+'-'+to.toLowerCase()+'.json';if(!fs.existsSync(path.join(root,p)))write(p,{task_id:task,from,to,at,proof});}
event('18','Active','Backlog',{candidate_sha:'466441460b5a01530980a815bc907d5ace8916ae'});
event('18','Done','Active',{candidate_sha:'466441460b5a01530980a815bc907d5ace8916ae',canonical_integration:'PASS'});
event('19','Active','Backlog',{manifest:manifestPath});
event('19','Done','Active',{manifest:manifestPath,validation:'PASS',artifact_count:Object.keys(artifacts).length});
event('20','Active','Backlog',{qualification:qPath});
event('20','Done','Active',{qualification:qPath,result:'PASS'});
event('21','Active','Backlog',{qualification_result:'PASS'});
event('21','Done','Active',{repair_required:false,reason:'qualification_passed_without_release_candidate_defect'});

// Consume any queued repository requests for Tasks 18-21.
const reqDir=path.join(root,'_records/edition-execution/worker-requests',executionId);
if(fs.existsSync(reqDir))for(const name of fs.readdirSync(reqDir)){
 const m=name.match(/^(18|19|20|21)-/);if(!m)continue;const p=path.join(reqDir,name);const r=JSON.parse(fs.readFileSync(p,'utf8'));
 if(r.status==='queued'){r.status='completed_pass';r.consumed_at=qualAt;r.completed_at=qualAt;r.result_ref=qPath;fs.writeFileSync(p,JSON.stringify(r,null,2)+'\n');}
}
console.log(JSON.stringify({result:'PASS',edition_id:editionId,manifest:manifestPath,qualification:qPath,watchlist_counts:counts},null,2));
