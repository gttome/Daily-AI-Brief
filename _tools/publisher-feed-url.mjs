// Upgrade only a publisher's own HTTP article URL when its registered endpoint is HTTPS.
// The metadata gate still receives HTTPS only. Cross-host links and unsafe authorities are rejected.
export function publisherFeedUrl(raw,base,source={}){
 let url;
 try{url=new URL(raw,base);}catch{return null;}
 if(url.username||url.password)return null;
 if(url.protocol==='http:'){
  let registered;
  try{registered=new URL(source.discovery_endpoint);}catch{return null;}
  if(registered.protocol!=='https:'||registered.username||registered.password||registered.port||url.hostname!==registered.hostname||url.port)return null;
  url.protocol='https:';
 }
 return url.protocol==='https:'?url:null;
}
