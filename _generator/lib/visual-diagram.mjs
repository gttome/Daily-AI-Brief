const WIDTH=1200,HEIGHT=630;
export const VISUAL_LAYOUTS=['process','layered_architecture','hub_spoke','lifecycle','compare_decision','pipeline','control_approval','evidence_verification','annotated_system','composite'];

const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));
const text=value=>String(value??'').replace(/\s+/g,' ').trim();
const unique=array=>new Set(array).size===array.length;
const wrap=(value,max=26)=>{const words=text(value).split(' ').filter(Boolean),lines=[];let line='';for(const word of words){const next=line?`${line} ${word}`:word;if(next.length>max&&line){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);return lines.slice(0,4);};

export function validateVisualSpec(spec){
 const errors=[];
 if(!spec||typeof spec!=='object')return ['visual_spec_required'];
 if(!VISUAL_LAYOUTS.includes(spec.layout))errors.push('unsupported_layout');
 if(text(spec.title).length<8)errors.push('descriptive_title_required');
 if(text(spec.alt_text).length<40)errors.push('useful_alt_text_required');
 if(!Array.isArray(spec.nodes)||spec.nodes.length<4||spec.nodes.length>12)errors.push('four_to_twelve_nodes_required');
 const ids=(spec.nodes||[]).map(n=>text(n.id));if(ids.some(id=>!id)||!unique(ids))errors.push('unique_node_ids_required');
 for(const node of spec.nodes||[]){if(text(node.label).length<2)errors.push(`node_label_required:${node.id||'unknown'}`);if(text(node.detail).length<8)errors.push(`node_detail_required:${node.id||'unknown'}`);}
 const known=new Set(ids);
 for(const edge of spec.edges||[]){if(!known.has(text(edge.from))||!known.has(text(edge.to)))errors.push('edge_endpoint_unknown');}
 if(['process','pipeline','control_approval','evidence_verification','lifecycle'].includes(spec.layout)&&(spec.edges||[]).length<Math.max(3,(spec.nodes||[]).length-2))errors.push('insufficient_relationships');
 if((spec.callouts||[]).some(c=>!known.has(text(c.anchor))))errors.push('callout_anchor_unknown');
 return [...new Set(errors)];
}

export function visualQualityGate(spec){
 const errors=validateVisualSpec(spec);if(errors.length)return {pass:false,errors,baseline:'2026-09-17',reason:'invalid_visual_spec'};
 const details=spec.nodes.filter(n=>text(n.detail).length>=18).length;
 const relationships=(spec.edges||[]).length+(spec.feedback_loops||[]).length;
 const explanatorySignals=details+relationships+(spec.callouts||[]).length+(spec.groups||[]).length;
 const passesDensity=explanatorySignals>=Math.max(9,spec.nodes.length+4);
 const passesMechanism=relationships>=Math.max(3,Math.floor(spec.nodes.length/2));
 const passesAnnotations=(spec.callouts||[]).length>0||(spec.groups||[]).length>0||(spec.feedback_loops||[]).length>0;
 const qualityErrors=[];
 if(!passesDensity)qualityErrors.push('below_sep17_information_density');
 if(!passesMechanism)qualityErrors.push('below_sep17_relationship_density');
 if(!passesAnnotations)qualityErrors.push('annotations_or_grouping_required');
 return {pass:qualityErrors.length===0,errors:qualityErrors,baseline:'2026-09-17',signals:{nodes:spec.nodes.length,details,relationships,callouts:(spec.callouts||[]).length,groups:(spec.groups||[]).length,feedback_loops:(spec.feedback_loops||[]).length}};
}

function positions(spec){
 const n=spec.nodes.length,points=[];
 if(['hub_spoke','lifecycle'].includes(spec.layout)){
  const cx=600,cy=330,rx=390,ry=190;
  spec.nodes.forEach((node,i)=>{if(spec.layout==='hub_spoke'&&i===0)points.push({id:node.id,x:cx,y:cy,w:210,h:90});else{const offset=spec.layout==='hub_spoke'?i-1:i,count=spec.layout==='hub_spoke'?n-1:n,angle=-Math.PI/2+offset*(Math.PI*2/Math.max(count,1));points.push({id:node.id,x:cx+Math.cos(angle)*rx,y:cy+Math.sin(angle)*ry,w:190,h:82});}});
  return points;
 }
 if(spec.layout==='layered_architecture'){
  const h=Math.min(76,360/n);spec.nodes.forEach((node,i)=>points.push({id:node.id,x:600,y:170+i*(h+12),w:760,h}));return points;
 }
 if(spec.layout==='compare_decision'){
  spec.nodes.forEach((node,i)=>{const col=i%2,row=Math.floor(i/2);points.push({id:node.id,x:330+col*540,y:180+row*120,w:430,h:92});});return points;
 }
 if(['process','pipeline','control_approval','evidence_verification'].includes(spec.layout)&&n<=6){
  const gap=1040/n;spec.nodes.forEach((node,i)=>points.push({id:node.id,x:80+gap*(i+.5),y:320,w:Math.min(180,gap-18),h:110}));return points;
 }
 const cols=n<=6?3:4,cellW=1050/cols,rows=Math.ceil(n/cols),cellH=360/rows;
 spec.nodes.forEach((node,i)=>{const col=i%cols,row=Math.floor(i/cols);points.push({id:node.id,x:75+cellW*(col+.5),y:170+cellH*(row+.5),w:Math.min(280,cellW-28),h:Math.min(118,cellH-24)});});return points;
}

function svgText(lines,x,y,{size=18,weight=400,fill='#18324a',anchor='middle',lineHeight=22}={}){return lines.map((line,i)=>`<text x="${x}" y="${y+i*lineHeight}" text-anchor="${anchor}" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(line)}</text>`).join('');}

export function renderVisualSvg(spec){
 const gate=visualQualityGate(spec);if(!gate.pass)throw Error(`visual_quality_gate_failed:${gate.errors.join(',')}`);
 const pts=positions(spec),byId=new Map(pts.map(p=>[p.id,p]));
 const marker='<defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#6b7280"/></marker></defs>';
 const edgeSvg=(spec.edges||[]).map(edge=>{const a=byId.get(edge.from),b=byId.get(edge.to);if(!a||!b)return '';const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,ax=a.x+dx/len*(a.w/2),ay=a.y+dy/len*(a.h/2),bx=b.x-dx/len*(b.w/2),by=b.y-dy/len*(b.h/2),mx=(ax+bx)/2,my=(ay+by)/2;return `<path d="M${ax.toFixed(1)},${ay.toFixed(1)} L${bx.toFixed(1)},${by.toFixed(1)}" stroke="#6b7280" stroke-width="2.2" fill="none" marker-end="url(#arrow)"/>${edge.label?svgText(wrap(edge.label,20),mx,my-8,{size:13,fill:'#5b6470'}):''}`;}).join('');
 const nodeSvg=spec.nodes.map((node,i)=>{const p=byId.get(node.id),accent=['#9c2f2f','#2f6b9a','#3f704d','#7a5a13'][i%4],label=wrap(node.label,24),detail=wrap(node.detail,31);return `<g><rect x="${p.x-p.w/2}" y="${p.y-p.h/2}" width="${p.w}" height="${p.h}" rx="14" fill="#ffffff" stroke="${accent}" stroke-width="2.4"/><rect x="${p.x-p.w/2}" y="${p.y-p.h/2}" width="7" height="${p.h}" rx="3" fill="${accent}"/>${svgText(label,p.x,p.y-p.h/2+30,{size:17,weight:700,fill:'#172b3a'})}${svgText(detail,p.x,p.y-p.h/2+30+label.length*21+12,{size:13,fill:'#425466',lineHeight:17})}</g>`;}).join('');
 const calloutSvg=(spec.callouts||[]).slice(0,3).map((c,i)=>{const y=520+i*30;return `<circle cx="95" cy="${y-5}" r="5" fill="#9c2f2f"/>${svgText(wrap(c.text,92),112,y,{size:14,fill:'#283c4b',anchor:'start',lineHeight:17})}`;}).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${esc(spec.alt_text)}"><rect width="1200" height="630" fill="#ffffff"/>${marker}${svgText(wrap(spec.title,72),60,55,{size:30,weight:700,fill:'#17365d',anchor:'start',lineHeight:34})}${spec.subtitle?svgText(wrap(spec.subtitle,100),60,95,{size:16,fill:'#5b6470',anchor:'start',lineHeight:20}):''}${edgeSvg}${nodeSvg}${calloutSvg}<text x="1140" y="604" text-anchor="end" font-family="Arial,Helvetica,sans-serif" font-size="12" fill="#6b7280">Daily Generative AI Brief · explanatory diagram</text></svg>`;
}

export function chooseVisualPath(spec,{sep17ParityApproved=false,pngRendererVerified=false}={}){
 const gate=visualQualityGate(spec);
 if(!gate.pass)return {path:'generative_fallback',gate,reason:'deterministic_quality_gate_failed'};
 if(!sep17ParityApproved)return {path:'generative_fallback',gate,reason:'sep17_visual_parity_not_approved'};
 if(!pngRendererVerified)return {path:'generative_fallback',gate,reason:'png_renderer_not_verified'};
 return {path:'deterministic',gate,reason:'quality_and_output_gates_passed'};
}

export const VISUAL_CANVAS={width:WIDTH,height:HEIGHT,background:'white',minimum_baseline:'2026-09-17'};
