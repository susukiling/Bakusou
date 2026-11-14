/* ---------- city scenery: merged geometry, facade textures, intersections ---------- */
function newG(){return {p:[],n:[],u:[],c:[],i:[]}}
function addBox(G,x,y,z,w,h,d,su,sv,col){
  const x0=x-w/2,x1=x+w/2,z0=z-d/2,z1=z+d/2,y0=y,y1=y+h,c=col||[1,1,1];
  const F=[[[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[0,0,1],w,h],[[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],[0,0,-1],w,h],
    [[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[1,0,0],d,h],[[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],[-1,0,0],d,h],
    [[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],[0,1,0],w,d]];
  for(const f of F){const b=G.p.length/3,uw=f[5]*(su||1),vh=f[6]*(sv||1),uv=[[0,0],[uw,0],[uw,vh],[0,vh]];
    for(let k=0;k<4;k++){G.p.push(f[k][0],f[k][1],f[k][2]);G.n.push(f[4][0],f[4][1],f[4][2]);G.u.push(uv[k][0],uv[k][1]);G.c.push(c[0],c[1],c[2])}
    G.i.push(b,b+1,b+2,b,b+2,b+3)}
}
function gMesh(G,mat){if(!G.i.length)return null;const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(G.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(G.n,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(G.u,2));g.setAttribute('color',new THREE.Float32BufferAttribute(G.c,3));g.setIndex(G.i);return new THREE.Mesh(g,mat)}
const rgb=h=>{const c=new THREE.Color(h);return [c.r,c.g,c.b]};
function rep(t){t.wrapS=t.wrapT=THREE.RepeatWrapping;return t}
/* one tile = 2 bays x 4 floors (6m x 14.4m) */
function facadeTex(kind,night,rng){return rep(cvTex(256,512,(g,w,h)=>{
  const wall=[ '#cdbfa6','#18222f','#d9dcdf','#b9b2a6'][kind];
  g.fillStyle=night?'#0d1016':wall;g.fillRect(0,0,w,h);
  for(let f=0;f<4;f++)for(let b=0;b<2;b++){const x=b*128,y=f*128;
    const lit=night&&rng()<.45;
    if(kind===0||kind===3){g.fillStyle=night?(lit?'#ffd58a':'#171c26'):'#27323f';g.fillRect(x+16,y+26,96,78);
      g.fillStyle=night?'#00000040':'#00000030';g.fillRect(x+16,y+26,96,5);g.fillStyle=night?'#2a2d33':'#a89a84';g.fillRect(x+10,y+104,108,7)}
    else if(kind===1){g.fillStyle=night?(lit?'#e8c98a':'#101822'):'#2c3e52';g.fillRect(x+2,y+14,124,100);
      g.fillStyle=night?'#05080c':'#0e1620';g.fillRect(x+62,y+14,4,100);g.fillRect(x,y+112,128,4)}
    else{g.fillStyle=night?(lit?'#f2d9a0':'#18222e'):'#5a7894';g.fillRect(x,y+30,128,70);
      g.fillStyle=night?'#05080c':'#8c97a2';g.fillRect(x+62,y+30,4,70)}}
  }))}
function shopTex(night){return rep(cvTex(256,128,(g,w,h)=>{
  g.fillStyle='#2b2c30';g.fillRect(0,0,w,h);
  const gr=g.createLinearGradient(0,30,0,h);gr.addColorStop(0,night?'#ffcf84':'#d9a867');gr.addColorStop(1,night?'#ffb45a':'#8a6238');
  g.fillStyle=gr;g.fillRect(6,34,w-12,h-40);g.fillStyle='#1a1b1e';for(let x=6;x<w;x+=64)g.fillRect(x,30,5,h-30);
  g.fillStyle=night?'#ffe9b8':'#e8d6b0';g.fillRect(20,8,80,14);g.fillStyle=night?'#ff9a60':'#b04a30';g.fillRect(130,8,60,14)}))}
function pavTex(){return rep(cvTex(128,128,(g,w,h)=>{g.fillStyle='#d8d2c6';g.fillRect(0,0,w,h);
  for(let y=0;y<h;y+=32)for(let x=0;x<w;x+=32){g.fillStyle=((x+y)/32)%2?'#cfc8bb':'#ddd7cb';g.fillRect(x+1,y+1,30,30)}}))}
function asphaltTex(rng){return rep(cvTex(256,256,(g,w,h)=>{g.fillStyle='#5d6168';g.fillRect(0,0,w,h);
  for(let i=0;i<2600;i++){const v=70+(rng()*40|0);g.fillStyle=`rgba(${v},${v+2},${v+6},.35)`;g.fillRect(rng()*w,rng()*h,1+rng()*2,1+rng()*2)}}))}
function limitSign(n){return cvTex(128,128,(g,w,h)=>{g.fillStyle='#fff';g.beginPath();g.arc(64,64,60,0,7);g.fill();g.strokeStyle='#d8262c';g.lineWidth=14;g.beginPath();g.arc(64,64,53,0,7);g.stroke();g.fillStyle='#111';g.font='900 54px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(String(n),64,68)})}
function greenSign(t){return cvTex(256,128,(g,w,h)=>{g.fillStyle='#1f7a45';g.fillRect(0,0,w,h);g.strokeStyle='#fff';g.lineWidth=6;g.strokeRect(8,8,w-16,h-16);g.fillStyle='#fff';g.font='900 48px "Noto Sans JP",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(t,w/2,h/2)})}
function roadNum(){return cvTex(128,96,(g,w,h)=>{g.fillStyle='#e8e8e2';g.font='900 80px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('50',64,52)})}


function leafTex(rng){return cvTex(128,128,(g,w,h)=>{g.fillStyle='#3a6a2c';g.fillRect(0,0,w,h);
  const cs=['#2c5524','#4a7a2e','#66802a','#244a20','#557f32','#34612a'];
  for(let i=0;i<150;i++){g.fillStyle=cs[(rng()*cs.length)|0];g.globalAlpha=.75;g.beginPath();const x=rng()*w,y=rng()*h,r=6+rng()*16;g.moveTo(x,y);g.lineTo(x+r,y+rng()*r);g.lineTo(x+rng()*r,y+r);g.closePath();g.fill()}g.globalAlpha=1})}
function addTrees(sc,trees,night,rng){
  const n=trees.length;if(!n)return;
  const tr=new THREE.InstancedMesh(new THREE.CylinderGeometry(.24,.34,3.6,6),M('#3a2a1c'),n),
    pit=new THREE.InstancedMesh(new THREE.BoxGeometry(1.3,.05,1.3),M('#101113'),n),
    lt=leafTex(rng),O=new THREE.Object3D(),col=new THREE.Color(),
    offs=[[0,4.3,0,1.9],[.95,5.5,.3,1.4],[-.95,5.1,-.2,1.5],[.45,3.3,.95,1.35],[-.65,3.4,-.85,1.45]],
    cr=offs.map(()=>new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),new THREE.MeshLambertMaterial({map:lt,color:'#ffffff',flatShading:true}),n));
  trees.forEach((t,i)=>{O.rotation.set(0,0,0);O.scale.set(t.k,t.k,t.k);O.position.set(t.x,1.8*t.k,t.z);O.updateMatrix();tr.setMatrixAt(i,O.matrix);
    O.scale.set(1,1,1);O.position.set(t.x,.22,t.z);O.updateMatrix();pit.setMatrixAt(i,O.matrix);
    offs.forEach((f,j)=>{const r=f[3]*t.k;O.position.set(t.x+f[0]*t.k,f[1]*t.k,t.z+f[2]*t.k);O.scale.set(r,r*.85,r);O.rotation.set(t.a+j,t.a*2+j*1.3,j);O.updateMatrix();cr[j].setMatrixAt(i,O.matrix);
      col.setHSL(.22+rng()*.1,.3+rng()*.2,(night?.28:.78)+rng()*.22);cr[j].setColorAt(i,col)})});
  sc.add(tr,pit);cr.forEach(m=>sc.add(m));
}

function cityScenery(sc,o){
  const {Z0,L,night,rng,sts}=o,zEnd=-L-260,ISEC=150,ints=[];
  for(let z=Z0-70;z>zEnd;z-=ISEC)ints.push(z);
  const inGap=(z0,z1)=>ints.some(c=>z1>c-10&&z0<c+10);
  const gapAt=z=>ints.find(c=>Math.abs(z-c)<10);
  // facades: 4 kinds, 1 shop, 1 plain
  const FG=[newG(),newG(),newG(),newG()],SG=newG(),PG=newG(),WG=newG();
  const dk=night?.35:1,tint=()=>{const v=(.88+rng()*.2)*dk;return[v,v,v]};
  for(const s of[-1,1]){
    let z=Z0+30;
    while(z>zEnd){
      // next blocking gap
      const nz=ints.filter(c=>c+10<z).sort((a,b)=>b-a)[0];
      const blockEnd=nz===undefined?zEnd:nz+10;
      if(z-blockEnd<8){z=(nz===undefined?zEnd:nz-10)-0;if(nz===undefined)break;z=nz-10;continue}
      const w=Math.min(z-blockEnd,12+rng()*18),d=14+rng()*8,r=rng();
      const h=r<.18?12+rng()*12:r<.58?26+rng()*24:50+Math.pow(rng(),1.4)*70,kind=(rng()*4)|0,cz=z-w/2;
      const dd=16.6+d/2;
      addBox(FG[kind],s*dd,0,cz,d,h,w,1/6,1/14.4,tint());
      // shop strip + canopy
      addBox(SG,s*15.6,0,cz,2.2,4.4,w-.4,1/4,1/4.4,night?[1,1,1]:[1,1,1]);
      addBox(PG,s*14.2,4.5,cz,4.2,.28,w,1,1,rgb('#4a4d53'));
      z-=w+.2+(rng()<.25?rng()*3:0);
    }
  }
  const matF=k=>{const t=facadeTex(k,night,rng);return night?new THREE.MeshLambertMaterial({map:t,emissive:'#ffffff',emissiveMap:t,vertexColors:true}):new THREE.MeshLambertMaterial({map:t,vertexColors:true})};
  FG.forEach((G,k)=>{const m=gMesh(G,matF(k));if(m)sc.add(m)});
  {const t=shopTex(night),m=gMesh(SG,night?new THREE.MeshLambertMaterial({map:t,emissive:'#ffffff',emissiveMap:t}):new THREE.MeshLambertMaterial({map:t}));if(m)sc.add(m)}
  // sidewalks (broken at intersections) + curb + tactile line
  const pv=pavTex(),pg=newG(),curb=rgb(night?'#33363c':'#5a5e64'),yel=rgb('#e0b830');
  for(const s of[-1,1]){let z=Z0+30;const segs=[...ints].sort((a,b)=>b-a);let a=z;
    for(const c of segs.concat([zEnd])){const b=c===zEnd?zEnd:c+10;if(a-b>2){
      addBox(pg,s*11,0,(a+b)/2,6,.2,a-b,1/1.5,1/1.5,night?[.45,.45,.47]:[1,1,1]);
      addBox(PG,s*7.95,0,(a+b)/2,.5,.22,a-b,1,1,curb);addBox(PG,s*8.7,.2,(a+b)/2,.28,.03,a-b,1,1,yel)}
      a=c===zEnd?zEnd:c-10}}
  {const m=gMesh(pg,new THREE.MeshLambertMaterial({map:pv,vertexColors:true}));if(m)sc.add(m)}
  // lamps
  const GL=newG();
  for(const s of[-1,1]){for(let z=Z0-10+(s>0?15:0);z>zEnd;z-=30){if(gapAt(z))continue;
    addBox(PG,s*8.5,0,z,.2,7.4,.2,1,1,rgb('#1c1e22'));addBox(PG,s*7.6,7.2,z,1.9,.16,.16,1,1,rgb('#1c1e22'));
    addBox(GL,s*6.8,7.0,z,1.0,.18,.42,1,1,night?rgb('#fff3b8'):rgb('#e6eaee'))}}
  // intersections: side streets, crosswalks, stop lines, signals
  const asp=asphaltTex(rng);asp.repeat.set(8,8);
  const sideM=new THREE.MeshLambertMaterial({map:asp,color:night?'#7a7d84':'#ffffff'});
  const mk=night?rgb('#9c9c94'):rgb('#f3f3ee');
  for(const c of ints){
    const sp=new THREE.Mesh(new THREE.PlaneGeometry(300,20),sideM);sp.rotation.x=-Math.PI/2;sp.position.set(0,-.01,c);sc.add(sp);
    for(let k=0;k<17;k++){addBox(GL,-7.2+k*.9,.02,c+10.8,.5,.02,3.2,1,1,mk)}
    addBox(GL,0,.02,c+14.2,16,.02,.45,1,1,mk);
    for(const s of[-1,1]){ // signal pole + head
      addBox(PG,s*8.3,0,c+9,.18,5.5,.18,1,1,rgb('#2a2c30'));addBox(PG,s*8.3,5.1,c+9,.5,1.3,.4,1,1,rgb('#2a2c30'))}
  }
  {const m=gMesh(GL,new THREE.MeshBasicMaterial({vertexColors:true}));if(m)sc.add(m)}
  {const m=gMesh(PG,new THREE.MeshLambertMaterial({vertexColors:true}));if(m)sc.add(m)}
  // road numerals & green notice signs & speed signs
  const nm=new THREE.MeshBasicMaterial({map:roadNum(),transparent:true,opacity:night?.55:.9}),npl=new THREE.PlaneGeometry(1.7,1.3);
  for(let z=Z0-60;z>-L-100;z-=140){if(gapAt(z)||gapAt(z-12))continue;const q=new THREE.Mesh(npl,nm);q.rotation.x=-Math.PI/2;q.position.set(rng()<.5?-2.7:2.7,.03,z);sc.add(q)}
  const g1=new THREE.PlaneGeometry(4.6,2.3),spl=new THREE.CircleGeometry(.5,16),sg1=new THREE.MeshBasicMaterial({map:greenSign('工事中')}),sg2=new THREE.MeshBasicMaterial({map:limitSign(50)}),sg3=new THREE.MeshBasicMaterial({map:limitSign(30)});
  const sf=new THREE.MeshLambertMaterial({color:'#7d858c'});
  for(let z=Z0-90,i=0;z>-L-100;z-=110,i++){if(gapAt(z))continue;const s=i%2?1:-1;
    if(i%3===0){const m=new THREE.Mesh(g1,sg1);m.position.set(s*13.6,1.9,z);m.rotation.y=-s*.35;sc.add(m)}
    else{const p=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,2.8,6),sf);p.position.set(s*8.2,1.4,z);sc.add(p);const m=new THREE.Mesh(spl,i%2?sg2:sg3);m.position.set(s*8.2,2.9,z+.05);m.rotation.y=Math.PI;sc.add(m)}}
  // trees: dark blobby crowns on black tree pits
  const trees=[];for(const s of[-1,1])for(let z=Z0-20-(s>0?8:0);z>zEnd;z-=16){if(gapAt(z)||gapAt(z-3)||gapAt(z+3))continue;trees.push({x:s*9.7,z,k:.9+rng()*.35,a:rng()*6})}
  addTrees(sc,trees,night,rng);
  // pedestrians (dark suits, some in color) and vending machines
  const peds=[];for(const s of[-1,1])for(let z=Z0-10;z>zEnd;z-=5+rng()*9){if(gapAt(z))continue;peds.push({x:s*(9+rng()*4.2),z,c:rng()})}
  if(peds.length){const n=peds.length,Gl=new THREE.BoxGeometry(.34,.85,.26),Gb=new THREE.BoxGeometry(.5,.75,.3),Gh=new THREE.BoxGeometry(.24,.26,.24),
    il=new THREE.InstancedMesh(Gl,M('#23262e'),n),ib=new THREE.InstancedMesh(Gb,M('#ffffff'),n),ih=new THREE.InstancedMesh(Gh,M('#e8c4a0'),n),O=new THREE.Object3D(),col=new THREE.Color();
    const sh=['#2a3550','#3a3d44','#f1f1ee','#c8323a','#5a6a86','#2b2f38'];
    peds.forEach((p,i)=>{O.rotation.set(0,rng()*6,0);O.scale.set(1,1,1);O.position.set(p.x,.62,p.z);O.updateMatrix();il.setMatrixAt(i,O.matrix);
      O.position.set(p.x,1.45,p.z);O.updateMatrix();ib.setMatrixAt(i,O.matrix);col.set(sh[(p.c*sh.length)|0]);ib.setColorAt(i,col);
      O.position.set(p.x,2.06,p.z);O.updateMatrix();ih.setMatrixAt(i,O.matrix)});
    sc.add(il,ib,ih)}
  for(let z=Z0-50;z>-L-100;z-=55+rng()*40){if(gapAt(z))continue;const s=rng()<.5?-1:1,vm=box(.8,1.9,.7,0,s*13.4,.95,z,M(['#e8eef2','#2f6fb5','#d23c32'][(rng()*3)|0]));sc.add(vm)}
}
