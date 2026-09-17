const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const c={};c.window=c;vm.createContext(c);for(const file of ['ttc-model.js','ttc-emplasemen-graph.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js',file),'utf8'),c);
const M=c.TTCEmplasemenGraph,g=M.empty(),a=M.addNode(g,'ujung',37,41),w=M.addNode(g,'wesel',201,83),b=M.addNode(g,'ujung',403,43),d=M.addNode(g,'ujung',403,183);
assert.equal(a.x,40);assert.equal(a.y,40);assert.equal(w.x,200);assert.throws(()=>M.addNode(g,'wesel',200,80),/ditempati/);
const ep=(node,port)=>({node:node.id,port});
M.connect(g,ep(a,'U'),ep(w,'A'),{length:100,speed:60});M.connect(g,ep(w,'B'),ep(b,'U'),{length:250,speed:60});M.connect(g,ep(w,'C'),ep(d,'U'),{length:180,speed:30});
assert.equal(M.route(g,a.id,b.id).length,350);assert.equal(M.route(g,a.id,d.id).switches[0].position,'belok');assert.equal(M.route(g,b.id,a.id).length,350);assert.equal(M.route(g,b.id,d.id),null);assert.equal(M.route(g,d.id,b.id),null);
assert.throws(()=>M.connect(g,ep(a,'U'),ep(w,'B'),{length:1,speed:1}),/terhubung/);assert.throws(()=>M.connect(g,ep(w,'B'),ep(w,'C'),{length:1,speed:1}),/titik lain/);
const untouched=JSON.stringify(g.edges);M.move(g,w.id,253,109);assert.equal(w.x,260);assert.equal(w.y,100);assert.equal(JSON.stringify(g.edges),untouched);
M.move(g,w.id,-33,-51);assert.equal(w.x,-40);assert.equal(w.y,-60);w.rotation=90;assert.equal(M.portXY(w,'B').y,-40);
const p=c.TTCModel.proyekKosong();p.prasarana.stasiun=[{kode:'S',km:10,diagramEmplasemen:g,layout:{jalur:[],wesel:[],rute:[]}}];const loaded=c.TTCModel.migrasi(JSON.parse(JSON.stringify(p)));M.validate(loaded.prasarana.stasiun[0].diagramEmplasemen);assert.equal(loaded.prasarana.stasiun[0].km,10);assert.deepEqual(JSON.parse(JSON.stringify(loaded.prasarana.stasiun[0].diagramEmplasemen)),JSON.parse(JSON.stringify(g)));
for(const bad of [NaN,0,-1,Infinity]){const h=M.empty(),x=M.addNode(h,'ujung',0,0),y=M.addNode(h,'ujung',100,0);assert.throws(()=>M.connect(h,ep(x,'U'),ep(y,'U'),{length:bad,speed:40}));}
const invalid=M.clone(g);invalid.edges[0].to.node='missing';assert.throws(()=>M.validate(invalid),/referensi/);
const saved=M.clone(g);M.remove(g,w.id);assert.equal(g.edges.length,0);assert.equal(saved.edges.length,3);M.validate(saved);
console.log('PASS: snap, collision, A-B/A-C dua arah, B-C ditolak, ujung tunggal, self-link ditolak, panjang tetap saat drag, rotasi, simpan/migrasi, angka invalid, referensi rusak, hapus beserta segmen.');
const cross=M.empty(),n1=M.addNode(cross,'ujung',0,0),n2=M.addNode(cross,'ujung',200,200),n3=M.addNode(cross,'ujung',200,0),n4=M.addNode(cross,'ujung',0,200);M.connect(cross,ep(n1,'U'),ep(n2,'U'),{length:200,speed:40});M.connect(cross,ep(n3,'U'),ep(n4,'U'),{length:200,speed:40});assert.equal(M.route(cross,n1.id,n4.id),null);console.log('PASS: persilangan garis tidak menjadi sambungan.');
