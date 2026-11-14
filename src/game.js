/* ---------- 3D game (Three.js) ---------- */
const Game=(()=>{
const $i=id=>document.getElementById(id), clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), lerp=(a,b,t)=>a+(b-a)*t;
const rngMk=seed=>{let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296}};
const hashS=str=>{let h=2166136261;for(const c of str){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
const PAL={
 morning:{sky:['#7aa6d8','#f6dfbd'],fog:'#ecdcc3',sun:1.0,amb:.75,night:0},
 day:{sky:['#3f86d8','#d3e8f8'],fog:'#d3e8f8',sun:1.15,amb:.8,night:0},
 night:{sky:['#060c1e','#2a3a68'],fog:'#16204a',sun:.55,amb:.95,night:1}
};
const LABEL={yamanote:'残り時間',senshu:'見送りまで',midosuji:'始業まで',minami:'予約まで',hanshinMid:'0時まで'};
const KEY={l:0,r:0,b:0,j:0};let touchDir=0;
let renderer=null,scene=null,camera=null,st=null,raf=0,last=0,snd=true,ac=null;
const el=()=>$i('gl');

function beep(f,d,type){if(!snd)return;try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator(),g=ac.createGain();o.type=type||'square';o.frequency.value=f;g.gain.value=.05;o.connect(g);g.connect(ac.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+d);o.stop(ac.currentTime+d)}catch(e){}}
function cvTex(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.anisotropy=4;return t}
function winTex(night,rng){return cvTex(128,256,(g,w,h)=>{g.fillStyle=night?'#10141c':'#b9c4cc';g.fillRect(0,0,w,h);
  for(let y=6;y<h-4;y+=16)for(let x=6;x<w-4;x+=16){g.fillStyle=night?(rng()<.4?'#ffd98a':'#1a2230'):(rng()<.5?'#6f8aa0':'#8aa3b6');g.fillRect(x,y,10,10)}})}
function skyTex(p){return cvTex(4,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,p.sky[0]);gr.addColorStop(1,p.sky[1]);g.fillStyle=gr;g.fillRect(0,0,w,h)})}
function signTex(stn,prev,next,color,showCode){return cvTex(1024,400,(g,w,h)=>{
  g.fillStyle='#fff';g.beginPath();g.roundRect(0,0,w,h,26);g.fill();
  g.fillStyle=color;g.fillRect(0,h-84,w,84);
  g.textBaseline='middle';
  if(showCode&&stn.c){g.strokeStyle='#222';g.lineWidth=7;g.strokeRect(34,40,130,150);g.fillStyle='#222';g.textAlign='center';g.font='900 46px sans-serif';g.fillText(stn.c.slice(0,2),99,86);g.font='900 74px sans-serif';g.fillText(stn.c.slice(2),99,146)}
  g.textAlign='left';g.fillStyle='#111';const x0=showCode&&stn.c?200:60;
  let fs=150;g.font=`900 ${fs}px "Noto Sans JP",sans-serif`;while(g.measureText(stn.n).width>w-x0-40&&fs>50){fs-=8;g.font=`900 ${fs}px "Noto Sans JP",sans-serif`}
  g.fillText(stn.n,x0,100);
  g.font='700 38px "Noto Sans JP",sans-serif';g.fillText(stn.k||'',x0,190);g.font='700 34px sans-serif';g.fillText(stn.r||'',x0+(stn.k?0:0),235);
  g.fillStyle='#fff';g.font='900 34px "Noto Sans JP",sans-serif';g.textAlign='left';g.fillText(prev?'◀ '+prev:'',30,h-42);g.textAlign='right';g.fillText(next?next+' ▶':'',w-30,h-42)})}
function stripeTex(){return cvTex(64,32,(g,w,h)=>{g.fillStyle='#fff';g.fillRect(0,0,w,h);g.fillStyle='#ff7a1a';for(let i=-2;i<6;i++){g.beginPath();g.moveTo(i*16,0);g.lineTo(i*16+8,0);g.lineTo(i*16+24,h);g.lineTo(i*16+16,h);g.fill()}})}
const M=(c,o)=>new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}));
function box(w,h,d,col,x,y,z,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat||M(col));m.position.set(x||0,y||0,z||0);return m}


let _rampTex=null;
function rampTex(){return _rampTex||(_rampTex=cvTex(128,256,(g,w,h)=>{g.fillStyle='#f6c400';g.fillRect(0,0,w,h);
  g.fillStyle='#16181c';for(let y=0;y<h;y+=64)g.fillRect(0,y,w,22);
  g.strokeStyle='#fff';g.lineWidth=9;g.lineCap='round';g.lineJoin='round';for(const y of[70,134,198]){g.beginPath();g.moveTo(26,y+22);g.lineTo(64,y-4);g.lineTo(102,y+22);g.stroke()}}))}
function mkRamp(){
  const W=3.4,Ln=4,Hh=1.2,g=new THREE.Group(),th=Math.atan2(Hh,Ln),sl=Math.hypot(Ln,Hh);
  const tilt=new THREE.Group();tilt.position.set(0,Hh/2,0);tilt.rotation.x=th;
  const top=new THREE.Mesh(new THREE.PlaneGeometry(W,sl),new THREE.MeshLambertMaterial({map:rampTex(),side:THREE.DoubleSide}));top.rotation.x=-Math.PI/2;tilt.add(top);g.add(tilt);
  const sh=new THREE.Shape();sh.moveTo(Ln/2,0);sh.lineTo(-Ln/2,0);sh.lineTo(-Ln/2,Hh);sh.closePath();
  for(const sx of[-1,1]){const m=new THREE.Mesh(new THREE.ShapeGeometry(sh),new THREE.MeshLambertMaterial({color:'#f6c400',side:THREE.DoubleSide}));m.rotation.y=-Math.PI/2;m.position.set(sx*W/2,0,0);g.add(m)}
  g.add(box(W,Hh,.1,0,0,Hh/2,-Ln/2,new THREE.MeshLambertMaterial({map:rampTex()})));
  return g}

function mkCar(rng,kind,col){
  const g=new THREE.Group();
  if(kind==='truck'){
    g.add(box(2.5,2.9,5.8,0,0,2.0,0,M('#e9edf0')));g.add(box(2.5,.6,5.8,0,0,.45,0,M('#2c3138')));
    g.add(box(2.3,.5,.1,0,0,.9,2.92,M('#ff3b30')));g.userData={hw:1.35,hl:3.1,hh:3.4};
  }else{
    const c=col||new THREE.Color().setHSL(rng(),.25+rng()*.45,.25+rng()*.3);
    g.add(box(2,.75,4.3,0,0,.75,0,M(c)));g.add(box(1.7,.7,2.2,0,0,1.45,.2,M(c)));
    g.add(box(1.55,.5,2.25,0,0,1.5,.2,M('#1c2733')));
    g.add(box(.5,.22,.08,0,-.65,.8,2.16,new THREE.MeshBasicMaterial({color:'#ff3a30'})));g.add(box(.5,.22,.08,0,.65,.8,2.16,new THREE.MeshBasicMaterial({color:'#ff3a30'})));
    g.add(box(2,.3,4.3,0,0,.25,0,M('#15181d')));g.userData={hw:1.1,hl:2.3,hh:1.9};
  }
  return g;
}
const SKINS={std:{deck:'#2a2d33',stem:'#3a4150',grip:'#111',glow:'#25e6d0'},yamate:{deck:'#62b32d',stem:'#e8eaec',grip:'#62b32d',glow:'#ffffff'},senshu:{deck:'#d8a46a',stem:'#d8402a',grip:'#1a1a1a',glow:'#ffe84a'},neon:{deck:'#16a0a0',stem:'#1a1d24',grip:'#d0309a',glow:'#d0309a'},bay:{deck:'#2f6fa8',stem:'#8aa0b4',grip:'#1a1a1a',glow:'#8ad0ff'}};

function mkPlayer(vehicle,skin){
  const g=new THREE.Group(),body=new THREE.Group();g.add(body);
  if(vehicle==='car'){const c=M('#ffcc00');body.add(box(2,.75,4.2,0,0,.75,0,c));body.add(box(1.7,.7,2.2,0,0,1.45,.2,c));body.add(box(1.55,.5,2.25,0,0,1.5,.2,M('#1c2733')));
    body.add(box(2,.3,4.2,0,0,.25,0,M('#15181d')));g.userData={body,legs:[],board:body,rider:body};return g}
  const sk=SKINS[skin]||SKINS.std,board=new THREE.Group();body.add(board);
  const wheel=z=>{const w=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.16,12),M('#0b0d10'));w.rotation.z=Math.PI/2;w.position.set(0,.24,z);return w};
  board.add(box(.52,.12,1.9,0,0,.36,0,M(sk.deck)));
  board.add(box(.4,.03,1.7,0,0,.29,0,new THREE.MeshBasicMaterial({color:sk.glow})));
  board.add(wheel(.98),wheel(-.98));
  const fen=box(.46,.05,.55,0,0,.62,1.2,M(sk.stem));fen.rotation.x=-.55;board.add(fen);
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.05,.06,1.45,8),M(sk.stem));stem.position.set(0,1.05,-.78);stem.rotation.x=.16;board.add(stem);
  const bar=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.86,8),M(sk.stem));bar.rotation.z=Math.PI/2;bar.position.set(0,1.78,-.7);board.add(bar);
  for(const sx of[-1,1]){const gp=new THREE.Mesh(new THREE.CylinderGeometry(.065,.065,.2,8),M(sk.grip));gp.rotation.z=Math.PI/2;gp.position.set(sx*.46,1.78,-.7);board.add(gp)}
  const rider=new THREE.Group();body.add(rider);
  const suit=M('#1f2a44'),legs=[];
  const l0=new THREE.Group();l0.position.set(-.18,.45,.35);l0.add(box(.22,.95,.26,0,0,.45,0,suit));rider.add(l0);legs.push(l0);
  const l1=new THREE.Group();l1.position.set(.18,.45,-.25);l1.add(box(.22,.95,.26,0,0,.45,0,suit));rider.add(l1);legs.push(l1);
  const torso=new THREE.Group();torso.position.set(0,1.45,-.05);torso.rotation.x=-.18;rider.add(torso);
  torso.add(box(.66,.82,.36,0,0,0,0,suit));torso.add(box(.52,.56,.24,0,0,0,.31,M('#3b3b3e')));
  for(const sx of[-1,1]){const ar=new THREE.Group();ar.position.set(sx*.4,.3,-.05);ar.rotation.x=-1.05;ar.add(box(.16,.78,.16,0,0,-.38,0,suit));torso.add(ar)}
  torso.add(box(.22,.2,.22,0,0,.55,0,M('#e8c4a0')));
  const hair=new THREE.Mesh(new THREE.SphereGeometry(.3,10,8),M('#ececee'));hair.position.set(0,.8,.02);torso.add(hair);
  g.userData={body,legs,board,rider};return g}

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
  const {Z0,L,night,rng,sts}=o,HW=!!o.hw,zEnd=-L-260,ISEC=150,ints=[];
  if(!HW)for(let z=Z0-170;z>zEnd;z-=ISEC)ints.push(z);
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
      const dd=16.6+d/2+(HW?30:0);
      addBox(FG[kind],s*dd,0,cz,d,h,w,1/6,1/14.4,tint());
      // shop strip + canopy
      if(!HW){addBox(SG,s*15.6,0,cz,2.2,4.4,w-.4,1/4,1/4.4,[1,1,1]);
      addBox(PG,s*14.2,4.5,cz,4.2,.28,w,1,1,rgb('#4a4d53'))}
      z-=w+.2+(rng()<.25?rng()*3:0);
    }
  }
  const matF=k=>{const t=facadeTex(k,night,rng);return night?new THREE.MeshLambertMaterial({map:t,emissive:'#ffffff',emissiveMap:t,vertexColors:true}):new THREE.MeshLambertMaterial({map:t,vertexColors:true})};
  FG.forEach((G,k)=>{const m=gMesh(G,matF(k));if(m)sc.add(m)});
  {const t=shopTex(night),m=gMesh(SG,night?new THREE.MeshLambertMaterial({map:t,emissive:'#ffffff',emissiveMap:t}):new THREE.MeshLambertMaterial({map:t}));if(m)sc.add(m)}
  // sidewalks (broken at intersections) + curb + tactile line
  const pv=pavTex(),pg=newG(),curb=rgb(night?'#33363c':'#5a5e64'),yel=rgb('#e0b830');
  if(HW){const wl=rgb(night?'#4c5057':'#b9bec3'),cap=rgb(night?'#33363c':'#8f959b'),rl=rgb('#d8dde2'),zc=(Z0+zEnd)/2,ln=Z0-zEnd;
    for(const s of[-1,1]){addBox(PG,s*9.4,0,zc,.5,3.8,ln,1,1,wl);addBox(PG,s*9.4,3.8,zc,.9,.25,ln,1,1,cap);addBox(PG,s*8.0,.7,zc,.14,.28,ln,1,1,rl);addBox(PG,s*8.0,.25,zc,.14,.28,ln,1,1,rl);addBox(PG,s*7.7,0,zc,.3,.18,ln,1,1,yel);
      for(let z=Z0;z>zEnd;z-=24)addBox(PG,s*9.7,0,z,.9,7.5,.9,1,1,cap)}}
  else for(const s of[-1,1]){let z=Z0+30;const segs=[...ints].sort((a,b)=>b-a);let a=z;
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
  if(!HW)for(let z=Z0-60;z>-L-100;z-=140){if(gapAt(z)||gapAt(z-12))continue;const q=new THREE.Mesh(npl,nm);q.rotation.x=-Math.PI/2;q.position.set(rng()<.5?-2.7:2.7,.03,z);sc.add(q)}
  const g1=new THREE.PlaneGeometry(4.6,2.3),spl=new THREE.CircleGeometry(.5,16),sg1=new THREE.MeshBasicMaterial({map:greenSign('工事中')}),sg2=new THREE.MeshBasicMaterial({map:limitSign(50)}),sg3=new THREE.MeshBasicMaterial({map:limitSign(30)});
  const sf=new THREE.MeshLambertMaterial({color:'#7d858c'});
  if(!HW)for(let z=Z0-90,i=0;z>-L-100;z-=110,i++){if(gapAt(z))continue;const s=i%2?1:-1;
    if(i%3===0){const m=new THREE.Mesh(g1,sg1);m.position.set(s*13.6,1.9,z);m.rotation.y=-s*.35;sc.add(m)}
    else{const p=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,2.8,6),sf);p.position.set(s*8.2,1.4,z);sc.add(p);const m=new THREE.Mesh(spl,i%2?sg2:sg3);m.position.set(s*8.2,2.9,z+.05);m.rotation.y=Math.PI;sc.add(m)}}
  // trees: dark blobby crowns on black tree pits
  const trees=[];if(!HW)for(const s of[-1,1])for(let z=Z0-20-(s>0?8:0);z>zEnd;z-=16){if(gapAt(z)||gapAt(z-3)||gapAt(z+3))continue;trees.push({x:s*9.7,z,k:.9+rng()*.35,a:rng()*6})}
  addTrees(sc,trees,night,rng);
  // pedestrians (dark suits, some in color) and vending machines
  const peds=[];if(!HW)for(const s of[-1,1])for(let z=Z0-10;z>zEnd;z-=5+rng()*9){if(gapAt(z))continue;peds.push({x:s*(9+rng()*4.2),z,c:rng()})}
  if(peds.length){const n=peds.length,Gl=new THREE.BoxGeometry(.34,.85,.26),Gb=new THREE.BoxGeometry(.5,.75,.3),Gh=new THREE.BoxGeometry(.24,.26,.24),
    il=new THREE.InstancedMesh(Gl,M('#23262e'),n),ib=new THREE.InstancedMesh(Gb,M('#ffffff'),n),ih=new THREE.InstancedMesh(Gh,M('#e8c4a0'),n),O=new THREE.Object3D(),col=new THREE.Color();
    const sh=['#2a3550','#3a3d44','#f1f1ee','#c8323a','#5a6a86','#2b2f38'];
    peds.forEach((p,i)=>{O.rotation.set(0,rng()*6,0);O.scale.set(1,1,1);O.position.set(p.x,.62,p.z);O.updateMatrix();il.setMatrixAt(i,O.matrix);
      O.position.set(p.x,1.45,p.z);O.updateMatrix();ib.setMatrixAt(i,O.matrix);col.set(sh[(p.c*sh.length)|0]);ib.setColorAt(i,col);
      O.position.set(p.x,2.06,p.z);O.updateMatrix();ih.setMatrixAt(i,O.matrix)});
    sc.add(il,ib,ih)}
  if(!HW)for(let z=Z0-50;z>-L-100;z-=55+rng()*40){if(gapAt(z))continue;const s=rng()<.5?-1:1,vm=box(.8,1.9,.7,0,s*13.4,.95,z,M(['#e8eef2','#2f6fb5','#d23c32'][(rng()*3)|0]));sc.add(vm)}
}


function goldTex(){return cvTex(128,128,(g,w,h)=>{g.fillStyle='#e9dcc0';g.fillRect(0,0,w,h);g.strokeStyle='#c9a04a';g.lineWidth=6;for(let i=0;i<=w;i+=32){g.beginPath();g.moveTo(i,0);g.lineTo(i,h);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(w,i);g.stroke()}})}
let DIRGREEN=false;
/* Japan: expressway/toll guide signs are green, ordinary roads/national routes are blue */
function dirSignTex(){return cvTex(512,200,(g,w,h)=>{g.fillStyle=DIRGREEN?'#0f7a4a':'#1b57b8';g.beginPath();g.roundRect(0,0,w,h,16);g.fill();g.strokeStyle='#fff';g.lineWidth=6;g.strokeRect(10,10,w-20,h-20);g.fillStyle='#fff';g.font='900 54px "Noto Sans JP",sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('大手町',130,60);g.fillText('日本橋',390,60);g.font='900 70px sans-serif';g.fillText('←',130,140);g.fillText('↑',260,140);g.fillText('→',390,140)})}
function addSegment(sc,kind,z0,len,night,rng){
  const dk=night?.4:1,z1=z0-len;
  if(kind==='truss'){const col=night?'#16505a':'#1f8a9a',mt=M(col);
    for(let z=z0;z>z1;z-=12){for(const s of[-1,1]){sc.add(box(.5,13,.5,0,s*8.8,6.5,z,mt));const dg=box(.4,15,.4,0,s*8.8,6.5,z-6,mt);dg.rotation.x=s>0?.45:-.45;sc.add(dg)}sc.add(box(18.4,.6,.6,0,0,13,z,mt))}
    for(const s of[-1,1])sc.add(box(.6,.6,len,0,s*8.8,13,(z0+z1)/2,mt))}
  else if(kind==='hall'){ // gold-grid ceiling over a covered section
    const gt=goldTex();gt.wrapS=gt.wrapT=THREE.RepeatWrapping;gt.repeat.set(len/6,3);
    const ce=new THREE.Mesh(new THREE.BoxGeometry(18.4,.4,len),new THREE.MeshLambertMaterial({map:gt,color:night?'#7a7a80':'#ffffff'}));ce.position.set(0,8.2,(z0+z1)/2);sc.add(ce);
    for(const s of[-1,1])sc.add(box(.6,8.2,len,0,s*9,4.1,(z0+z1)/2,M(night?'#4a4e54':'#9aa3ab')))}
  else if(kind==='hedge'){ // green hedge walls, brown ceiling with white round lights
    const lt=leafTex(rng);lt.wrapS=lt.wrapT=THREE.RepeatWrapping;lt.repeat.set(len/8,1.5);
    for(const s of[-1,1]){const w=new THREE.Mesh(new THREE.BoxGeometry(.8,9,len),new THREE.MeshLambertMaterial({map:lt,color:night?'#8aa088':'#ffffff'}));w.position.set(s*9,4.5,(z0+z1)/2);w.rotation.z=-s*.12;sc.add(w)}
    sc.add(box(19,.4,len,0,0,8.6,(z0+z1)/2,M(night?'#2a1a10':'#4a2c1c')));
    const n=Math.floor(len/6),li=new THREE.InstancedMesh(new THREE.CircleGeometry(.5,12),new THREE.MeshBasicMaterial({color:'#ffffff'}),n*5),O=new THREE.Object3D();let i=0;
    for(let q=0;q<n;q++)for(let k=0;k<5;k++){O.position.set(-6+k*3,8.38,z0-q*6);O.rotation.set(Math.PI/2,0,0);O.updateMatrix();li.setMatrixAt(i++,O.matrix)}
    sc.add(li)}
  else if(kind==='dirsign'){const m=new THREE.Mesh(new THREE.PlaneGeometry(6,2.4),new THREE.MeshBasicMaterial({map:dirSignTex()}));m.position.set(-4.5,6.2,z0);sc.add(m);sc.add(box(.2,6.2,.2,0,-8.2,3.1,z0,M('#7d858c')));sc.add(box(4,.2,.2,0,-6.2,6.3,z0,M('#7d858c')))}
}

function addHills(sc,o){
  const {Z0,L,night,rng,th}=o,n=Math.ceil((L+500)/60)*2,O=new THREE.Object3D();
  const hm=new THREE.InstancedMesh(new THREE.ConeGeometry(1,1,7),new THREE.MeshLambertMaterial({color:'#ffffff',flatShading:true}),n),col=new THREE.Color();
  let i=0;for(const s of[-1,1])for(let z=Z0+100;z>-L-420&&i<n;z-=60){const big=th==='mtn',r=(big?60+rng()*70:30+rng()*30),h=big?(50+rng()*90):(8+rng()*14);
    O.position.set(s*(big?(55+rng()*80):(70+rng()*80)),h/2-1,z-rng()*40);O.scale.set(r,h,r);O.rotation.set(0,rng()*6,0);O.updateMatrix();hm.setMatrixAt(i,O.matrix);
    col.setHSL(.27+rng()*.08,.25+rng()*.2,(night?.1:.28)+rng()*.12);hm.setColorAt(i,col);i++}
  hm.count=i;sc.add(hm)}
function addGuardrail(sc,o){
  const {Z0,L,night}=o,zc=(Z0-L-420)/2,ln=Z0+L+420,rl=M(night?'#8a9096':'#e4e8ec'),pm=M(night?'#4a4e54':'#8f959b'),n=Math.ceil(ln/8)*2,pst=new THREE.InstancedMesh(new THREE.BoxGeometry(.14,.9,.14),pm,n),O=new THREE.Object3D();let i=0;
  for(const s of[-1,1]){sc.add(box(.1,.3,ln,0,s*8.2,.75,zc,rl));sc.add(box(.1,.25,ln,0,s*8.2,.35,zc,rl));for(let z=Z0;z>-L-420;z-=8){O.position.set(s*8.3,.45,z);O.updateMatrix();pst.setMatrixAt(i++,O.matrix)}}
  pst.count=i;sc.add(pst)}

/* Time design: needed = length / (average speed x 0.9). Each station adds a bonus that shrinks along the route
   (starting value by difficulty). The starting time is what is left to cover the needed time, plus a margin that is thinner on harder routes. */
const CRU0=62,CRU1=34,DISP=1.45; /* cruise m/s at start / extra at goal; DISP: arcade display scale (original shows 220-500 km/h) */
function timePlan(rt,L,n,survive){
  const base=[5.5,5.0,4.5,4.0][rt.d-1],margin=[9,7,5,3.5][rt.d-1],avg=(CRU0+CRU1*.5)*.9;
  const add=k=>Math.max(2.5,base-.25*(k-1));
  let sum=0;for(let k=1;k<n;k++)sum+=add(k);
  const need=L/avg,t0=Math.max(16,Math.round((need-sum+margin)*2)/2);
  return {t0,add,need,sum}}

function build(S){
  const rt=S.route,rng=rngMk(S.lay==='fix'?hashS(rt.id):((Math.random()*1e9)|0)+1);
  const tm=S.time==='auto'?rt.tm:S.time,pal=PAL[tm],night=pal.night,th=rt.th;
  const sts=rt.st,n=sts.length;
  const L=S.mode==='survive'?6000:(rt.id==='yamanote'?2640:Math.max(1500,1200+rt.d*450+n*60));
  const gdist=k=>L*k/(n-1);
  const sc=new THREE.Scene();sc.background=skyTex(pal);sc.fog=new THREE.Fog(pal.fog,night?60:90,night?420:620);
  sc.add(new THREE.HemisphereLight(night?'#7080b0':'#ffffff',night?'#101420':'#8a9099',pal.amb*(night?1.1:1.3)));
  const dl=new THREE.DirectionalLight(night?'#aab8ff':'#fff2dd',pal.sun);dl.position.set(-30,60,20);sc.add(dl);
  const Z0=60,len=L+520,mid=-(L)/2+Z0/2-100;
  const road=new THREE.Mesh(new THREE.PlaneGeometry(16,len),(()=>{const t=asphaltTex(rng);t.repeat.set(3,len/12);return new THREE.MeshLambertMaterial({map:t,color:night?'#8a8d94':'#ffffff'})})());road.rotation.x=-Math.PI/2;road.position.set(0,0,mid);sc.add(road);
  const gcol=th==='sea'||th==='bay'?(night?'#0a2548':'#2a86c0'):th==='mtn'||th==='plain'?(night?'#17402a':'#5a9a52'):(night?'#14171d':'#9a9ea4');
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(900,len),M(gcol));ground.rotation.x=-Math.PI/2;ground.position.set(0,th==='sea'||th==='bay'?-3:-.15,mid);sc.add(ground);
  for(const s of(th==='city'?[]:[-1,1])){
    sc.add(box(6,.2,len,0,s*11,.1,mid,M(night?'#4a4c52':'#d2ccbf')));
    sc.add(box(.35,.22,len,0,s*8.5,.11,mid,M('#e8c030')));
    sc.add(box(.2,.05,len,0,s*7.8,.03,mid,M('#f4f4f4')));
  }
  // lane dashes
  const dn=Math.ceil(len/9),dash=new THREE.InstancedMesh(new THREE.PlaneGeometry(.22,4),new THREE.MeshBasicMaterial({color:night?'#d8d8d0':'#f2f2f2'}),dn*2),dm=new THREE.Object3D();
  let di=0;for(let i=0;i<dn;i++)for(const lx of[-2.7,2.7]){dm.position.set(lx,.03,Z0-i*9-2);dm.rotation.set(-Math.PI/2,0,0);dm.updateMatrix();dash.setMatrixAt(di++,dm.matrix)}
  sc.add(dash);
  // buildings / scenery
  const winD=winTex(0,rng),winN=winTex(1,rng);
  const bmat=new THREE.MeshLambertMaterial({color:'#ffffff',map:night?null:winD,emissive:night?'#ffffff':'#000000',emissiveMap:night?winN:null});
  const bl=[],tl=[],lampL=[];
  if(th==='plain'){
    for(const s of[-1,1]){let z=Z0+40;while(z>-L-200){const w=th==='city'?10+rng()*16:7+rng()*6,d=th==='city'?14+rng()*16:7+rng()*5,h=th==='city'?(18+Math.pow(rng(),1.6)*90):(5+rng()*6);
      bl.push({x:s*(16.5+d/2+rng()*2),z:z-w/2,w:d,h,d:w,c:new THREE.Color().setHSL(.08+rng()*.1,.08+rng()*.12,.55+rng()*.25)});z-=w+.5+rng()*3}}
  }
  if(bl.length){const bi=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),bmat,bl.length),o=new THREE.Object3D();
    bl.forEach((b,i)=>{o.position.set(b.x,b.h/2,b.z);o.scale.set(b.w,b.h,b.d);o.updateMatrix();bi.setMatrixAt(i,o.matrix);bi.setColorAt(i,b.c)});sc.add(bi)}
  if(false){ // ground-floor shops
    const sm=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),M(night?'#6a5a40':'#d9b98a',{emissive:night?'#5a4020':'#000000'}),bl.length),o=new THREE.Object3D();
    bl.forEach((b,i)=>{const s=Math.sign(b.x);o.position.set(s*15.6,2.1,b.z);o.scale.set(2.2,4.2,b.d*.96);o.updateMatrix();sm.setMatrixAt(i,o.matrix)});sc.add(sm)}
  for(const s of(th==='city'?[]:[-1,1])){ // trees, lamps
    let z=Z0;const step=th==='mtn'?7:15;while(z>-L-200){if(th!=='sea'&&th!=='bay'||rng()<.2)tl.push({x:s*(9.6+rng()*1.2),z:z-rng()*4,sz:.8+rng()*.5});
      if(th==='mtn'||th==='plain')for(let k=0;k<3;k++)tl.push({x:s*(15+rng()*40),z:z-rng()*10,sz:1.2+rng()*1.6});
      z-=step}
    z=Z0;while(z>-L-200){lampL.push({x:s*8.3,z,s});z-=32}
  }
  if(tl.length)addTrees(sc,tl.map(t=>({x:t.x,z:t.z,k:t.sz*1.1,a:t.x})),night,rng);
  {const pm=new THREE.InstancedMesh(new THREE.BoxGeometry(.2,6.5,.2),M('#8a929a'),lampL.length),hm=new THREE.InstancedMesh(new THREE.BoxGeometry(1.4,.25,.45),new THREE.MeshBasicMaterial({color:night?'#fff3b0':'#d8dde2'}),lampL.length),o=new THREE.Object3D();
    lampL.forEach((l,i)=>{o.position.set(l.x,3.25,l.z);o.scale.set(1,1,1);o.updateMatrix();pm.setMatrixAt(i,o.matrix);o.position.set(l.x-l.s*.7,6.5,l.z);o.updateMatrix();hm.setMatrixAt(i,o.matrix)});sc.add(pm,hm)}
  if(th==='sea'||th==='bay'){ // railings and bridge trusses
    for(const s of[-1,1]){const rl=Math.ceil(len/4),rm=new THREE.InstancedMesh(new THREE.BoxGeometry(.12,1.2,.12),M('#c9d0d6'),rl),o=new THREE.Object3D();for(let i=0;i<rl;i++){o.position.set(s*14.2,.8,Z0-i*4);o.updateMatrix();rm.setMatrixAt(i,o.matrix)}sc.add(rm);sc.add(box(.15,.12,len,0,s*14.2,1.35,mid,M('#c9d0d6')))}
    if(th==='bay')for(let z=Z0-80;z>-L-100;z-=24){for(const s of[-1,1]){const dg=box(.5,16,.5,0,s*13.5,8,z,M(night?'#1d6a78':'#1f8a9a'));dg.rotation.z=-s*.5;sc.add(dg)}sc.add(box(28,.6,.6,0,0,15.5,z,M(night?'#1d6a78':'#1f8a9a')))}
  }
  // stations (gates + canopies)
  const gates=[],sg=new THREE.Group();sc.add(sg);
  const barCol=rt.id==='yamanote'?'#7ac143':rt.t==='hw'?'#0b8a56':rt.t==='toll'?'#c97800':rt.t==='nat'?'#1b62d6':'#2f9a7a';
  sts.forEach((s,k)=>{const z=-gdist(k);
    const tex=signTex(s,sts[k-1]&&sts[k-1].n,sts[k+1]&&sts[k+1].n,barCol,rt.id==='yamanote');
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(9,3.5),new THREE.MeshBasicMaterial({map:tex}));sign.position.set(0,8.4,z+.4);sg.add(sign);
    sg.add(box(.4,9,.4,0,-8.6,4.5,z,M('#7d858c')));sg.add(box(.4,9,.4,0,8.6,4.5,z,M('#7d858c')));sg.add(box(17.6,.5,.6,0,0,10.4,z,M('#6b737a')));
    if(k%2===1&&k<n-1){const cl=70;sg.add(box(18,.6,cl,0,0,7,z-cl/2-4,M(night?'#5a3d20':'#c49a5e')));
      for(let q=0;q<cl;q+=14)for(const s2 of[-1,1])sg.add(box(.6,7,.6,0,s2*8.6,3.5,z-q-4,M('#9aa0a6')));
      for(let q=0;q<cl;q+=10){const lt=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.4),new THREE.MeshBasicMaterial({color:'#fff7d0'}));lt.rotation.x=Math.PI/2;lt.position.set(0,6.68,z-q-4);sg.add(lt)}}
    gates.push({z,s,k})});
  if(th==='mtn'||th==='plain')addHills(sc,{Z0,L,night,rng,th});
  if(th!=='city'&&th!=='sea'&&th!=='bay'&&(rt.t==='hw'||rt.t==='toll'||th==='mtn'))addGuardrail(sc,{Z0,L,night});
  if(th==='city')cityScenery(sc,{Z0,L,night,rng,sts,hw:rt.t==='hw'||rt.t==='toll'||['shutoNight','shutoMid','hanshinMid'].includes(rt.id)});
  if(th==='city'){
    if(rt.id==='yamanote'){const gz=k=>-gdist(k);
      addSegment(sc,'truss',gz(3)-20,130,night,rng);addSegment(sc,'hall',gz(5)-30,150,night,rng);addSegment(sc,'hall',gz(6)-20,170,night,rng);addSegment(sc,'hedge',gz(8)-20,130,night,rng)}
    else if(rt.id==='midosuji'||rt.id==='minami'||rt.id==='shutoNight'||rt.id==='shutoMid'){addSegment(sc,'hall',-gdist(1)-30,140,night,rng)}
    DIRGREEN=rt.t==='hw'||rt.t==='toll'||rt.id==='shutoMid'||rt.id==='shutoNight'||rt.id==='hanshinMid';
    for(let z=-300;z>-L+100;z-=360)addSegment(sc,'dirsign',z,0,night,rng)}
  // obstacles
  const ents=[],lanes=[-3.6,0,3.6],dd=[1.7,1.35,1.05,.85][rt.d-1];
  const barTex=stripeTex();
  let z=-90;
  const near=zz=>gates.some(g=>Math.abs(zz-g.z)<40);
  while(z>-L+60){
    const prog=-z/L,surv=S.mode==='survive'?Math.max(.4,1-prog*.75):1;
    z-=(32*dd*surv)*(.6+rng()*.9);if(near(z))continue;
    const r=rng(),lx=lanes[(rng()*3)|0];let e=null;
    if(r<.34){const g=mkCar(rng,'car');e={m:g,k:'car',sp:14+rng()*22}}
    else if(r<.46){const g=mkCar(rng,'truck');e={m:g,k:'truck',sp:10+rng()*10}}
    else if(r<.66){const g=new THREE.Group();g.add(box(.7,.1,.7,0,0,.05,0,M('#222')));const c=new THREE.Mesh(new THREE.ConeGeometry(.3,.85,8),M('#ff6a1a'));c.position.y=.55;g.add(c);g.add(box(.36,.1,.36,0,0,.55,0,M('#fff')));g.userData={hw:.4,hl:.4,hh:.9};e={m:g,k:'cone'}}
    else if(r<.76){const g=new THREE.Group(),bm=new THREE.MeshLambertMaterial({map:barTex});g.add(box(2.1,.55,.1,0,0,.85,0,bm));g.add(box(2.1,.2,.1,0,0,.45,0,bm));for(const sx of[-1,1]){const lg=box(.1,.95,.1,0,sx*.95,.45,0,M('#e8e8e8'));lg.rotation.x=.18;g.add(lg)}g.userData={hw:1.1,hl:.3,hh:1.3};e={m:g,k:'barrier'}}
    else if(r<.9){const w=mkRamp();w.userData={hw:1.7,hl:2.1,hh:0};e={m:w,k:'ramp'}}
    else if(rt.t==='nat'||rt.t==='area'){const g=new THREE.Group();g.add(box(.5,1.0,.35,0,0,.9,0,M('#2a3140')));g.add(box(.6,.7,.4,0,0,1.55,0,M(rng()<.5?'#e8423a':'#2b9be8')));g.add(new THREE.Mesh(new THREE.SphereGeometry(.22,8,6),M('#f0c8a0'))).position.y=2.1;g.userData={hw:.4,hl:.4,hh:2};e={m:g,k:'ped',dir:rng()<.5?1:-1}}
    if(!e)continue;
    const u=e.m.userData;e.hw=u.hw;e.hl=u.hl;e.hh=u.hh;e.x=e.k==='cone'?lx+(rng()-.5)*.8:(e.k==='ped'?(rng()<.5?-7:7):lx);e.z=z;e.hit=false;e.passed=false;e.fly=0;
    if(e.k==='car'&&rt.d>=4&&rng()<.4)e.merge=e.x<0?-1:1;
    e.m.position.set(e.x,0,e.z);sc.add(e.m);ents.push(e)}
  return {sc,rt,pal,tm,night,th,L,gates,ents,n,sts,barCol,dust:dl,plan:timePlan(rt,L,n)}
}

function start(S){
  stop();
  const host=el();
  if(!renderer){renderer=new THREE.WebGLRenderer({antialias:true});host.appendChild(renderer.domElement)}
  else if(renderer.domElement.parentNode!==host)host.appendChild(renderer.domElement);
  const w=build(S),total=S.mode==='survive'?3:(S.veh==='car'?4:3);
  scene=w.sc;camera=new THREE.PerspectiveCamera(65,1,.1,900);
  const pl=mkPlayer(S.veh,S.skin);scene.add(pl);
  const t0=S.mode==='challenge'?w.plan.t0:0;
  st={w,S,pl,pos:0,x:0,v:0,y:0,vy:0,air:0,flip:0,flipping:false,lives:total,max:total,score:0,t:0,time:t0,limit:0,lb:0,inv:0,combo:0,cd:3.6,cdn:4,cp:1,ready:false,over:false,paused:false,flash:0,pen:0,steer:0,anim:0,shake:0,hit:0};
  resize();
  $i('over').classList.remove('on');$i('bAgain').textContent='もう一度';
  $i('touch').classList.toggle('on',matchMedia('(pointer:coarse)').matches||'ontouchstart' in window);
  $i('hTimeLbl').textContent=LABEL[w.rt.id]||'残り時間';
  const seg=$i('hSeg');seg.innerHTML='<i></i>'.repeat(12);
  $i('light').classList.add('on');
  hud(st);last=performance.now();raf=requestAnimationFrame(loop)
}
function stop(){cancelAnimationFrame(raf);raf=0;
  if(scene){scene.traverse(o=>{if(o.geometry)o.geometry.dispose()});}
  st=null;scene=null;
}
function resize(){if(!renderer)return;const h=el();const w=h.clientWidth||innerWidth,hh=h.clientHeight||innerHeight;renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setSize(w,hh);if(camera){camera.aspect=w/hh;camera.updateProjectionMatrix()}}
addEventListener('resize',resize);

function say(id,html,cls){const e=$i(id);e.innerHTML=html;e.classList.remove('show');void e.offsetWidth;e.classList.add('show')}
function loop(now){const s=st;if(!s)return;const dt=Math.min(.05,(now-last)/1000);last=now;
  if(!s.paused&&!s.over)update(s,dt);
  frame(s,dt);hud(s);renderer.render(scene,camera);raf=requestAnimationFrame(loop)}

function update(s,dt){
  const w=s.w;s.anim+=dt;
  if(s.cd>0){s.cd-=dt;const n=Math.ceil(s.cd);
    if(n<s.cdn&&n>=0){s.cdn=n;const li=$i('light').children;if(n>0){$i('count').textContent=n;for(let i=0;i<3;i++)li[i].className=i<n?'r':'';beep(520,.12)}else{$i('count').textContent='GO!';for(let i=0;i<3;i++)li[i].className='g';beep(900,.3);setTimeout(()=>{$i('light').classList.remove('on');$i('count').textContent=''},800)}}
    s.v=0;return}
  const dir=clamp(KEY.r-KEY.l+touchDir,-1,1),prog=clamp(s.pos/w.L,0,1);
  const lbm=s.lb>0?1.35:1,cruise=(CRU0+prog*CRU1)*lbm,target=KEY.b?34:cruise;
  s.v+=(target-s.v)*Math.min(1,dt*(target>s.v?.9:2.2));
  s.steer=lerp(s.steer,dir,Math.min(1,dt*9));
  s.x+=dir*dt*15*Math.min(1,.4+s.v/60);
  if(Math.abs(s.x)>7.3){s.v-=dt*60*Math.sign(s.v);s.x=clamp(s.x,-8.2,8.2)}
  s.v=Math.max(0,s.v);s.pos+=s.v*dt;s.t+=dt;
  // jump / flip
  if(KEY.j){KEY.j=0;activate(s)}
  if(s.y>0||s.vy>0){s.vy-=24*dt;s.y+=s.vy*dt;s.air+=dt;if(s.flipping)s.flip+=dt*Math.PI*5;
    if(s.y<=0){s.y=0;s.vy=0;const a=s.air;s.air=0;
      if(s.flipping){s.flipping=false;s.flip=0;const nm=['キックフリップ!','前転!','コークスクリュー!'][s.trick|0],b=Math.round((900+a*1400)*[1,1.5,1.7][s.trick|0]);s.score+=b;s.limit=Math.min(12,s.limit+3);say('msg',`${nm}<b>+${b.toLocaleString()}</b>`);beep(1200,.15,'triangle')}
      else if(a>.5){const b=Math.round(a*600);s.score+=b;say('msg2','着地 決まったで! +'+b)}}}
  const pz=-s.pos;
  for(const e of w.ents){
    if(e.dead)continue;
    if(e.k==='car'||e.k==='truck'){if(!e.hit||e.fly===0)e.z-=e.sp*dt;if(e.merge&&e.z>pz-150){const tx=e.merge<0?-3.6:3.6;e.x+=Math.sign(tx-e.x)*Math.min(Math.abs(tx-e.x),3*dt)}}
    if(e.k==='ped'){e.x+=e.dir*2.2*dt;if(Math.abs(e.x)>8.5)e.dir*=-1;e.m.rotation.y=e.dir>0?-1.57:1.57}
    if(e.fly>0){e.fly-=dt;e.z-=30*dt;e.x+=e.vx*dt;e.m.rotation.x+=dt*8;e.m.position.y+=dt*(e.fly>.5?14:-14);if(e.fly<=0)e.dead=true}
    e.m.position.x=e.x;e.m.position.z=e.z;if(e.fly<=0)e.m.position.y=0;
    const dz=Math.abs(e.z-pz),dx=Math.abs(e.x-s.x);
    if(e.k==='ramp'){if(!e.used&&dz<2.2&&dx<1.9&&s.y<=.01){e.used=true;s.vy=14;s.air=0;s.flipping=true;s.flip=0;s.trick=(Math.random()*3)|0}continue}
    if(!e.hit&&e.fly===0&&dz<e.hl+.9&&dx<e.hw+.45&&s.y<e.hh){
      if(s.lb>0){e.hit=true;e.fly=.9;e.vx=(e.x>=s.x?1:-1)*14;s.score+=300;say('msg','ぶっとばし!<b>+300</b>');beep(200,.15,'sawtooth')}
      else if(s.inv<=0)crash(s,e)}
    if(!e.passed&&e.z>pz+3){e.passed=true;
      if(!e.hit&&dx<(e.hw+2.4)&&dx<7&&e.k!=='ped'||(e.k==='ped'&&!e.hit&&dx<2.4)){
        s.combo++;const b=Math.round(250*(1+Math.min(9,s.combo)*.55)+s.v*2);s.score+=b;if(s.lb<=0)s.limit=Math.min(12,s.limit+1);
        say('msg',`NEAR MISS<b>+${b.toLocaleString()}</b>`);beep(1500,.06,'triangle')}}
  }
  if(s.lb>0){s.lb-=dt;if(s.lb<=0){s.lb=0;s.limit=0;s.ready=false;$i('fx').classList.remove('on');say('big','LIMIT BREAK 終了')}}
  else if(s.limit>=12&&!s.ready){s.ready=true;s.limit=12;say('big','LIMIT 満タン');beep(700,.3,'sawtooth')}
  s.inv=Math.max(0,s.inv-dt);s.flash=Math.max(0,s.flash-dt);s.shake=Math.max(0,s.shake-dt);
  s.score+=s.v*dt*(s.lb>0?2:1)*.8;
  // stations / goal
  const m=w.rt.id==='yamanote'||true;
  while(s.cp<w.n&&-pz>=-w.gates[s.cp].z){const g=w.gates[s.cp];
    if(s.cp<w.n-1){const add=s.S.mode==='challenge'?w.plan.add(s.cp):0;s.time+=add;s.score+=500;if(add){s.pen=1.4;s.penTxt='+'+add.toFixed(1)+'秒'}say('big',g.s.n);beep(880,.1,'triangle');s.cp++}
    else{finish(s,true);return}}
  if(s.S.mode==='survive'&&s.pos>=w.L-60){finish(s,true);return}
  if(s.S.mode==='challenge'){s.time-=dt;if(s.time<=0){s.time=0;finish(s,false)}}
}
function activate(s){if(!s||!s.ready||s.lb>0||s.over||s.cd>0)return;s.ready=false;s.lb=6;s.limit=12;$i('fx').classList.add('on');say('big','LIMIT BREAK');say('msg2','何でもぶっ飛ばせ!');beep(900,.3,'sawtooth')}
function crash(s,e){
  e.hit=true;s.combo=0;s.v*=.35;s.inv=1.6;s.flash=.4;s.shake=.35;s.limit=Math.max(0,s.limit-3);
  if(e.k==='cone'){e.fly=.8;e.vx=(e.x>=s.x?1:-1)*6}
  beep(120,.25,'sawtooth');
  if(s.S.mode==='challenge'){s.time=Math.max(0,s.time-.5);s.pen=1.2;s.penTxt='-0.5秒'}
  if(s.S.mode!=='time'){s.lives--;say('hb','💔');
    if(s.lives<=0){finish(s,false);return}
    say('msg',`激突! 残りライフ <b>${s.lives}</b>`)}
  else say('msg','激突!')}
function finish(s,goal){
  s.over=true;$i('fx').classList.remove('on');
  const m=s.S.mode,w=s.w;let bonus=0;
  if(goal&&m==='challenge'){bonus=Math.round(s.time*100);s.score+=bonus}
  const fin=Math.round(s.score),best=Math.max(store.get('bestScore',0),fin);store.set('bestScore',best);$i('tBest').textContent=best.toLocaleString();
  let ttl=goal?'GOAL!':(m==='challenge'&&s.time<=0?'TIME UP':'GAME OVER');if(m==='survive'&&goal)ttl='完走!';
  const res=[['コース',w.rt.n],['モード',MODES.find(x=>x.id===m).n],['走行距離',Math.round(s.pos).toLocaleString()+' m'],['タイム',s.t.toFixed(2)+' 秒']];
  if(bonus)res.push(['残り時間ボーナス','+'+bonus.toLocaleString()]);
  res.push(['スコア',fin.toLocaleString()]);
  if(m==='time'&&goal){const k='bt_'+w.rt.id,b=store.get(k,1e9);if(s.t<b){store.set(k,s.t);ttl='NEW RECORD!'}res.push(['ベストタイム',Math.min(b,s.t).toFixed(2)+' 秒'])}
  $i('oTitle').textContent=ttl;$i('oRes').innerHTML=res.map(r=>`<span>${r[0]}</span><span>${r[1]}</span>`).join('');$i('over').classList.add('on')}
function pause(){const s=st;if(!s||s.over)return;s.paused=!s.paused;const o=$i('over');
  if(s.paused){$i('oTitle').textContent='一時停止';$i('oRes').innerHTML='';$i('bAgain').textContent='再開';o.classList.add('on')}else{o.classList.remove('on');$i('bAgain').textContent='もう一度';last=performance.now()}}
$i('bPause').onclick=pause;$i('bSnd').onclick=()=>{snd=!snd;$i('bSnd').style.opacity=snd?1:.4};$i('bBgm').onclick=()=>{$i('bBgm').style.opacity=$i('bBgm').style.opacity==='0.4'?1:.4};
$i('bAgain').onclick=()=>{if(st&&st.paused){pause();return}$i('over').classList.remove('on');start(S)};
$i('bMapBack').onclick=()=>{show('sMap');drawMap()};

function frame(s,dt){
  const pl=s.pl,u=pl.userData,w=s.w,v=s.S.cam;
  pl.position.set(s.x,s.y,-s.pos);
  u.body.rotation.z=-s.steer*.22;if(!(s.flipping&&(s.trick|0)===2))u.body.rotation.y=-s.steer*.12;
  if(u.legs.length&&s.S.veh!=='car'){const p=Math.sin(s.anim*Math.min(14,s.v/5))*.5*(s.y>0?0:1);u.legs[0].rotation.x=p;u.legs[1].rotation.x=-p*.4}
  if(s.S.veh!=='car'){const f=s.flipping?s.flip:0,t=s.trick|0;u.board.rotation.z=t===0?f:0;u.body.rotation.x=t===1?-f:0;if(t===2)u.body.rotation.y=f;}
  pl.visible=!(v==='fp')&&!(s.inv>0&&Math.floor(s.t*20)%2);
  const cfg=v==='high'?[6.5,10.5,-18]:v==='fp'?[2.0,.2,-30]:[3.0,7.2,-13];
  const sh=s.shake>0?(Math.random()-.5)*.35:0;
  camera.position.set(s.x*.65+sh,cfg[0]+s.y*.5,-s.pos+cfg[1]);
  camera.lookAt(s.x*.8,1.4+s.y*.2,-s.pos+cfg[2]);
  camera.fov=65+clamp(s.v/110,0,1)*16+(s.lb>0?8:0);camera.updateProjectionMatrix();
}
function hud(s){
  const w=s.w,idx=clamp(s.cp,0,w.n-1),g=w.gates[idx];
  $i('hScore').textContent=Math.round(s.score).toLocaleString();
  $i('hSpd').textContent=Math.round(s.v*3.6*DISP);
  $i('gArc').setAttribute('stroke-dasharray',clamp(s.v/(96*1.35),0,1)*100+' 100');
  $i('hLife').textContent=s.S.mode==='time'?'':'♥'.repeat(Math.max(0,s.lives))+'♡'.repeat(Math.max(0,s.max-s.lives));
  $i('hLife').style.display=s.S.mode==='time'?'none':'block';
  const segs=$i('hSeg').children;for(let i=0;i<12;i++)segs[i].className=i<s.limit?'on':'';
  $i('hLim').textContent=s.lb>0?'LIMIT BREAK':'LIMIT';
  $i('hCombo').textContent=s.combo>1?'COMBO ×'+s.combo:'';
  $i('bLB').hidden=!s.ready;$i('hReady').hidden=!s.ready;
  if(s.S.mode==='survive'){$i('hNext').textContent=w.rt.n;$i('hJy').textContent='SURV';$i('hDist').textContent=Math.round(s.pos)+'m';$i('hProg').style.width=clamp(s.pos/w.L,0,1)*100+'%'}
  else{const prevZ=idx>0?-w.gates[idx-1].z:0,span=Math.max(1,-g.z-prevZ);
    $i('hNext').textContent=g.s.n;$i('hJy').textContent=g.s.c||('GATE'+(idx+1));$i('hDist').textContent=Math.max(0,Math.round(-g.z-s.pos))+'m';$i('hProg').style.width=clamp((s.pos-prevZ)/span,0,1)*100+'%'}
  $i('hTime').textContent=s.S.mode==='challenge'?s.time.toFixed(1):s.S.mode==='time'?s.t.toFixed(2):Math.round(s.pos/10)/10+'';
  $i('hTimeLbl').textContent=s.S.mode==='challenge'?(LABEL[w.rt.id]||'残り時間'):s.S.mode==='time'?'タイム':'距離';
  if(s.pen>0){s.pen-=.016;$i('hPen').textContent=s.penTxt||'';$i('hPen').style.color=(s.penTxt||'')[0]==='+'?'#31d6a0':'#ff4d4d'}else $i('hPen').textContent='';
}
addEventListener('keydown',e=>{if(!st)return;const k=e.key;
  if(k==='ArrowLeft'||k==='a'||k==='A')KEY.l=1;else if(k==='ArrowRight'||k==='d'||k==='D')KEY.r=1;
  else if(k===' '||k==='Enter'||k==='l'||k==='L'){KEY.j=1;e.preventDefault()}
  else if(k==='ArrowDown'||k==='s'||k==='S')KEY.b=1;else if(k==='p'||k==='P'||k==='Escape')pause()});
addEventListener('keyup',e=>{const k=e.key;if(k==='ArrowLeft'||k==='a'||k==='A')KEY.l=0;else if(k==='ArrowRight'||k==='d'||k==='D')KEY.r=0;else if(k==='ArrowDown'||k==='s'||k==='S')KEY.b=0});
document.querySelectorAll('#touch button').forEach(b=>{b.addEventListener('pointerdown',e=>{touchDir=+b.dataset.d;e.preventDefault()});['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>{touchDir=0}))});
$i('bLB').addEventListener('pointerdown',e=>{KEY.j=1;e.preventDefault()});
return {start,stop,pause,resize};
})();
