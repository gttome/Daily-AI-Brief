import {cleanText,compactDiscoveryHtml} from './discovery-links.mjs';
import {normalizeUrl} from '../_generator/lib/util.mjs';

// Mechanical minimums reject page shells; editorial review still decides sufficiency.
export const MIN_ARTICLE_SOURCE_WORDS=80;
export const MIN_ARTICLE_EXCERPT_WORDS=25;
export const ARTICLE_EVIDENCE_TEXT_VERSION='article-body-v1';
export const evidenceWordCount=value=>(String(value||'').match(/\b[\p{L}\p{N}][\p{L}\p{N}'’-]*\b/gu)||[]).length;
const canonical=value=>{try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password)return null;u.hash='';return normalizeUrl(u.href);}catch{return null;}};
const normalizeTitle=value=>cleanText(value).toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();

export function extractArticleEvidenceText(html,{canonicalUrl,headline}={}){
 const wanted=canonical(canonicalUrl),blocks=[];let visited=0;
 const visit=(value,depth=0)=>{
  if(depth>20||visited++>1000)return;
  if(Array.isArray(value)){value.forEach(x=>visit(x,depth+1));return;}
  if(!value||typeof value!=='object')return;
  const types=Array.isArray(value['@type'])?value['@type']:[value['@type']];
  if(types.some(x=>['Article','BlogPosting','NewsArticle','TechArticle','ScholarlyArticle'].includes(x))){
   const entity=value.mainEntityOfPage;
   const identity=value.url||(typeof entity==='string'?entity:entity?.['@id'])||value['@id'];
   // A related article or generic Organization description is not this source's body.
   if(wanted&&canonical(identity)===wanted&&(!value.headline||!headline||normalizeTitle(value.headline)===normalizeTitle(headline))){
    for(const key of ['articleBody','description']){
     if(typeof value[key]!=='string')continue;
     const text=cleanText(value[key]);
     if(evidenceWordCount(text)>=MIN_ARTICLE_SOURCE_WORDS)blocks.push({text,method:`jsonld.${key}`});
    }
   }
  }
  for(const child of Object.values(value))if(child&&typeof child==='object')visit(child,depth+1);
 };
 for(const match of String(html||'').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)){
  if(!/\btype\s*=\s*["']application\/ld\+json["']/i.test(match[1]))continue;
  try{visit(JSON.parse(match[2]));}catch{/* Invalid JSON is never evaluated as JavaScript. */}
 }
 if(blocks.length){
  blocks.sort((a,b)=>(a.method==='jsonld.articleBody'?0:1)-(b.method==='jsonld.articleBody'?0:1)||b.text.length-a.text.length);
  return blocks[0];
 }
 const visible=compactDiscoveryHtml(String(html||''))
  .replace(/<(head|nav|header|footer|aside)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,' ');
 for(const tag of ['article','main']){
  const sections=[...visible.matchAll(new RegExp('<'+tag+'\\b[^>]*>([\\s\\S]*?)<\\/'+tag+'\\s*>','gi'))]
   .map(m=>cleanText(m[1])).filter(x=>evidenceWordCount(x)>=MIN_ARTICLE_SOURCE_WORDS).sort((a,b)=>b.length-a.length);
  if(sections.length)return {text:sections[0],method:`html.${tag}`};
 }
 return {text:cleanText(visible),method:'html.cleaned_document'};
}

const stop=new Set(['about','after','again','against','agentic','being','could','from','have','into','more','their','there','these','those','through','using','with','without','your','adds','update','generally','available']);
const terms=headline=>[...new Set(String(headline||'').toLowerCase().match(/[a-z0-9][a-z0-9-]{3,}/g)||[])].filter(x=>!stop.has(x));
export function articleEvidenceExcerpt(plain,headline,max=650){
 const keys=terms(headline);
 const sentences=String(plain||'').split(/(?<=[.!?])\s+/).map((s,i)=>({s:s.trim(),i})).filter(x=>x.s.length>=45&&x.s.length<=700);
 const scored=sentences.map(x=>({...x,score:keys.reduce((n,k)=>n+(x.s.toLowerCase().includes(k)?2:0),0)+(/\b(ai|agent|agents|model|workflow|copilot|skill|skills|evaluation|permission|governance|retrieval)\b/i.test(x.s)?1:0)}));
 const chosen=scored.filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.i-b.i).slice(0,5).sort((a,b)=>a.i-b.i);
 let out=(chosen.length?chosen:sentences.slice(0,4)).map(x=>x.s).join(' ');
 if(out.length>max)out=out.slice(0,max).replace(/\s+\S*$/,'').trim()+'…';
 return out;
}
export function articleEvidenceSufficiency(record){
 const reasons=[];
 if(!Number.isInteger(record?.source_word_count)||record.source_word_count<MIN_ARTICLE_SOURCE_WORDS)reasons.push('source_body_too_short');
 if(evidenceWordCount(record?.excerpt)<MIN_ARTICLE_EXCERPT_WORDS)reasons.push('excerpt_not_substantive');
 const excerpt=normalizeTitle(record?.excerpt),title=normalizeTitle(record?.headline);
 if(!excerpt||title&&(excerpt===title||excerpt.startsWith(title)&&excerpt.length<=title.length+50))reasons.push('title_only_evidence');
 return {sufficient:reasons.length===0,reasons};
}
