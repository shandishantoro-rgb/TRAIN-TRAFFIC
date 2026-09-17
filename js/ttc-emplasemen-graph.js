/* Jaringan emplasemen per stasiun; grid visual bukan satuan panjang operasi. */
(function(global){
'use strict';
const GRID=20, clone=x=>JSON.parse(JSON.stringify(x));
const snap=n=>Math.round(Number(n)/GRID)*GRID;
const ports=n=>n.type==='wesel'?['A','B','C']:['U'];
const key=p=>JSON.stringify([p.node,p.port]);
function empty(){return {version:1,grid:GRID,nodes:[],edges:[]};}
function uid(prefix){return prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);}
function node(g,id){return g.nodes.find(n=>n.id===id);}
function endpoint(g,p){const n=p&&node(g,p.node);return !!n&&ports(n).includes(p.port);}
function used(g,p){return g.edges.some(e=>key(e.from)===key(p)||key(e.to)===key(p));}
function addNode(g,type,x,y){
 if(!['wesel','ujung'].includes(type)||![x,y].every(Number.isFinite))throw Error('Jenis atau posisi titik tidak valid.');
 x=snap(x);y=snap(y);if(g.nodes.some(n=>n.x===x&&n.y===y))throw Error('Titik kisi ini sudah ditempati.');
 const prefix=type==='wesel'?'W':'U';let i=1;while(g.nodes.some(n=>n.name===prefix+i))i++;
 const n={id:uid('v'),type,name:prefix+i,x,y,rotation:0,vLurus:null,vBelok:null};g.nodes.push(n);return n;
}
function move(g,id,x,y){const n=node(g,id);if(!n||![x,y].every(Number.isFinite))throw Error('Titik tidak valid.');x=snap(x);y=snap(y);if(g.nodes.some(v=>v.id!==id&&v.x===x&&v.y===y))throw Error('Titik kisi ini sudah ditempati.');n.x=x;n.y=y;}
function connect(g,from,to,values){
 if(!endpoint(g,from)||!endpoint(g,to))throw Error('Pilih ujung titik yang valid.');
 if(from.node===to.node)throw Error('Sambungkan ke titik lain, bukan ke wesel yang sama.');
 if(used(g,from)||used(g,to))throw Error('Ujung sudah terhubung. Setiap ujung hanya boleh mempunyai satu segmen.');
 const length=Number(values.length),speed=Number(values.speed);
 if(!Number.isFinite(length)||length<=0||!Number.isFinite(speed)||speed<=0)throw Error('Isi panjang segmen (meter) dan Vmax yang lebih dari nol.');
 const e={id:uid('e'),from:clone(from),to:clone(to),name:String(values.name||'Segmen '+(g.edges.length+1)).trim(),length,speed};g.edges.push(e);return e;
}
function remove(g,id){g.nodes=g.nodes.filter(n=>n.id!==id);g.edges=g.edges.filter(e=>e.id!==id&&e.from.node!==id&&e.to.node!==id);}
function validate(g){
 if(!g||g.version!==1||g.grid!==GRID||!Array.isArray(g.nodes)||!Array.isArray(g.edges))throw Error('Format jaringan emplasemen tidak dikenali.');
 const ids=new Set(),names=new Set(),xy=new Set(),occupied=new Set();
 for(const n of g.nodes){if(!n||!n.id||ids.has(n.id)||!['wesel','ujung'].includes(n.type)||typeof n.name!=='string'||!n.name.trim()||names.has(n.name))throw Error('Identitas titik tidak valid atau kembar.');ids.add(n.id);names.add(n.name);if(![n.x,n.y].every(Number.isFinite)||n.x%GRID||n.y%GRID||xy.has(n.x+','+n.y)||![0,90,180,270].includes(n.rotation))throw Error('Posisi titik harus unik dan mengikuti kisi.');xy.add(n.x+','+n.y);for(const f of ['vLurus','vBelok'])if(n[f]!=null&&(!Number.isFinite(n[f])||n[f]<=0))throw Error('Batas kecepatan wesel tidak valid.');}
 for(const e of g.edges){if(!e||!e.id||ids.has(e.id)||!endpoint(g,e.from)||!endpoint(g,e.to)||e.from.node===e.to.node||![e.length,e.speed].every(v=>Number.isFinite(v)&&v>0))throw Error('Segmen atau referensi ujung tidak valid.');ids.add(e.id);for(const p of [e.from,e.to]){if(occupied.has(key(p)))throw Error('Ujung memiliki lebih dari satu sambungan.');occupied.add(key(p));}}
 return true;
}
// Transisi internal wesel wajib A-B atau A-C; tidak ada B-C.
function allowed(a,b){return a!==b&&(a==='A'||b==='A');}
function route(g,start,finish){
 validate(g);if(start===finish)throw Error('Pilih dua ujung lintasan yang berbeda.');
 const a=node(g,start),z=node(g,finish);if(!a||!z||a.type!=='ujung'||z.type!=='ujung')throw Error('Pilih titik ujung U sebagai awal dan akhir.');
 const queue=[{p:{node:start,port:'U'},edges:[],switches:[],visited:[start]}];
 while(queue.length){const item=queue.shift();const e=g.edges.find(e=>key(e.from)===key(item.p)||key(e.to)===key(item.p));if(!e)continue;const next=key(e.from)===key(item.p)?e.to:e.from;
 if(item.visited.includes(next.node))continue;const edges=item.edges.concat(e.id);
 if(next.node===finish)return {edges,switches:item.switches,length:edges.reduce((sum,id)=>sum+g.edges.find(e=>e.id===id).length,0)};
 const n=node(g,next.node);if(n.type!=='wesel')continue;
 for(const out of ports(n).filter(port=>allowed(next.port,port))){queue.push({p:{node:n.id,port:out},edges,switches:item.switches.concat({node:n.id,from:next.port,to:out,position:next.port==='C'||out==='C'?'belok':'lurus'}),visited:item.visited.concat(n.id)});}
 }
 return null;
}
function portXY(n,port){const p=port==='A'?[-20,0]:port==='B'?[20,0]:port==='C'?[20,20]:[0,0];const r=n.rotation*Math.PI/180;return {x:n.x+Math.round(p[0]*Math.cos(r)-p[1]*Math.sin(r)),y:n.y+Math.round(p[0]*Math.sin(r)+p[1]*Math.cos(r))};}
global.TTCEmplasemenGraph={GRID,snap,empty,clone,node,ports,portXY,addNode,move,connect,remove,validate,allowed,route};
})(window);
