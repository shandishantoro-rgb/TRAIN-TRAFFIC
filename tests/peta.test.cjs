// Jalankan: node tests/peta.test.cjs. DOM tiruan untuk perilaku, bukan uji visual browser.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const nodes=new Map();
class Element{
 constructor(tag='div'){this.tag=tag;this.attrs={};this.children=[];this.style={};this.listeners={};this.dataset={};this.classList={toggle(){}};}
 set id(v){this._id=v;nodes.set(v,this)}get id(){return this._id}
 setAttribute(k,v){this.attrs[k]=String(v);if(k.startsWith('data-'))this.dataset[k.slice(5)]=String(v);}
 getAttribute(k){return this.attrs[k]}
 append(...es){for(const e of es){e.parent=this;this.children.push(e)}}
 replaceChildren(...es){this.children=[];this.append(...es)}
 set innerHTML(s){this.children=[];for(const match of s.matchAll(/<(button|span)[^>]*id="([^"]+)"[^>]*>([^<]*)/g)){const e=new Element(match[1]);e.id=match[2];e.textContent=match[3];this.append(e)}}
 closest(q){if(q==='.map-card')return card;if(q==='[data-station]'&&this.dataset.station!==undefined)return this;if(q==='[data-edge]'&&this.dataset.edge!==undefined)return this;return this.parent?.closest(q)||null}
 querySelector(q){if(q==='.head-actions')return bar;return null}
 addEventListener(k,f){this.listeners[k]=f}
 setPointerCapture(i){this.capture=i}hasPointerCapture(i){return this.capture===i}releasePointerCapture(){this.capture=null}
 getBoundingClientRect(){return {width:1100,height:420}}
 getScreenCTM(){const v=this.attrs.viewBox.split(' ').map(Number);return {inverse:()=>({x:v[0],y:v[1],scale:v[2]/1100})}}
}
for(const id of ['network-svg','view-peta','empty-map','peta-sub']){const e=new Element();e.id=id}
const card=new Element(),bar=new Element();card.append(nodes.get('network-svg'));
const context={document:{getElementById:id=>nodes.get(id),createElement:t=>new Element(t),createElementNS:(_,t)=>new Element(t)},DOMPoint:class{constructor(x,y){this.x=x;this.y=y}matrixTransform(m){return {x:m.x+this.x*m.scale,y:m.y+this.y*m.scale}}},console};context.window=context;vm.createContext(context);
for(const f of ['ttc-model.js','ttc-peta.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js',f),'utf8'),context);
const p=context.TTCModel.proyekKosong();p.prasarana.stasiun=[{kode:'A',nama:'Alpha',km:0,jumlahJalur:2,jenis:'Stasiun'},{kode:'B',nama:'Beta',km:10,jumlahJalur:2,jenis:'Stasiun'}];p.prasarana.petakJalan=[{dari:'A',ke:'B',jarak:10,jenisJalur:'Ganda',kecepatanMaks:80}];let saved,opened;
const callbacks={save(){saved=JSON.stringify(p)},station(i){opened=['station',i]},edge(i){opened=['edge',i]}};
context.TTCPeta.render(p,callbacks);const svg=nodes.get('network-svg');
const station=()=>svg.children.find(e=>e.dataset.station==='A');
function event(type,target,x,y,extra={}){svg.listeners[type]({button:0,pointerId:1,target,clientX:x,clientY:y,preventDefault(){},...extra})}
const operations=JSON.stringify({km:p.prasarana.stasiun.map(s=>s.km),petak:p.prasarana.petakJalan});
event('pointerdown',station(),70,210);event('pointerup',svg,70,210);assert.match(nodes.get('map-selection').children[0].textContent,/Alpha/);assert.equal(nodes.get('map-selection').children.length,1);
event('pointerdown',svg,300,300);event('pointermove',svg,400,320);event('pointerup',svg,400,320);assert.equal(p.petaJalur.view.x,-100);assert.equal(p.prasarana.stasiun[0].petaPos,undefined);nodes.get('map-undo').onclick();assert.equal(p.petaJalur.view.x,0);
nodes.get('map-mode').onclick();event('pointerdown',station(),70,210);event('pointermove',svg,170,260);event('pointerup',svg,170,260);assert.equal(p.prasarana.stasiun[0].petaPos.x,170);assert.equal(p.prasarana.stasiun[0].petaPos.y,260);assert.equal(svg.children[0].attrs.x1,'170');nodes.get('map-selection').children[1].onclick();assert.deepEqual(opened,['station',0]);
nodes.get('map-undo').onclick();assert.equal(p.prasarana.stasiun[0].petaPos,undefined);nodes.get('map-redo').onclick();assert.equal(p.prasarana.stasiun[0].petaPos.x,170);
event('pointerdown',station(),170,260);event('pointermove',svg,220,300);event('pointercancel',svg,220,300);assert.equal(p.prasarana.stasiun[0].petaPos.x,170);
event('wheel',svg,500,200,{deltaY:-100});assert.ok(p.petaJalur.view.w<1100);nodes.get('map-fit').onclick();assert.ok(p.petaJalur.view.w>0);
const loaded=context.TTCModel.migrasi(JSON.parse(saved));assert.equal(loaded.prasarana.stasiun[0].petaPos.x,170);assert.equal(loaded.petaJalur.view.w,p.petaJalur.view.w);
assert.equal(JSON.stringify({km:p.prasarana.stasiun.map(s=>s.km),petak:p.prasarana.petakJalan}),operations);
context.TTCPeta.render(loaded,callbacks);assert.equal(nodes.get('map-mode').textContent,'Mode: Lihat');assert.equal(nodes.get('map-undo').disabled,true);
console.log('PASS: pilih objek, pan, mode Lihat/Edit, drag dan garis ikut, properti, undo/redo, cancel, zoom, fit, simpan/migrasi, km dan petak tetap, reset antar-proyek.');
