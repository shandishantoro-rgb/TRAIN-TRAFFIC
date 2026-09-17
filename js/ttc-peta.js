/* Peta Jalur: koordinat tampilan terpisah dari data operasi. */
(function(global){
'use strict';
let project, callbacks, svg, selected=null, editing=false, drag=null;
let undo=[], redo=[];
const NS='http://www.w3.org/2000/svg';
const $=id=>document.getElementById(id);
const copy=x=>JSON.parse(JSON.stringify(x));
const valid=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
function positions(){
  const stations=project.prasarana.stasiun;
  const lo=Math.min(...stations.map(s=>Number(s.km))), hi=Math.max(...stations.map(s=>Number(s.km)));
  return stations.map((s,i)=>valid(s.petaPos)?s.petaPos:{x:70+(Number(s.km)-lo)/Math.max(hi-lo,.001)*960,y:210+(stations.length>12?(i%2?26:-26):0)});
}
function snapshot(){return {positions:project.prasarana.stasiun.map(s=>({kode:s.kode,pos:valid(s.petaPos)?copy(s.petaPos):null})),view:copy(project.petaJalur.view)};}
function apply(s){s.positions.forEach(p=>{const st=project.prasarana.stasiun.find(x=>x.kode===p.kode);if(st){if(p.pos)st.petaPos=copy(p.pos);else delete st.petaPos;}});project.petaJalur.view=copy(s.view);draw();callbacks.save();}
function record(before){if(JSON.stringify(before)===JSON.stringify(snapshot()))return;undo.push(before);if(undo.length>50)undo.shift();redo=[];buttons();callbacks.save();}
function buttons(){if($('map-undo')){$('map-undo').disabled=!undo.length;$('map-redo').disabled=!redo.length;}}
function undoAction(){if(!undo.length)return;redo.push(snapshot());apply(undo.pop());buttons();}
function redoAction(){if(!redo.length)return;undo.push(snapshot());apply(redo.pop());buttons();}
function el(tag,attrs,text){const e=document.createElementNS(NS,tag);Object.entries(attrs||{}).forEach(([k,v])=>e.setAttribute(k,v));if(text!==undefined)e.textContent=text;return e;}
function point(e){return new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());}
function view(){const v=project.petaJalur.view;svg.setAttribute('viewBox',`${v.x} ${v.y} ${v.w} ${v.h}`);$('map-zoom-value').textContent=Math.round(1100/v.w*100)+'%';}
function zoom(f,center){const before=snapshot(),v=project.petaJalur.view;const w=Math.max(140,Math.min(11000,v.w*f)),ratio=w/v.w;const c=center||{x:v.x+v.w/2,y:v.y+v.h/2};v.x=c.x-(c.x-v.x)*ratio;v.y=c.y-(c.y-v.y)*ratio;v.w=w;v.h*=ratio;view();record(before);}
function fit(){const before=snapshot(),pos=positions();if(!pos.length){project.petaJalur.view={x:0,y:0,w:1100,h:420};}else{const loX=Math.min(...pos.map(p=>p.x))-130,hiX=Math.max(...pos.map(p=>p.x))+130,loY=Math.min(...pos.map(p=>p.y))-80,hiY=Math.max(...pos.map(p=>p.y))+80;const w=Math.max(400,hiX-loX,(hiY-loY)*1100/420),h=w*420/1100;project.petaJalur.view={x:(loX+hiX-w)/2,y:(loY+hiY-h)/2,w,h};}view();record(before);}
function details(){const out=$('map-selection');out.replaceChildren();let text='Klik stasiun atau petak untuk melihat propertinya.';let edit=null;
 if(selected?.type==='station'){const i=project.prasarana.stasiun.findIndex(s=>s.kode===selected.key),s=project.prasarana.stasiun[i];if(s){text=`${s.kode} — ${s.nama} · km ${s.km} · ${s.jumlahJalur} jalur · ${s.jenis}`;edit=()=>callbacks.station(i);}}
 if(selected?.type==='edge'){const i=selected.key,p=project.prasarana.petakJalan[i];if(p){text=`${p.dari}–${p.ke} · ${p.jarak} km · ${p.jenisJalur} · Vmax ${p.kecepatanMaks} km/jam`;edit=()=>callbacks.edge(i);}}
 const span=document.createElement('span');span.textContent=text;out.append(span);if(edit&&editing){const b=document.createElement('button');b.className='small-btn';b.textContent='Edit Properti';b.onclick=edit;out.append(b);}
}
function draw(){
 svg.replaceChildren();view();const st=project.prasarana.stasiun,pos=positions();$('empty-map').classList.toggle('hidden',!!st.length);$('peta-sub').textContent=`${st.length} stasiun · ${project.prasarana.petakJalan.length} petak · Tata letak skematis; jarak mengikuti data petak.`;
 project.prasarana.petakJalan.forEach((p,i)=>{const a=st.findIndex(s=>s.kode===p.dari),b=st.findIndex(s=>s.kode===p.ke);if(a<0||b<0)return;const attr={x1:pos[a].x,y1:pos[a].y,x2:pos[b].x,y2:pos[b].y};svg.append(el('line',{...attr,stroke:selected?.type==='edge'&&selected.key===i?'#165fa0':'#647482','stroke-width':p.jenisJalur==='Ganda'?7:3,'pointer-events':'none'}));if(p.jenisJalur==='Ganda')svg.append(el('line',{...attr,stroke:'#fff','stroke-width':2,'pointer-events':'none'}));svg.append(el('line',{...attr,stroke:'transparent','stroke-width':18,'data-edge':i,style:'cursor:pointer'}));});
 st.forEach((s,i)=>{const p=pos[i],g=el('g',{'data-station':s.kode,transform:`translate(${p.x} ${p.y})`,style:`cursor:${editing?'grab':'pointer'}`});g.append(el('circle',{r:15,fill:'transparent'}));g.append(el('circle',{r:8,fill:selected?.type==='station'&&selected.key===s.kode?'#165fa0':'#fff',stroke:'#344b5d','stroke-width':3}));g.append(el('text',{y:-24,'text-anchor':'middle',class:'station-label'},s.nama));g.append(el('text',{y:-12,'text-anchor':'middle',class:'station-code'},s.kode));g.append(el('text',{y:26,'text-anchor':'middle',class:'station-km'},`km ${s.km}`));svg.append(g);});details();buttons();
}
function init(){
 svg=$('network-svg');svg.style.touchAction='none';svg.style.userSelect='none';svg.style.cursor='grab';svg.setAttribute('tabindex','0');svg.setAttribute('aria-label','Peta jaringan. Geser latar untuk menggeser tampilan.');
 const bar=$('view-peta').querySelector('.head-actions');bar.innerHTML='<button class="small-btn" id="map-mode" aria-pressed="false">Mode: Lihat</button><button class="small-btn" id="map-minus" aria-label="Perkecil peta">−</button><span id="map-zoom-value">100%</span><button class="small-btn" id="map-plus" aria-label="Perbesar peta">+</button><button class="small-btn" id="map-fit">Tampilkan Semua</button><button class="small-btn" id="map-undo">Urungkan</button><button class="small-btn" id="map-redo">Ulangi</button>';bar.style.flexWrap='wrap';
 const info=document.createElement('div');info.id='map-selection';info.className='note';info.style.cssText='display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:12px';svg.closest('.map-card').append(info);
 const hint=document.createElement('p');hint.className='note';hint.textContent='Tarik latar untuk menggeser · Scroll untuk zoom · Mode Edit: tarik stasiun untuk mengatur posisi · Km dan jarak petak tidak berubah.';svg.closest('.map-card').append(hint);
 $('map-mode').onclick=()=>{editing=!editing;$('map-mode').textContent='Mode: '+(editing?'Edit':'Lihat');$('map-mode').setAttribute('aria-pressed',editing);draw();};$('map-plus').onclick=()=>zoom(.8);$('map-minus').onclick=()=>zoom(1.25);$('map-fit').onclick=fit;$('map-undo').onclick=undoAction;$('map-redo').onclick=redoAction;
 svg.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?.9:1/.9,point(e));},{passive:false});
 svg.addEventListener('pointerdown',e=>{if(e.button!==0||drag)return;const st=e.target.closest('[data-station]'),edge=e.target.closest('[data-edge]');selected=st?{type:'station',key:st.dataset.station}:edge?{type:'edge',key:Number(edge.dataset.edge)}:null;const p=point(e),v=copy(project.petaJalur.view);drag={id:e.pointerId,start:p,client:{x:e.clientX,y:e.clientY},before:snapshot(),v,station:editing&&st?st.dataset.station:null,moved:false};if(drag.station){const i=project.prasarana.stasiun.findIndex(s=>s.kode===drag.station);drag.origin=copy(positions()[i]);}svg.setPointerCapture(e.pointerId);draw();});
 svg.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;if(Math.hypot(e.clientX-drag.client.x,e.clientY-drag.client.y)<3&&!drag.moved)return;drag.moved=true;if(drag.station){const p=point(e),s=project.prasarana.stasiun.find(s=>s.kode===drag.station);s.petaPos={x:drag.origin.x+p.x-drag.start.x,y:drag.origin.y+p.y-drag.start.y};draw();}else{const rect=svg.getBoundingClientRect(),scale=Math.min(rect.width/drag.v.w,rect.height/drag.v.h);project.petaJalur.view={...drag.v,x:drag.v.x-(e.clientX-drag.client.x)/scale,y:drag.v.y-(e.clientY-drag.client.y)/scale};view();}});
 function end(e,cancel){if(!drag||drag.id!==e.pointerId)return;const d=drag;drag=null;if(cancel)apply(d.before);else record(d.before);if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);}
 svg.addEventListener('pointerup',e=>end(e,false));svg.addEventListener('pointercancel',e=>end(e,true));svg.addEventListener('lostpointercapture',e=>end(e,true));
 svg.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redoAction():undoAction();}if(e.key==='Escape'&&drag)end({pointerId:drag.id},true);});
}
function render(p,c){if(!svg)init();if(project!==p){project=p;undo=[];redo=[];selected=null;editing=false;$('map-mode').textContent='Mode: Lihat';$('map-mode').setAttribute('aria-pressed','false');}callbacks=c;const v=p.petaJalur?.view;if(!v||![v.x,v.y,v.w,v.h].every(Number.isFinite)||v.w<=0||v.h<=0)p.petaJalur={view:{x:0,y:0,w:1100,h:420}};draw();}
global.TTCPeta={render};
})(window);
