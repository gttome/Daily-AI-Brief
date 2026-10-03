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
    consumer=host.get('reusable_consumer') or {}
    consumer_id=str(consumer.get('automation_id',''))
    qualified=host.get('status')=='READY' and str(host.get('host_id','')).startswith('chatgpt-automation:') and host.get('qualification_receipt_path')
    admitted_consumer=(
        qualified and consumer.get('scheduler_kind')=='chatgpt_automation' and
        len(consumer_id)==32 and consumer.get('enabled') is True and
        consumer.get('role')=='scheduled_native_image_request_consumer'
    )
    if admitted_consumer:
        result={'schema_version':'scheduled-image-dispatch-v2','status':'QUEUED_FOR_SCHEDULED_CONSUMER',
            'qualification_host_id':host['host_id'],'consumer_id':consumer_id,
            'execution_id':a.execution_id,'task_id':task,
            'generation_started':False,'accepted_locked':False,
            'writer_generation_is_provenance':True,'authority_refresh_required_at_invocation':True,
            'next_action':'Enabled admitted scheduled consumer refreshes current fenced authority at invocation and consumes this exact request.'}
        if req.get('status')!='queued_for_scheduled_consumer':
            req.update(status='queued_for_scheduled_consumer',dispatch=result)
            request.write_text(json.dumps(req,indent=2)+'\n')
        print(json.dumps(result)); return
    if qualified:
        now=datetime.now(timezone.utc).isoformat()
        result={'schema_version':'image-capability-blocker-v1','status':'CAPABILITY_BLOCKED',
            'reason':'NO_ENABLED_REUSABLE_SCHEDULED_IMAGE_CONSUMER','execution_id':a.execution_id,
            'task_id':task,'at':now,'generation_started':False,'accepted_locked':False,
            'next_action':'Bind an enabled reusable scheduled ChatGPT consumer in protected host registration; do not create a duplicate production run.'}
        req.update(status='capability_blocked',blocker=result)
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
