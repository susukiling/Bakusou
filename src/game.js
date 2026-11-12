/* ---------- 3D game (Three.js) ---------- */
const Game=(()=>{
const $i=id=>document.getElementById(id), clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), lerp=(a,b,t)=>a+(b-a)*t;
const rngMk=seed=>{let s=seed>>>0||1;return()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296}};
const hashS=str=>{let h=2166136261;for(const c of str){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
const PAL={
 morning:{sky:['#7aa6d8','#f6dfbd'],fog:'#ecdcc3',sun:1.0,amb:.75,night:0},
 day:{sky:['#3f86d8','#d3e8f8'],fog:'#d3e8f8',sun:1.15,amb:.8,night:0},
 night:{sky:['#040815','#26345f'],fog:'#101834',sun:.25,amb:.45,night:1}
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
function mkPlayer(vehicle){
  const g=new THREE.Group(),body=new THREE.Group();g.add(body);
  if(vehicle==='car'){const c=M('#ffcc00');body.add(box(2,.75,4.2,0,0,.75,0,c));body.add(box(1.7,.7,2.2,0,0,1.45,.2,c));body.add(box(1.55,.5,2.25,0,0,1.5,.2,M('#1c2733')));
    body.add(box(2,.3,4.2,0,0,.25,0,M('#15181d')));g.userData={body,legs:[],board:body,rider:body};return g}
  const board=new THREE.Group();body.add(board);
  board.add(box(.55,.1,1.7,0,0,.32,0,M('#2c3239')));board.add(box(.5,.02,1.6,0,0,.38,0,M('#00c2a8')));
  board.add(box(.12,.3,.12,0,0,.18,.9,M('#14171b')));board.add(box(.1,1.0,.1,0,0,.85,-.78,M('#3a4048')));board.add(box(.9,.08,.1,0,0,1.38,-.78,M('#14171b')));
  const rider=new THREE.Group();body.add(rider);
  const suit=M('#1f2a44'),legs=[];
  for(const sx of[-1,1]){const l=new THREE.Group();l.position.set(sx*.2,.45,.1);l.add(box(.22,.85,.24,0,0,.42,0,suit));rider.add(l);legs.push(l)}
  rider.add(box(.65,.8,.38,0,0,1.55,0,suit));rider.add(box(.5,.6,.25,0,0,1.55,.3,M('#2a2f38')));
  rider.add(box(.2,.2,.2,0,0,1.97,0,M('#f0c8a0')));
  const head=new THREE.Mesh(new THREE.SphereGeometry(.3,10,8),M('#e8e8ea'));head.position.set(0,2.15,0);rider.add(head);
  g.userData={body,legs,board,rider};return g}

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
  const road=new THREE.Mesh(new THREE.PlaneGeometry(16,len),M(night?'#2b3038':'#666a72'));road.rotation.x=-Math.PI/2;road.position.set(0,0,mid);sc.add(road);
  const gcol=th==='sea'||th==='bay'?(night?'#0a2548':'#2a86c0'):th==='mtn'||th==='plain'?(night?'#0b2418':'#5a9a52'):(night?'#14171d':'#9a9ea4');
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(900,len),M(gcol));ground.rotation.x=-Math.PI/2;ground.position.set(0,th==='sea'||th==='bay'?-3:-.15,mid);sc.add(ground);
  for(const s of[-1,1]){
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
  if(th==='city'||th==='plain'){
    for(const s of[-1,1]){let z=Z0+40;while(z>-L-200){const w=th==='city'?10+rng()*16:7+rng()*6,d=th==='city'?14+rng()*16:7+rng()*5,h=th==='city'?(18+Math.pow(rng(),1.6)*90):(5+rng()*6);
      bl.push({x:s*(16.5+d/2+rng()*2),z:z-w/2,w:d,h,d:w,c:new THREE.Color().setHSL(.08+rng()*.1,.08+rng()*.12,.55+rng()*.25)});z-=w+.5+rng()*3}}
  }
  if(bl.length){const bi=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),bmat,bl.length),o=new THREE.Object3D();
    bl.forEach((b,i)=>{o.position.set(b.x,b.h/2,b.z);o.scale.set(b.w,b.h,b.d);o.updateMatrix();bi.setMatrixAt(i,o.matrix);bi.setColorAt(i,b.c)});sc.add(bi)}
  if(th==='city'){ // ground-floor shops
    const sm=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),M(night?'#6a5a40':'#d9b98a',{emissive:night?'#5a4020':'#000000'}),bl.length),o=new THREE.Object3D();
    bl.forEach((b,i)=>{const s=Math.sign(b.x);o.position.set(s*15.6,2.1,b.z);o.scale.set(2.2,4.2,b.d*.96);o.updateMatrix();sm.setMatrixAt(i,o.matrix)});sc.add(sm)}
  for(const s of[-1,1]){ // trees, lamps
    let z=Z0;const step=th==='mtn'?7:15;while(z>-L-200){if(th!=='sea'&&th!=='bay'||rng()<.2)tl.push({x:s*(9.6+rng()*1.2),z:z-rng()*4,sz:.8+rng()*.5});
      if(th==='mtn'||th==='plain')for(let k=0;k<3;k++)tl.push({x:s*(15+rng()*40),z:z-rng()*10,sz:1.2+rng()*1.6});
      z-=step}
    z=Z0;while(z>-L-200){lampL.push({x:s*8.3,z,s});z-=32}
  }
  if(tl.length){const tr=new THREE.InstancedMesh(new THREE.CylinderGeometry(.15,.2,2.2,6),M('#5b3a22'),tl.length),cr=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.6,0),M(night?'#1d4a2a':'#3f8a3c'),tl.length),o=new THREE.Object3D();
    tl.forEach((t,i)=>{o.position.set(t.x,1.1*t.sz,t.z);o.scale.set(t.sz,t.sz,t.sz);o.rotation.set(0,i,0);o.updateMatrix();tr.setMatrixAt(i,o.matrix);o.position.set(t.x,3.4*t.sz,t.z);o.scale.set(t.sz*1.15,t.sz,t.sz*1.15);o.updateMatrix();cr.setMatrixAt(i,o.matrix)});sc.add(tr,cr)}
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
    else if(r<.76){const g=new THREE.Group();g.add(box(2.6,1,.3,0,0,.9,0,new THREE.MeshLambertMaterial({map:barTex})));g.add(box(.15,.9,.15,0,-1.1,.45,0,M('#333')));g.add(box(.15,.9,.15,0,1.1,.45,0,M('#333')));g.userData={hw:1.4,hl:.3,hh:1.4};e={m:g,k:'barrier'}}
    else if(r<.9){const g=box(3,.4,4,0,0,.2,0,M('#ffd400'));g.rotation.x=.12;const w=new THREE.Group();w.add(g);w.userData={hw:1.5,hl:2,hh:0};e={m:w,k:'ramp'}}
    else if(rt.t==='nat'||rt.t==='area'){const g=new THREE.Group();g.add(box(.5,1.0,.35,0,0,.9,0,M('#2a3140')));g.add(box(.6,.7,.4,0,0,1.55,0,M(rng()<.5?'#e8423a':'#2b9be8')));g.add(new THREE.Mesh(new THREE.SphereGeometry(.22,8,6),M('#f0c8a0'))).position.y=2.1;g.userData={hw:.4,hl:.4,hh:2};e={m:g,k:'ped',dir:rng()<.5?1:-1}}
    if(!e)continue;
    const u=e.m.userData;e.hw=u.hw;e.hl=u.hl;e.hh=u.hh;e.x=e.k==='cone'?lx+(rng()-.5)*.8:(e.k==='ped'?(rng()<.5?-7:7):lx);e.z=z;e.hit=false;e.passed=false;e.fly=0;
    if(e.k==='car'&&rt.d>=4&&rng()<.4)e.merge=e.x<0?-1:1;
    e.m.position.set(e.x,0,e.z);sc.add(e.m);ents.push(e)}
  return {sc,rt,pal,tm,night,th,L,gates,ents,n,sts,barCol,dust:dl}
}

function start(S){
  stop();
  const host=el();
  if(!renderer){renderer=new THREE.WebGLRenderer({antialias:true});host.appendChild(renderer.domElement)}
  else if(renderer.domElement.parentNode!==host)host.appendChild(renderer.domElement);
  const w=build(S),total=S.mode==='survive'?3:(S.veh==='car'?4:3);
  scene=w.sc;camera=new THREE.PerspectiveCamera(65,1,.1,900);
  const pl=mkPlayer(S.veh);scene.add(pl);
  const t0=S.mode==='challenge'?Math.round(w.L/92)+(S.mode==='challenge'?4:0):0;
  st={w,S,pl,pos:0,x:0,v:0,y:0,vy:0,air:0,flip:0,flipping:false,lives:total,max:total,score:0,t:0,time:t0,limit:0,lb:0,inv:0,combo:0,cd:3.6,cdn:4,cp:1,over:false,paused:false,flash:0,pen:0,steer:0,anim:0,shake:0,hit:0};
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
  const lbm=s.lb>0?1.35:1,cruise=(52+prog*28)*lbm,target=KEY.b?30:cruise;
  s.v+=(target-s.v)*Math.min(1,dt*(target>s.v?.9:2.2));
  s.steer=lerp(s.steer,dir,Math.min(1,dt*9));
  s.x+=dir*dt*13*Math.min(1,.4+s.v/60);
  if(Math.abs(s.x)>7.3){s.v-=dt*60*Math.sign(s.v);s.x=clamp(s.x,-8.2,8.2)}
  s.v=Math.max(0,s.v);s.pos+=s.v*dt;s.t+=dt;
  // jump / flip
  if(KEY.j){KEY.j=0;if(s.y<=.01&&!s.fl){s.vy=9.5;s.air=0;s.fl=0}else if(s.y>.5&&!s.flipping){s.flipping=true;s.flip=0}}
  if(s.y>0||s.vy>0){s.vy-=24*dt;s.y+=s.vy*dt;s.air+=dt;if(s.flipping)s.flip+=dt*Math.PI*5;
    if(s.y<=0){s.y=0;s.vy=0;const a=s.air;s.air=0;
      if(s.flipping){s.flipping=false;s.flip=0;const b=Math.round(900+a*1400);s.score+=b;s.limit=Math.min(12,s.limit+3);say('msg',`キックフリップ!<b>+${b.toLocaleString()}</b>`);beep(1200,.15,'triangle')}
      else if(a>.5){const b=Math.round(a*600);s.score+=b;say('msg2','着地 決まったで! +'+b)}}}
  const pz=-s.pos;
  for(const e of w.ents){
    if(e.dead)continue;
    if(e.k==='car'||e.k==='truck'){if(!e.hit||e.fly===0)e.z-=e.sp*dt;if(e.merge&&e.z>pz-150){const tx=e.merge<0?-3.6:3.6;e.x+=Math.sign(tx-e.x)*Math.min(Math.abs(tx-e.x),3*dt)}}
    if(e.k==='ped'){e.x+=e.dir*2.2*dt;if(Math.abs(e.x)>8.5)e.dir*=-1;e.m.rotation.y=e.dir>0?-1.57:1.57}
    if(e.fly>0){e.fly-=dt;e.z-=30*dt;e.x+=e.vx*dt;e.m.rotation.x+=dt*8;e.m.position.y+=dt*(e.fly>.5?14:-14);if(e.fly<=0)e.dead=true}
    e.m.position.x=e.x;e.m.position.z=e.z;if(e.fly<=0)e.m.position.y=0;
    const dz=Math.abs(e.z-pz),dx=Math.abs(e.x-s.x);
    if(e.k==='ramp'){if(!e.used&&dz<2.2&&dx<1.9&&s.y<=.01){e.used=true;s.vy=14;s.air=0}continue}
    if(!e.hit&&e.fly===0&&dz<e.hl+.9&&dx<e.hw+.45&&s.y<e.hh){
      if(s.lb>0){e.hit=true;e.fly=.9;e.vx=(e.x>=s.x?1:-1)*14;s.score+=300;say('msg','ぶっとばし!<b>+300</b>');beep(200,.15,'sawtooth')}
      else if(s.inv<=0)crash(s,e)}
    if(!e.passed&&e.z>pz+3){e.passed=true;
      if(!e.hit&&dx<(e.hw+2.4)&&dx<7&&e.k!=='ped'||(e.k==='ped'&&!e.hit&&dx<2.4)){
        s.combo++;const b=Math.round(250*(1+Math.min(9,s.combo)*.55)+s.v*2);s.score+=b;if(s.lb<=0)s.limit=Math.min(12,s.limit+1);
        say('msg',`NEAR MISS<b>+${b.toLocaleString()}</b>`);beep(1500,.06,'triangle')}}
  }
  if(s.lb>0){s.lb-=dt;if(s.lb<=0){s.lb=0;s.limit=0;$i('fx').classList.remove('on')}}
  else if(s.limit>=12){s.lb=6;s.limit=12;$i('fx').classList.add('on');say('big','LIMIT BREAK');say('msg2','LIMIT 満タン!');beep(700,.3,'sawtooth')}
  s.inv=Math.max(0,s.inv-dt);s.flash=Math.max(0,s.flash-dt);s.shake=Math.max(0,s.shake-dt);
  s.score+=s.v*dt*(s.lb>0?2:1)*.8;
  // stations / goal
  const m=w.rt.id==='yamanote'||true;
  while(s.cp<w.n&&-pz>=-w.gates[s.cp].z){const g=w.gates[s.cp];
    if(s.cp<w.n-1){const add=s.S.mode==='challenge'?3:0;s.time+=add;s.score+=500;say('big',g.s.n);beep(880,.1,'triangle');s.cp++}
    else{finish(s,true);return}}
  if(s.S.mode==='survive'&&s.pos>=w.L-60){finish(s,true);return}
  if(s.S.mode==='challenge'){s.time-=dt;if(s.time<=0){s.time=0;finish(s,false)}}
}
function crash(s,e){
  e.hit=true;s.combo=0;s.v*=.35;s.inv=1.6;s.flash=.4;s.shake=.35;s.limit=Math.max(0,s.limit-3);
  if(e.k==='cone'){e.fly=.8;e.vx=(e.x>=s.x?1:-1)*6}
  beep(120,.25,'sawtooth');
  if(s.S.mode==='challenge'){s.time=Math.max(0,s.time-.5);s.pen=1.2}
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
  u.body.rotation.z=-s.steer*.22;u.body.rotation.y=-s.steer*.12;
  if(u.legs.length){const p=Math.sin(s.anim*Math.min(14,s.v/5))*.5*(s.y>0?0:1);u.legs[0].rotation.x=p;u.legs[1].rotation.x=-p*.4}
  if(u.board&&s.S.veh!=='car')u.board.rotation.z=s.flipping?s.flip:0;
  pl.visible=!(v==='fp')&&!(s.inv>0&&Math.floor(s.t*20)%2);
  const cfg=v==='high'?[6.5,10.5,-18]:v==='fp'?[2.0,.2,-30]:[3.1,6.6,-14];
  const sh=s.shake>0?(Math.random()-.5)*.35:0;
  camera.position.set(s.x*.65+sh,cfg[0]+s.y*.5,-s.pos+cfg[1]);
  camera.lookAt(s.x*.8,1.4+s.y*.2,-s.pos+cfg[2]);
  camera.fov=65+clamp(s.v/110,0,1)*16+(s.lb>0?8:0);camera.updateProjectionMatrix();
}
function hud(s){
  const w=s.w,idx=clamp(s.cp,0,w.n-1),g=w.gates[idx];
  $i('hScore').textContent=Math.round(s.score).toLocaleString();
  $i('hSpd').textContent=Math.round(s.v*3.6);
  $i('gArc').setAttribute('stroke-dasharray',clamp(s.v/(110*1.35),0,1)*100+' 100');
  $i('hLife').textContent=s.S.mode==='time'?'':'♥'.repeat(Math.max(0,s.lives))+'♡'.repeat(Math.max(0,s.max-s.lives));
  $i('hLife').style.display=s.S.mode==='time'?'none':'block';
  const segs=$i('hSeg').children;for(let i=0;i<12;i++)segs[i].className=i<s.limit?'on':'';
  $i('hLim').textContent=s.lb>0?'LIMIT BREAK':'LIMIT';
  $i('hCombo').textContent=s.combo>1?'COMBO ×'+s.combo:'';
  if(s.S.mode==='survive'){$i('hNext').textContent=w.rt.n;$i('hJy').textContent='SURV';$i('hDist').textContent=Math.round(s.pos)+'m';$i('hProg').style.width=clamp(s.pos/w.L,0,1)*100+'%'}
  else{const prevZ=idx>0?-w.gates[idx-1].z:0,span=Math.max(1,-g.z-prevZ);
    $i('hNext').textContent=g.s.n;$i('hJy').textContent=g.s.c||('GATE'+(idx+1));$i('hDist').textContent=Math.max(0,Math.round(-g.z-s.pos))+'m';$i('hProg').style.width=clamp((s.pos-prevZ)/span,0,1)*100+'%'}
  $i('hTime').textContent=s.S.mode==='challenge'?s.time.toFixed(1):s.S.mode==='time'?s.t.toFixed(2):Math.round(s.pos/10)/10+'';
  $i('hTimeLbl').textContent=s.S.mode==='challenge'?(LABEL[w.rt.id]||'残り時間'):s.S.mode==='time'?'タイム':'距離';
  if(s.pen>0){s.pen-=.016;$i('hPen').textContent='-0.5秒'}else $i('hPen').textContent='';
}
addEventListener('keydown',e=>{if(!st)return;const k=e.key;
  if(k==='ArrowLeft'||k==='a'||k==='A')KEY.l=1;else if(k==='ArrowRight'||k==='d'||k==='D')KEY.r=1;
  else if(k===' '||k==='ArrowUp'||k==='w'||k==='W'){KEY.j=1;e.preventDefault()}
  else if(k==='ArrowDown'||k==='s'||k==='S')KEY.b=1;else if(k==='p'||k==='P'||k==='Escape')pause()});
addEventListener('keyup',e=>{const k=e.key;if(k==='ArrowLeft'||k==='a'||k==='A')KEY.l=0;else if(k==='ArrowRight'||k==='d'||k==='D')KEY.r=0;else if(k==='ArrowDown'||k==='s'||k==='S')KEY.b=0});
document.querySelectorAll('#touch button').forEach(b=>{b.addEventListener('pointerdown',e=>{touchDir=+b.dataset.d;e.preventDefault()});['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>{touchDir=0}))});
$i('bJump').addEventListener('pointerdown',e=>{KEY.j=1;e.preventDefault()});
return {start,stop,pause,resize};
})();
