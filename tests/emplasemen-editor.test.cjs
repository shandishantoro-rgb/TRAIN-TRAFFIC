// DOM tiruan: memeriksa alur interaksi; bukan uji visual browser.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');const nodes=new Map();
class Element{
 constructor(tag='div'){this.tagName=tag.toUpperCase();this.children=[];this.attrs={};this.dataset={};this.style={};this.listeners={};this.value='';this.textContent='';}
 set id(v){this._id=v;nodes.set(v,this)}get id(){return this._id}
 setAttribute(k,v){this.attrs[k]=String(v);if(k==='id')this.id=v;if(k.startsWith('data-'))this.dataset[k.slice(5)]=String(v)}getAttribute(k){return this.attrs[k]}
 append(...children){for(const e of children){e.parentNode=this;this.children.push(e)}}insertBefore(e){this.append(e)}replaceChildren(...children){this.children=[];this.append(...children)}
 set innerHTML(s){for(const m of s.matchAll(/<(\w+)[^>]*\bid="([^"]+)"[^>]*>/g)){const e=new Element(m[1]);e.id=m[2];this.append(e)}}
 closest(s){if(s==='.card')return oldCard;if(s==='[data-node]'&&this.dataset.node)return this;if(s==='[data-edge]'&&this.dataset.edge)return this;if(s==='[data-port]'&&this.dataset.port)return this;return this.parentNode?.closest(s)||null}
 addEventListener(name,fn){this.listeners[name]=fn}setPointerCapture(i){this.capture=i}hasPointerCapture(i){return this.capture===i}releasePointerCapture(){this.capture=null}
 getBoundingClientRect(){return {width:1000,height:400}}getScreenCTM(){const v=this.attrs.viewBox.split(' ').map(Number);return {inverse:()=>({x:v[0],y:v[1],scale:v[2]/1000})}}
}
const root=new Element(),oldCard=new Element(),oldSvg=new Element('svg');oldSvg.id='skema-emplasemen';root.append(oldCard);oldCard.append(oldSvg);
const ctx={console,confirm:()=>true,document:{head:new Element(),getElementById:id=>nodes.get(id),createElement:tag=>new Element(tag),createElementNS:(_,tag)=>new Element(tag)},DOMPoint:class{constructor(x,y){this.x=x;this.y=y}matrixTransform(m){return {x:m.x+this.x*m.scale,y:m.y+this.y*m.scale}}}};ctx.window=ctx;vm.createContext(ctx);for(const f of ['ttc-emplasemen-graph.js','ttc-emplasemen-editor.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js',f),'utf8'),ctx);
const M=ctx.TTCEmplasemenGraph,E=ctx.TTCEmplasemenEditor;const s={kode:'A',nama:'Alpha',km:12,layout:{jalur:[{no:'1'}]}};const legacy=JSON.stringify(s.layout);let saves=0;E.render(s,()=>saves++);const svg=nodes.get('eg-svg');
function mode(v){nodes.get('eg-mode').onchange({target:{value:v}})}
function pointer(type,target,x,y){svg.listeners[type]({button:0,pointerId:1,target,clientX:x,clientY:y})}
function find(id,port){const g=svg.children.find(x=>x.dataset.node===id);return port?g.children.find(x=>x.dataset.port===port):g}
mode('wesel');pointer('pointerdown',svg,203,103);let w=s.diagramEmplasemen.nodes[0];assert.equal(w.x,200);assert.equal(w.y,100);
mode('ujung');pointer('pointerdown',svg,40,103);pointer('pointerdown',svg,401,101);let [_,a,b]=s.diagramEmplasemen.nodes;
mode('hubung');nodes.get('eg-length').value='100';nodes.get('eg-speed').value='60';pointer('pointerdown',find(a.id,'U'),a.x,a.y);pointer('pointerdown',find(w.id,'A'),180,100);assert.equal(s.diagramEmplasemen.edges.length,1);
nodes.get('eg-length').value='250';pointer('pointerdown',find(w.id,'B'),220,100);pointer('pointerdown',find(b.id,'U'),400,100);assert.equal(s.diagramEmplasemen.edges.length,2);
nodes.get('eg-start').value=a.id;nodes.get('eg-end').value=b.id;nodes.get('eg-route-check').onclick();assert.match(nodes.get('eg-message').textContent,/350 m/);
mode('edit');pointer('pointerdown',find(w.id),200,100);pointer('pointermove',svg,253,137);pointer('pointerup',svg,253,137);assert.equal(s.diagramEmplasemen.nodes[0].x,260);assert.equal(s.diagramEmplasemen.nodes[0].y,140);
nodes.get('eg-undo').onclick();assert.equal(s.diagramEmplasemen.nodes[0].x,200);nodes.get('eg-redo').onclick();assert.equal(s.diagramEmplasemen.nodes[0].x,260);
pointer('pointerdown',find(w.id),260,140);pointer('pointermove',svg,310,190);pointer('pointercancel',svg,310,190);assert.equal(s.diagramEmplasemen.nodes[0].x,260);
pointer('pointerdown',find(w.id),260,140);pointer('pointerup',svg,260,140);nodes.get('eg-name').value='W12';nodes.get('eg-rotation').value='180';nodes.get('eg-vstraight').value='60';nodes.get('eg-vbranch').value='30';nodes.get('eg-props').onsubmit({preventDefault(){}});assert.equal(s.diagramEmplasemen.nodes[0].name,'W12');assert.equal(s.diagramEmplasemen.nodes[0].rotation,180);
nodes.get('eg-delete').onclick();assert.equal(s.diagramEmplasemen.edges.length,0);nodes.get('eg-undo').onclick();assert.equal(s.diagramEmplasemen.edges.length,2);
const snapshot=JSON.stringify(s.diagramEmplasemen);const s2={kode:'B',nama:'Beta'};E.render(s2,()=>saves++);assert.equal(nodes.get('eg-undo').disabled,true);mode('wesel');pointer('pointerdown',svg,500,200);assert.equal(s2.diagramEmplasemen.nodes.length,1);assert.equal(JSON.stringify(s.diagramEmplasemen),snapshot);
E.render(JSON.parse(JSON.stringify(s)),()=>saves++);assert.equal(nodes.get('eg-count').textContent,'1 wesel · 2 ujung · 2 segmen');assert.equal(s.km,12);assert.equal(JSON.stringify(s.layout),legacy);assert.ok(saves>0);
console.log('PASS: tambah vertex snap, koneksi port, periksa lintasan, drag snap, undo/redo, cancel, properti/rotasi, hapus cascade/undo, isolasi stasiun, buka ulang, template dan km tetap.');
