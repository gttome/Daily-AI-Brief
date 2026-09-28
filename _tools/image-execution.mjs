#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {parseArgs} from 'node:util';
import {createHash} from 'node:crypto';
import {buildImageGenerationExecution,validateImageExecutionReceipt,IMAGE_EXECUTION_POLICY} from '../_generator/lib/image-execution.mjs';
const {positionals,values}=parseArgs({allowPositionals:true,options:{packets:{type:'string'},out:{type:'string'},execution:{type:'string'},receipt:{type:'string'},asset:{type:'string'}}});
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
try{
  if(positionals[0]==='prepare'){
    if(!values.packets||!values.out)throw Error('--packets and --out required');
    const packets=read(values.packets);
    if(!Array.isArray(packets)||packets.length!==6)throw Error('exactly_six_packets_required');
    const executions=packets.map(buildImageGenerationExecution);
    if(new Set(executions.map(e=>e.sealed_story_packet.candidate_id)).size!==6||new Set(executions.map(e=>e.sealed_story_packet.story_id)).size!==6)throw Error('unique_image_story_identity_required');
    const outputs=executions.map(e=>{
      const id=e.sealed_story_packet.candidate_id;
      if(!/^[a-zA-Z0-9_-]+$/.test(id))throw Error('unsafe_candidate_id');
      const p=path.join(values.out,id+'.json'),text=JSON.stringify(e,null,2)+'\n';
      if(fs.existsSync(p)&&fs.readFileSync(p,'utf8')!==text)throw Error('refuse_to_overwrite_changed_request:'+id);
      return {path:p,text};
    });
    fs.mkdirSync(values.out,{recursive:true});
    for(const output of outputs)fs.writeFileSync(output.path,output.text);
    console.log(JSON.stringify({policy_id:IMAGE_EXECUTION_POLICY,status:'REQUESTS_READY',requests:outputs.map(x=>x.path),image_generation_started:false,manual_intervention_required:false}));
  }else if(positionals[0]==='validate-receipt'){
    if(!values.execution||!values.receipt||!values.asset)throw Error('--execution, --receipt and --asset required');
    const bytes=fs.readFileSync(values.asset),sha=createHash('sha256').update(bytes).digest('hex'),blob=createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
    const errors=validateImageExecutionReceipt(read(values.receipt),read(values.execution),{assetSha256:sha,gitBlobSha:blob});
    if(errors.length)throw Error(errors.join('; '));
    console.log(JSON.stringify({status:'pass',asset_sha256:sha,git_blob_sha:blob,scope:'single_image_execution_receipt_not_full_editorial_or_publication_approval'}));
  }else throw Error('Use prepare or validate-receipt');
}catch(error){console.error(error.message);process.exitCode=1;}
