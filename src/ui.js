/* ---------- data ---------- */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const proj=(lo,la)=>[(lo-129.4)*19+8,(45.7-la)*30+8];
const C={ // lon,lat,label
 sapporo:[141.35,43.06,'札幌'],hakodate:[140.73,41.77,'函館'],aomori:[140.74,40.82,'青森'],sendai:[140.87,38.27,'仙台'],
 niigata:[139.02,37.9,'新潟'],takasaki:[139.0,36.32,'高崎'],tokyo:[139.69,35.69,'東京'],yokohama:[139.64,35.45,'横浜'],
 kawasaki:[139.72,35.53,'川崎'],kisarazu:[139.92,35.38,'木更津'],atsugi:[139.36,35.44,'厚木'],gotenba:[138.93,35.31,'御殿場'],
 numazu:[138.86,35.1,'沼津'],atami:[139.07,35.1,'熱海'],odawara:[139.15,35.25,'小田原'],hakone:[139.02,35.23,'箱根'],
 shizuoka:[138.38,34.98,'静岡'],nagoya:[136.9,35.18,'名古屋'],kanazawa:[136.65,36.56,'金沢'],kyoto:[135.77,35.01,'京都'],
 osaka:[135.5,34.69,'大阪'],kobe:[135.2,34.69,'神戸'],okayama:[133.92,34.66,'岡山'],onomichi:[133.2,34.41,'尾道'],
 imabari:[133.0,34.07,'今治'],hiroshima:[132.46,34.39,'広島'],shimonoseki:[130.94,33.96,'下関'],tottori:[134.24,35.5,'鳥取'],
 matsue:[133.05,35.47,'松江'],takamatsu:[134.04,34.34,'高松'],kitakyu:[130.88,33.88,'北九州'],fukuoka:[130.4,33.59,'福岡'],
 shibuya:[139.70,35.66,'渋谷'],odaiba:[139.78,35.62,'お台場'],tennoji:[135.51,34.65,'天王寺'],senshu:[135.3,34.4,'泉州'],kumamoto:[130.74,32.8,'熊本'],kagoshima:[130.56,31.6,'鹿児島']
};
const SHOWN=['sapporo','hakodate','aomori','sendai','niigata','tokyo','yokohama','shizuoka','nagoya','kanazawa','kyoto','osaka','okayama','hiroshima','takamatsu','fukuoka','kumamoto','kagoshima'];
const TYPE={hw:'高速道路',toll:'有料道路',nat:'国道',area:'ストーリー'};
/* tm: morning/day/night. hz: road hazards. diff 1-4. km is the real road length used only for display scaling. */
const R=[
 {id:'tomei',n:'東名高速道路',t:'hw',v:['tokyo','yokohama','shizuoka','nagoya'],km:346,d:2,tm:'day',s:'東京→名古屋',x:'日本の大動脈。3車線の広い道で、速い車が次々に迫る。'},
 {id:'meishin',n:'名神高速道路',t:'hw',v:['nagoya','kyoto','osaka'],km:190,d:2,tm:'morning',s:'名古屋→大阪',x:'京都の山あいを抜けて大阪へ。朝の渋滞前に走り切れ。'},
 {id:'tohoku',n:'東北自動車道',t:'hw',v:['tokyo','sendai','aomori'],km:679,d:3,tm:'day',s:'東京→青森',x:'日本一長い高速。長丁場でトラックが増えていく。'},
 {id:'kanetsu',n:'関越自動車道',t:'hw',v:['tokyo','takasaki','niigata'],km:300,d:3,tm:'night',s:'東京→新潟',x:'夜の山岳区間。カーブとトラックの連続。'},
 {id:'sanyo',n:'山陽自動車道',t:'hw',v:['kobe','okayama','hiroshima','shimonoseki'],km:500,d:2,tm:'day',s:'神戸→下関',x:'瀬戸内を西へ。まっすぐで速度が乗る。'},
 {id:'kyushu',n:'九州自動車道',t:'hw',v:['kitakyu','fukuoka','kumamoto','kagoshima'],km:346,d:3,tm:'morning',s:'北九州→鹿児島',x:'九州を縦に貫く。桜島を目指して南へ。'},
 {id:'doo',n:'道央自動車道',t:'hw',v:['hakodate','sapporo'],km:300,d:1,tm:'day',s:'函館→札幌',x:'北海道の広い道。はじめての人向け。'},
 {id:'shutoko',n:'首都高速 横羽線',t:'hw',v:['tokyo','kawasaki','yokohama'],km:30,d:4,tm:'night',s:'東京→横浜',x:'夜の首都高。急カーブと合流車の超人向け。'},
 {id:'hanshin',n:'阪神高速 神戸線',t:'hw',v:['osaka','kobe'],km:40,d:4,tm:'night',s:'大阪→神戸',x:'真夜中の阪神高速。左右から車が合流してくる。'},
 {id:'aqua',n:'東京湾アクアライン',t:'toll',v:['kawasaki','kisarazu'],km:15,d:1,tm:'day',s:'川崎→木更津',x:'海の上を走る有料道路。短くてはじめてでも安心。'},
 {id:'hakoneTP',n:'箱根ターンパイク',t:'toll',v:['odawara','hakone'],km:16,d:3,tm:'morning',s:'小田原→箱根',x:'ヘアピンの連続する山岳有料道路。'},
 {id:'izuSky',n:'伊豆スカイライン',t:'toll',v:['atami','numazu'],km:41,d:2,tm:'day',s:'熱海→伊豆',x:'尾根づたいの絶景ロード。アップダウンが多い。'},
 {id:'seto',n:'瀬戸大橋',t:'toll',v:['okayama','takamatsu'],km:13,d:2,tm:'day',s:'岡山→高松',x:'本州と四国をつなぐ海上の橋。横風に注意。'},
 {id:'shimanami',n:'しまなみ海道',t:'toll',v:['onomichi','imabari'],km:60,d:2,tm:'morning',s:'尾道→今治',x:'島々を橋でつなぐ道。朝の光の中を走る。'},
 {id:'r1',n:'国道1号',t:'nat',v:['tokyo','yokohama','shizuoka','nagoya','kyoto','osaka'],km:500,d:2,tm:'day',s:'東京→大阪',x:'日本橋から梅田まで。信号と横断歩道の連続。'},
 {id:'r2',n:'国道2号',t:'nat',v:['osaka','kobe','okayama','hiroshima','shimonoseki'],km:690,d:2,tm:'morning',s:'大阪→下関',x:'大阪から山陽を西へ。港町と工場地帯を抜ける。'},
 {id:'r3',n:'国道3号',t:'nat',v:['kitakyu','fukuoka','kumamoto','kagoshima'],km:340,d:3,tm:'night',s:'北九州→鹿児島',x:'九州の夜道。トラックが多い。'},
 {id:'r4',n:'国道4号',t:'nat',v:['tokyo','sendai','aomori'],km:740,d:3,tm:'day',s:'東京→青森',x:'奥州街道。長い直線と、ときどき急な信号。'},
 {id:'r5',n:'国道5号',t:'nat',v:['hakodate','sapporo'],km:270,d:1,tm:'morning',s:'函館→札幌',x:'北の大地を走る。はじめての人向け。'},
 {id:'r9',n:'国道9号',t:'nat',v:['kyoto','tottori','matsue','shimonoseki'],km:690,d:3,tm:'day',s:'京都→下関',x:'日本海沿いを西へ。カーブが多い。'},
 {id:'r17',n:'国道17号',t:'nat',v:['tokyo','takasaki','niigata'],km:300,d:2,tm:'morning',s:'東京→新潟',x:'中山道から三国峠を越えて日本海へ。'},
 {id:'r246',n:'国道246号',t:'nat',v:['tokyo','atsugi','gotenba','numazu'],km:120,d:3,tm:'night',s:'東京→沼津',x:'渋谷から西へ。夜の通勤ラッシュを突き抜けろ。'}
];

const J=(n,k,r,c)=>({n,k,r,c});
R.push(
 {id:'odaiba',n:'お台場ホリデー',t:'area',a:'東京編',v:['tokyo','odaiba'],km:12,d:1,tm:'day',th:'bay',s:'東京駅→お台場',x:'休日の湾岸、レインボーブリッジを渡ってお台場へ。はじめての人向け。',
  st:[J('東京','とうきょう','Tokyo','JY01'),J('新橋','しんばし','Shimbashi','JY29'),J('芝浦','しばうら','Shibaura',''),J('レインボーブリッジ','','Rainbow Bridge',''),J('お台場','おだいば','Odaiba','')]},
 {id:'yamanote',n:'山手モーニング',t:'area',a:'東京編',v:['tokyo','shibuya'],km:20,d:2,tm:'morning',th:'city',s:'東京駅→渋谷のオフィス',x:'山手線の駅をたどって、朝の東京を渋谷まで爆走出社。',
  st:[J('東京','とうきょう','Tokyo','JY01'),J('有楽町','ゆうらくちょう','Yurakucho','JY30'),J('新橋','しんばし','Shimbashi','JY29'),J('浜松町','はままつちょう','Hamamatsucho','JY28'),J('田町','たまち','Tamachi','JY27'),J('高輪ゲートウェイ','たかなわげーとうぇい','Takanawa Gateway','JY26'),J('品川','しながわ','Shinagawa','JY25'),J('大崎','おおさき','Osaki','JY24'),J('五反田','ごたんだ','Gotanda','JY23'),J('目黒','めぐろ','Meguro','JY22'),J('恵比寿','えびす','Ebisu','JY21'),J('渋谷','しぶや','Shibuya','JY20')]},
 {id:'shutoNight',n:'首都高ナイト',t:'area',a:'東京編',v:['tokyo','shibuya'],km:25,d:3,tm:'night',th:'city',s:'夜の首都高',x:'ネオンの夜を首都高で駆け抜ける。カーブとトラックに注意。',
  st:[J('霞が関','かすみがせき','Kasumigaseki',''),J('谷町JCT','たにまちじゃんくしょん','Tanimachi JCT',''),J('三宅坂JCT','みやけざかじゃんくしょん','Miyakezaka JCT',''),J('渋谷','しぶや','Shibuya','')]},
 {id:'shutoMid',n:'首都高ミッドナイト',t:'area',a:'東京編',v:['tokyo','yokohama'],km:30,d:4,tm:'night',th:'city',s:'真夜中の首都高',x:'車線をまたぐトラックと合流車の連続。超人向け。',
  st:[J('箱崎JCT','はこざきじゃんくしょん','Hakozaki JCT',''),J('江戸橋JCT','えどばしじゃんくしょん','Edobashi JCT',''),J('芝浦JCT','しばうらじゃんくしょん','Shibaura JCT',''),J('大黒JCT','だいこくじゃんくしょん','Daikoku JCT','')]},
 {id:'senshu',n:'泉州ホリデー',t:'area',a:'大阪編',v:['senshu','osaka'],km:20,d:1,tm:'morning',th:'sea',s:'泉州の港町',x:'休日の港町、だんじり祭りを抜けて11時の飛行機の見送りへ! はじめての人向け。',
  st:[J('朝市','あさいち','Asaichi',''),J('港町','みなとまち','Minatomachi',''),J('だんじり','だんじり','Danjiri',''),J('空港','くうこう','Airport','')]},
 {id:'midosuji',n:'御堂筋モーニング',t:'area',a:'大阪編',v:['osaka','tennoji'],km:10,d:2,tm:'morning',th:'city',s:'大阪駅→天王寺のオフィス',x:'梅田・道頓堀・通天閣を朝の光の中、爆走出社や! はじめての人にもおすすめ。',
  st:[J('梅田','うめだ','Umeda',''),J('淀屋橋','よどやばし','Yodoyabashi',''),J('心斎橋','しんさいばし','Shinsaibashi',''),J('道頓堀','どうとんぼり','Dotonbori',''),J('通天閣','つうてんかく','Tsutenkaku',''),J('天王寺','てんのうじ','Tennoji','')]},
 {id:'minami',n:'ミナミナイト',t:'area',a:'大阪編',v:['osaka','tennoji'],km:9,d:3,tm:'night',th:'city',s:'大阪駅→新世界の串カツ屋',x:'ネオンの道頓堀を抜けて、21時の予約に間に合うんか!? 上級者向け。',
  st:[J('梅田','うめだ','Umeda',''),J('心斎橋','しんさいばし','Shinsaibashi',''),J('道頓堀','どうとんぼり','Dotonbori',''),J('新世界','しんせかい','Shinsekai','')]},
 {id:'hanshinMid',n:'阪神ミッドナイト',t:'area',a:'大阪編',v:['osaka','kobe'],km:30,d:4,tm:'night',th:'city',s:'真夜中の阪神高速',x:'真夜中の阪神高速を飛ばして帰るで。左右から合流してくる車、車線をまたぐ電飾トラック。0時までに帰れるんか!? 超人向け。',
  st:[J('梅田','うめだ','Umeda',''),J('湊町','みなとまち','Minatomachi',''),J('湾岸','わんがん','Wangan',''),J('神戸','こうべ','Kobe','')]}
);
R.sort((a,b)=>(b.t==='area')-(a.t==='area'));
R.forEach(r=>{if(!r.th)r.th=['aqua','seto','shimanami'].includes(r.id)?'sea':['hakoneTP','izuSky','kanetsu','meishin','r9','kyushu'].includes(r.id)?'mtn':['shutoko','hanshin','r1','r246','tomei','r17','r2'].includes(r.id)?'city':'plain';
  if(!r.st)r.st=r.v.map(k=>J(C[k][2],'',C[k][2],''));});
R.forEach(r=>{r.pts=r.v.map(k=>proj(C[k][0],C[k][1]))});
const MODES=[
 {id:'challenge',en:'CHALLENGE',n:'チャレンジ',x:'制限時間内にゴールをめざす。チェックポイントを通過すると残り時間が延びる。スコアとライフあり。'},
 {id:'time',en:'TIME ATTACK',n:'タイムアタック',x:'制限時間なし。ゴールまでのタイムを競う。自己ベストを更新しよう。',note:'ベストタイムは端末に保存されます'},
 {id:'survive',en:'SURVIVAL',n:'サバイバル',x:'ライフ3つで、ゴールのない道をどこまで行けるか。進むほど車と障害物が増えていく。'}
];
const LAND=[ // simplified outlines (lon,lat)
 [[141.4,41.4],[141.9,40.0],[141.5,38.3],[140.9,37.0],[140.8,35.7],[139.9,35.0],[139.8,35.3],[139.2,35.2],[138.8,34.7],[137.0,34.6],[136.8,34.3],[136.0,33.5],[135.2,33.5],[135.1,34.3],[134.5,34.6],[133.0,34.3],[132.0,33.9],[131.0,33.9],[130.9,34.4],[132.0,35.5],[133.5,35.5],[135.2,35.7],[136.0,36.2],[136.8,37.3],[137.3,37.2],[138.5,37.4],[139.4,38.1],[139.9,39.6],[140.0,40.6],[140.4,41.0],[141.1,41.2]],
 [[140.0,41.4],[141.0,41.8],[141.3,43.2],[141.6,45.4],[142.2,45.5],[144.0,44.0],[145.5,43.4],[144.4,42.9],[143.3,42.0],[141.8,42.5],[140.5,42.4],[140.0,41.9]],
 [[130.9,33.9],[131.9,33.6],[131.8,32.6],[131.4,31.4],[130.7,31.0],[130.2,31.4],[130.2,32.5],[129.8,33.2],[130.3,33.6]],
 [[132.5,33.9],[134.0,34.3],[134.7,34.0],[134.2,33.3],[133.0,32.8],[132.5,33.2]]
];
const store={get(k,d){try{const v=localStorage.getItem('bk_'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem('bk_'+k,JSON.stringify(v))}catch(e){}}};

/* ---------- ui state ---------- */
const S={mode:'challenge',route:null,veh:'kick',cam:'std',lay:'rand',time:'auto',tab:'all'};
function show(id){$$('.screen').forEach(s=>s.hidden=s.id!==id);if(id!=='sGame')Game.stop()}
$$('[data-back]').forEach(b=>b.onclick=()=>show(b.dataset.back));
$('#bStart').onclick=()=>show('sMode');
$('#bHow').onclick=()=>{$('#how').hidden=!$('#how').hidden};
$('#tBest').textContent=(store.get('bestScore',0)).toLocaleString();
$('#modeGrid').innerHTML=MODES.map(m=>`<button class="card" data-m="${m.id}"><small style="letter-spacing:.2em;font-weight:900;color:var(--lamp)">${m.en}</small><h3>${m.n}</h3><small>${m.x}</small>${m.note?`<small>※${m.note}</small>`:''}</button>`).join('');
$$('#modeGrid .card').forEach(c=>c.onclick=()=>{S.mode=c.dataset.m;show('sMap');drawMap()});

/* ---------- map ---------- */
function drawMap(){
  const poly=LAND.map(p=>`<polygon class="land" points="${p.map(q=>proj(q[0],q[1]).map(n=>n.toFixed(1)).join(',')).join(' ')}"/>`).join('');
  const rts=R.map(r=>`<polyline class="rt ${r.t}" data-id="${r.id}" points="${r.pts.map(p=>p.map(n=>n.toFixed(1)).join(',')).join(' ')}"/>`).join('');
  const cities=SHOWN.map(k=>{const p=proj(C[k][0],C[k][1]);return `<g class="city"><circle cx="${p[0]}" cy="${p[1]}" r="2.2"/><text x="${p[0]+4}" y="${p[1]+3}">${C[k][2]}</text></g>`}).join('');
  $('#map').innerHTML=poly+rts+cities;
  $$('.rt').forEach(e=>e.onclick=()=>pick(e.dataset.id));
  renderList();paintSel();
}
function renderList(){
  const L=R.filter(r=>S.tab==='all'||r.t===S.tab);
  $('#rlist').innerHTML=L.map(r=>`<button class="rc" data-id="${r.id}"><span class="badge ${r.t}">${TYPE[r.t]}</span><div><b>${r.n}</b><span>${r.s}</span></div><span class="stars">${'★'.repeat(r.d)}${'☆'.repeat(4-r.d)}</span></button>`).join('');
  $$('.rc').forEach(e=>e.onclick=()=>pick(e.dataset.id));
  $$('.tab').forEach(t=>t.classList.toggle('on',t.dataset.k===S.tab));
}
$$('.tab').forEach(t=>t.onclick=()=>{S.tab=t.dataset.k;renderList();paintSel()});
function pick(id){S.route=R.find(r=>r.id===id);paintSel();
  const r=S.route,tm={morning:'朝',day:'昼',night:'夜'}[r.tm];
  $('#rdetail').innerHTML=`<b style="font-size:16px">${r.n}</b>（${TYPE[r.t]}）<br>${r.s}　実距離 約${r.km}km　時間帯 ${tm}　難易度 <span class="stars">${'★'.repeat(r.d)}${'☆'.repeat(4-r.d)}</span><br>${r.x}<br><small style="color:var(--mute)">ゲーム内のコース長は遊びやすいよう短縮しています。</small>`;
  $('#bRoute').disabled=false;
}
function paintSel(){
  $$('.rt').forEach(e=>{const r=R.find(x=>x.id===e.dataset.id);e.classList.toggle('on',!!S.route&&S.route.id===r.id);e.classList.toggle('dim',(S.tab!=='all'&&r.t!==S.tab)||(!!S.route&&S.route.id!==r.id&&false))});
  $$('.rc').forEach(e=>e.classList.toggle('on',!!S.route&&S.route.id===e.dataset.id));
  const on=$('.rt.on');if(on)on.parentNode.appendChild(on);
}
$('#bRoute').onclick=()=>{const r=S.route;$('#optRoute').innerHTML=`<span class="badge ${r.t}">${TYPE[r.t]}</span> <b>${r.n}</b>　${r.s}`;show('sOpt')};
[['#oVeh','veh'],['#oCam','cam'],['#oLay','lay'],['#oTime','time']].forEach(([sel,k])=>$$(sel+' button').forEach(b=>b.onclick=()=>{$$(sel+' button').forEach(x=>x.classList.remove('on'));b.classList.add('on');S[k]=b.dataset.v}));
$('#bGo').onclick=()=>{show('sGame');Game.start(S)};
$('#bAgain').onclick=()=>{$('#over').classList.remove('on');Game.start(S)};
$('#bMapBack').onclick=()=>{show('sMap');drawMap()};
