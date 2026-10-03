#!/usr/bin/env node
// Private transport only. Library owns cloud authentication and durable storage.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import {pathToFileURL} from 'node:url';
const MAX_RAW=100*1024*1024, MAX_ARCHIVE=45*1024*1024, MAX_JSON=150*1024*1024;
export const digest=b=>createHash('sha256').update(b).digest('hex');
const inside=(a,b)=>{const r=path.relative(a,b);return r===''||(!r.startsWith('..'+path.sep)&&r!=='..'&&!path.isAbsolute(r));};
function noLinks(p){
 let cur=path.parse(path.resolve(p)).root;
 for(const part of path.resolve(p).slice(cur.length).split(path.sep).filter(Boolean)){
  cur=path.join(cur,part);
  if(fs.existsSync(cur)||fs.lstatSync(path.dirname(cur)).isDirectory()){
   let st;try{st=fs.lstatSync(cur);}catch(e){if(e.code==='ENOENT')break;throw e;}
   if(st.isSymbolicLink())throw Error('Symbolic links are not allowed');
  }
 }
}
function privatePath(repo,p){
 if(!path.isAbsolute(p))throw Error('Absolute private path required');
 const r=path.resolve(repo),a=path.resolve(p);noLinks(r);noLinks(a);
 if(inside(r,a)||inside(a,r))throw Error('Private data must remain outside repository');
 return a;
}
const safeName=n=>typeof n==='string'&&n.length>0&&!n.includes('\\')&&!n.includes('\0')&&!path.posix.isAbsolute(n)&&n.split('/').every(x=>x&&x!=='.'&&x!=='..'&&!/^\.git$|^\.env(?:\.|$)|^credentials?$/i.test(x));
function entries(root,dir=root,out=[]){
 for(const name of fs.readdirSync(dir).sort()){
  const file=path.join(dir,name),st=fs.lstatSync(file),rel=path.relative(root,file).split(path.sep).join('/');
  if(!safeName(rel)||st.isSymbolicLink()||(!st.isDirectory()&&!st.isFile())||(st.isFile()&&st.nlink!==1))throw Error('Unsafe checkpoint file');
  if(st.isDirectory())entries(root,file,out);else out.push(rel);
 }
 return out;
}
export function pack({repo,root,output}){
 root=privatePath(repo,root);output=privatePath(repo,output);
 if(inside(root,output))throw Error('Bundle must be outside evidence root');
 const st=fs.statSync(root);
 if(!st.isDirectory()||(st.mode&0o077)!==0||st.uid!==process.getuid())throw Error('Evidence root must be owner-only');
 const names=entries(root);if(!names.length||names.length>10000)throw Error('Invalid file count');
 let size=0;
 const files=names.map(name=>{
  const file=path.join(root,name),before=fs.statSync(file);
  size+=before.size;if(size>MAX_RAW)throw Error('Checkpoint too large; do not truncate evidence');
  const bytes=fs.readFileSync(file),after=fs.statSync(file);
  if(before.size!==after.size||before.mtimeMs!==after.mtimeMs||before.ino!==after.ino)throw Error('Checkpoint changed during snapshot');
  return {name,size:bytes.length,sha256:digest(bytes),data:bytes.toString('base64')};
 });
 if(JSON.stringify(entries(root))!==JSON.stringify(names)||files.some(x=>digest(fs.readFileSync(path.join(root,x.name)))!==x.sha256))throw Error('Checkpoint changed during snapshot');
 const bundle={schema_version:'1.0.0',kind:'private-checkpoint-transport',root,created_at:new Date().toISOString(),files};
 const bytes=gzipSync(Buffer.from(JSON.stringify(bundle)));
 if(bytes.length>MAX_ARCHIVE)throw Error('Bundle exceeds 45 MiB; report storage gap');
 fs.mkdirSync(path.dirname(output),{recursive:true,mode:0o700});
 fs.writeFileSync(output,bytes,{flag:'wx',mode:0o600});
 return {sha256:digest(bytes),bytes:bytes.length,files:files.length,approval:'not_granted',cloud_saved:false};
}
export function unpack({repo,root,bundle,expectedHash,restore=false}){
 root=privatePath(repo,root);bundle=privatePath(repo,bundle);
 if(!/^[a-f0-9]{64}$/.test(expectedHash||''))throw Error('Independent SHA-256 receipt required');
 if(fs.statSync(bundle).size>MAX_ARCHIVE)throw Error('Bundle too large');
 const bytes=fs.readFileSync(bundle);
 if(digest(bytes)!==expectedHash)throw Error('Bundle hash mismatch');
 const b=JSON.parse(gunzipSync(bytes,{maxOutputLength:MAX_JSON}));
 if(b.schema_version!=='1.0.0'||b.kind!=='private-checkpoint-transport'||b.root!==root||!Array.isArray(b.files)||!b.files.length||b.files.length>10000)throw Error('Bundle identity mismatch; do not rewrite manifest paths');
 const seen=new Set();let size=0;
 const files=b.files.map(x=>{
  if(!safeName(x.name)||seen.has(x.name)||typeof x.data!=='string'||!Number.isSafeInteger(x.size)||x.size<0)throw Error('Unsafe or duplicate file');
  seen.add(x.name);size+=x.size;if(size>MAX_RAW)throw Error('Bundle too large');
  const data=Buffer.from(x.data,'base64');
  if(data.toString('base64')!==x.data||data.length!==x.size||digest(data)!==x.sha256)throw Error('Artifact integrity failure');
  const dest=path.join(root,x.name);noLinks(dest);
  if(fs.existsSync(dest)){const st=fs.lstatSync(dest);if(!st.isFile()||st.nlink!==1||digest(fs.readFileSync(dest))!==x.sha256)throw Error('Existing artifact differs; no overwrite');}
  return {...x,data,dest};
 });
 for(const x of files)for(let p=path.posix.dirname(x.name);p!=='.';p=path.posix.dirname(p))if(seen.has(p))throw Error('File/directory collision');
 if(fs.existsSync(root)){const st=fs.statSync(root);if(!st.isDirectory()||st.uid!==process.getuid()||(st.mode&0o077)!==0)throw Error('Restore root must be owner-only');}
 let restored=0;
 if(restore){
  fs.mkdirSync(root,{recursive:true,mode:0o700});
  for(const x of files){
   noLinks(x.dest);
   if(fs.existsSync(x.dest))continue;
   fs.mkdirSync(path.dirname(x.dest),{recursive:true,mode:0o700});
   // Exclusive writes preserve any concurrent working artifact. Partial writes remain
   // detectable by hash; this operation never silently overwrites or approves them.
   fs.writeFileSync(x.dest,x.data,{flag:'wx',mode:0o600});restored++;
  }
 }
 return {state:'transport_verified',files:files.length,restored,approval:'not_granted',requires_existing_recovery_checks:true,scheduled_recovery_verified:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 try{
  const [command,...rest]=process.argv.slice(2),args={};
  for(let i=0;i<rest.length;i++){if(rest[i]==='--restore'){args.restore=true;continue;}if(!rest[i].startsWith('--')||!rest[i+1])throw Error('Invalid arguments');args[rest[i].slice(2)]=rest[++i];}
  const opts={repo:process.cwd(),root:args.root,output:args.output,bundle:args.bundle,expectedHash:args.sha256,restore:args.restore===true};
  if(!['pack','verify','restore'].includes(command))throw Error('Expected pack, verify or restore');
  if(command==='restore'&&!opts.restore)throw Error('Restore requires explicit --restore');
  console.log(JSON.stringify(command==='pack'?pack(opts):unpack({...opts,restore:command==='restore'&&opts.restore})));
 }catch(e){console.error(e.message);process.exitCode=1;}
}
