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
    pool=host.get('reusable_consumer_pool') or {}
    legacy=host.get('reusable_consumer') or {}
    qualified=host.get('status')=='READY' and str(host.get('host_id','')).startswith('chatgpt-automation:') and host.get('qualification_receipt_path')
    pool_ids=[str(x) for x in (pool.get('automation_ids') or [])]
    pool_slots=[str(x) for x in (pool.get('slot_ids') or [])]
    admitted_pool=(
        qualified and pool.get('scheduler_kind')=='chatgpt_watchdog_ring' and
        pool.get('enabled') is True and pool.get('role')=='scheduled_native_image_request_consumer_pool' and
        pool.get('all_slots_equivalent') is True and
        pool.get('normal_queued_native_request_consumption') is True and
        int(pool.get('nominal_pickup_minutes',0))==10 and
        pool_slots==['A','B','C','D','E','F'] and len(pool_ids)==6 and
        all(len(x)==32 for x in pool_ids)
    )
    legacy_id=str(legacy.get('automation_id',''))
    admitted_legacy=(
        qualified and legacy.get('scheduler_kind')=='chatgpt_automation' and
        len(legacy_id)==32 and legacy.get('enabled') is True and
        legacy.get('role')=='scheduled_native_image_request_consumer'
    )
    if admitted_pool or admitted_legacy:
        result={'schema_version':'scheduled-image-dispatch-v3','status':'QUEUED_FOR_SCHEDULED_CONSUMER',
            'qualification_host_id':host['host_id'],
            'consumer_kind':'chatgpt_watchdog_ring' if admitted_pool else 'chatgpt_automation',
            'consumer_pool_ids':pool_ids if admitted_pool else [legacy_id],
            'eligible_slots':pool_slots if admitted_pool else ['LEGACY'],
            'all_slots_equivalent':bool(admitted_pool),
            'nominal_pickup_minutes':int(pool.get('nominal_pickup_minutes',60)) if admitted_pool else 60,
            'consumer_id':None if admitted_pool else legacy_id,
            'execution_id':a.execution_id,'task_id':task,
            'generation_started':False,'accepted_locked':False,
            'writer_generation_is_provenance':True,'authority_refresh_required_at_invocation':True,
            'image_execution_admission':{
                'schema_version':'image-execution-admission-v1',
                'required_before_generation':True,
                'generation_authorized':False,
                'preflight_failure_consumes_attempt':False,
                'generator_context_requirement':'dedicated_story_only_generation_context',
                'orchestration_context_visible_to_generator':False,
                'approved_persistence_modes':['git_data_direct_blob','protected_base64_chunk_bridge'],
                'runtime_generated_bytes_readable_required':True,
                'owner_intervention_required':False,
                'receipt_path_pattern':'_records/image-admission/'+a.execution_key+'/'+task+'-'+str(req.get('request_key',''))+'.json'
            },
            'next_action':'Next eligible admitted scheduled consumer refreshes current fenced authority, proves image-execution-admission-v1 before native generation, and consumes this exact request. A mixed Watchdog context or unavailable exact-byte route must fail preflight with zero image attempts; overlapping consumers yield to the current task writer.'}
        if req.get('status')!='queued_for_scheduled_consumer':
            req.update(status='queued_for_scheduled_consumer',dispatch=result)
            request.write_text(json.dumps(req,indent=2)+'\n')
        print(json.dumps(result)); return
    if qualified:
        now=datetime.now(timezone.utc).isoformat()
        result={'schema_version':'image-capability-blocker-v1','status':'CAPABILITY_BLOCKED',
            'reason':'NO_ENABLED_REUSABLE_SCHEDULED_IMAGE_CONSUMER','execution_id':a.execution_id,
            'task_id':task,'at':now,'generation_started':False,'accepted_locked':False,
            'next_action':'Bind an enabled reusable scheduled ChatGPT Watchdog consumer pool (or historical compatible consumer) in protected host registration; do not create a duplicate production run.'}
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
