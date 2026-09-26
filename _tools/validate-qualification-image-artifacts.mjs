import fs from 'node:fs';
import {validateQualificationImageArtifactManifest} from '../_generator/lib/qualification-image-artifact.mjs';
const args=process.argv.slice(2);const i=args.indexOf('--run-id');const runId=i>=0?args[i+1]:null;if(!runId)throw new Error('qualification_image_run_id_required');const p=`_records/qualification/${runId}/image-artifacts.json`;if(!fs.existsSync(p))throw new Error('qualification_image_artifact_manifest_missing:'+p);const m=JSON.parse(fs.readFileSync(p,'utf8'));process.stdout.write(JSON.stringify(validateQualificationImageArtifactManifest(m,{runId}))+'\n');
