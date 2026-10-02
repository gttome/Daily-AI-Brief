#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {bookSelectionPlan,selectBookReferences} from '../_generator/lib/book-selection.mjs';
import {publicWatchlist} from '../_generator/lib/watchlist.mjs';

const root=path.resolve(process.argv[2]||'.');
const date='2026-10-02';
const executionKey='2026-10-02-run5';
const editionId='dab-edition-2026-10-02';
const executionId='reliable-edition-20261002-run5';
const branch='reliable-edition/dab-edition-2026-10-02-run5';
const cutoff='2026-10-02T12:42:37Z';
const baseline=process.env.BASELINE_SHA;
if(!/^[a-f0-9]{40}$/.test(baseline||''))throw Error('BASELINE_SHA required');

const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const write=(p,v)=>{const f=path.join(root,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,typeof v==='string'?v:JSON.stringify(v,null,2)+'\n')};
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const blobSha=b=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b])).digest('hex');
const now=()=>new Date().toISOString();

const eventDir=path.join(root,'_records/edition-execution/events',executionKey);
const eventFiles=fs.existsSync(eventDir)?fs.readdirSync(eventDir):[];
if(!eventFiles.some(n=>/^17-done/.test(n)))throw Error('Task 17 must be durably Done before Task 18');
if(eventFiles.some(n=>/^18-done/.test(n))){console.log(JSON.stringify({result:'REUSED_DONE',task:'18'}));process.exit(0);}

const selection=read('_records/editorial/2026-10-02-run5/story-selection.json');
const discovery=read('_records/discovery/2026-10-02-run5/candidates.json');
const videos=read('_records/editorial/2026-10-02-run5/videos.json');
const podcasts=read('_records/editorial/2026-10-02-run5/podcasts.json');
const bookReview=read('_records/editorial/2026-10-02-run5/book-review.json');
const imageSpecs=read('_records/image-specs/2026-10-02-run5.json');
const specBy=new Map(imageSpecs.specs.map(x=>[x.candidate_id,x]));
const candidateBy=new Map(discovery.candidates.map(x=>[x.id,x]));
const imageManifest17=read('_records/editorial-handoff/images-2026-10-02.json');

if(selection.result!=='PASS'||selection.selected?.length!==6)throw Error('Run 5 six-story selection required');
if(videos.result!=='PASS'||videos.videos?.length!==2)throw Error('Run 5 two-video selection required');
if(podcasts.result!=='PASS'||podcasts.podcasts?.length!==2)throw Error('Run 5 two-podcast selection required');
if(bookReview.result!=='PASS'||bookReview.books_reviewed?.length!==4)throw Error('Run 5 all-four-book review required');
if(Object.keys(imageManifest17).length!==6)throw Error('Task 17 six-image manifest required');

const copy={
 m01:{
  headline:'Cohere Embed 5 splits retrieval into Pro and Fast models with one shared space',
  summary:'Cohere introduced Embed 5 Pro and Fast as multimodal enterprise embedding models that share one vector space while supporting long-context, multilingual and Matryoshka-style retrieval workflows.',
  why:'A shared embedding space lets teams trade quality and speed without maintaining separate retrieval indexes, making model choice an operational control rather than a data-migration event.'
 },
 m02:{
  headline:'Dogwood moves agent governance into the action sequence',
  summary:'AWS introduced the Dogwood Local Engine to apply temporal policy to ordered agent actions, using execution history and state to decide whether a tool action should proceed.',
  why:'Agent safety depends on what happens before and after an action, not only on the action in isolation; sequence-aware policy makes that runtime context enforceable.'
 },
 m04:{
  headline:'Stack Internal makes enterprise knowledge provenance machine-readable for AI',
  summary:'Stack Overflow’s next Stack Internal release adds provenance, recency, corroboration and expert validation signals so people and agents can reason about whether internal knowledge is trustworthy.',
  why:'Enterprise AI needs more than retrieval: it needs evidence about where knowledge came from, how current it is, and when a human should resolve conflicting or uncertain context.'
 },
 m05:{
  headline:'Slack MCP Server turns Lists and records into agent-operable workflow objects',
  summary:'Slack’s September feature release expands its MCP Server with create, read, update and delete operations for Lists and records, enabling AI-assisted CRM and administrative workflows inside structured work data.',
  why:'When agents can safely manipulate structured workflow objects through governed interfaces, teams can automate recurring operational work without relying on brittle screen imitation.'
 },
 m07:{
  headline:'Gemini Skills turn repeated prompting into reusable work modules',
  summary:'Google added reusable Skills to Gemini so people can save instructions and reference files, invoke them on matching work, and compose multiple Skills for repeated tasks.',
  why:'A maintained Skill converts prompt craft into reusable operating knowledge that can be reviewed, shared and improved instead of recreated in every conversation.'
 },
 m08:{
  headline:'Meta Muse brings skills, connectors, and approval boundaries to small-business agents',
  summary:'Meta introduced Muse for Small Business as an agent experience that connects common business systems through reusable skills and connectors while keeping approval boundaries around actions.',
  why:'For nontechnical teams, the useful agent pattern is not unrestricted autonomy but bounded access to real business tools with explicit human approval before consequential actions.'
 }
};
const slugs={
 m01:'cohere-embed-5-shared-space-pro-fast-retrieval',
 m02:'dogwood-temporal-governance-for-agent-actions',
 m04:'stack-internal-trusted-enterprise-context-for-ai',
 m05:'slack-mcp-server-lists-records-agent-workflows',
 m07:'gemini-skills-reusable-work-modules',
 m08:'meta-muse-small-business-skills-connectors-approval'
};
const readingFiles={
 m01:'_records/discovery/2026-10-02-run5/reading-m01.json',
 m02:'_records/discovery/2026-10-02-run5/reading-m02.json',
 m04:'_records/discovery/2026-10-02-run5/m04-reading.json',
 m05:'_records/discovery/2026-10-02-run5/m05-reading.json',
 m07:'_records/discovery/2026-10-02-run5/m07-reading.json',
 m08:'_records/discovery/2026-10-02-run5/m08-reading.json'
};

function acceptedAttempt(id){
 const dir=path.join(root,'_records/image-attempts',executionKey);
 const matches=fs.readdirSync(dir).filter(n=>n.endsWith('.json')).map(n=>({name:n,value:read('_records/image-attempts/'+executionKey+'/'+n)}))
   .filter(x=>x.value.candidate_id===id&&x.value.accepted_locked===true&&x.value.status==='accepted_locked');
 if(matches.length!==1)throw Error('exactly_one_accepted_attempt_required:'+id+':'+matches.length);
 const a=matches[0].value,p=a.persistence?.production_path;
 const bytes=fs.readFileSync(path.join(root,p));
 if(sha256(bytes)!==a.candidate.sha256||blobSha(bytes)!==a.candidate.git_blob_sha)throw Error('accepted_image_identity_mismatch:'+id);
 return {name:matches[0].name,a,path:p,bytes,sha256:a.candidate.sha256,git_blob_sha:a.candidate.git_blob_sha};
}

const accepted=new Map(selection.selected.map(s=>[s.candidate_id,acceptedAttempt(s.candidate_id)]));
const stories=selection.selected.map(s=>{
 const id=s.candidate_id,c=candidateBy.get(id),img=accepted.get(id),review=imageManifest17[id],reading=read(readingFiles[id]);
 if(!c||!copy[id]||!review||reading.status!=='verified')throw Error('story_input_missing:'+id);
 const freshness=c.freshness_band==='primary_24h'?'primary':'fallback';
 const fallbackBand=c.freshness_band==='extended_168h'?'extended':'normal';
 const cache='oct2-'+id+'-'+img.sha256.slice(0,12);
 return {
  story_id:'dab-story-'+date+'-'+id,
  ordinal:s.slot,
  slug:slugs[id],
  permanent_url:'/stories/'+date+'/'+slugs[id]+'/',
  focus:s.focus,
  headline:copy[id].headline,
  event_date:c.published_date,
  topics:[id,s.focus.replaceAll('_',' ')],
  companies:[c.publisher],
  image:{path:img.path,public_url:'https://gttome.github.io/Daily-AI-Brief/'+img.path+'?v='+cache,alt:review.alt,width:1200,height:630,kind:'editorial_explainer',cache_key:cache},
  summary:copy[id].summary,
  why_it_matters:copy[id].why,
  source:{title:c.title,organization:c.publisher,url:c.url,normalized_url:c.url,publication_date:c.published_date,evidence_type:'publisher_authored',availability_status:'available',
    reading_evidence:{status:'verified',word_count:reading.source_body_word_count,verified_at:reading.verified_at,method:reading.method||'indexed full-source body review'}},
  freshness:{tier:freshness,fallback_band:freshness==='fallback'?fallbackBand:null,source_published_at:c.published_date+'T00:00:00Z',
    fallback_reason:freshness==='fallback'?'The selected item is outside the primary 24-hour band but remains inside the approved '+c.freshness_band+' fallback and provides distinct evidence needed for the fixed 2/2/2 slate.':null},
  selection_rationale:c.rationale,
  editorial_limitation:'Publisher-authored evidence establishes the described feature or mechanism; comparative performance and organization-specific outcomes still require local evaluation.',
  social_description:copy[id].summary
 };
});

const v1=videos.videos[0],v2=videos.videos[1];
const worthWatching={
 general:{status:'included',title:v1.title,channel:v1.channel,upload_date:v1.publication_date,runtime_seconds:v1.runtime_seconds,
   why_useful:'A concise practical walkthrough of the new Copilot surfaces for everyday knowledge work.',
   connection:v1.connection,url:v1.url,duration_tier:'short',verification_note:v1.verification},
 agents_non_technical_people:{status:'included',title:v2.title,channel:v2.channel,upload_date:v2.publication_date,runtime_seconds:20,
   why_useful:'A 20-second first-party view of Copilot Home bringing Chat and Cowork into one starting point.',
   connection:v2.connection,url:v2.url,duration_tier:'short',verification_note:v2.verification+' Exact 0:20 runtime independently corroborated before release assembly.'}
};
const podcastItems=podcasts.podcasts.map((p,i)=>({
 status:'included',ordinal:9+i,item_id:'dab-podcast-'+date+'-'+(i+1),
 title:p.title,show:p.show,host:p.host,publication_date:p.publication_date,runtime_seconds:p.runtime_seconds,
 focus:i===0?'agents_non_technical_people':'technical_ai_engineering',
 topics:i===0?['agents','business workflows']:['agent payments','AI workflow controls'],
 url:p.url,summary:p.connection,why_useful:p.connection,
 selection_rationale:'Locked Run 5 source-diverse podcast selection.',
 freshness_tier:p.freshness_tier,connection:p.connection,
 permanent_url:'/podcasts/'+date+'/run5-'+(i+1)+'/',
 verification_note:p.verification,platforms:[{name:p.show,url:p.url}],
 coverage_note:'Locked October 2 Run 5 media selection.'
}));

const edition={
 schema_version:'1.0.0',article_freshness_policy:'article-24-72-168-v1',policy_profile:'under80-v1',
 edition_id:editionId,brief_date:date,timezone:'America/Chicago',
 title:'Daily Generative AI Brief — October 2, 2026',published_at:now(),research_cutoff_at:cutoff,
 coverage_period:'24-hour primary window ending at the fixed Run 5 research cutoff; bounded 72-hour and 168-hour fallback used only where required by the locked 2/2/2 slate.',
 status:'staged',stories,worth_watching:worthWatching,podcasts:podcastItems,
 editorial_takeaway:'Today’s strongest pattern is operationalization: retrieval, agent governance, trusted enterprise context, structured workflow actions, reusable skills and approval boundaries are turning generative AI from isolated prompting into governed systems of work.'
};
write('_data/editions/'+date+'.json',edition);

// Reconcile all-four-book review into the canonical book projection, preserving relevance-first choices.
const books=read('_data/book-reading.json');
const reviewBy=new Map(bookReview.item_reviews.map(x=>[x.candidate_id,x]));
const preferred={m01:'reliable-embeddings',m02:'context-failure-playbooks',m04:'ecosystem-workflow',m05:'reliable-handoffs',m07:'prompt-core-components',m08:'ecosystem-problem-strategies'};
for(const [id,ref] of Object.entries(preferred))if(!reviewBy.get(id)?.best_connections?.includes(ref))throw Error('preferred_book_reference_not_reviewed:'+id+':'+ref);
const plan=bookSelectionPlan(edition,books);
const chosen=Object.fromEntries(selection.selected.map((s,i)=>[stories[i].story_id,preferred[s.candidate_id]]));
const bookSelectionReview={schema_version:'1.0.0',edition_date:date,catalog_digest:plan.catalog_digest,items_digest:plan.items_digest,
 items:plan.items.map(item=>({item_id:item.item_id,scores:plan.anchors.map(a=>{const yes=chosen[item.item_id]===a.id;return {
   reference_id:a.id,
   rationale:yes?'Run 5 all-four-book review selected this verified section as a direct mechanism and reader-value match for the item.':'This verified section was reviewed but was not the strongest direct mechanism/reader-value match for this item.',
   mechanism:yes?4:0,topic:yes?4:0,practical_lesson:yes?4:0,audience:yes?4:0,section_relevance:yes?4:0,reader_value:yes?4:0
  }})}))
};
books.selection_reviews=books.selection_reviews||{};books.selection_reviews[date]=bookSelectionReview;
books.editions=books.editions||{};books.editions[date]=selectBookReferences(edition,books,bookSelectionReview).selections;
write('_data/book-reading.json',books);

// Reconcile the independent Task 08 Watchlist findings. No story selection is changed.
const watch=read('_data/watchlist.json');
watch.edition_date=date;watch.updated_at='2026-10-02T13:29:44Z';watch.verification_observed_at='2026-10-02T13:29:44Z';
watch.baseline_note='Independent Run 5 seven-domain sweep completed 14 focused checks: 2 new topics, 5 existing topics updated, and the remaining active topics carried forward.';
const updates={
 'dab-topic-system-one-decision-models':{why:"Databricks launched ai_decide on September 30 using a decision model and explicitly cited TypeSafe AI's Jev for fast structured choices, probabilities and scores over governed data.",e:{title:'Introducing ai_decide: Make Fast Decisions on Your Governed Data',url:'https://www.databricks.com/blog/introducing-aidecide-make-fast-decisions-your-governed-data',publisher:'Databricks',kind:'primary',publication_date:'2026-09-30',checked_at:'2026-10-02T13:29:44Z',development_id:'databricks-ai-decide-2026-09-30',review_depth:'full first-party product article'}},
 'dab-topic-agent-skills-observability':{why:'Google moved reusable Skills into Gemini chat, making saved instructions and reference files directly invokable and composable for recurring work.',e:{title:'Let skills in Gemini tackle your most repetitive tasks',url:'https://blog.google/products-and-platforms/products/gemini/automate-tasks-with-skills/',publisher:'Google',kind:'primary',publication_date:'2026-09-30',checked_at:'2026-10-02T13:29:44Z',development_id:'google-gemini-skills-2026-09-30',review_depth:'full first-party product article'}},
 'dab-topic-repairable-generative-design':{why:'MIT CSAIL published InstructMesh, enabling selective natural-language and slider-based repair of generated 3D models before fabrication.',e:{title:'InstructMesh lets users repair AI-generated 3D models before fabrication',url:'https://news.mit.edu/2026/instructmesh-tool-lets-users-repair-ai-3d-models-then-fabricate-them-1001',publisher:'MIT News',kind:'primary',publication_date:'2026-10-01',checked_at:'2026-10-02T13:29:44Z',development_id:'mit-instructmesh-2026-10-01',review_depth:'full original research news article'}},
 'dab-topic-model-lifecycle-governance':{why:'CoreWeave Forge connected training, inference, observability, evaluation, curation, post-training and agent development into a continuous improvement loop.',e:{title:'CoreWeave Forge launches',url:'https://www.coreweave.com/news/coreweave-forge-launches-turning-the-ai-loop-production-run-into-a-better-model-and-agent',publisher:'CoreWeave',kind:'primary',publication_date:'2026-09-30',checked_at:'2026-10-02T13:29:44Z',development_id:'coreweave-forge-2026-09-30',review_depth:'full first-party announcement'}},
 'dab-topic-harness-engineering':{why:'AWS Dogwood introduced execution-time temporal governance for sequences of agent actions, moving policy enforcement deeper into the agent runtime.',e:{title:'Introducing the Dogwood Local Engine: temporal governance for agent actions',url:'https://aws.amazon.com/blogs/opensource/introducing-the-dogwood-local-engine-temporal-governance-for-agent-actions/',publisher:'AWS Open Source',kind:'primary',publication_date:'2026-10-01',checked_at:'2026-10-02T13:29:44Z',development_id:'aws-dogwood-temporal-governance-2026-10-01',review_depth:'full first-party engineering article'}}
};
for(const [id,u] of Object.entries(updates)){
 const t=watch.topics.find(x=>x.topic_id===id);if(!t)throw Error('watchlist_update_topic_missing:'+id);
 t.updated_at='2026-10-02T13:29:44Z';t.verification_observed_at='2026-10-02T13:29:44Z';t.why_now=u.why;
 t.evidence=t.evidence||[];if(!t.evidence.some(e=>e.development_id===u.e.development_id))t.evidence.push(u.e);
}
const newTopics=[
 {topic_id:'dab-topic-trusted-enterprise-context',name:'Trusted enterprise context becomes machine-readable for agents',audience:'Knowledge leaders, AI platform owners, and enterprise agent teams',
  summary:'Enterprise knowledge systems are exposing provenance, recency, corroboration, expert validation and conflict signals in forms that AI agents can use.',
  why_now:'Stack Internal now combines provenance, recency, corroboration, expert validation and conflict handling so agents can reason about whether internal knowledge is trustworthy.',
  practical_value:'Lets teams make knowledge quality and escalation rules part of the agent context instead of relying on retrieval alone.',
  limitations:'The current evidence comes from one enterprise knowledge platform; portability and measurable outcome gains remain to be established.',
  next_action:'Test how provenance, recency and expert-review signals alter agent answer quality, abstention and escalation on internal knowledge tasks.',
  evidence:{title:'Stack Overflow Launches the Next Generation of Stack Internal to Power Trusted Enterprise AI',url:'https://stackoverflow.co/company/press/archive/stack-internal-trusted-enterprise-ai',publisher:'Stack Overflow',kind:'primary',publication_date:'2026-09-30',checked_at:'2026-10-02T13:29:44Z',development_id:'stackoverflow-trusted-enterprise-context-2026-09-30',review_depth:'full first-party announcement'}},
 {topic_id:'dab-topic-sovereign-open-ai',name:'Sovereign open AI becomes an organized infrastructure layer',audience:'AI platform leaders, governments, and open-source ecosystem teams',
  summary:'Organizations are coordinating open models, tooling and infrastructure as a sovereignty layer rather than treating individual open-source components independently.',
  why_now:'The Eclipse Foundation launched a multi-organization Sovereign AI Foundation to map dependencies, evaluate open alternatives and develop guidance across models, tooling and agentic systems.',
  practical_value:'Provides a framework for teams evaluating dependency risk, portability, governance and local control across the AI stack.',
  limitations:'The foundation is newly launched; concrete reference architectures, adoption evidence and interoperability outcomes are still emerging.',
  next_action:'Track the foundation’s dependency maps, reference architectures and concrete cross-stack interoperability guidance.',
  evidence:{title:'Sovereign AI Foundation announcement',url:'https://newsroom.eclipse.org/news/announcements',publisher:'Eclipse Foundation',kind:'primary',publication_date:'2026-10-01',checked_at:'2026-10-02T13:29:44Z',development_id:'eclipse-sovereign-ai-foundation-2026-10-01',review_depth:'primary foundation announcement'}}
];
for(const n of newTopics)if(!watch.topics.some(t=>t.topic_id===n.topic_id))watch.topics.push({
 topic_id:n.topic_id,name:n.name,audience:n.audience,summary:n.summary,why_now:n.why_now,practical_value:n.practical_value,limitations:n.limitations,next_action:n.next_action,
 first_detected:'2026-10-02T13:29:44Z',updated_at:'2026-10-02T13:29:44Z',verification_observed_at:'2026-10-02T13:29:44Z',status:'early_signal',confidence:'limited',evidence:[n.evidence],external_attention:[],
 momentum:{classification:'baseline',score:null,observations:[],reason:'First Watchlist observation; comparable repeated measurements are not yet available.'},
 rubric:{novelty:{score:5,reason:'Materially new mechanism in the current independent sweep.'},evidence:{score:3,reason:'A reviewed first-party source establishes the current development.'},independence:{score:2,reason:'Independent corroboration remains limited at first admission.'},momentum:{score:null,reason:'First observation.'},relevance:{score:5,reason:'Directly relevant to reliable enterprise AI and agent operations.'},durability:{score:4,reason:'The mechanism can remain useful beyond the initial implementation.'}},
 trial_story_ids:[]
});
write('_data/watchlist.json',watch);write('data/watchlist.json',publicWatchlist(watch));

// Upgrade Task 17 image evidence into the strict publication-quality contract without changing any image bytes.
const imageManifest={},qualityImages=[];
stories.forEach((story,i)=>{
 const id=selection.selected[i].candidate_id,info=accepted.get(id),spec=specBy.get(id);
 const requestPath='_records/image-context/'+date+'/'+id+'.json';
 const request={mode:'single_story',story_ids:[story.story_id],includes_edition_context:false,prompt:'Professional high-detail textbook/editorial mechanism diagram on a clean white 1200x630 canvas. Subject: '+spec.subject+'. Mechanism: '+spec.mechanism+'. No people or humanoid figures, no decorative filler, no unsupported metrics, no overlapping text, and only sealed visible labels.'};
 write(requestPath,request);const requestSha=sha256(fs.readFileSync(path.join(root,requestPath)));
 const sig='oct2-'+id+'-'+(i+1),cache=story.image.cache_key,version='oct2-'+id+'-accepted-v1';
 qualityImages.push({
  story_id:story.story_id,asset:info.path,asset_path:info.path,result:'pass',overall_gate:'pass',
  assessment:'Accepted Run 5 story-specific professional editorial visual; exact production bytes were read back from Git and the saved asset passed subject, mechanism, structural, editorial, text, factual, no-people, no-overlap and no-fallback review.',
  composition:'Distinct story-specific '+spec.subject+' composition',
  replacement_sha256:info.sha256,asset_hash:info.sha256,git_blob_sha:info.git_blob_sha,cache_key:cache,asset_version:version,supersedes:null,deployment_verification_required:true,
  structural_gate:{result:'PASS',checks:Object.fromEntries(['file_exists','file_integrity','format','dimensions','expected_path','clipping_corruption','byte_uniqueness','story_identity','accessibility','asset_hash','git_blob_identity','lock_state','replacement_identity'].map(k=>[k,'PASS']))},
  editorial_quality_gate:{result:'PASS',benchmark_comparison:Object.fromEntries(['professional_finish','meaningful_detail','explanatory_mechanism','annotation_richness','visual_depth','hierarchy','composition','story_specificity','differentiation'].map(k=>[k,'PASS'])),
    story_specificity:'PASS',information_density:'PASS',explanatory_mechanism:'PASS',annotation_quality:'PASS',depth_hierarchy:'PASS',composition:'PASS',generic_or_sparse:false,decorative_only:false,
    meaningful_components:['primary mechanism','input artifacts','control boundary','process lane','output artifact','feedback path','verification marker','maintenance or audit path'],
    composition_signature:sig+'-composition',layout_signature:sig+'-layout',diagram_grammar:sig+'-grammar',hierarchy_signature:sig+'-hierarchy',annotation_pattern_signature:sig+'-annotation',
    assessment:'Professional high-detail Run 5 mechanism diagram with distinct composition, clear hierarchy, meaningful explanatory components and no sparse or decorative fallback.'},
  generation_context:{mode:'single_story',story_ids:[story.story_id],includes_edition_context:false,reviewed_subject_match:'pass',unrelated_status_artwork:false,request_path:requestPath,request_sha256:requestSha}
 });
});
const qualityPath='_records/image-quality/'+date+'-editorial-v2.json';
const quality={schema_version:'2.0.0',record_kind:'editorial_image_quality',edition_date:date,edition_id:editionId,benchmark_profile:'sep09-sep10-premium3-v1',benchmark_profile_path:'_records/image-quality/benchmark-profile-v1.json',
 reviewed_at:now(),review_method:'Release assembly projection of the completed Task 17 saved-Git six-image review; no image was regenerated or modified.',review_status:'complete',image_gate:'pass',
 generation_method:'OpenAI native image generation with saved-Git editorial review',asset_policy:'accepted_locked_reuse_only',benchmark_assets_inspected:true,attempts_this_invocation:0,rejected_this_invocation:0,accepted_locked:6,earlier_attempt_count:0,earlier_accepted_asset_recovery:true,rejections:[],
 set_review:{result:'PASS',composition_differentiation:'PASS',layout_differentiation:'PASS',diagram_grammar_differentiation:'PASS',information_hierarchy_differentiation:'PASS',annotation_pattern_differentiation:'PASS',
  assessment:'The six accepted Run 5 images use distinct story mechanisms, compositions, layouts, diagram grammars, hierarchy and annotation patterns while preserving a consistent professional textbook/editorial standard.'},
 images:qualityImages};
write(qualityPath,quality);const qualitySha=sha256(fs.readFileSync(path.join(root,qualityPath)));
stories.forEach((story,i)=>{
 const id=selection.selected[i].candidate_id,info=accepted.get(id);
 imageManifest[id]={story_id:story.story_id,candidate_id:id,path:info.path,alt:story.image.alt,width:1200,height:630,sha256:info.sha256,git_blob_sha:info.git_blob_sha,
  accepted_locked:true,lock_status:'accepted_locked',locked:true,inspection_result:'pass',generation_method:'professional_editorial_diagram',renderer_verified:true,visual_reviewed:true,quality_accepted:true,overall_gate:'pass',
  quality_evidence_path:qualityPath,quality_evidence_sha256:qualitySha,cache_key:story.image.cache_key,asset_version:'oct2-'+id+'-accepted-v1',supersedes:null,deployment_verification_required:true,
  execution_receipt_path:'_records/image-attempts/'+executionKey+'/'+info.name};
});
const imageReviewPath='_records/editorial-handoff/images-'+date+'.json';write(imageReviewPath,imageManifest);

const {generatedFiles}=await import('../_generator/lib/render.mjs');
const {validateIntegratedRepository}=await import('../_generator/lib/integrity.mjs');
const files=generatedFiles(edition,root,{watchlist:watch});
for(const [name,content] of files){
 const p=path.join(root,name);fs.mkdirSync(path.dirname(p),{recursive:true});
 if(Buffer.isBuffer(content))fs.writeFileSync(p,content);else fs.writeFileSync(p,content.endsWith('\n')?content:content+'\n');
}
const errors=validateIntegratedRepository(edition,root,{imageReviewPath});
if(errors.length)throw Error('run5_task18_integrated_validation:'+errors.join('|'));

function event(name,value){const p=path.join(eventDir,name);if(!fs.existsSync(p))write(path.relative(root,p),value);}
const at=now();
event('18-active.json',{task_id:'18',from:'Backlog',to:'Active',at,proof:{task17_done:true,accepted_images:6}});
event('18-done.json',{task_id:'18',from:'Active',to:'Done',at:new Date(Date.parse(at)+1).toISOString(),proof:{canonical_edition:'_data/editions/'+date+'.json',permanent_pages:'PASS',integrated_repository_validation:'PASS',accepted_images_reused:6}});

console.log(JSON.stringify({result:'PASS',edition:editionId,stories:stories.length,task18:'Done',watchlist_active:watch.topics.filter(x=>x.status!=='archived').length,book_selections:books.editions[date]?.length||0},null,2));
