from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
import json,math
ROOT=Path('.');bp=ROOT/'_records/edition-execution/task11-kanban.json';b=json.loads(bp.read_text());now=datetime.now(ZoneInfo('America/Chicago'))
W=3200;M=36;G=20
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';bold='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
F=lambda s,bo=False:ImageFont.truetype(bold if bo else font,s)
C={'bg':'#061f33','panel':'#103249','border':'#426279','text':'#f5f9ff','muted':'#abc1d5','Backlog':'#698699','WIP':'#f6be0b','Tested':'#168fec','Done':'#04a768','ink':'#07213b','card':'#f4f8fd'}
cardh=174; top=655; lanehead=100
counts={c:sum(t['column']==c for t in b['cards']) for c in ['Backlog','WIP','Tested','Done']}
rows=math.ceil(counts['Backlog']/2);laneh=lanehead+rows*(cardh+14)+24
bottom=top+laneh+22;H=bottom+1010
im=Image.new('RGB',(W,H),C['bg']);d=ImageDraw.Draw(im)
def rr(box,fill,outline=None,r=12):d.rounded_rectangle(box,radius=r,fill=fill,outline=outline,width=2)
def text(x,y,s,size=28,fill=None,bo=False):d.text((x,y),str(s),font=F(size,bo),fill=fill or C['text'])
def wrap(s,width,size,bo=False):
 out=[]
 for para in str(s).split('\n'):
  line=''
  for word in para.split():
   new=(line+' '+word).strip()
   if d.textlength(new,font=F(size,bo))>width and line:out.append(line);line=word
   else:line=new
  out.append(line)
 return out

def txtbox(x,y,s,width,size=27,fill=None,bo=False,leading=1.3):
 for line in wrap(s,width,size,bo):text(x,y,line,size,fill,bo);y+=size*leading
 return y

def dur(start,end=None):
 if not start:return 'UNKNOWN'
 dt=datetime.fromisoformat(start.replace('Z','+00:00'));en=datetime.fromisoformat(end.replace('Z','+00:00')) if end else now
 sec=max(0,int((en-dt).total_seconds()));h,rem=divmod(sec,3600);m,se=divmod(rem,60)
 return f'{h}h {m:02}m {se:02}s' if h else f'{m}m {se:02}s'
def stamp(t):return datetime.fromisoformat(t.replace('Z','+00:00')).astimezone(ZoneInfo('America/Chicago')).strftime('%b %d  %I:%M:%S %p CT') if t else 'UNKNOWN'
text(M,28,'Daily AI Brief',68,bo=True);text(M,113,'Production Kanban  |  Task 11 / Run Two',31,fill=C['muted'],bo=True)
# Top tiles carry all example metrics, with honest current state.
tiles=[('OBSERVED',now.strftime('%b %d, %Y'),now.strftime('%I:%M:%S %p CT')),('TARGET EDITION','September 30, 2026','Distinct edition / fixed cutoff'),('IMAGES','0 / 6 accepted','Six serial story-specific jobs'),('PUBLIC CLOSED','1 / 2 verified','September 29 closed'),('RUN TWO ELAPSED',dur(b['run_started_at']),'Since edition binding')]
start=800;tw=(W-M-start-4*14)//5
for i,(label,value,note) in enumerate(tiles):
 x=start+i*(tw+14);rr((x,24,x+tw,168),C['panel'],C['border']);text(x+16,40,label,23,fill=C['muted'],bo=True);text(x+16,80,value,30,fill='#ffce54' if i in [2,4] else C['text'],bo=True);txtbox(x+16,125,note,tw-30,20,fill=C['muted'])
text(M,196,'PARENT 11: IN PROGRESS / BLOCKED AT ADMISSION',31,fill='#ffcc55',bo=True)
text(1150,196,'Task 11 recorded elapsed: '+dur(b['parent_started_at']),27)
text(2150,196,'Mission elapsed: '+dur(b['mission_started_at']),27)
y=250
for s in ['Run ID: '+b['run_id']+'    |    Edition ID: '+b['edition_id'], 'Fixed cutoff: '+stamp(b['cutoff'])+'    |    Pinned release: '+b['main_sha'][:12], 'Change: distinct identity locked; first closure reconciled; controller, keeper and status instructions updated.', 'Primary restored to enabled; immediate run requested. Active production execution is not yet confirmed.']:
 text(M,y,s,28,fill=C['muted'] if y<326 else C['text']);y+=42
rr((M,430,W-M,535),'#453622','#ba8425')
txtbox(M+20,445,'CURRENT BLOCKER: '+b['blocker'],W-2*M-40,29,fill='#ffd98a',bo=True)
txtbox(M+20,490,'NEXT: Same controller recovers the prior native result, verifies exact bytes, then advances fresh discovery.',W-2*M-40,27)
# Readiness strip: all ten categories, two rows.
read=list(b['readiness'].items());tilew=(W-2*M-4*16)//5
for i,(k,v) in enumerate(read):
 x=M+(i%5)*(tilew+16);yy=554+(i//5)*43
 text(x,yy,k.upper()+': '+v,22,fill=C['muted'])
# Lanes preserve ordering while using 2 subcolumns in Backlog, as in attached board.
lx=[M,1398,2070,2547];lw=[1342,652,457,617]
for col,x,width in zip(['Backlog','WIP','Tested','Done'],lx,lw):
 rr((x,top,x+width,top+laneh),C['panel'],C['border']);rr((x,top,x+width,top+67),C[col]);text(x+22,top+15,f'{col}  {counts[col]}',36,fill=C['ink'] if col=='WIP' else 'white',bo=True)
 sub='ID / TASK                         DEPENDENCY / ESTIMATE' if col=='Backlog' else 'ID / TASK         ELAPSED' if col=='WIP' else 'TIME IN TESTED' if col=='Tested' else 'COMPLETED / CYCLE TIME'
 text(x+18,top+75,sub,19,fill=C['muted'])
 cards=[t for t in b['cards'] if t['column']==col]
 if not cards:text(x+22,top+128,'No tasks yet',27,fill=C['muted'])
 for i,t in enumerate(cards):
  if col=='Backlog':
   inner=(width-42)//2;cx=x+14+(i//rows)*(inner+14);cy=top+lanehead+(i%rows)*(cardh+14);ww=inner;hh=cardh
  else:cx=x+14;cy=top+lanehead+i*(245 if col=='Done' else 650);ww=width-28;hh=229 if col=='Done' else 590
  rr((cx,cy,cx+ww,cy+hh),C['card']);rr((cx+14,cy+16,cx+112,cy+65),C[col],r=8);text(cx+22,cy+24,t['id'],27,fill='white' if col!='WIP' else C['ink'],bo=True)
  if col=='Backlog':
   ty=txtbox(cx+125,cy+16,t['title'],ww-142,26,fill=C['ink'],bo=True)
   text(cx+16,cy+112,'Dependency: '+t['depends_on'],23,fill='#456176');text(cx+16,cy+141,'Not started  |  Estimate: unknown',21,fill='#587487')
  elif col=='Done':
   txtbox(cx+126,cy+17,t['title'],ww-144,25,fill=C['ink'],bo=True)
   text(cx+16,cy+104,'Completed:',22,fill='#456176');text(cx+16,cy+136,stamp(t['completed_at']),21,fill=C['ink'])
   text(cx+16,cy+172,'Cycle: '+dur(t['started_at'],t['completed_at']),26,fill=C['ink'],bo=True)
   text(cx+16,cy+205,'Historical Backlog exit not recorded',17,fill='#587487')
  else:
   ty=txtbox(cx+126,cy+17,t['title'],ww-144,27,fill=C['ink'],bo=True)
   text(cx+18,cy+108,'BLOCKED / RECOVERY REQUESTED',23,fill='#9e6100',bo=True)
   text(cx+18,cy+152,'Elapsed: '+dur(t['started_at']),33,fill=C['ink'],bo=True)
   text(cx+18,cy+195,'Backlog exit: '+stamp(t['started_at']),20,fill='#456176')
   steps=[('DONE','Bind separate edition and cutoff'),('DONE','Update the existing controller'),('DONE','Restore controller enabled state'),('DONE','Request immediate continuation'),('WAIT','Recover native producer result'),('WAIT','Persist fresh admission proof'),('NEXT','Begin fresh article discovery')]
   yy=cy+246
   for status,title in steps:
    text(cx+18,yy,status,20,fill='#008951' if status=='DONE' else '#a56d00',bo=True);txtbox(cx+95,yy,title,ww-112,22,fill=C['ink']);yy+=43
# bottom panels: pipeline, repository, controller, blocker-next.
py=bottom; widths=[1180,765,630,493];xx=M
for title,width in zip(['Publication pipeline — Run Two','Repository state','Controller status','Blocker / next action'],widths):
 rr((xx,py,xx+width,py+384),C['panel'],C['border']);text(xx+20,py+17,title,28,bo=True);xx+=width+20
px=M+28
for i,g in enumerate(b['pipeline']):
 xx=px+(i%4)*287;yy=py+80+(i//4)*145
 d.ellipse((xx,yy,xx+28,yy+28),fill='#efb823' if i==0 else '#688397',outline='white',width=2)
 text(xx+41,yy,g['stage'],24,bo=True);text(xx,yy+45,g['status'],21,fill='#ffcc55' if i==0 else C['muted'])
text(M+25,py+348,'No run-two qualification, publication PR or deployment yet.',24,fill=C['muted'])
rx=M+1200
repo_lines=[('Main / release',b['main_sha'][:12]),('Active branch','reliable-edition/dab-edition-2026-09-30'),('Run-two state head',b['controller_sha'][:12]),('Public edition','2026-09-29'),('Public content SHA',b['live_public']['production_sha'][:12]),('Latest Pages SHA',b['live_public']['latest_pages_sha'][:12]),('Main CI / Pages','PASS / PASS'),('Second edition live?','NO')]
for i,(k,v) in enumerate(repo_lines):text(rx+18,py+68+i*36,k+': '+v,21)
cx=rx+785
for i,a in enumerate(b['automations']):
 text(cx+18,py+67+i*75,a['role']+': '+('enabled' if a['enabled'] else 'disabled'),24,bo=True)
 text(cx+18,py+97+i*75,'Last run: '+stamp(a['last_run_at']),19,fill=C['muted'])
text(cx+18,py+304,'Current step: admission',23);text(cx+18,py+338,'Version 1  |  No active Actions',22,fill=C['muted'])
nx=cx+650
ny=txtbox(nx+18,py+66,'Native recovery proof unavailable for pinned release.',453,27,fill='#ffc76b',bo=True)
ny=txtbox(nx+18,ny+25,'Next: recover existing producer result; verify same bytes; admit; discover.',453,25)
# Image timing and evidence panel
py+=410;rr((M,py,1800,py+426),C['panel'],C['border']);text(M+20,py+20,'Image production — actual phase timing',29,bo=True)
headers=['IMAGE / TASK','ATTEMPTS','GENERATE','SAVE','REVIEW','ACCEPT','CYCLE']
xs=[M+20,M+310,M+510,M+770,M+1030,M+1280,M+1510]
for x,h in zip(xs,headers):text(x,py+76,h,21,fill=C['muted'],bo=True)
for i,img in enumerate(b['images']):
 yy=py+116+i*42
 vals=[f"{img['image']}  /  {img['task_id']}",'0','Not started','Not started','Not started','0 / 1','Not started']
 for x,v in zip(xs,vals):text(x,yy,v,22)
text(M+20,py+382,'Accepted images are preserved. No phase duration is invented before an actual event.',22,fill=C['muted'])
rr((1820,py,W-M,py+426),C['panel'],C['border']);text(1842,py+20,'Evidence, timing and changes',29,bo=True)
notes=['First closure: protected completion + independent validation 36809593413.','Latest stage run 36813464628: SUCCESS, production stages SKIPPED (no-op).','Run-two stages are not marked complete from old-edition evidence.','Backlog: no age. WIP: elapsed from actual recorded exit.','Tested: time waiting. Done: frozen Backlog-to-Done cycle.','Earlier missing starts stay UNKNOWN; estimates are not promises.','Billing meter unobserved. No paid recurring execution enabled.']
ny=py+73
for s in notes:ny=txtbox(1842,ny,s,W-1880,24,fill=C['muted'])+9
# footer
text(M,py+460,'Engineering Done is not a published Brief. Only independently verified PUBLIC CLOSED counts.',32,bo=True)
text(M,py+513,'Updated '+now.strftime('%b %d, %Y  %I:%M:%S %p CT')+'  |  26 child cards + parent 11  |  Timing from durable events',26,fill=C['muted'])
out=ROOT/'_records/edition-execution/status/task11-production-dashboard.png';out.parent.mkdir(parents=True,exist_ok=True);im.quantize(colors=64).save(out,optimize=True)
assert len(b['cards'])==26 and len({c['id'] for c in b['cards']})==26
print(json.dumps({'path':str(out),'dimensions':im.size,'counts':counts,'bytes':out.stat().st_size}))
