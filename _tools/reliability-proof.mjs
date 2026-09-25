#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {parseArgs} from '../_generator/lib/util.mjs';
import {buildWave5EditionProof,summarizeWave5Proof,assessWave5RecoveryQualification} from '../_generator/lib/reliability-proof.mjs';

const args=parseArgs(process.argv.slice(2));
const command=args._?.[0]||process.argv[2];
const root=path.resolve(args.root||'.');
const read=relative=>JSON.parse(fs.readFileSync(path.isAbsolute(relative)?relative:path.join(root,relative),'utf8'));
const exists=relative=>Boolean(relative)&&fs.existsSync(path.isAbsolute(relative)?relative:path.join(root,relative));
const write=(relative,value)=>{const file=path.isAbsolute(relative)?relative:path.join(root,relative);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');return file;};
const defaultProofDir='_records/reliability-proof/wave5';

function publicationStatusForDate(date){
  const explicit=args.status;
  if(explicit)return read(explicit);
  const status=read('data/operations/publication-status.json');
  if(status.edition_date!==date)throw Error('publication_status_not_for_requested_edition:pass_--status');
  return status;
}

function imageQualityForDate(date,observation){
  const explicit=args['image-quality']||observation?.image_quality_evidence_path;
  if(explicit&&exists(explicit))return {record:read(explicit),path:explicit};
  const manifestPath=args.manifest||'_records/editorial-handoff/publication-manifest.json';
  if(!exists(manifestPath))return {record:null,path:null};
  const manifest=read(manifestPath);
  if(manifest.edition_date!==date)return {record:null,path:null};
  const quality=manifest?.artifacts?.image_quality_evidence?.path||null;
  return quality&&exists(quality)?{record:read(quality),path:quality}:{record:null,path:quality};
}

if(command==='edition'){
  const date=args.date;if(!date)throw Error('edition_requires_--date');
  const lifecyclePath='_records/publication/'+date+'/lifecycle.json',completionPath='_records/publication/'+date+'/completion.json',runStatePath='_records/run-state/'+date+'.json';
  const lifecycle=read(lifecyclePath),completion=exists(completionPath)?read(completionPath):null,status=publicationStatusForDate(date),runState=exists(runStatePath)?read(runStatePath):null;
  const observation=args.observation?read(args.observation):{};
  const recovery=args.recovery?read(args.recovery):null;
  const quality=imageQualityForDate(date,observation);
  if(quality.path&&!observation.image_quality_evidence_path)observation.image_quality_evidence_path=quality.path;
  const proof=buildWave5EditionProof({
    editionDate:date,productionMainSha:args['main-sha']||null,lifecycle,completion,status,runState,
    imageQualityEvidence:quality.record,recoveryEvidence:recovery,observation,
    recordedAt:args['recorded-at']||new Date().toISOString(),
    sourcePaths:{lifecycle:lifecyclePath,completion:completionPath,publication_status:args.status||'data/operations/publication-status.json',run_state:runStatePath,image_quality_evidence:quality.path}
  });
  const out=args.out||defaultProofDir+'/'+date+'.json';write(out,proof);console.log(JSON.stringify(proof,null,2));
}else if(command==='summary'){
  const dir=args.dir||defaultProofDir,absolute=path.join(root,dir);
  const records=exists(dir)?fs.readdirSync(absolute).filter(name=>/^\d{4}-\d{2}-\d{2}\.json$/.test(name)).map(name=>read(path.join(dir,name))):[];
  const summary=summarizeWave5Proof(records,{recordedAt:args['recorded-at']||new Date().toISOString()});
  const out=args.out||path.join(dir,'summary.json');write(out,summary);console.log(JSON.stringify(summary,null,2));
}else if(command==='recovery'){
  if(!args.cases)throw Error('recovery_requires_--cases');
  const qualification=assessWave5RecoveryQualification(read(args.cases),{recordedAt:args['recorded-at']||new Date().toISOString()});
  if(args.out)write(args.out,qualification);console.log(JSON.stringify(qualification,null,2));if(qualification.result!=='pass')process.exitCode=1;
}else throw Error('Usage: reliability-proof.mjs <edition|summary|recovery> [options]');
