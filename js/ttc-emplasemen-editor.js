/* Editor skematis snap-to-grid. Tidak mengubah template perhitungan lama. */
(function(global){
'use strict';
const M=global.TTCEmplasemenGraph,NS='http://www.w3.org/2000/svg';
const $=id=>document.getElementById(id);
let station=null,save=null,graph=null,mode='lihat',selected=null,pending=null,drag=null,undo=[],redo=[],view={x:0,y:0,w:1000,h:400},invalid=false;
function svgEl(tag,attrs={},text){const e=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(text!=null)e.textContent=text;return e;}
function tell(text,error=false){$('eg-message').textContent=text;$('eg-message').style.color=error?'#a32929':'#435665';}
function snapshot(){return M.clone(graph);}
function persist(){station.diagramEmplasemen=M.clone(graph);save();}
function commit(before){M.validate(graph);if(JSON.stringify(before)!==JSON.stringify(graph)){undo.push(before);if(undo.length>50)undo.shift();redo=[];persist();}draw();}
function action(fn){if(!station||invalid)return;const before=snapshot();try{fn();commit(before);}catch(e){graph=before;draw();tell(e.message,true);}}
function history(back){const src=back?undo:redo,dst=back?redo:undo;if(!src.length)return;dst.push(snapshot());graph=src.pop();pending=null;selected=null;persist();draw();tell(back?'Perubahan diurungkan.':'Perubahan diulangi.');}
function setMode(value){mode=value;pending=null;drag=null;draw();tell(mode==='lihat'?'Mode Lihat: tarik latar untuk menggeser; scroll untuk zoom.':mode==='wesel'||mode==='ujung'?'Klik kisi kosong untuk menempatkan titik.':mode==='hubung'?'Isi panjang dan Vmax, lalu klik dua ujung berlabel A/B/C/U.':'Tarik titik mengikuti kisi; klik objek untuk mengubah propertinya.');}
function coords(e){return new DOMPoint(e.clientX,e.clientY).matrixTransform($('eg-svg').getScreenCTM().inverse());}
function setView(){const svg=$('eg-svg');svg.setAttribute('viewBox',`${view.x} ${view.y} ${view.w} ${view.h}`);$('eg-percent').textContent=Math.round(1000/view.w*100)+'%';}
function zoom(f,c){const ratio=Math.max(250,Math.min(10000,view.w*f))/view.w;c=c||{x:view.x+view.w/2,y:view.y+view.h/2};view={x:c.x-(c.x-view.x)*ratio,y:c.y-(c.y-view.y)*ratio,w:view.w*ratio,h:view.h*ratio};setView();background();}
function fit(){const ns=graph?.nodes||[];if(!ns.length)view={x:0,y:0,w:1000,h:400};else{const left=Math.min(...ns.map(n=>n.x))-100,right=Math.max(...ns.map(n=>n.x))+100,top=Math.min(...ns.map(n=>n.y))-80,bottom=Math.max(...ns.map(n=>n.y))+80,w=Math.max(500,right-left,(bottom-top)*2.5);view={x:(left+right-w)/2,y:(top+bottom-w/2.5)/2,w,h:w/2.5};}setView();background();}
function background(){const b=$('eg-background');if(b)Object.entries({x:view.x,y:view.y,width:view.w,height:view.h}).forEach(([k,v])=>b.setAttribute(k,v));}
function properties(){
 const n=selected?.type==='node'?M.node(graph,selected.id):null,e=selected?.type==='edge'?graph.edges.find(e=>e.id===selected.id):null;
 $('eg-props').hidden=!n&&!e;$('eg-node-fields').hidden=!n;$('eg-edge-fields').hidden=!e;
 if(n){$('eg-name').value=n.name;$('eg-rotation').value=n.rotation;$('eg-vstraight').value=n.vLurus??'';$('eg-vbranch').value=n.vBelok??'';$('eg-switch-speeds').hidden=n.type!=='wesel';}
 if(e){$('eg-name').value=e.name||'';$('eg-edit-length').value=e.length;$('eg-edit-speed').value=e.speed;}
 $('eg-save').disabled=mode!=='edit';$('eg-delete').disabled=mode!=='edit';
 $('eg-selection').textContent=n?`${n.type==='wesel'?'Wesel':'Ujung'} ${n.name} · kisi (${n.x/M.GRID}, ${n.y/M.GRID})`:e?`${e.name} · ${e.length} m · ${e.speed} km/jam`:'Belum ada objek dipilih.';
}
function draw(){
 const svg=$('eg-svg');svg.replaceChildren();setView();
 const defs=svgEl('defs'),pattern=svgEl('pattern',{id:'eg-grid',width:M.GRID,height:M.GRID,patternUnits:'userSpaceOnUse'});pattern.append(svgEl('path',{d:'M 20 0 L 0 0 0 20',fill:'none',stroke:'#d4dbe2','stroke-width':.7}));defs.append(pattern);svg.append(defs);svg.append(svgEl('rect',{id:'eg-background',x:view.x,y:view.y,width:view.w,height:view.h,fill:'url(#eg-grid)'}));
 $('eg-mode').value=mode;$('eg-undo').disabled=!undo.length;$('eg-redo').disabled=!redo.length;$('eg-connect-values').hidden=mode!=='hubung';
 $('eg-title').textContent=station?`${station.kode} — ${station.nama}`:'Pilih atau tambahkan stasiun terlebih dahulu.';
 $('eg-mode').disabled=!station||invalid;$('eg-route-check').disabled=!station||invalid;
 if(!graph||invalid){$('eg-props').hidden=true;return;}
 graph.edges.forEach(e=>{const a=M.portXY(M.node(graph,e.from.node),e.from.port),b=M.portXY(M.node(graph,e.to.node),e.to.port);const attr={x1:a.x,y1:a.y,x2:b.x,y2:b.y};svg.append(svgEl('line',{...attr,stroke:selected?.id===e.id?'#215c85':'#506575','stroke-width':4,'pointer-events':'none'}));svg.append(svgEl('line',{...attr,stroke:'transparent','stroke-width':16,'data-edge':e.id,style:'cursor:pointer'}));svg.append(svgEl('text',{x:(a.x+b.x)/2,y:(a.y+b.y)/2-8,'text-anchor':'middle','font-size':10,fill:'#455666','pointer-events':'none'},`${e.name} · ${e.length} m`));});
 graph.nodes.forEach(n=>{const g=svgEl('g',{'data-node':n.id,style:'cursor:'+(mode==='edit'?'grab':'pointer')});
 if(n.type==='wesel'){const a=M.portXY(n,'A');for(const port of ['B','C']){const p=M.portXY(n,port);g.append(svgEl('line',{x1:a.x,y1:a.y,x2:p.x,y2:p.y,stroke:'#344959','stroke-width':3,'pointer-events':'none'}));}}
 g.append(svgEl('rect',{x:n.x-9,y:n.y-9,width:18,height:18,rx:3,fill:selected?.id===n.id?'#215c85':'#fff',stroke:'#344959','stroke-width':2}));g.append(svgEl('text',{x:n.x,y:n.y-30,'font-size':12,'font-weight':600,'text-anchor':'middle','pointer-events':'none'},n.name));
 M.ports(n).forEach(port=>{const p=M.portXY(n,port),isPending=pending?.node===n.id&&pending.port===port;g.append(svgEl('circle',{cx:p.x,cy:p.y,r:7,fill:isPending?'#e8ac36':'#fff',stroke:'#2c668c','stroke-width':2,'data-node':n.id,'data-port':port,style:'cursor:crosshair'}));g.append(svgEl('text',{x:p.x,y:p.y+(port==='C'?21:-12),'text-anchor':'middle','font-size':10,'pointer-events':'none'},port));});svg.append(g);});
 properties();const previous=[$('eg-start').value,$('eg-end').value];['eg-start','eg-end'].forEach((id,i)=>{const sel=$(id);sel.replaceChildren();const none=document.createElement('option');none.value='';none.textContent='Pilih ujung';sel.append(none);for(const n of graph.nodes.filter(n=>n.type==='ujung')){const o=document.createElement('option');o.value=n.id;o.textContent=n.name;sel.append(o);}sel.value=previous[i]||'';});
 $('eg-count').textContent=`${graph.nodes.filter(n=>n.type==='wesel').length} wesel · ${graph.nodes.filter(n=>n.type==='ujung').length} ujung · ${graph.edges.length} segmen`;
}
function selectPort(n,p){
 if(!pending){pending={node:n,port:p};draw();tell('Ujung awal dipilih. Klik ujung pada titik lain.');return;}
 if(pending.node===n&&pending.port===p){pending=null;draw();return;}
 action(()=>{const e=M.connect(graph,pending,{node:n,port:p},{name:$('eg-segment-name').value,length:$('eg-length').value,speed:$('eg-speed').value});pending=null;selected={type:'edge',id:e.id};tell('Segmen tersambung. Panjang mengikuti angka yang Anda isi.');});
}
function init(){
 const host=document.createElement('section');host.id='eg-panel';host.className='card';host.innerHTML=`
 <h2>Editor emplasemen · snap to grid <span class="count" id="eg-title"></span></h2>
 <p class="note">Susun rancangan dengan titik wesel dan segmen. Setiap titik mengikuti kisi 20 unit gambar; panjang segmen diisi dalam meter. Rancangan ini belum digunakan oleh pemeriksaan konflik dan simulasi; perhitungan tersebut masih memakai template di bawah.</p>
 <div class="eg-toolbar"><label>Mode <select id="eg-mode"><option value="lihat">Lihat</option><option value="edit">Edit / geser titik</option><option value="wesel">Tambah wesel</option><option value="ujung">Tambah ujung jalur</option><option value="hubung">Hubungkan ujung</option></select></label><button class="small-btn" id="eg-undo">Urungkan</button><button class="small-btn" id="eg-redo">Ulangi</button><button class="small-btn" id="eg-minus">−</button><span id="eg-percent">100%</span><button class="small-btn" id="eg-plus">+</button><button class="small-btn" id="eg-fit">Tampilkan Semua</button><span id="eg-count"></span></div>
 <div id="eg-connect-values" class="eg-toolbar" hidden><label>Nama segmen <input id="eg-segment-name" placeholder="Jalur 1"></label><label>Panjang (m) <input id="eg-length" type="number" min="0.01" step="any" placeholder="Isi panjang sebenarnya"></label><label>Vmax (km/jam) <input id="eg-speed" type="number" min="0.01" step="any" placeholder="Isi batas kecepatan"></label></div>
 <p id="eg-message" role="status">Pilih Tambah wesel atau Tambah ujung jalur, lalu klik kisi.</p>
 <svg id="eg-svg" viewBox="0 0 1000 400" tabindex="0" aria-label="Editor emplasemen dengan kisi"></svg>
 <div id="eg-selection" class="note"></div>
 <form id="eg-props" hidden><div class="eg-toolbar"><label>Nama/nomor <input id="eg-name" required></label><div id="eg-node-fields"><label>Orientasi <select id="eg-rotation"><option value="0">0°</option><option value="90">90°</option><option value="180">180°</option><option value="270">270°</option></select></label><span id="eg-switch-speeds"><label>V lurus <input id="eg-vstraight" type="number" min="0.01" step="any" placeholder="km/jam"></label><label>V belok <input id="eg-vbranch" type="number" min="0.01" step="any" placeholder="km/jam"></label></span></div><div id="eg-edge-fields"><label>Panjang (m) <input id="eg-edit-length" type="number" min="0.01" step="any"></label><label>Vmax <input id="eg-edit-speed" type="number" min="0.01" step="any"></label></div><button class="small-btn primary" id="eg-save" type="submit">Simpan Properti</button><button class="small-btn" id="eg-delete" type="button">Hapus Terpilih</button></div></form>
 <div class="eg-toolbar"><strong>Periksa keterhubungan</strong><select id="eg-start" aria-label="Ujung awal"></select><span>→</span><select id="eg-end" aria-label="Ujung akhir"></select><button class="small-btn" id="eg-route-check">Periksa Lintasan</button></div>
 <p class="note">Wesel: A–B lurus, A–C belok. B–C tidak tersambung langsung. Garis berpotongan tidak membuat sambungan. Esc membatalkan sambungan/geser. Urungkan berlaku selama sesi editor.</p>`;
 const old=$('skema-emplasemen').closest('.card');old.parentNode.insertBefore(host,old);
 const style=document.createElement('style');style.textContent='#eg-panel .eg-toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:10px 0}#eg-panel [hidden]{display:none!important}#eg-panel label{display:inline-flex;gap:6px;align-items:center;font-size:12px}#eg-panel input{max-width:180px}#eg-panel #eg-svg{width:100%;height:440px;display:block;border:1px solid #cdd5dc;touch-action:none;user-select:none;cursor:grab}#eg-message{font-size:12px;min-height:20px}#eg-panel select,#eg-panel input{font:inherit;border:1px solid #cdd5dc;border-radius:4px;padding:6px}';document.head.append(style);
 $('eg-mode').onchange=e=>setMode(e.target.value);$('eg-undo').onclick=()=>history(true);$('eg-redo').onclick=()=>history(false);$('eg-plus').onclick=()=>zoom(.8);$('eg-minus').onclick=()=>zoom(1.25);$('eg-fit').onclick=fit;
 $('eg-props').onsubmit=e=>{e.preventDefault();if(mode!=='edit')return;action(()=>{const name=$('eg-name').value.trim();if(!name)throw Error('Nama wajib diisi.');if(selected.type==='node'){const n=M.node(graph,selected.id);if(graph.nodes.some(v=>v.id!==n.id&&v.name===name))throw Error('Nama titik sudah dipakai.');n.name=name;n.rotation=Number($('eg-rotation').value);for(const [field,id] of [['vLurus','eg-vstraight'],['vBelok','eg-vbranch']])n[field]=$(id).value.trim()===''?null:Number($(id).value);}else{const edge=graph.edges.find(v=>v.id===selected.id);edge.name=name;edge.length=Number($('eg-edit-length').value);edge.speed=Number($('eg-edit-speed').value);}tell('Properti disimpan.');});};
 $('eg-delete').onclick=()=>{if(mode!=='edit'||!selected)return;const attached=graph.edges.filter(e=>e.from.node===selected.id||e.to.node===selected.id).length;if(!confirm('Hapus objek terpilih?'+(attached?' '+attached+' segmen terhubung ikut dihapus.':'')))return;action(()=>{M.remove(graph,selected.id);selected=null;pending=null;tell('Objek dihapus. Anda dapat mengurungkannya.');});};
 $('eg-route-check').onclick=()=>{try{const r=M.route(graph,$('eg-start').value,$('eg-end').value);tell(r?'Terhubung · '+r.length+' m · '+(r.switches.map(w=>M.node(graph,w.node).name+' '+w.position).join(' → ')||'tanpa wesel'):'Tidak ada lintasan yang sah melalui sambungan saat ini.',!r);}catch(e){tell(e.message,true);}};
 const svg=$('eg-svg');svg.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?.9:1/.9,coords(e));},{passive:false});
 svg.addEventListener('pointerdown',e=>{if(e.button!==0||drag||!station||invalid)return;const port=e.target.closest('[data-port]'),target=e.target.closest('[data-node]'),edge=e.target.closest('[data-edge]');const p=coords(e);
 if(mode==='hubung'){if(port)selectPort(port.dataset.node,port.dataset.port);else tell('Klik ujung berlabel A/B/C/U.',true);return;}
 if(mode==='wesel'||mode==='ujung'){if(target||edge){tell('Pilih kisi kosong.',true);return;}action(()=>{const n=M.addNode(graph,mode,p.x,p.y);selected={type:'node',id:n.id};tell(n.name+' ditempatkan pada kisi.');});return;}
 selected=target?{type:'node',id:target.dataset.node}:edge?{type:'edge',id:edge.dataset.edge}:null;
 drag={id:e.pointerId,client:{x:e.clientX,y:e.clientY},p,before:snapshot(),v:{...view},node:mode==='edit'&&target?target.dataset.node:null,moved:false};if(drag.node)drag.origin={...M.node(graph,drag.node)};svg.setPointerCapture(e.pointerId);draw();});
 svg.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;if(!drag.moved&&Math.hypot(e.clientX-drag.client.x,e.clientY-drag.client.y)<3)return;drag.moved=true;if(drag.node){const p=coords(e);try{M.move(graph,drag.node,drag.origin.x+p.x-drag.p.x,drag.origin.y+p.y-drag.p.y);draw();}catch(error){tell(error.message,true);}}else{const r=svg.getBoundingClientRect(),scale=Math.min(r.width/drag.v.w,r.height/drag.v.h);view={...drag.v,x:drag.v.x-(e.clientX-drag.client.x)/scale,y:drag.v.y-(e.clientY-drag.client.y)/scale};setView();background();}});
 function end(e,cancel){if(!drag||drag.id!==e.pointerId)return;const d=drag;drag=null;if(cancel){graph=d.before;view=d.v;draw();}else if(d.node)commit(d.before);if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);}
 svg.addEventListener('pointerup',e=>end(e,false));svg.addEventListener('pointercancel',e=>end(e,true));svg.addEventListener('lostpointercapture',e=>end(e,true));
 host.addEventListener('keydown',e=>{if(e.key==='Escape'){if(drag)end({pointerId:drag.id},true);pending=null;draw();tell('Tindakan dibatalkan.');}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)){e.preventDefault();history(!e.shiftKey);}});
}
function render(s,onSave){if(!$('eg-panel'))init();save=onSave;if(station!==s){station=s;graph=s?.diagramEmplasemen?M.clone(s.diagramEmplasemen):M.empty();selected=null;pending=null;drag=null;undo=[];redo=[];mode='lihat';invalid=false;try{M.validate(graph);tell(s?'Pilih Tambah wesel atau Tambah ujung jalur, lalu klik kisi.':'Tambahkan stasiun sebelum menyusun emplasemen.');}catch(e){invalid=true;tell('Rancangan tidak dapat diedit: '+e.message,true);}view={x:0,y:0,w:1000,h:400};}draw();}
global.TTCEmplasemenEditor={render};
})(window);
