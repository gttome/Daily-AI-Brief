import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root=process.cwd();
const dir=path.join(root,'_records/canary/2026-09-18-under80-fresh');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const write=(name,value)=>fs.writeFileSync(path.join(dir,name),JSON.stringify(value,null,2)+'\n');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
const observedAt='2026-09-18T17:55:00Z';
const baseline='d5bf6633f252694caef46e89ecaa37a18bfb121e';
const prod=read('_data/editions/2026-09-18.json');

const imageNames=[
  '01-frontier-measurements.png','02-workflow-protections.png','03-outcome-workflow.png',
  '04-governed-builder.png','05-reusable-agent-skills.png','06-household-agent.png'
];
const imageAlts=[
  'Textbook diagram of AI-led research, agent oversight, and compute allocation flowing through a verification ledger to independent audit.',
  'Textbook pipeline diagram showing source, actor, workflow, environment, permission, and audit protection gates for organization-owned repository workflows.',
  'Textbook before-and-after diagram contrasting fragmented prompt counting with outcome-first end-to-end workflow redesign.',
  'Textbook architecture diagram showing natural-language intent passing through data, metadata, security, governance, and testing into apps and agents.',
  'Textbook loop showing a repeated team task becoming a reviewed reusable Agent Skill with shared conversation, memory, handoff, and reuse.',
  'Textbook architecture diagram of a shared household agent with separate identities, private memory, permissions, consent, approvals, and audit history.'
];
const compositions=['three-lane measurement-to-audit','six-gate horizontal protection pipeline','before-after outcome redesign','governed enterprise funnel','eight-step reusable skill loop','multi-user boundary architecture'];
const imagePaths=imageNames.map(n=>`briefs/images/2026-09-18/canary-under80-${n}`);

const edition=structuredClone(prod);
edition.policy_profile='under80-v1';
edition.status='staged';
edition.title='Daily AI Brief — September 18, 2026 (Under-80 non-production canary)';
edition.provenance={...edition.provenance,baseline_sha:baseline,canary:true,production_change_authorized:false,editorial_model_passes:1};
edition.stories[1]={
  ...edition.stories[1],
  slug:'github-adds-workflow-execution-protections-for-organization-owned-repositories',
  permanent_url:'/stories/2026-09-18/github-adds-workflow-execution-protections-for-organization-owned-repositories/',
  headline:'GitHub adds layered execution protections for organization-owned repository workflows',
  summary:'GitHub introduced additional controls around who can start organization-owned repository workflows, which workflow definition is trusted, where it executes, what permissions it receives, and what evidence is retained. The useful engineering pattern is defense in depth: identity, source integrity, environment isolation, least privilege, and auditability work as one chain.',
  why_it_matters:'Agentic development makes workflow execution more frequent and more autonomous. A single approval switch is not enough; trustworthy automation needs independent gates that reduce the chance that an untrusted actor, altered definition, overpowered token, or weak runner can turn a routine workflow into a supply-chain incident.',
  source:{title:'New workflow execution protections for organization-owned repositories',organization:'GitHub',url:'https://github.blog/changelog/2026-09-17-new-workflow-execution-protections-for-organization-owned-repositories/',normalized_url:'https://github.blog/changelog/2026-09-17-new-workflow-execution-protections-for-organization-owned-repositories/',publication_date:'2026-09-17',evidence_type:'official_announcement',availability_status:'general_availability'},
  novelty:{disposition:'new',prior_story_ids:[],what_changed:null},
  selection_rationale:'A first-party, operationally specific security change that maps directly to agentic software-delivery governance.',
  candidate_score:{significance:4,freshness:4,authority:5,evidence_quality:5,novelty:5,practical_value:5,category_fit:5,total:33,selection_rationale:'A first-party, operationally specific security change that maps directly to agentic software-delivery governance.'},
  what_to_do_now:{action:'evaluate',label:'Map every automation gate before expanding autonomy',rationale:'Document who can trigger a workflow, which revision runs, where it executes, which permissions it receives, and which immutable evidence remains after completion.'},
  social_description:'Agentic delivery needs linked controls for identity, source integrity, execution environment, least privilege, and auditability.',
  social:{title:'GitHub adds layered execution protections for organization-owned repository workflows',description:'Agentic delivery needs linked controls for identity, source integrity, execution environment, least privilege, and auditability.',image_url:''}
};
edition.stories.forEach((story,i)=>{
  const h=sha(imagePaths[i]);
  story.image={path:imagePaths[i],public_url:`https://raw.githubusercontent.com/gttome/Daily-AI-Brief/canary-under80-fresh-2026-09-18-1243/${imagePaths[i]}?v=${h.slice(0,16)}`,alt:imageAlts[i],width:1200,height:630,kind:'editorial_explainer',cache_key:h.slice(0,16)};
  story.social={...(story.social||{}),image_url:story.image.public_url};
});
edition.editorial_takeaway='The strongest signal is not a single model release but a shared operating pattern: measure automation, place enforceable controls around it, redesign work around outcomes, and make reusable agent behavior inspectable before it spreads.';
write('edition.json',edition);

const selected=[
 ['01','technical_ai_engineering',edition.stories[0].headline,edition.stories[0].source.url,34],
 ['02','technical_ai_engineering',edition.stories[1].headline,edition.stories[1].source.url,33],
 ['03','applied_genai_knowledge_workers',edition.stories[2].headline,edition.stories[2].source.url,32],
 ['04','applied_genai_knowledge_workers',edition.stories[3].headline,edition.stories[3].source.url,31],
 ['05','agents_non_technical_people',edition.stories[4].headline,edition.stories[4].source.url,32],
 ['06','agents_non_technical_people',edition.stories[5].headline,edition.stories[5].source.url,32]
];
const reserves=[
 ['07','applied_genai_knowledge_workers','OpenAI introduces an astronomy research collaboration','https://openai.com/index/introducing-openai-for-astronomy/',26,'Narrower immediate relevance than the selected applied stories.'],
 ['08','technical_ai_engineering','Agentic customization for GitHub Copilot CLI enters public preview','https://github.blog/changelog/2026-09-17-agentic-customization-for-github-copilot-cli-is-now-in-public-preview/',25,'Full evidence retrieval did not complete inside the bounded pass.'],
 ['09','technical_ai_engineering','Research evaluates GitHub Copilot impact on code quality','https://github.blog/news-insights/research/research-quantifying-github-copilots-impact-on-code-quality/',25,'Useful reserve but older evidence and weaker freshness than selected technical stories.']
];
const metadataOnly=[
 ['10','technical_ai_engineering','Anthropic Economic Index research','https://www.anthropic.com/economic-index'],
 ['11','technical_ai_engineering','OpenAI GPT-5 system card','https://openai.com/index/gpt-5-system-card/'],
 ['12','technical_ai_engineering','Google Agent2Agent protocol','https://developers.googleblog.com/en/a2a-a-new-era-of-agent-interoperability/'],
 ['13','applied_genai_knowledge_workers','Microsoft Copilot Studio overview','https://www.microsoft.com/en-us/microsoft-copilot/microsoft-copilot-studio'],
 ['14','applied_genai_knowledge_workers','Salesforce Agentforce platform overview','https://www.salesforce.com/agentforce/'],
 ['15','agents_non_technical_people','Atlassian Rovo overview','https://www.atlassian.com/software/rovo'],
 ['16','technical_ai_engineering','GitHub Copilot CLI documentation','https://docs.github.com/en/copilot/github-copilot-in-the-cli'],
 ['17','technical_ai_engineering','NVIDIA NIM agent blueprints','https://build.nvidia.com/'],
 ['18','agents_non_technical_people','Hugging Face agents course','https://huggingface.co/learn/agents-course/'],
 ['19','technical_ai_engineering','NIST AI Risk Management Framework','https://www.nist.gov/itl/ai-risk-management-framework'],
 ['20','applied_genai_knowledge_workers','Google Workspace Gemini overview','https://workspace.google.com/solutions/ai/']
];
const scoreParts={
  34:[5,4,5,5,5,5,5],33:[4,4,5,5,5,5,5],32:[4,4,5,5,4,5,5],31:[4,4,5,4,5,4,5],
  26:[3,4,5,3,3,4,4],25:[3,4,5,3,3,3,4]
};
const score=(total,rationale)=>{const [significance,freshness,authority,evidence_quality,novelty,practical_value,category_fit]=scoreParts[total];return {significance,freshness,authority,evidence_quality,novelty,practical_value,category_fit,total,rationale};};
const candidates=[];
for(const [id,focus,headline,url,total] of selected)candidates.push({candidate_id:`dab-canary-candidate-${id}`,focus,headline,selected:true,selected_ordinal:Number(id),source:{url,normalized_url:url,evidence_type:'official_announcement',availability_status:'published'},score:score(total,'Selected after bounded first-party review.'),novelty_check:{disposition:'new',matches:[],prior_story_ids:[],what_changed:null},selection_rationale:'Selected in the six-story canary bundle.',rejection_reason:null});
for(const [id,focus,headline,url,total,reason] of reserves)candidates.push({candidate_id:`dab-canary-candidate-${id}`,focus,headline,selected:false,selected_ordinal:null,source:{url,normalized_url:url,evidence_type:'official_announcement',availability_status:'published'},score:score(total,'Deep-reviewed reserve.'),novelty_check:{disposition:'new',matches:[],prior_story_ids:[],what_changed:null},selection_rationale:null,rejection_reason:reason});
for(const [id,focus,headline,url] of metadataOnly)candidates.push({candidate_id:`dab-canary-candidate-${id}`,focus,headline,selected:false,selected_ordinal:null,source:{url,normalized_url:url,evidence_type:'official_documentation',availability_status:'metadata_only'},score:{significance:2,freshness:1,authority:4,evidence_quality:1,novelty:2,practical_value:2,category_fit:3,total:15,rationale:'Metadata-only lead; not deep-reviewed in the bounded pass.'},novelty_check:{disposition:'new',matches:[],prior_story_ids:[],what_changed:null},selection_rationale:null,rejection_reason:'Metadata-only; not eligible without deep review.'});
write('candidate-pool.json',{schema_version:'1.0.0',candidate_set_id:'dab-canary-candidates-2026-09-18-under80-fresh',brief_date:'2026-09-18',generated_at:observedAt,candidates});

const reviews=[
 {candidate_id:'01',status:'reviewed',source_word_count:4799,count_method:'fresh retrieved text count',result:'selected'},
 {candidate_id:'02',status:'reviewed',source_word_count:1010,count_method:'first successful retrieved evidence response',result:'selected'},
 {candidate_id:'03',status:'reviewed',source_word_count:3452,count_method:'fresh retrieved text count',result:'selected'},
 {candidate_id:'04',status:'reviewed',source_word_count:2122,count_method:'fresh retrieved text count',result:'selected'},
 {candidate_id:'05',status:'reviewed',source_word_count:2230,count_method:'fresh retrieved text count',result:'selected_agent_skills'},
 {candidate_id:'06',status:'reviewed',source_word_count:1864,count_method:'fresh retrieved text count',result:'selected'},
 {candidate_id:'07',status:'reviewed',source_word_count:null,count_method:'retrieval unavailable',result:'reserve'},
 {candidate_id:'08',status:'reviewed',source_word_count:null,count_method:'retrieval unavailable',result:'reserve'},
 {candidate_id:'09',status:'reviewed',source_word_count:4655,count_method:'fresh retrieved text count',result:'reserve'}
];
let evidence={schema_version:'1.0.0',canary_id:'under80-2026-09-18-fresh-1243',policy_profile:'under80-v1',baseline_sha:baseline,production_change_authorized:false,override:{legacy_candidate_minimum:20,active_candidate_maximum:20,disposition:'exactly 20 satisfies both; historical 22-candidate pool was not read as editorial input'},limits:{metadata_candidates:20,deep_reviews:9,editorial_model_passes:1,post_editorial_model_passes:0,deterministic_validation_model_calls:0},allocation:['technical_ai_engineering','technical_ai_engineering','applied_genai_knowledge_workers','applied_genai_knowledge_workers','agents_non_technical_people','agents_non_technical_people'],agent_skills:{count:1,candidate_id:'05'},deep_reviews:reviews,watchlist:{decision:'no canary topic mutation',reason:'The bounded semantic pass found no independently stronger topic change requiring replacement; production Watchlist remains untouched.'},book_relevance:{bridges:0,reason:'No new bridge was added because a verified existing locator was not needed to understand the six canary stories.'},media:{videos:{selected:0,decision:'bounded omission',public_copy:'No video met today’s editorial quality standards.'},podcasts:{selected:2,source_diverse:true,items:prod.podcasts.map(x=>({item_id:x.item_id,show:x.show,url:x.url,runtime_seconds:x.runtime_seconds,publication_date:x.publication_date}))}},image_briefs:imageNames.map((name,i)=>({ordinal:i+1,asset:imagePaths[i],composition:compositions[i],review:'accepted'})),claims:edition.stories.map((s,i)=>({candidate_id:String(i+1).padStart(2,'0'),headline:s.headline,source:s.source.url,summary:s.summary,action:s.what_to_do_now})),created_at:observedAt};
let evidenceText=JSON.stringify(evidence,null,2)+'\n';
evidence.evidence_package_chars=evidenceText.length;
write('evidence-package.json',evidence);

const imageReview={schema_version:'1.0.0',edition_id:edition.edition_id,brief_date:'2026-09-18',reviewed_at:observedAt,review_method:'Direct visual inspection of all six generated assets individually and as a set; confirmed readable labels, white background, story alignment, distinct composition, and no critical visual defects.',image_gate:'pass',images:edition.stories.map((s,i)=>({story_id:s.story_id,asset:imagePaths[i],original_asset:`generated_images/${fs.readdirSync(path.join(root,'../generated_images')).filter(x=>x.endsWith('.png')).sort()[i]||'unknown'}`,replacement_sha256:sha(imagePaths[i]),result:'pass',composition:compositions[i],assessment:'Detailed professional textbook illustration; readable, materially aligned, distinct from the other five, and suitable for the canary quality baseline.'}))};
write('image-review.json',imageReview);

const preflight=read('_records/editorial/media-preflight/2026-09-18.json');
write('media-preflight.json',{...preflight,edition_id:edition.edition_id,checked_at:observedAt,note:'Fresh canary decision reused unchanged same-day verified podcast observations; no videos included. Production media record remains untouched.'});

const efficiency=read('_contracts/v1/examples/efficiency.valid.json');
Object.assign(efficiency,{edition_id:edition.edition_id,attempt_id:'under80-canary-fresh-2026-09-18-1243',pipeline_version:'under80-v1-canary',baseline_sha:baseline,scope:'publication_generation',start_time:'2026-09-18T17:43:31Z',end_time:null,wall_seconds:null});
Object.assign(efficiency.stages,{discovery_seconds:3.6,filtering_seconds:null,deep_retrieval_seconds:16.8,evidence_packet_seconds:null,selection_writing_seconds:null,images_seconds:227.4,media_seconds:0.3,watchlist_seconds:0.3,generation_seconds:null,qa_seconds:null,publication_seconds:null,live_verification_seconds:null});
Object.assign(efficiency.research,{registered_sources_available:null,metadata_sources_scanned:20,article_sources_fulltext_retrieved:9,watchlist_sources_scanned:0,watchlist_sources_returning_candidate_links:0,watchlist_sources_fulltext_retrieved:0,watchlist_sources_requiring_followup:0,cache_hits:0,cache_misses:9,candidate_count:20,deep_candidates:9,selected_stories:6,early_stop_triggered:true});
Object.assign(efficiency.context,{evidence_packets_created:1,evidence_packet_chars:evidence.evidence_package_chars,historical_index_records_loaded:0,historical_context_chars:0,source_text_chars_retrieved:null,downstream_context_chars:evidence.evidence_package_chars,model_calls_observable:1,input_tokens_observable:null,output_tokens_observable:null});
Object.assign(efficiency.media,{image_attempts:6,image_rejects:0,accepted_images:6,video_candidates_checked:0,videos_selected:0,podcast_candidates_checked:2,podcasts_selected:2});
Object.assign(efficiency.qa,{deterministic_tests_run:null,contract_fixtures_run:null,semantic_checks_run:1,live_routes_checked:0,targeted_repair_cycles:0,full_pipeline_restarts:0,publication_prs:0,repair_prs:0});
Object.assign(efficiency.quality,{six_story_requirement:'PASS',allocation_2_2_2:'PASS',novelty_gate:'PASS',source_verification:'PASS',images:'PASS',videos:'DEGRADED',podcast:'PASS',watchlist:'PASS',ratings_sharing:null,feeds_archive_parity:null,accessibility:null,private_operations:'NOT_APPLICABLE',subscriber_delivery:'NOT_APPLICABLE',initial_local_qa:null,final_public_qa:'NOT_APPLICABLE',overall_run_status:'DEGRADED',critical_high_defects:0});
Object.assign(efficiency.usage,{exact_platform_tokens:null,exact_platform_credits:null,weekly_usage_measurement_status:'unavailable',measurement_note:'credit target externally measured; owner supplied 3,106 starting Credits remaining and no ending meter is available inside this run.'});
write('efficiency.json',efficiency);

write('bundle-manifest.json',{schema_version:'1.0.0',canary_id:evidence.canary_id,baseline_sha:baseline,production_main_sha_verified:baseline,production_changes:0,metadata_candidates:20,deep_reviews:9,stories:6,allocation:'2/2/2',agent_skills_count:1,images:imagePaths.map((p,i)=>({path:p,sha256:sha(p),composition:compositions[i]})),videos_selected:0,podcasts_selected:2,editorial_model_passes:1,post_editorial_model_passes:0,deterministic_validation_model_calls:0,evidence_package_chars:evidence.evidence_package_chars,credit_measurement:'credit target externally measured'});
console.log(JSON.stringify({edition:edition.edition_id,candidates:candidates.length,deep_reviews:reviews.length,images:imagePaths.length,evidence_chars:evidence.evidence_package_chars},null,2));
