from pathlib import Path
import textwrap, cairosvg
W,H=1200,630
OUT=Path('briefs/images/2026-09-10'); OUT.mkdir(parents=True, exist_ok=True)
N='#0a315d'; B='#1479c9'; C='#32aee1'; T='#1aa69d'; R='#c84f52'; P='#6a5bc2'; M='#526c86'; O='#e58b2b'; G='#319a70'
def e(s): return s.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
def tx(x,y,s,size=16,w=500,a='start',fill=N): return f'<text x="{x}" y="{y}" font-family="Arial,Helvetica,sans-serif" font-size="{size}" font-weight="{w}" text-anchor="{a}" fill="{fill}">{e(s)}</text>'
def ml(x,y,s,width=28,size=12,a='start',fill=M,line=15):
    out=''; i=0
    for p in s.split('\n'):
        for q in textwrap.wrap(p,width=width) or ['']:
            out+=tx(x,y+i*line,q,size,400,a,fill); i+=1
    return out
DEFS=f'''<defs>
<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eaf8ff" stop-opacity=".92"/><stop offset="1" stop-color="#aeddF5" stop-opacity=".30"/></linearGradient>
<linearGradient id="p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d8edf8"/></linearGradient>
<linearGradient id="btn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2aa9f4"/><stop offset="1" stop-color="#0867bd"/></linearGradient>
<filter id="sh" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="7" stdDeviation="7" flood-color="#204f77" flood-opacity=".20"/></filter>
<marker id="ar" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto"><path d="M0 0 L0 6 L9 3z" fill="{B}"/></marker>
<marker id="rr" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto"><path d="M0 0 L0 6 L9 3z" fill="{R}"/></marker>
</defs>'''
def icon(cx,cy,typ,col=B,r=34):
    s=f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#fff" stroke="{col}" stroke-width="2.1" filter="url(#sh)"/>'
    if typ=='agent':
        s+=f'<rect x="{cx-21}" y="{cy-17}" width="42" height="34" rx="10" fill="{col}"/><circle cx="{cx-8}" cy="{cy-3}" r="4" fill="#fff"/><circle cx="{cx+8}" cy="{cy-3}" r="4" fill="#fff"/><path d="M{cx-9} {cy+9}h18" stroke="#fff" stroke-width="3"/><path d="M{cx} {cy-26}v9" stroke="{col}" stroke-width="4"/><circle cx="{cx}" cy="{cy-29}" r="4" fill="{col}"/>'
    elif typ=='server':
        s+=f'<rect x="{cx-19}" y="{cy-22}" width="38" height="44" rx="6" fill="{col}"/><path d="M{cx-11} {cy-9}h22 M{cx-11} {cy+3}h22 M{cx-11} {cy+15}h22" stroke="#fff" stroke-width="3"/><circle cx="{cx+11}" cy="{cy-9}" r="2.5" fill="#fff"/><circle cx="{cx+11}" cy="{cy+3}" r="2.5" fill="#fff"/>'
    elif typ=='net':
        s+=f'<circle cx="{cx}" cy="{cy}" r="18" fill="none" stroke="{col}" stroke-width="4"/><path d="M{cx-18} {cy}h36 M{cx} {cy-18}c-9 9-9 27 0 36 M{cx} {cy-18}c9 9 9 27 0 36" fill="none" stroke="{col}" stroke-width="2"/>'
    elif typ=='shield':
        s+=f'<path d="M{cx} {cy-24}l21 8v16c0 16-10 26-21 32-11-6-21-16-21-32v-16z" fill="{col}"/><path d="M{cx-9} {cy+1}l7 7 13-15" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>'
    elif typ=='doc':
        s+=f'<path d="M{cx-20} {cy-24}h28l12 12v36h-40z" fill="#fff" stroke="{col}" stroke-width="3"/><path d="M{cx+8} {cy-24}v12h12 M{cx-12} {cy-3}h24 M{cx-12} {cy+7}h24 M{cx-12} {cy+17}h16" fill="none" stroke="{col}" stroke-width="3"/>'
    elif typ=='gear':
        s+=f'<circle cx="{cx}" cy="{cy}" r="20" fill="{col}"/><circle cx="{cx}" cy="{cy}" r="8" fill="#fff"/><path d="M{cx} {cy-29}v8 M{cx} {cy+21}v8 M{cx-29} {cy}h8 M{cx+21} {cy}h8 M{cx-20} {cy-20}l6 6 M{cx+14} {cy+14}l6 6 M{cx+20} {cy-20}l-6 6 M{cx-14} {cy+14}l-6 6" stroke="{col}" stroke-width="6" stroke-linecap="round"/>'
    elif typ=='lock':
        s+=f'<rect x="{cx-16}" y="{cy-4}" width="32" height="25" rx="5" fill="{col}"/><path d="M{cx-10} {cy-5}v-9a10 10 0 0 1 20 0v9" fill="none" stroke="{col}" stroke-width="5"/><circle cx="{cx}" cy="{cy+7}" r="3" fill="#fff"/>'
    elif typ=='chart':
        s+=f'<rect x="{cx-23}" y="{cy-20}" width="46" height="40" rx="5" fill="#fff" stroke="{col}" stroke-width="3"/><path d="M{cx-16} {cy+11}l9-12 10 6 13-19" fill="none" stroke="{col}" stroke-width="4"/><circle cx="{cx+16}" cy="{cy-14}" r="4" fill="{col}"/>'
    elif typ=='audio':
        s+=f'<circle cx="{cx}" cy="{cy}" r="22" fill="{col}"/><path d="M{cx-13} {cy}v-10 M{cx-6} {cy}v-18 M{cx+1} {cy}v-13 M{cx+8} {cy}v-21 M{cx+15} {cy}v-8" stroke="#fff" stroke-width="4" stroke-linecap="round"/>'
    elif typ=='app':
        s+=f'<rect x="{cx-22}" y="{cy-22}" width="44" height="44" rx="10" fill="{col}"/><rect x="{cx-12}" y="{cy-10}" width="10" height="10" rx="2" fill="#fff"/><rect x="{cx+3}" y="{cy-10}" width="10" height="10" rx="2" fill="#fff"/><rect x="{cx-12}" y="{cy+5}" width="10" height="10" rx="2" fill="#fff"/><rect x="{cx+3}" y="{cy+5}" width="10" height="10" rx="2" fill="#fff"/>'
    elif typ=='terminal':
        s+=f'<rect x="{cx-24}" y="{cy-18}" width="48" height="36" rx="6" fill="{col}"/><path d="M{cx-14} {cy-5}l8 7-8 7 M{cx} {cy+9}h12" fill="none" stroke="#fff" stroke-width="4"/>'
    elif typ=='bug':
        s+=f'<ellipse cx="{cx}" cy="{cy+2}" rx="14" ry="20" fill="{col}"/><circle cx="{cx}" cy="{cy-18}" r="8" fill="{col}"/><path d="M{cx-22} {cy-11}l9 5 M{cx+22} {cy-11}l-9 5 M{cx-23} {cy+3}h10 M{cx+23} {cy+3}h-10 M{cx-20} {cy+18}l9-6 M{cx+20} {cy+18}l-9-6" stroke="{col}" stroke-width="4"/>'
    elif typ=='book':
        s+=f'<path d="M{cx-25} {cy-18}q14-6 25 2v36q-11-8-25-2z M{cx+25} {cy-18}q-14-6-25 2v36q11-8 25-2z" fill="{col}"/><path d="M{cx} {cy-16}v36" stroke="#fff" stroke-width="2"/>'
    return s
def header(title,sub,kind='shield',col=B):
    return f'<rect x="330" y="12" width="540" height="72" rx="14" fill="#fff" stroke="{N}" stroke-width="2.2" filter="url(#sh)"/>'+icon(374,48,kind,col,29)+tx(420,41,title,24,700,'start',N)+tx(420,64,sub,12,400,'start',M)
def arrows_down(xs,y1=84,y2=122): return ''.join(f'<path d="M{x} {y1} V{y2}" stroke="{C}" stroke-width="6" opacity=".65" marker-end="url(#ar)"/>' for x in xs)
def cylinder(cx=600,top=155,rx=450,ry=52,bottom=430,label='CONTROL LAYER',sub='',stroke=B):
    return f'<ellipse cx="{cx}" cy="{top}" rx="{rx}" ry="{ry}" fill="url(#g)" stroke="{stroke}" stroke-width="2"/><path d="M{cx-rx} {top}V{bottom}C{cx-rx} {bottom+45} {cx+rx} {bottom+45} {cx+rx} {bottom}V{top}" fill="#cfeefe" fill-opacity=".28" stroke="{stroke}" stroke-width="1.7"/><ellipse cx="{cx}" cy="{bottom}" rx="{rx}" ry="{ry}" fill="#dff3fb" fill-opacity=".42" stroke="{stroke}" stroke-width="1.4"/>'+tx(cx,top+5,label,20,700,'middle',N)+tx(cx,top+27,sub,12,400,'middle',M)
def inner(cx=600,top=238,rx=365,ry=36,bottom=394,label='WORKSPACE'):
    return f'<ellipse cx="{cx}" cy="{top}" rx="{rx}" ry="{ry}" fill="#fff" fill-opacity=".78" stroke="#56a8d0" stroke-width="1.6"/><path d="M{cx-rx} {top}V{bottom}C{cx-rx} {bottom+34} {cx+rx} {bottom+34} {cx+rx} {bottom}V{top}" fill="#fff" fill-opacity=".49" stroke="#56a8d0" stroke-width="1.4"/><ellipse cx="{cx}" cy="{bottom}" rx="{rx}" ry="{ry}" fill="#f5fbff" fill-opacity=".72" stroke="#56a8d0" stroke-width="1.2"/>'+tx(cx,top+4,label,16,700,'middle',N)
def node(x,y,label,sub,typ,col): return icon(x,y,typ,col)+tx(x,y+49,label,13,700,'middle',N)+tx(x,y+66,sub,10,400,'middle',M)
def conn(x1,y1,x2,y2,col=B,dash=True,arr=True,w=2.2):
    mk=' marker-end="url(#ar)"' if arr else ''
    return f'<path d="M{x1} {y1}H{x2}" fill="none" stroke="{col}" stroke-width="{w}"'+(' stroke-dasharray="5 5"' if dash else '')+mk+'/>'
def bottom_box(title,sub,typ='server',col=N,width=380):
    x=(1200-width)/2
    return f'<rect x="{x}" y="498" width="{width}" height="76" rx="14" fill="#fff" stroke="{N}" stroke-width="2.2" filter="url(#sh)"/>'+icon(x+45,536,typ,col,27)+tx(x+88,528,title,18,700,'start',N)+tx(x+88,550,sub,11,400,'start',M)+f'<path d="M600 431V492" stroke="{B}" stroke-width="4" marker-end="url(#ar)"/>'
def call_left(dotx,doty,y,text,col=B): return f'<circle cx="{dotx}" cy="{doty}" r="4" fill="{col}"/><path d="M{dotx} {doty}H62V{y-5}" stroke="{col}" stroke-width="1.3" fill="none"/>'+ml(70,y,text,24,12,'start',N,15)
def call_right(dotx,doty,y,text,col=B): return f'<circle cx="{dotx}" cy="{doty}" r="4" fill="{col}"/><path d="M{dotx} {doty}H1138V{y-5}" stroke="{col}" stroke-width="1.3" fill="none"/>'+ml(1130,y,text,23,12,'end',N,15)
def base(): return [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',DEFS,'<rect width="1200" height="630" fill="#fff"/><ellipse cx="600" cy="585" rx="390" ry="25" fill="#b8d1e2" opacity=".16"/>']
def save(name,parts):
    parts.append('</svg>'); svg=''.join(parts); (OUT/(name+'.svg')).write_text(svg); cairosvg.svg2png(bytestring=svg.encode(),write_to=str(OUT/(name+'.png')),output_width=W,output_height=H)

s=base(); s+=[header('EVALUATION ISOLATION POLICY','simulation boundary • egress rules • telemetry • stop conditions'),arrows_down([450,530,610,690,770]),cylinder(label='Infrastructure Containment Layer',sub='network namespace  |  DNS controls  |  route enforcement  |  audit'),inner(label='Sandboxed Evaluation Workspace')]
for x,l,sub,typ,col in [(315,'SIM TARGET','synthetic API','server',P),(445,'HARNESS','scenario + tools','doc',B),(600,'AGENT','model under test','agent',B),(755,'EGRESS GATE','allowlist + firewall','shield',T),(885,'TELEMETRY','traces + packets','doc',C)]: s.append(node(x,315,l,sub,typ,col))
for a,b in [(349,411),(479,566),(634,721),(789,851)]: s.append(conn(a,315,b,315))
s += [f'<path d="M790 298C860 246 930 220 1000 218" fill="none" stroke="{R}" stroke-width="4" marker-end="url(#rr)"/>',f'<rect x="980" y="177" width="168" height="83" rx="14" fill="#fff" stroke="{R}" stroke-width="2.1" filter="url(#sh)"/>',icon(1012,218,'net',R,27),tx(1054,207,'REAL EXTERNAL',13,700,'start',R),tx(1054,225,'SYSTEM',13,700,'start',R),tx(1054,244,'unexpected reachability',10,400,'start',M),bottom_box('FORENSIC REVIEW','human incident analysis + independent evidence','bug',R,390),call_left(177,375,118,'Isolation must be enforced below the model layer—not assumed by the harness.'),call_right(963,218,118,'A realistic simulation can still leak into a real external system.',R),call_right(944,451,480,'Packets, traces, and logs make the escape observable and reviewable.')]
save('01-anthropic-containment',s)

s=base(); s+=[header('ENTERPRISE ADMIN POLICY','organization rules • allowed capabilities • security controls','shield',B),arrows_down([450,530,610,690,770]),cylinder(label='Enterprise Copilot Control Plane',sub='policy enforcement  |  access controls  |  monitoring  |  audit'),inner(label='Managed Agent Workspace')]
for x,l,sub,typ,col in [(300,'REPOSITORY','scoped files','doc',T),(420,'NETWORK','restricted egress','net',B),(555,'AGENT','coding agent','agent',B),(690,'TOOLS','approved ops','gear',P),(820,'KEYCHAIN','limited secrets','lock',O),(920,'TERMINAL','controlled exec','terminal',N)]: s.append(node(x,315,l,sub,typ,col))
for a,b in [(334,386),(454,521),(589,656),(724,786),(854,886)]: s.append(conn(a,315,b,315,col=T if a<500 else B))
s += [bottom_box('DIAGNOSTICS + AUDIT','all agent actions are logged and reviewable','server',N,390),call_left(176,374,118,'Local safeguards prevent agent operations from exceeding approved permissions.'),call_right(1012,210,118,'Organization policy flows down into every managed coding-agent session.'),call_right(949,451,480,'Tool access, credentials, and command execution remain centrally constrained.')]
save('02-github-agent-permissions',s)

s=base(); s+=[header('DOCUMENT EVIDENCE SET','PDFs • notes • reference files • source passages','doc',R),arrows_down([450,530,610,690,770]),cylinder(label='Grounded Acrobat Productivity Layer',sub='retrieval  |  synthesis  |  citation mapping  |  deliverable generation',stroke=R),inner(label='Document Agent Workspace')]
for x,l,sub,typ,col in [(300,'SOURCE FILES','controlled corpus','doc',R),(430,'RETRIEVAL','find passages','gear',B),(570,'AGENT','synthesize','agent',B),(710,'REPORT','cited narrative','doc',T),(830,'SLIDES','visual summary','chart',P),(930,'AUDIO','narrated brief','audio',C)]: s.append(node(x,315,l,sub,typ,col))
for a,b,col in [(334,396,R),(464,536,B),(604,676,B),(744,796,T),(864,896,P)]: s.append(conn(a,315,b,315,col=col,dash=False,w=2.6))
s += [bottom_box('CITATION LINEAGE','each output can trace claims back to source evidence','doc',B,430),call_left(177,374,118,'The source corpus stays visible as the grounding layer for every generated artifact.',R),call_right(1015,215,118,'One evidence set can produce reports, presentations, and audio in parallel.',P),call_right(945,451,480,'The productivity gain is useful only if outputs remain traceable and reviewable.',B)]
save('03-adobe-document-agent',s)

s=base(); s+=[header('AI VALUE MEASUREMENT','define the unit of work • completion test • business outcome','chart',G),arrows_down([450,530,610,690,770]),cylinder(label='Work-Outcome Measurement Plane',sub='activity telemetry  |  task verification  |  quality signals  |  value attribution',stroke=G),inner(label='From Interaction to Outcome')]
for x,l,sub,typ,col in [(300,'PROMPTS','activity count','doc',M),(430,'TASKS','work attempted','gear',B),(565,'COMPLETION','verified finish','shield',T),(700,'QUALITY','output standard','chart',G),(830,'THROUGHPUT','time + volume','chart',C),(930,'VALUE','business impact','server',P)]: s.append(node(x,315,l,sub,typ,col))
for a,b,col in [(334,396,M),(464,531,B),(599,666,T),(734,796,G),(864,896,C)]: s.append(conn(a,315,b,315,col=col,dash=False,w=2.8))
s += [bottom_box('MEASUREMENT CONTROL','instrument completed work—not just model interaction','chart',G,440),call_left(177,374,118,'Prompt and token counts are activity metrics; they do not prove useful work was finished.',M),call_right(1015,215,118,'Completion, quality, and throughput form a stronger value chain.',G),call_right(945,451,480,'The KPI should connect AI-assisted work to an outcome the organization actually values.',P)]
save('04-microsoft-work-value',s)

s=base(); s+=[header('USER INTENT + CONTROL','describe the workflow • inspect the steps • approve consequential actions','shield',T),arrows_down([450,530,610,690,770]),cylinder(label='Consumer Agent Orchestration Layer',sub='prompt-to-app generation  |  browser actions  |  state  |  confirmation gates',stroke=T),inner(label='Build + Action Workspace')]
for x,l,sub,typ,col in [(290,'PROMPT','describe flow','doc',P),(410,'OPAL','build mini-app','app',T),(535,'MINI-APP','reusable tool','gear',B),(670,'WEB AGENT','navigate sites','net',C),(805,'STATE','carry context','server',B),(920,'CONFIRM','human approval','shield',G)]: s.append(node(x,315,l,sub,typ,col))
for a,b,col in [(324,376,P),(444,501,T),(569,636,B),(704,771,C),(839,886,B)]: s.append(conn(a,315,b,315,col=col,dash=False,w=2.8))
s += [bottom_box('USER CONTROL PLANE','editable logic • reviewable actions • explicit approval','shield',T,430),call_left(177,374,118,'Natural-language prompting can construct a repeatable mini-app instead of a one-off answer.',P),call_right(1015,215,118,'The same agent stack can carry out web errands—but only inside visible control gates.',C),call_right(945,451,480,'The important design pattern is build, inspect, act, confirm—not autonomous action by default.',G)]
save('05-google-opal-web-errands',s)

s=base(); s+=[header('VERSIONED SKILL PACKAGE','instructions • tools • examples • constraints • reusable know-how','doc',P),arrows_down([450,530,610,690,770]),cylinder(label='Cross-Runtime Compatibility Layer',sub='shared specification  |  adapters  |  permissions  |  runtime-specific verification',stroke=P),inner(label='Portable Agent Skill Workspace')]
for x,l,sub,typ,col in [(285,'CODEX','OpenAI runtime','terminal',B),(410,'CLAUDE','Anthropic runtime','terminal',P),(535,'SKILL.md','one source','doc',N),(670,'GEMINI','Google runtime','terminal',T),(805,'COPILOT','GitHub runtime','terminal',G),(925,'OTHER TOOLS','compatible agents','gear',C)]: s.append(node(x,315,l,sub,typ,col))
for a,b,col in [(319,501,B),(444,501,P),(569,636,N),(704,771,T),(839,891,G)]: s.append(conn(a,315,b,315,col=col,dash=True,w=2.4))
s += [bottom_box('SHARED REPOSITORY','versioned skill file • portable operating knowledge','book',P,430),call_left(177,374,118,'A skill package turns operating know-how into a reusable artifact instead of a one-off prompt.',P),call_right(1015,215,118,'One SKILL.md can travel across runtimes, but compatibility still has to be tested.',T),call_right(945,451,480,'Permissions, tool names, and execution semantics remain runtime-specific verification points.',B)]
save('06-skillmd-portability',s)

import json
edition_path = Path('_data/editions/2026-09-10.json')
edition = json.loads(edition_path.read_text())
new_names = ['01-anthropic-containment.png','02-github-agent-permissions.png','03-adobe-document-agent.png','04-microsoft-work-value.png','05-google-opal-web-errands.png','06-skillmd-portability.png']
old_paths = []
for story, name in zip(edition['stories'], new_names):
    old_paths.append(story['image']['path'])
    path = f'briefs/images/2026-09-10/{name}'
    url = f'https://raw.githubusercontent.com/gttome/Daily-AI-Brief/main/{path}?v=20260910hq2'
    story['image']['path'] = path
    story['image']['public_url'] = url
    story['image']['cache_key'] = '20260910hq2'
    if 'social' in story:
        story['social']['image_url'] = url
edition_path.write_text(json.dumps(edition, indent=2, ensure_ascii=False) + '\n')
for old in old_paths:
    p = Path(old)
    if p.exists() and p.name not in new_names:
        p.unlink()
for svg in OUT.glob('*.svg'):
    svg.unlink()
print('HQ images generated; canonical cache-busted; superseded Sep 10 assets removed.')
