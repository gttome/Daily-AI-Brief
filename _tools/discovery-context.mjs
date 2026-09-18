import {RetrievalCache} from '../_generator/lib/research.mjs';
import {retrieveSource,compactDiscoveryHtml} from './discovery-links.mjs';
export class DiscoveryAcquisition {
 constructor({cache=new RetrievalCache({directory:process.env.DAB_RETRIEVAL_CACHE?process.env.DAB_RETRIEVAL_CACHE+'/catalog-html-v2':null}),fetcher=async (url,options)=>{const result=await retrieveSource(url,options);return result.not_modified?result:{...result,text:compactDiscoveryHtml(result.text),metadata:{representation:'catalog-html-v2',raw_normalized_chars:result.normalized_chars,response_bytes:result.response_bytes}};}}={}){this.cache=cache;this.fetcher=fetcher;this.failures=new Map();this.pending=new Map();}
 async retrieve(url,{force=false}={}){
  const key=this.cache.key(url,'metadata');
  if(!force&&this.failures.has(key))throw this.failures.get(key);
  if(!force&&this.pending.has(key))return this.pending.get(key);
  const task=this.cache.retrieve(url,this.fetcher,{kind:'metadata',force}).then(result=>{this.failures.delete(key);return result;}).catch(error=>{this.failures.set(key,error);throw error;});
  if(!force)this.pending.set(key,task);
  try{return await task;}finally{if(this.pending.get(key)===task)this.pending.delete(key);}
 }
}
// Both discovery consumers import this same instance in the integrated runner.
export const acquisition=new DiscoveryAcquisition();
