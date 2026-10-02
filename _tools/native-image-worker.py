#!/usr/bin/env python3
"""Route to a qualified scheduled host or report the actual capability gap.

This GitHub runner never renders, visually reviews or accepts an image itself.
"""
import argparse, json
from pathlib import Path
from datetime import datetime, timezone

def main():
    p=argparse.ArgumentParser()
    for name in ['run-root','request','execution-key','execution-id','edition-id','writer-generation']:
        p.add_argument('--'+name, required=True)
    p.add_argument('--host-registration', default=str(Path(__file__).resolve().parents[1]/'docs/operations/unattended-image-host.json'))
    a=p.parse_args(); root=Path(a.run_root); request=Path(a.request)
    req=json.loads(request.read_text()); task=str(req.get('task_id',''))
    if req.get('capability')!='native_chatgpt' or task not in ['11','12','13','14','15','16']:
        raise SystemExit('unsupported_image_request')
    if req.get('execution_id')!=a.execution_id or int(req.get('writer_generation',-1))!=int(a.writer_generation):
        raise SystemExit('stale_or_unbound_image_request')
    done=root/f'_records/edition-execution/events/{a.execution_key}/{task}-done.json'
    if done.exists():
        print(json.dumps({'status':'already_done','preserved':True})); return
    # Protected host registration is written only after live qualification. The
    # actual scheduled consumer still owns generation, capture, review and receipt.
    registration=Path(a.host_registration)
    host=json.loads(registration.read_text()) if registration.exists() else {}
    if host.get('status')=='READY' and str(host.get('host_id','')).startswith('chatgpt-automation:') and host.get('qualification_receipt_path'):
        result={'schema_version':'scheduled-image-dispatch-v1','status':'AWAITING_SCHEDULED_EXECUTOR',
            'host_id':host['host_id'],'execution_id':a.execution_id,'task_id':task,
            'generation_started':False,'accepted_locked':False,
            'next_action':'Qualified scheduled controller consumes this exact fenced request; queueing is not execution.'}
        if req.get('status')!='awaiting_scheduled_executor':
            req.update(status='awaiting_scheduled_executor',dispatch=result)
            request.write_text(json.dumps(req,indent=2)+'\n')
        print(json.dumps(result)); return
    if req.get('status')=='capability_blocked':
        print(json.dumps({'status':'CAPABILITY_BLOCKED','reused':True})); return
    now=datetime.now(timezone.utc).isoformat()
    result={'schema_version':'image-capability-blocker-v1','status':'CAPABILITY_BLOCKED',
        'reason':'NO_SUPPORTED_UNATTENDED_NATIVE_IMAGE_HOST','execution_id':a.execution_id,
        'task_id':task,'at':now,'generation_started':False,'accepted_locked':False,
        'next_action':'Bind and prove an authorized native generation/review host within production cost policy.'}
    event=root/f'_records/edition-execution/events/{a.execution_key}/{task}-blocked-image-capability.json'
    event.parent.mkdir(parents=True,exist_ok=True)
    if not event.exists():
        event.write_text(json.dumps({'task_id':task,'from':'Active','to':'Blocked','at':now,
            'reason_code':result['reason'],'external_blocker':True,'recoverable':False,'recovery_action':None},indent=2)+'\n')
    req.update(status='capability_blocked',blocker=result)
    request.write_text(json.dumps(req,indent=2)+'\n')
    print(json.dumps(result))
if __name__=='__main__': main()
