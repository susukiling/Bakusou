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

/* 実在するIC・JCTを全て出す(スマートIC・SA/PAは除く)。[名前, 起点からのkm] ─ 出典: 各路線のIC/JCT一覧(Wikipedia等) */
const HWX={
 tomei:{s:'東京→小牧',p:[['東京IC',0],['東名川崎IC',7.6],['横浜青葉IC',13.3],['横浜町田IC',19.7],['海老名JCT',33.9],['厚木IC',35.0],['伊勢原JCT',40.0],['秦野中井IC',50.1],['大井松田IC',57.9],['御殿場IC',83.7],['御殿場JCT',88.3],['裾野IC',93.8],['沼津IC',103.3],['富士IC',121.5],['清水JCT',146.4],['清水IC',147.8],['静岡IC',161.8],['焼津IC',173.6],['吉田IC',185.6],['相良牧之原IC',197.0],['菊川IC',201.8],['掛川IC',207.8],['袋井IC',219.4],['磐田IC',223.3],['浜松IC',230.0],['浜松西IC',240.5],['三ヶ日IC',251.1],['三ヶ日JCT',255.8],['豊川IC',269.0],['音羽蒲郡IC',280.2],['岡崎IC',293.4],['豊田JCT',304.1],['豊田IC',310.8],['東名三好IC',315.8],['日進JCT',322.3],['名古屋IC',325.5],['春日井IC',337.7],['小牧JCT',339.9],['小牧IC',346.8]]},
 meishin:{s:'小牧→西宮',p:[['小牧IC',0],['一宮IC',8.3],['一宮JCT',12.7],['岐阜羽島IC',21.4],['大垣IC',28.2],['養老JCT',31.8],['関ヶ原IC',42.7],['米原JCT',58.8],['彦根IC',66.7],['八日市IC',87.9],['竜王IC',100.5],['栗東湖南IC',110.3],['栗東IC',111.5],['草津JCT',117.7],['瀬田東JCT',120.8],['瀬田西IC',122.3],['大津IC',127.9],['京都東IC',131.2],['京都南IC',140.9],['大山崎JCT',149.0],['高槻JCT',157.3],['茨木IC',165.0],['吹田JCT',167.8],['豊中IC',177.8],['尼崎IC',182.7],['西宮IC',189.5]]},
 tohoku:{s:'川口→青森',p:[['川口JCT',0],['浦和IC',3.2],['岩槻IC',10.5],['久喜IC',25.5],['加須IC',33.4],['羽生IC',39.4],['館林IC',46.0],['佐野藤岡IC',55.0],['栃木IC',72.7],['栃木都賀JCT',75.4],['鹿沼IC',91.5],['宇都宮IC',103.0],['矢板IC',120.2],['西那須野塩原IC',139.1],['那須IC',152.5],['白河IC',169.7],['矢吹IC',186.3],['須賀川IC',198.2],['郡山南IC',207.7],['郡山IC',216.4],['郡山JCT',220.2],['本宮IC',223.1],['二本松IC',236.0],['福島西IC',254.9],['福島飯坂IC',264.9],['国見IC',276.0],['白石IC',299.5],['村田IC',311.8],['村田JCT',314.5],['仙台南IC',326.8],['仙台宮城IC',332.4],['泉IC',346.1],['富谷JCT',349.3],['大和IC',357.1],['古川IC',375.1],['築館IC',391.2],['若柳金成IC',403.0],['一関IC',420.3],['平泉前沢IC',431.8],['水沢IC',449.3],['北上金ケ崎IC',458.0],['北上JCT',461.8],['北上江釣子IC',464.7],['花巻南IC',474.5],['花巻JCT',478.6],['花巻IC',481.3],['紫波IC',494.1],['盛岡南IC',505.1],['盛岡IC',512.1],['滝沢IC',522.1],['西根IC',532.2],['松尾八幡平IC',541.7],['安代JCT',563.3],['安代IC',564.6],['鹿角八幡平IC',590.7],['十和田IC',602.6],['小坂IC',610.7],['碇ヶ関IC',630.7],['大鰐弘前IC',643.7],['黒石IC',653.6],['浪岡IC',667.6],['青森IC',679.5]]},
 kanetsu:{s:'練馬→長岡',p:[['練馬IC',0],['大泉JCT',0.8],['所沢IC',9.4],['川越IC',21.2],['鶴ヶ島JCT',27.8],['鶴ヶ島IC',29.6],['東松山IC',39.4],['嵐山小川IC',47.4],['花園IC',56.1],['本庄児玉IC',69.6],['藤岡JCT',78.6],['高崎JCT',84.6],['高崎IC',87.0],['前橋IC',92.1],['渋川伊香保IC',103.4],['赤城IC',111.2],['昭和IC',120.6],['沼田IC',125.8],['月夜野IC',131.1],['水上IC',141.0],['湯沢IC',167.0],['塩沢石打IC',175.5],['六日町IC',186.9],['魚沼IC',204.4],['堀之内IC',212.1],['越後川口IC',220.9],['小千谷IC',228.8],['長岡IC',244.5],['長岡JCT',246.1]]},
 sanyo:{s:'神戸→山口',p:[['神戸JCT',0],['神戸北IC',2.6],['三木JCT',15.4],['三木東IC',18.0],['三木小野IC',27.7],['加古川北IC',41.2],['山陽姫路東IC',49.8],['山陽姫路西IC',62.7],['龍野IC',69.3],['龍野西IC',73.7],['播磨JCT',74.7],['赤穂IC',88.3],['備前IC',98.8],['和気IC',109.1],['山陽IC',123.2],['岡山IC',136.8],['岡山JCT',143.9],['倉敷JCT',150.3],['倉敷IC',152.4],['玉島IC',161.9],['鴨方IC',171.9],['笠岡IC',180.1],['福山東IC',191.7],['福山西IC',208.6],['尾道JCT',213.1],['尾道IC',214.5],['三原久井IC',227.2],['本郷IC',238.5],['河内IC',246.7],['高屋JCT',252.8],['西条IC',257.8],['志和IC',268.8],['広島東IC',279.2],['広島IC',285.6],['広島JCT',293.1],['五日市IC',296.1],['廿日市JCT',310.4],['大野IC',315.1],['大竹IC',323.4],['岩国IC',332.6],['玖珂IC',346.7],['熊毛IC',358.9],['徳山東IC',370.7],['徳山西IC',388.7],['防府東IC',401.3],['防府西IC',404.6],['山口南IC',413.2],['山口JCT',419.3]]},
 kyushu:{s:'北九州→鹿児島',p:[['北九州JCT',0],['小倉南IC',3.7],['八幡IC',14.9],['鞍手IC',19.6],['若宮IC',28.7],['古賀IC',41.2],['福岡IC',51.8],['太宰府IC',63.6],['筑紫野IC',70.4],['鳥栖JCT',79.6],['久留米IC',88.9],['広川IC',96.7],['八女IC',101.9],['みやま柳川IC',109.1],['南関IC',118.5],['菊水IC',130.1],['植木IC',140.8],['熊本IC',154.7],['益城熊本空港IC',159.9],['嘉島JCT',164.2],['御船IC',166.6],['松橋IC',178.6],['八代IC',197.0],['八代JCT',198.1],['人吉IC',235.5],['えびのIC',257.8],['えびのJCT',259.9],['栗野IC',273.5],['横川IC',279.5],['溝辺鹿児島空港IC',293.3],['加治木JCT',301.0],['姶良IC',309.7],['薩摩吉田IC',318.3],['鹿児島北IC',325.4],['鹿児島IC',329.7]]},
 doo:{s:'大沼公園→札幌',p:[['大沼公園IC',0],['森IC',9.7],['落部IC',29.9],['八雲IC',45.9],['国縫IC',67.6],['長万部IC',78.7],['黒松内JCT',94.3],['豊浦IC',112.5],['虻田洞爺湖IC',125.7],['伊達IC',139.3],['室蘭IC',152.2],['登別室蘭IC',161.8],['登別東IC',173.2],['白老IC',191.8],['苫小牧西IC',207.6],['苫小牧東IC',225.2],['新千歳空港IC',233.1],['千歳IC',237.1],['千歳恵庭JCT',242.1],['恵庭IC',246.1],['北広島IC',260.0],['札幌南IC',264.5],['大谷地IC',268.3],['北郷IC',270.3],['札幌JCT',271.9],['札幌IC',272.4]]},
 shutoko:{s:'羽田→石川町',p:[['羽田',0],['大師',0.7],['浜川崎',4.5],['浅田',6.4],['汐入',7.4],['生麦JCT',9.1],['生麦',9.7],['守屋町',10.6],['子安',10.8],['東神奈川',12.6],['金港JCT',14.0],['横浜駅東口',14.1],['みなとみらい',15.3],['横浜公園',19.0],['石川町JCT',19.7]]},
 hanshin:{s:'阿波座→月見山',p:[['阿波座JCT',0],['西長堀',0.3],['中之島西',0.9],['海老江JCT',3.2],['姫島',4.2],['大和田',5.1],['尼崎東',7.0],['尼崎西',10.7],['武庫川',11.9],['西宮JCT',14.5],['西宮',16.8],['芦屋',17.4],['深江',21.4],['魚崎',22.7],['摩耶JCT',27.3],['生田川',29.6],['京橋JCT',30.8],['柳原JCT',34.2],['湊川JCT',36.1],['若宮',38.1],['月見山',39.4]]}
};
R.forEach(r=>{const h=HWX[r.id];if(!h)return;const p=h.p;r.st=p.map(q=>J(q[0],'',q[0],''));r.gk=p.map(q=>q[1]-p[0][1]);r.km=Math.round(r.gk[r.gk.length-1]);r.s=h.s});
/* 山手線(東京→渋谷)の駅間の実距離 */
R.forEach(r=>{if(r.id==='yamanote'){r.gk=[0,.8,1.9,3.1,4.6,5.9,6.8,8.8,9.7,10.9,12.4,14.0];r.km=14}});
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
const S={mode:'challenge',route:null,veh:'kick',skin:'std',cam:'std',lay:'rand',time:'auto',tab:'all'};
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
[['#oSkin','skin'],['#oVeh','veh'],['#oCam','cam'],['#oLay','lay'],['#oTime','time']].forEach(([sel,k])=>$$(sel+' button').forEach(b=>b.onclick=()=>{$$(sel+' button').forEach(x=>x.classList.remove('on'));b.classList.add('on');S[k]=b.dataset.v}));
$('#bGo').onclick=()=>{show('sGame');Game.start(S)};
$('#bAgain').onclick=()=>{$('#over').classList.remove('on');Game.start(S)};
$('#bMapBack').onclick=()=>{show('sMap');drawMap()};
