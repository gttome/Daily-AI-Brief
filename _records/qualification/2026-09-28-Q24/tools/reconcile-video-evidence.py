from pathlib import Path
from urllib.parse import urlparse, parse_qs
from datetime import datetime
import json, hashlib, re, xml.etree.ElementTree as ET, copy, os
CHANNEL='UCKWaEZ-_VweaEx1j62do_vQ'
CHANNEL_URL='https://www.youtube.com/channel/'+CHANNEL
NS={'a':'http://www.w3.org/2005/Atom','yt':'http://www.youtube.com/xml/schemas/2015','m':'http://search.yahoo.com/mrss/'}
def parse_feed(text):
    feed=ET.fromstring(text)
    assert feed.tag=='{'+NS['a']+'}feed'
    assert feed.findtext('a:author/a:uri',namespaces=NS)==CHANNEL_URL
    alternate=feed.find("a:link[@rel='alternate']",NS)
    assert alternate is not None and alternate.get('href')==CHANNEL_URL
    self_link=feed.find("a:link[@rel='self']",NS)
    assert self_link is not None
    u=urlparse(self_link.get('href'))
    assert u.scheme in ('http','https') and u.hostname=='www.youtube.com' and u.path=='/feeds/videos.xml' and parse_qs(u.query)=={'channel_id':[CHANNEL]}
    # This captured feed's root has the UC-less channel ID; entry-level channel IDs remain full.
    assert feed.findtext('yt:channelId',namespaces=NS)==CHANNEL[2:]
    assert feed.findtext('a:id',namespaces=NS)=='yt:channel:'+CHANNEL[2:]
    records={}
    for entry in feed.findall('a:entry',NS):
        video_id=entry.findtext('yt:videoId',namespaces=NS)
        assert video_id and re.fullmatch(r'[A-Za-z0-9_-]{11}',video_id)
        assert entry.findtext('yt:channelId',namespaces=NS)==CHANNEL
        assert entry.findtext('a:author/a:uri',namespaces=NS)==CHANNEL_URL
        assert entry.findtext('a:id',namespaces=NS)=='yt:video:'+video_id
        link=entry.find("a:link[@rel='alternate']",NS);assert link is not None
        canonical=link.get('href');assert canonical in ('https://www.youtube.com/watch?v='+video_id,'https://www.youtube.com/shorts/'+video_id)
        title=entry.findtext('a:title',namespaces=NS)
        assert title and title==entry.findtext('m:group/m:title',namespaces=NS)
        published=entry.findtext('a:published',namespaces=NS)
        assert published and re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})',published)
        when=datetime.fromisoformat(published.replace('Z','+00:00'));assert when.tzinfo is not None
        assert video_id not in records
        records[video_id]={'video_id':video_id,'channel_id':CHANNEL,'channel_author_url':CHANNEL_URL,'canonical_url':canonical,'title':title,'published_at':when.isoformat().replace('+00:00','Z'),'updated_at_not_used_for_freshness':entry.findtext('a:updated',namespaces=NS),'description':entry.findtext('m:group/m:description',namespaces=NS)}
    return records

def verify_negative_cases(source):
    tests=[]
    def reject(name,change):
        root=ET.fromstring(source);change(root)
        try:parse_feed(ET.tostring(root))
        except (AssertionError,ValueError):tests.append(name);return
        raise AssertionError('Accepted invalid source: '+name)
    reject('wrong_feed_author',lambda f:f.find('a:author/a:uri',NS).__setattr__('text',CHANNEL_URL+'x'))
    reject('wrong_feed_alternate',lambda f:f.find("a:link[@rel='alternate']",NS).set('href',CHANNEL_URL+'x'))
    reject('wrong_feed_self_identity',lambda f:f.find("a:link[@rel='self']",NS).set('href','https://www.youtube.com/feeds/videos.xml?channel_id=other'))
    reject('wrong_root_suffix',lambda f:f.find('yt:channelId',NS).__setattr__('text','wrong'))
    reject('wrong_entry_channel',lambda f:f.find('a:entry/yt:channelId',NS).__setattr__('text','UCwrong'))
    reject('wrong_entry_author',lambda f:f.find('a:entry/a:author/a:uri',NS).__setattr__('text',CHANNEL_URL+'x'))
    reject('wrong_entry_video_link',lambda f:f.find("a:entry/a:link[@rel='alternate']",NS).set('href','https://www.youtube.com/watch?v=AAAAAAAAAAA'))
    reject('different_media_title',lambda f:f.find('a:entry/m:group/m:title',NS).__setattr__('text','Another video'))
    reject('timestamp_without_timezone',lambda f:f.find('a:entry/a:published',NS).__setattr__('text','2026-09-28T11:00:25'))
    assert len(tests)==9
    return tests

if __name__=='__main__':
    root=Path('/tmp/q24-video-reconciled');source=(root/'ibm-public-feed.txt').read_bytes()
    assert hashlib.sha256(source).hexdigest()=='4f910653cd78b4c0899d89a63a3030000dfcda243cca8b1ac69452768bdf115b'
    parsed=parse_feed(source);negative_tests=verify_negative_cases(source)
    old_path=Path('_records/qualification/2026-09-28-Q24/media-evidence/video-primary-metadata.json');old=json.loads(old_path.read_text())
    cutoff=datetime.fromisoformat(old['cutoff'].replace('Z','+00:00'));results=[]
    for previous in old['records']:
        item=parsed[previous['video_id']]
        assert item['title']==previous['title'] and item['canonical_url']==previous['canonical_url']
        age=(cutoff-datetime.fromisoformat(item['published_at'].replace('Z','+00:00'))).total_seconds()/3600
        assert 0<=age<=72 and 0<previous['catalog_runtime_seconds']<=1200
        results.append({**previous,'feed_record':item,'published_at':item['published_at'],'age_hours_at_original_cutoff':age,'within_72_hours':True,'primary_feed_catalog_identity_matches':True,'metadata_resolved':True,'editorial_review_complete':False,'selected':False})
    history=[]
    for path in sorted(Path('_data/editions').glob('????-??-??.json')):
        if path.stem>='2026-09-28':continue
        edition=json.loads(path.read_text());assert edition['brief_date']==path.stem
        assert isinstance(edition['worth_watching'],dict)
        assert set(edition['worth_watching'])=={'general','agents_non_technical_people'}
        videos=[]
        for slot,item in edition['worth_watching'].items():
            assert isinstance(item,dict) and item.get('status') in ('included','empty')
            if item['status']=='included':assert item.get('url') and item.get('title')
            videos.append({'slot':slot,**item})
        history.append({'edition_date':path.stem,'source_path':str(path),'source_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'canonical_path':'worth_watching','videos':videos})
    assert len(history)==20 and any(v['status']=='included' for e in history for v in e['videos'])
    out=Path('_records/qualification/2026-09-28-Q24/media-evidence')
    history_result={'schema_version':'1.0.0','run_id':'2026-09-28-Q24','baseline_sha':old['baseline_sha'],'canonical_field':'worth_watching','includes_before':'2026-09-28','same_day_and_qualification_outcomes_excluded':True,'previous_projection_usable_for_novelty':False,'supersedes_artifact_field':'10999560701/prior-video-history.json','semantic_novelty_review_complete':False,'editions':history}
    history_bytes=(json.dumps(history_result,indent=2)+'\n').encode()
    with (out/'prior-video-history-v2.json').open('xb') as stream:stream.write(history_bytes)
    result={**old,'workflow_run_id':int(os.environ['GITHUB_RUN_ID']),'execution_commit':os.environ['GITHUB_SHA'],'previous_execution':{'workflow_run_id':old['workflow_run_id'],'source_git_blob':'31b3b469809ffb68d20092b6ab9ba99b44cfeb3b','initial_feed_header_assertion_failed':True,'previous_record_preserved':True},'source_artifact_id':11000140814,'source_artifact_sha256':'5bd46d50ff9df9dbd03095539bc867640f7311b3045687e5a76c07cdbf2c7af3','new_endpoints_requested':0,'records':results,'feed_identity_reconciliation':{'root_channel_id_observed':CHANNEL[2:],'root_author_and_alternate':CHANNEL_URL,'entry_channel_ids_required':CHANNEL,'entry_author_urls_required':CHANNEL_URL,'feed_self_channel_parameter_required':CHANNEL,'source_recaptured':False,'negative_tests_passed':negative_tests},'diagnostics':[],'prior_video_history_git_path':str(out/'prior-video-history-v2.json'),'prior_video_history_sha256':hashlib.sha256(history_bytes).hexdigest(),'prior_video_history_editions':len(history),'prior_video_history_included_slots':sum(v['status']=='included' for e in history for v in e['videos']),'metadata_only':True,'video_selection_validated':False,'media_ready':False}
    with (out/'video-metadata-reconciliation.json').open('x') as stream:stream.write(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'metadata_resolved':len(results),'negative_tests':len(negative_tests),'history_editions':len(history),'history_included_slots':result['prior_video_history_included_slots'],'media_ready':False}))
