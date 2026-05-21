import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════ CONSTANTS ═══════════ */
const W=760,H=420,CX=W/2,CY=H/2,MAX_TOWERS=30;
const TT=[
  {id:0,cat:0,name:"涙の芽",cost:12,dmg:3,range:60,cd:700,mhp:30,col:"#6ee7b7"},
  {id:1,cat:0,name:"荊棘の蔓",cost:55,dmg:12,range:85,cd:1100,mhp:50,col:"#34d399"},
  {id:2,cat:0,name:"古代樹",cost:240,dmg:35,range:125,cd:2000,mhp:100,col:"#059669"},
  {id:3,cat:0,name:"天涙の花",cost:750,dmg:70,range:155,cd:2400,mhp:80,col:"#7dd3fc"},
  {id:4,cat:1,name:"涙増幅器",cost:90,dmg:0,range:0,cd:0,mhp:35,col:"#60a5fa",eff:"cursor"},
  {id:5,cat:1,name:"希望の灯",cost:140,dmg:0,range:80,cd:0,mhp:40,col:"#c084fc",eff:"dmgUp"},
  {id:6,cat:1,name:"再生の苔",cost:110,dmg:0,range:70,cd:1800,mhp:55,col:"#4ade80",eff:"heal"},
  {id:7,cat:2,name:"壁の根",cost:35,dmg:0,range:25,cd:0,mhp:220,col:"#a16207",eff:"wall"},
  {id:8,cat:2,name:"棘バリケード",cost:75,dmg:8,range:35,cd:400,mhp:130,col:"#d97706",eff:"barricade"},
];

const SD={
  cur_dmg_f:{l:"カーソル威力",f:v=>"+"+v.toFixed(1),c:"#60a5fa",d:"カーソルの涙で敵に与えるダメージが増加"},
  cur_dmg_p:{l:"カーソル威力%",f:v=>"+"+Math.round(v)+"%",c:"#60a5fa",d:"カーソルの涙ダメージを%で増加"},
  cur_range:{l:"カーソル範囲",f:v=>"+"+v.toFixed(0),c:"#93c5fd",d:"涙が降る範囲が広がる"},
  tw_dmg_p:{l:"タワー攻撃%",f:v=>"+"+Math.round(v)+"%",c:"#4ade80",d:"全タワーの攻撃力を%で増加"},
  tw_spd_p:{l:"タワー速度%",f:v=>"+"+Math.round(v)+"%",c:"#34d399",d:"全タワーの攻撃速度を%で増加"},
  tw_hp_p:{l:"タワーHP%",f:v=>"+"+Math.round(v)+"%",c:"#6ee7b7",d:"全タワーの最大HPを%で増加"},
  tear_p:{l:"涙獲得%",f:v=>"+"+Math.round(v)+"%",c:"#fbbf24",d:"敵を倒した時の涙獲得量が増加"},
  core_hp:{l:"種HP",f:v=>"+"+v.toFixed(0),c:"#f59e0b",d:"生命の種の最大HPが増加"},
  core_reg:{l:"種回復/秒",f:v=>"+"+v.toFixed(1),c:"#4ade80",d:"種のHPが毎秒自動回復"},
  all_dmg_p:{l:"全攻撃力%",f:v=>"+"+Math.round(v)+"%",c:"#f472b6",d:"カーソルとタワー両方の攻撃力を%で増加"},
  core_shield:{l:"種ダメ減%",f:v=>"+"+Math.round(v)+"%",c:"#a78bfa",d:"種が受けるダメージを%で軽減"},
  drop_up:{l:"ドロップ率%",f:v=>"+"+v.toFixed(1)+"%",c:"#fb923c",d:"敵を倒した時の装備ドロップ率が上昇"},
  mark_tower:{l:"マーク召喚%",f:v=>v.toFixed(0)+"%",c:"#e879f9",d:"カーソルで0.2秒照射した敵の近くにタワーを自動配置"},
  wave_wipe:{l:"天罰確率%",f:v=>v.toFixed(1)+"%",c:"#facc15",d:"敵を倒す度にこの確率で全敵に最大HPの20%ダメージ"},
  crit:{l:"会心率%",f:v=>v.toFixed(1)+"%",c:"#ef4444",d:"カーソル攻撃が5倍ダメージになる確率"},
  chain_kill:{l:"連鎖処刑%",f:v=>v.toFixed(1)+"%",c:"#f43f5e",d:"敵を倒した時に別のランダムな敵も即死する確率"},
  kill_buff:{l:"キルバフ%",f:v=>v.toFixed(1)+"%",c:"#22d3ee",d:"敵を倒した時にランダムな一時バフを得る確率"},
  aura_dmg:{l:"光カーソル攻撃%",f:v=>"+"+Math.round(v)+"%",c:"#fcd34d",d:"カーソル範囲内のタワーの攻撃力を%で増加"},
  aura_spd:{l:"光カーソル速度%",f:v=>"+"+Math.round(v)+"%",c:"#fde68a",d:"カーソル範囲内のタワーの攻撃速度を%で増加"},
  tw_splash:{l:"爆裂弾%",f:v=>v.toFixed(0)+"%",c:"#fb923c",d:"タワー攻撃時にこの確率で周囲の敵にも50%ダメージ"},
  tw_chain:{l:"雷鎖%",f:v=>v.toFixed(0)+"%",c:"#38bdf8",d:"タワー攻撃時にこの確率で近くの敵2体に40%ダメージ連鎖"},
  tw_heal:{l:"生命吸収%",f:v=>v.toFixed(0)+"%",c:"#86efac",d:"タワー攻撃時にこの確率で種のHPを少量回復"},
  tw_gold:{l:"涙搾取%",f:v=>v.toFixed(0)+"%",c:"#fbbf24",d:"タワー攻撃時にこの確率でボーナス涙を獲得"},
  tw_max:{l:"タワー上限",f:v=>"+"+v.toFixed(0),c:"#fde047",d:"設置できるタワーの最大数が増加"},
  tw_slow:{l:"鈍化%",f:v=>v.toFixed(0)+"%",c:"#67e8f9",d:"タワー攻撃時にこの確率で1.5秒の鈍化を付与"},
  cur_clone:{l:"分身%",f:v=>v.toFixed(1)+"%",c:"#a5b4fc",d:"敵を倒した時にこの確率でカーソル分身が4秒出現"},
  kb_fury:{l:"怒涛バフ%",f:v=>v.toFixed(1)+"%",c:"#ef4444",d:"敵を倒した時にこの確率で「怒涛」バフを獲得"},
  kb_haste:{l:"迅雷バフ%",f:v=>v.toFixed(1)+"%",c:"#22d3ee",d:"敵を倒した時にこの確率で「迅雷」バフを獲得"},
  kb_rain:{l:"豪雨バフ%",f:v=>v.toFixed(1)+"%",c:"#60a5fa",d:"敵を倒した時にこの確率で「豪雨」バフを獲得"},
  kb_shield:{l:"神護バフ%",f:v=>v.toFixed(1)+"%",c:"#fbbf24",d:"敵を倒した時にこの確率で「神護」バフを獲得"},
};
const sf=k=>SD[k]||{l:k,f:v=>""+v,c:"#888",d:""};
const rv=v=>Math.round(v*10)/10;

const RARS=[
  {id:0,name:"コモン",tag:"",col:"#9ca3af",bg:"rgba(156,163,175,0.06)",bd:"rgba(156,163,175,0.18)"},
  {id:1,name:"アンコモン",tag:"▪",col:"#4ade80",bg:"rgba(74,222,128,0.06)",bd:"rgba(74,222,128,0.22)"},
  {id:2,name:"レア",tag:"◆",col:"#60a5fa",bg:"rgba(96,165,250,0.07)",bd:"rgba(96,165,250,0.25)"},
  {id:3,name:"エピック",tag:"★",col:"#a78bfa",bg:"rgba(167,139,250,0.08)",bd:"rgba(167,139,250,0.3)"},
  {id:4,name:"レジェンド",tag:"♛",col:"#fbbf24",bg:"rgba(251,191,36,0.1)",bd:"rgba(251,191,36,0.35)"},
];
const STAT_V={
  cur_dmg_f:[3,6,12,22,40],cur_dmg_p:[5,10,20,35,60],cur_range:[3,6,10,16,25],
  tw_dmg_p:[5,10,18,30,50],tw_spd_p:[4,8,15,25,40],tw_hp_p:[5,12,22,35,55],
  tear_p:[8,15,25,40,70],core_hp:[10,25,50,90,150],core_reg:[0.5,1,2,3.5,6],
  all_dmg_p:[3,7,12,20,35],core_shield:[3,6,10,16,25],
  drop_up:[1,2,3.5,5,8],mark_tower:[5,10,18,30,50],wave_wipe:[0.1,0.2,0.4,0.7,1.2],
  crit:[2,4,8,14,22],chain_kill:[2,5,10,18,30],kill_buff:[0.5,1,1.8,2.5,3.5],
  aura_dmg:[10,20,35,55,80],aura_spd:[8,15,25,40,60],
  tw_splash:[3,6,12,20,35],tw_chain:[3,6,12,20,35],tw_heal:[3,6,10,16,25],tw_gold:[4,8,15,25,40],
  tw_max:[1,2,3,5,8],tw_slow:[4,8,15,25,40],cur_clone:[0.3,0.6,1,1.5,2.2],
  kb_fury:[0.3,0.6,1.2,2,3],kb_haste:[0.3,0.6,1.2,2,3],kb_rain:[0.3,0.6,1.2,2,3],kb_shield:[0.2,0.4,0.8,1.4,2],
};
const NORMAL_STATS=["cur_dmg_f","cur_dmg_p","cur_range","tw_dmg_p","tw_spd_p","tw_hp_p","tear_p","core_hp","core_reg","drop_up","crit","mark_tower","wave_wipe","chain_kill","kill_buff","aura_dmg","aura_spd","tw_splash","tw_chain","tw_heal","tw_gold","tw_max","tw_slow","cur_clone","kb_fury","kb_haste","kb_rain","kb_shield"];
const BOSS_STATS=["cur_dmg_f","all_dmg_p","core_shield","mark_tower","wave_wipe","chain_kill","kill_buff","crit","aura_dmg","tw_splash","tw_chain"];

let _u=1;
const mkS=(k,v)=>({k,v:rv(v)});
const rollRar=(w,boss,luck=0)=>{if(boss){const r=Math.random()*100;return r<30+luck*3?4:3;}const l=Math.min(w*0.4,20)+luck*2;const r=Math.random()*100;if(r<1+l*0.15)return 4;if(r<5+l*0.4)return 3;if(r<18+l*0.8)return 2;if(r<45+l)return 1;return 0;};
const rarCol=it=>RARS[it.rar||0].col;
const rarTag=it=>{const r=RARS[it.rar||0];return r.tag?r.tag+" ":"";};
const rarName=it=>RARS[it.rar||0].name;
const doDrop=(w,boss,luck=0)=>{const rar=rollRar(w,boss,luck);const pool=boss?BOSS_STATS:NORMAL_STATS;const key=pool[Math.floor(Math.random()*pool.length)];return{uid:_u++,stats:[mkS(key,STAT_V[key][rar])],rar,boss};};

const synthResult=(a,b)=>{const allKeys=new Set([...a.stats.map(s=>s.k),...b.stats.map(s=>s.k)]);if(allKeys.size>5)return null;const aM=new Map(a.stats.map(s=>[s.k,s.v])),bM=new Map(b.stats.map(s=>[s.k,s.v]));const stats=[];for(const k of allKeys){const av=aM.get(k)||0,bv=bM.get(k)||0;if(av>0&&bv>0)stats.push(mkS(k,Math.max(Math.max(av,bv),(av+bv)/2*1.5)));else stats.push(mkS(k,av+bv));}return{uid:_u++,stats,boss:a.boss||b.boss,rar:Math.max(a.rar||0,b.rar||0)};};
const eqT=items=>{const m={};items.forEach(it=>it.stats.forEach(s=>{m[s.k]=(m[s.k]||0)+s.v;}));return m;};

const RL=[
  {id:0,name:"涙の祝福",desc:"カーソル範囲+4",icon:"💧",bc:30,cm:1.55},
  {id:1,name:"涙の怒り",desc:"カーソル威力+0.5 / +3%",icon:"🗡",bc:40,cm:1.6},
  {id:2,name:"豊穣の恵み",desc:"涙獲得+10%",icon:"🌾",bc:50,cm:1.7},
  {id:3,name:"植物の活力",desc:"タワー攻撃+8%",icon:"🌿",bc:55,cm:1.65},
  {id:4,name:"生命の加護",desc:"種HP+20",icon:"❤️",bc:40,cm:1.5},
  {id:5,name:"根の強靭",desc:"タワーHP+10%",icon:"🏔",bc:50,cm:1.6},
  {id:6,name:"時の加速",desc:"タワー速度+6%",icon:"⏩",bc:65,cm:1.7},
  {id:7,name:"経済の知恵",desc:"コスト-4%",icon:"💰",bc:80,cm:1.9,mx:12},
  {id:8,name:"装備拡張",desc:"スロット+1",icon:"🎒",bc:120,cm:2.2,mx:5},
  {id:9,name:"運命の導き",desc:"レア度UP",icon:"🔮",bc:100,cm:2.0,mx:10},
];
const rlC=(r,lv)=>Math.floor(r.bc*Math.pow(r.cm,lv));
const wZ=w=>6+w*3,wHp=w=>Math.floor((8+w*5)*(1+(w-1)*0.25)),wSpd=w=>20+Math.min(w*0.6,30);
const waveExpectedHp=w=>{const n=wZ(w);const bh=wHp(w);const isB=w%10===0;const bossHp=isB?bh*5:0;const normalCount=isB?n-1:n;const tm=w<4?1.0:w<7?0.9:w<12?1.008:0.974;return Math.round(normalCount*bh*tm*1.05+bossHp);};
const computeCombatPower=(rlv,equipped)=>{const et=eqT(equipped);const cD=1+(rlv[1]||0)*0.5+(et.cur_dmg_f||0);const cDp=1+(rlv[1]||0)*0.03+(et.cur_dmg_p||0)/100+(et.all_dmg_p||0)/100;const cR=36+(rlv[0]||0)*4+(et.cur_range||0);const twD=1+(rlv[3]||0)*0.08+(et.tw_dmg_p||0)/100+(et.all_dmg_p||0)/100;const twS=1+(rlv[6]||0)*0.06+(et.tw_spd_p||0)/100;const coreMax=150+(rlv[4]||0)*20+(et.core_hp||0);const coreReg=et.core_reg||0;const coreShield=Math.min(80,et.core_shield||0);const tearP=1+(rlv[2]||0)*0.1+(et.tear_p||0)/100;const crit=(et.crit||0)/100;const waveWipe=(et.wave_wipe||0)/100;const chainKill=(et.chain_kill||0)/100;const cursorPot=cD*cDp*25*10*Math.sqrt(cR/36)*(1+crit*2);const towerPot=Math.max(0,twD*twS-1)*80;const survBudget=Math.max(0,coreMax-150)*0.5+coreReg*5+coreShield*2;const wipeBonus=waveWipe*30000;const chainMul=1+chainKill*0.3;const ecoMul=Math.pow(tearP,0.4);return Math.round((cursorPot+towerPot+200+survBudget+wipeBonus)*chainMul*ecoMul);};
const BUFF_TYPES=[{id:"fury",name:"怒涛",desc:"カーソル威力x3",dur:5,col:"#ef4444"},{id:"haste",name:"迅雷",desc:"タワー速度x2",dur:5,col:"#22d3ee"},{id:"rain",name:"豪雨",desc:"カーソル範囲x2",dur:5,col:"#60a5fa"},{id:"shield",name:"神護",desc:"種無敵",dur:3,col:"#fbbf24"}];
const ETYPES={
  basic: {hpMul:1.0,spdMul:1.0,szBase:10,armor:1.0,drop:1.0},
  swift: {hpMul:0.5,spdMul:1.6,szBase:8, armor:1.0,drop:0.7},
  armor: {hpMul:1.6,spdMul:0.7,szBase:12,armor:0.5,drop:1.5},
  healer:{hpMul:0.8,spdMul:0.9,szBase:11,armor:1.0,drop:1.3},
};
const TYPE_COL={
  basic:{r:55, g:110,b:45, dr:130,dg:-60,db:0},
  swift:{r:200,g:180,b:60, dr:30, dg:-40,db:30},
  armor:{r:90, g:95, b:115,dr:60, dg:-20,db:-20},
  healer:{r:200,g:120,b:185,dr:30, dg:20, db:30},
};
const rollType=(wn)=>{const r=Math.random();const tH=wn>=12?0.17:0;const tA=tH+(wn>=7?0.18:0);const tS=tA+(wn>=4?0.20:0);if(r<tH)return"healer";if(r<tA)return"armor";if(r<tS)return"swift";return"basic";};

const ASSET_PATHS={atlas:"/assets/tears-atlas.png",bg:"/assets/battlefield.png",walk:"/assets/enemy-walk.png"};
const SPR={
  enemies:{
    basic:[35,35,205,230],swift:[285,45,185,225],armor:[510,28,245,235],healer:[770,45,160,225],boss:[920,80,310,405],
  },
  towers:{
    0:[55,335,155,165],1:[280,330,170,175],2:[505,335,175,170],3:[45,545,175,170],4:[290,555,165,170],
    5:[515,555,175,170],6:[55,760,170,170],7:[290,760,170,180],8:[515,750,175,190],
  },
  droplet:[720,555,70,105],
  lightning:[705,705,225,220],
  heal:[1015,710,205,165],
  cloneRing:[215,930,285,285],
};
const okImg=img=>img&&img.complete&&img.naturalWidth>0;
const drawSprite=(ctx,img,r,x,y,w,h,alpha=1,rot=0)=>{
  if(!okImg(img)||!r)return false;
  ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,y);if(rot)ctx.rotate(rot);
  ctx.drawImage(img,r[0],r[1],r[2],r[3],-w/2,-h/2,w,h);
  ctx.restore();return true;
};
const WALK={cell:160,frames:8,rows:{basic:0,swift:1,armor:2}};
const drawWalk=(ctx,img,type,x,y,w,h,now,phase=0)=>{
  const row=WALK.rows[type];if(row===undefined||!okImg(img))return false;
  const f=(Math.floor(now/90+phase)%WALK.frames+WALK.frames)%WALK.frames;
  return drawSprite(ctx,img,[f*WALK.cell,row*WALK.cell,WALK.cell,WALK.cell],x,y,w,h);
};

const mkRun=(tgt,rlv,equipped,grave)=>{
  const et=eqT(equipped);const coreBase=150+(rlv[4]||0)*20+(et.core_hp||0);
  return{tears:0,wave:0,tgt,zombies:[],towers:[],parts:[],projs:[],drops:[],mx:-300,my:-300,
    cR:36+(rlv[0]||0)*4+(et.cur_range||0),cD:1+(rlv[1]||0)*0.5+(et.cur_dmg_f||0),cDp:1+(rlv[1]||0)*0.03+(et.cur_dmg_p||0)/100,
    kills:0,sQs:[],sel:null,placing:false,lt:0,coreHp:coreBase,coreMax:coreBase,coreReg:(et.core_reg||0),coreShield:Math.min(80,et.core_shield||0),
    go:false,vic:false,wPause:0,wActive:false,rlv,eq:equipped,et,
    twD:1+(rlv[3]||0)*8/100+(et.tw_dmg_p||0)/100+(et.all_dmg_p||0)/100,twS:1+(rlv[6]||0)*6/100+(et.tw_spd_p||0)/100,
    twH:1+(rlv[5]||0)*10/100+(et.tw_hp_p||0)/100,tearP:1+(rlv[2]||0)*10/100+(et.tear_p||0)/100,
    costP:1-Math.min(0.48,(rlv[7]||0)*0.04),dropUp:(et.drop_up||0)/100,markTower:(et.mark_tower||0)/100,
    waveWipe:(et.wave_wipe||0)/100,critCh:(et.crit||0)/100,chainKill:(et.chain_kill||0)/100,killBuff:(et.kill_buff||0)/100,
    auraDmg:(et.aura_dmg||0)/100,auraSpd:(et.aura_spd||0)/100,twSplash:(et.tw_splash||0)/100,twChain:(et.tw_chain||0)/100,
    twHeal:(et.tw_heal||0)/100,twGold:(et.tw_gold||0)/100,luck:(rlv[9]||0),maxTowers:Math.min(200,MAX_TOWERS+(et.tw_max||0)),
    twSlow:(et.tw_slow||0)/100,curClone:(et.cur_clone||0)/100,clones:[],
    kbFury:(et.kb_fury||0)/100,kbHaste:(et.kb_haste||0)/100,kbRain:(et.kb_rain||0)/100,kbShield:(et.kb_shield||0)/100,
    runDrops:[],newDrops:[],grave:grave||null,buffs:[],_wipeTriggered:false,_chainPending:0,dmgNums:[],
  };
};

/* ═══════════ TOOLTIP ═══════════ */
const Tip=({item,anchor})=>{
  if(!item||!anchor)return null;
  const r=RARS[item.rar||0];
  return(<div style={{position:"fixed",left:anchor.x,top:anchor.y,transform:"translate(-50%,-100%)",marginTop:-8,zIndex:999,pointerEvents:"none",animation:"fadeIn .15s ease"}}>
    <div style={{background:"linear-gradient(170deg,#141824,#0c1018)",border:`1px solid ${r.bd}`,borderRadius:8,padding:"10px 14px",minWidth:180,maxWidth:240,boxShadow:`0 8px 24px rgba(0,0,0,0.6), inset 0 1px 0 ${r.bd}`}}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6,paddingBottom:6,borderBottom:`1px solid ${r.bd}`}}>
        <span style={{fontSize:11,fontWeight:700,color:r.col,letterSpacing:1}}>{r.tag?r.tag+" ":""}{r.name}</span>
        {item.boss&&<span style={{fontSize:8,background:"rgba(251,191,36,0.15)",color:"#fbbf24",padding:"1px 5px",borderRadius:3,fontWeight:600}}>BOSS</span>}
      </div>
      {item.stats.map((st,i)=>{const sd=sf(st.k);return(
        <div key={i} style={{marginBottom:i<item.stats.length-1?6:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
            <span style={{fontSize:11,fontWeight:600,color:sd.c}}>{sd.l}</span>
            <span style={{fontSize:12,fontWeight:700,color:"#e2e8f0",fontFamily:"'Courier New',monospace"}}>{sd.f(st.v)}</span>
          </div>
          <div style={{fontSize:9,color:"#64748b",lineHeight:1.4,marginTop:2}}>{sd.d}</div>
        </div>
      );})}
    </div>
  </div>);
};

/* ═══════════ COMPONENTS ═══════════ */
const EqBadge=({item,small,on,active,style:sx})=>{
  const [tipAnchor,setTipAnchor]=useState(null);
  const ref=useRef(null);
  const r=RARS[item.rar||0];
  const showTip=()=>{if(!ref.current)return;const b=ref.current.getBoundingClientRect();setTipAnchor({x:b.left+b.width/2,y:b.top});};
  return(<>
    <div ref={ref} onClick={on} onMouseEnter={showTip} onMouseLeave={()=>setTipAnchor(null)} style={{display:"inline-flex",flexDirection:"column",gap:2,padding:small?"3px 6px":"5px 9px",borderRadius:5,background:active?r.bg:r.bg,border:`1px solid ${active?r.col:r.bd}`,cursor:on?"pointer":"default",position:"relative",transition:"all .15s",boxShadow:active?`0 0 8px ${r.col}33`:"none",...(sx||{})}}>
      {!small&&<div style={{fontSize:8,fontWeight:700,color:r.col,letterSpacing:0.5,textTransform:"uppercase"}}>{r.tag?r.tag+" ":""}{r.name}</div>}
      {item.stats.map((st,i)=>{const sd=sf(st.k);return(
        <div key={i} style={{fontSize:small?9:10,color:sd.c,whiteSpace:"nowrap",lineHeight:1.3}}>{small&&i===0?rarTag(item):""}{sd.l} <span style={{fontWeight:700,fontFamily:"monospace"}}>{sd.f(st.v)}</span></div>
      );})}
      {active&&<div style={{position:"absolute",top:-3,right:-3,width:8,height:8,borderRadius:4,background:r.col,boxShadow:`0 0 6px ${r.col}`}}/>}
    </div>
    {tipAnchor&&<Tip item={item} anchor={tipAnchor}/>}
  </>);
};

const GlowBtn=({children,on,dis,color="#2563eb",style:sx,...p})=>(<button onClick={on} disabled={dis} style={{background:dis?`rgba(255,255,255,0.03)`:`linear-gradient(135deg,${color}cc,${color})`,color:dis?"#555":"#fff",border:dis?"1px solid #1a1a2a":`1px solid ${color}55`,borderRadius:6,padding:"6px 16px",fontSize:12,fontWeight:600,cursor:dis?"default":"pointer",opacity:dis?0.4:1,letterSpacing:0.5,transition:"all .2s",boxShadow:dis?"none":`0 2px 12px ${color}33`,...(sx||{})}} {...p}>{children}</button>);

/* ═══════════ MAIN GAME ═══════════ */
export default function Game(){
  const cv=useRef(null),gs=useRef(null);
  const assets=useRef({atlas:null,bg:null});
  const [phase,setPhase]=useState("hub");
  const [tears,setTears]=useState(0);
  const [rlv,setRlv]=useState(new Array(RL.length).fill(0));
  const [stash,setStash]=useState([]);
  const [equipped,setEquipped]=useState([]);
  const [target,setTarget]=useState(5);
  const [runResult,setRunResult]=useState(null);
  const [hubTab,setHubTab]=useState(0);
  const [synA,setSynA]=useState(null);const [synB,setSynB]=useState(null);
  const [runTab,setRunTab]=useState(0);
  const [grave,setGrave]=useState(null);
  const [ui,setUi]=useState({t:0,w:0,zn:0,tw:0,tm:MAX_TOWERS,pl:false,chp:100,cm:100,go:false,vic:false,nDrop:0,canRush:false,buffs:[]});
  const [,bump]=useState(0);

  useEffect(()=>{let alive=true;for(const [k,src] of Object.entries(ASSET_PATHS)){const img=new Image();img.src=src;img.onload=()=>{if(alive){assets.current[k]=img;bump(v=>v+1);}};img.onerror=()=>{if(alive)assets.current[k]=null;};}return()=>{alive=false;};},[]);

  const maxSlots=()=>3+(rlv[8]||0);
  const sync=()=>{if(!gs.current)return;const s=gs.current;setUi({t:Math.floor(s.tears),w:s.wave,zn:s.zombies.length,tw:s.towers.length,tm:s.maxTowers,pl:s.placing,chp:Math.ceil(s.coreHp),cm:s.coreMax,go:s.go,vic:s.vic,nDrop:s.runDrops.length,canRush:!s.go&&!s.vic&&s.wave<s.tgt,buffs:s.buffs.map(b=>({...b}))});};
  const toggleEquip=item=>{if(equipped.find(e=>e.uid===item.uid))setEquipped(p=>p.filter(e=>e.uid!==item.uid));else if(equipped.length<maxSlots())setEquipped(p=>[...p,item]);};
  const buyRelic=rid=>{const r=RL[rid];const lv=rlv[rid];if(r.mx&&lv>=r.mx)return;const cost=rlC(r,lv);if(tears>=cost){setTears(t=>t-cost);setRlv(p=>{const n=[...p];n[rid]++;return n;});}};
  const doSynth=()=>{if(!synA||!synB)return;const res=synthResult(synA,synB);if(!res)return;setStash(p=>[...p.filter(e=>e.uid!==synA.uid&&e.uid!==synB.uid),res]);setEquipped(p=>p.filter(e=>e.uid!==synA.uid&&e.uid!==synB.uid));setSynA(null);setSynB(null);};
  const bulkSynth=()=>{let items=[...stash];let changed=true;while(changed){changed=false;const groups=new Map();items.forEach(it=>{if(it.stats.length===1){const k=it.stats[0].k;if(!groups.has(k))groups.set(k,[]);groups.get(k).push(it);}});for(const[,arr]of groups){arr.sort((a,b)=>a.stats[0].v-b.stats[0].v);while(arr.length>=2){const a=arr.shift(),b=arr.shift();const res=synthResult(a,b);if(res){items=items.filter(e=>e.uid!==a.uid&&e.uid!==b.uid);items.push(res);arr.push(res);arr.sort((x,y)=>x.stats[0].v-y.stats[0].v);changed=true;}}}}setStash(items);setEquipped(p=>p.filter(e=>items.find(i=>i.uid===e.uid)));setSynA(null);setSynB(null);bump(n=>n+1);};
  const canBulk=stash.some((a,i)=>stash.some((b,j)=>i<j&&a.stats.length===1&&b.stats.length===1&&a.stats[0].k===b.stats[0].k));

  const startRun=()=>{gs.current=mkRun(target,rlv,equipped,grave);setPhase("run");setRunTab(0);};
  const endRun=useCallback(vic=>{const s=gs.current;const mul=vic?2:1;const et=Math.floor(s.tears*mul);
    if(vic){setRunResult({vic,et,kept:s.runDrops,lost:[],w:s.wave,tgt:s.tgt,k:s.kills,lostEq:[]});setTears(t=>t+et);setStash(p=>[...p,...s.runDrops]);setGrave(null);}
    else{const lc=Math.min(equipped.length,1+Math.floor(Math.random()*3));const sh=[...equipped].sort(()=>Math.random()-0.5);const lostEq=sh.slice(0,lc);const lu=new Set(lostEq.map(e=>e.uid));setRunResult({vic,et,kept:[],lost:s.runDrops,w:s.wave,tgt:s.tgt,k:s.kills,lostEq});setTears(t=>t+et);setStash(p=>p.filter(e=>!lu.has(e.uid)));setEquipped(p=>p.filter(e=>!lu.has(e.uid)));if(lostEq.length>0)setGrave({wave:s.wave,items:lostEq});}
    setPhase("result");},[equipped]);

  const spawn1=useCallback((wn,rem)=>{const s=gs.current;const side=Math.random()*4|0;let x,y;if(side===0){x=Math.random()*W;y=-18}else if(side===1){x=W+18;y=Math.random()*H}else if(side===2){x=Math.random()*W;y=H+18}else{x=-18;y=Math.random()*H}const hp=wHp(wn);const boss=wn%10===0&&rem===1;const bm=boss?5:1;const hpVar=boss?1:0.8+Math.random()*0.5;const type=boss?"basic":rollType(wn);const et=ETYPES[type];const fHp=hp*bm*hpVar*et.hpMul;s.zombies.push({x,y,type,hp:fHp,mhp:fHp,spd:(wSpd(wn)+(Math.random()-0.5)*8)*et.spdMul,val:Math.floor((2+wn*0.7)*s.tearP*bm*hpVar*et.drop),sz:boss?22:et.szBase+Math.random()*2+(hpVar-1)*4,boss,atk:null,atkT:0,dropR:boss?1:Math.min(0.35,0.04+wn*0.002)+s.dropUp,markT:0,armor:et.armor});},[]);
  const startW=useCallback(wn=>{const s=gs.current;s.wave=wn;s.sQs.push({w:wn,rem:wZ(wn),t:0.3,iv:Math.max(0.12,10/wZ(wn))});s.wActive=true;if(s.grave&&wn>=s.grave.wave){s.runDrops.push(...s.grave.items);s.newDrops.push({special:"🔄 ロスト装備を回収!",t:3,x:CX,y:CY-60});s.grave=null;}},[]);
  const rushW=useCallback(()=>{const s=gs.current;if(!s||s.go||s.vic||s.wave>=s.tgt)return;const nxt=s.wave+1;s.wave=nxt;s.sQs.push({w:nxt,rem:wZ(nxt),t:0,iv:Math.max(0.12,10/wZ(nxt))});s.wActive=true;if(s.grave&&nxt>=s.grave.wave){s.runDrops.push(...s.grave.items);s.newDrops.push({special:"🔄 ロスト装備を回収!",t:3,x:CX,y:CY-60});s.grave=null;}sync();},[]);
  const rushAllW=useCallback(()=>{const s=gs.current;if(!s||s.go||s.vic||s.wave>=s.tgt)return;for(let w=s.wave+1;w<=s.tgt;w++){s.sQs.push({w,rem:wZ(w),t:0,iv:Math.max(0.12,10/wZ(w))});}s.wave=s.tgt;s.wActive=true;if(s.grave){s.runDrops.push(...s.grave.items);s.newDrops.push({special:"🔄 ロスト装備を回収!",t:3,x:CX,y:CY-60});s.grave=null;}sync();},[]);

  // Kill flags processed AFTER zombie loop
  const onKill=useCallback((s,z)=>{
    s.tears+=z.val;s.kills++;
    if(Math.random()<z.dropR){const drop=doDrop(s.wave,z.boss,s.luck);s.runDrops.push(drop);const st0=drop.stats[0];const sd0=sf(st0.k);if(s.newDrops.length<20)s.newDrops.push({special:null,rar:drop.rar,label:`${rarTag(drop)}[${rarName(drop)}] ${sd0.l} ${sd0.f(st0.v)}`,t:2.5,x:z.x,y:z.y});}
    // Flag wave wipe / chain kill for deferred processing
    if(s.waveWipe>0&&!s._wipeTriggered&&Math.random()<s.waveWipe&&s.zombies.length>1){s._wipeTriggered=true;}
    else if(s.chainKill>0&&Math.random()<s.chainKill){s._chainPending=(s._chainPending||0)+1;}
    const addBuff=bt=>{const ex=s.buffs.find(b=>b.id===bt.id);if(ex)ex.rem=bt.dur;else s.buffs.push({...bt,rem:bt.dur});if(s.newDrops.length<20)s.newDrops.push({special:`🔥 ${bt.name}!`,t:1.5,x:z.x,y:z.y-20});};
    if(s.killBuff>0&&Math.random()<s.killBuff)addBuff(BUFF_TYPES[Math.floor(Math.random()*BUFF_TYPES.length)]);
    if(s.kbFury>0&&Math.random()<s.kbFury)addBuff(BUFF_TYPES[0]);
    if(s.kbHaste>0&&Math.random()<s.kbHaste)addBuff(BUFF_TYPES[1]);
    if(s.kbRain>0&&Math.random()<s.kbRain)addBuff(BUFF_TYPES[2]);
    if(s.kbShield>0&&Math.random()<s.kbShield)addBuff(BUFF_TYPES[3]);
    if(s.curClone>0&&Math.random()<s.curClone&&s.clones.length<12){const ang=Math.random()*Math.PI*2,spd=90;s.clones.push({x:CX+(Math.random()-0.5)*180,y:CY+(Math.random()-0.5)*120,vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd,t:4});}
    if(s.parts.length<300){const n=z.boss?12:4;for(let p=0;p<n;p++)s.parts.push({x:z.x,y:z.y,vx:(Math.random()-0.5)*90,vy:(Math.random()-0.5)*90,life:0.6+Math.random()*0.4,col:z.boss?"#fbbf24":"#86efac",sz:z.boss?4:2.5});}
  },[]);

  useEffect(()=>{
    if(phase!=="run")return;const canvas=cv.current;if(!canvas)return;const ctx=canvas.getContext("2d");let anim,ut=0;const s=gs.current;s.lt=performance.now();if(!s.wActive&&s.wave===0)startW(1);
    const loop=now=>{
      const dt=Math.min((now-s.lt)/1000,0.05);s.lt=now;
      if(s.go||s.vic){render(ctx,s);ut+=dt;if(ut>0.2){ut=0;sync();}anim=requestAnimationFrame(loop);return;}
      const hasBuff=id=>s.buffs.some(b=>b.id===id);for(let i=s.buffs.length-1;i>=0;i--){s.buffs[i].rem-=dt;if(s.buffs[i].rem<=0)s.buffs.splice(i,1);}
      for(let i=s.clones.length-1;i>=0;i--){const c=s.clones[i];c.t-=dt;if(c.t<=0){s.clones.splice(i,1);continue;}c.x+=c.vx*dt;c.y+=c.vy*dt;const cxMin=150,cxMax=W-150,cyMin=100,cyMax=H-100;if(c.x<cxMin){c.x=cxMin;c.vx=-c.vx;}else if(c.x>cxMax){c.x=cxMax;c.vx=-c.vx;}if(c.y<cyMin){c.y=cyMin;c.vy=-c.vy;}else if(c.y>cyMax){c.y=cyMax;c.vy=-c.vy;}}
      const bF=hasBuff("fury")?3:1,bH=hasBuff("haste")?2:1,bR=hasBuff("rain")?2:1,bS=hasBuff("shield");
      let cBR=0,cBD=0;for(const t of s.towers){if(TT[t.tid].eff==="cursor"&&t.hp>0){cBR+=12;cBD+=0.35;}}
      const ecR=(s.cR+cBR)*bR,ecD=(s.cD+cBD)*s.cDp*bF;
      for(let qi=s.sQs.length-1;qi>=0;qi--){const q=s.sQs[qi];q.t-=dt;if(q.t<=0&&q.rem>0){spawn1(q.w,q.rem);q.rem--;q.t=q.iv;if(q.rem<=0)s.sQs.splice(qi,1);}}
      if(s.sQs.length===0&&s.zombies.length===0&&s.wActive){if(s.wave>=s.tgt){s.vic=true;endRun(true);}else{s.wActive=false;s.wPause=1.5;}}
      if(!s.wActive&&!s.vic){s.wPause-=dt;if(s.wPause<=0)startW(s.wave+1);}
      if(s.coreReg>0&&s.coreHp<s.coreMax)s.coreHp=Math.min(s.coreMax,s.coreHp+s.coreReg*dt);
      if(s.mx>0&&s.my>0){for(let i=0;i<2;i++)s.drops.push({x:s.mx+(Math.random()-0.5)*ecR*1.5,y:s.my-ecR*0.4-Math.random()*12,vy:70+Math.random()*50,life:0.3+Math.random()*0.2});}
      for(let i=s.drops.length-1;i>=0;i--){s.drops[i].y+=s.drops[i].vy*dt;s.drops[i].life-=dt;if(s.drops[i].life<=0)s.drops.splice(i,1);}
      const dmgMap=new Map();for(const t of s.towers){const tp=TT[t.tid];if(tp.eff==="dmgUp"&&t.hp>0){for(const o of s.towers){if(o!==t&&TT[o.tid].cat===0&&o.hp>0&&Math.hypot(o.x-t.x,o.y-t.y)<tp.range)dmgMap.set(o,(dmgMap.get(o)||1)*1.5);}}}
      for(const t of s.towers){const tp=TT[t.tid];if(tp.eff==="heal"&&t.hp>0){t.cd-=dt*1000*s.twS*bH;if(t.cd<=0){t.cd=tp.cd;for(const o of s.towers){if(o!==t&&o.hp>0){const omhp=Math.floor(TT[o.tid].mhp*s.twH);if(o.hp<omhp&&Math.hypot(o.x-t.x,o.y-t.y)<tp.range){o.hp=Math.min(omhp,o.hp+10);s.parts.push({x:o.x,y:o.y-8,vx:(Math.random()-0.5)*20,vy:-20,life:0.4,col:"#4ade80",sz:2});}}}}}}
      for(const t of s.towers){const tp=TT[t.tid];if(tp.cat!==0||t.hp<=0)continue;const inC=(s.mx>0&&Math.hypot(t.x-s.mx,t.y-s.my)<ecR);const aD=inC?1+s.auraDmg:1;const aS=inC?1+s.auraSpd:1;t.cd-=dt*1000*s.twS*bH*aS;if(t.cd<=0){let best=null,bd=tp.range;for(const z of s.zombies){const d=Math.hypot(z.x-t.x,z.y-t.y);if(d<bd){best=z;bd=d;}}if(best){const ml=(dmgMap.get(t)||1)*s.twD*aD;const hd=tp.dmg*ml*(best.armor||1);best.hp-=hd;t.cd=tp.cd;s.projs.push({x:t.x,y:t.y,tx:best.x,ty:best.y,p:0,col:inC?"#fcd34d":tp.col});
          if(s.dmgNums.length<30&&hd>1)s.dmgNums.push({x:best.x+(Math.random()-0.5)*12,y:best.y-(best.sz||10)-4,v:Math.floor(hd),col:inC?"#fcd34d":"#4ade80",t:0.7,big:false});
        if(s.twSplash>0&&Math.random()<s.twSplash){for(const z2 of s.zombies){if(z2!==best&&Math.hypot(z2.x-best.x,z2.y-best.y)<50)z2.hp-=hd*0.5*(z2.armor||1);}for(let p=0;p<6;p++)s.parts.push({x:best.x,y:best.y,vx:(Math.random()-0.5)*80,vy:(Math.random()-0.5)*80,life:0.3,col:"#fb923c",sz:2.5});}
        if(s.twChain>0&&Math.random()<s.twChain){let pv=best;for(let c=0;c<2;c++){let cn=null,cd3=120;for(const z2 of s.zombies){if(z2!==pv&&z2.hp>0){const d=Math.hypot(z2.x-pv.x,z2.y-pv.y);if(d<cd3){cn=z2;cd3=d;}}}if(cn){cn.hp-=hd*0.4*(cn.armor||1);s.projs.push({x:pv.x,y:pv.y,tx:cn.x,ty:cn.y,p:0,col:"#38bdf8"});pv=cn;}}}
        if(s.twHeal>0&&Math.random()<s.twHeal){s.coreHp=Math.min(s.coreMax,s.coreHp+3+s.wave*0.1);s.parts.push({x:CX,y:CY,vx:0,vy:-12,life:0.5,col:"#86efac",sz:3});}
        if(s.twGold>0&&Math.random()<s.twGold){const b=Math.floor(1+s.wave*0.3);s.tears+=b;s.newDrops.push({special:`💧+${b}`,t:1,x:best.x,y:best.y-10});}
        if(s.twSlow>0&&Math.random()<s.twSlow){best.slowT=Math.max(best.slowT||0,1.5);}}}}
      for(let i=s.zombies.length-1;i>=0;i--){const z=s.zombies[i];
        if(z.atk){if(z.atk.hp<=0)z.atk=null;else{z.atkT-=dt;if(z.atkT<=0){z.atk.hp-=3+s.wave*0.35;z.atkT=0.7;s.parts.push({x:z.atk.x,y:z.atk.y-5,vx:(Math.random()-0.5)*30,vy:-15,life:0.3,col:"#ef4444",sz:2});if(z.atk.hp<=0){s.parts.push({x:z.atk.x,y:z.atk.y,vx:0,vy:-10,life:0.7,col:"#fbbf24",sz:4});z.atk=null;}}}}
        if(z.slowT){z.slowT-=dt;if(z.slowT<=0)z.slowT=0;}
        const slowMul=z.slowT>0?0.5:1;
        if(!z.atk){const dx=CX-z.x,dy=CY-z.y,dist=Math.hypot(dx,dy);if(dist>18){z.x+=(dx/dist)*z.spd*dt*slowMul;z.y+=(dy/dist)*z.spd*dt*slowMul;}else{
          let coreDmg=0;if(!bS){coreDmg=Math.max(3,z.hp*0.35)*(1-s.coreShield/100);s.coreHp-=coreDmg;}
          if(s.dmgNums.length<30)s.dmgNums.push({x:CX,y:CY-20,v:bS?"SHIELD":"-"+Math.floor(coreDmg),col:bS?"#fbbf24":"#ef4444",t:1.2,big:true});
          for(let p=0;p<6;p++)s.parts.push({x:CX,y:CY,vx:(Math.random()-0.5)*60,vy:(Math.random()-0.5)*60,life:0.5,col:bS?"#fbbf24":"#ef4444",sz:3});s.zombies.splice(i,1);if(s.coreHp<=0){s.coreHp=0;s.go=true;endRun(false);}continue;}
          for(const t of s.towers){if(t.hp<=0)continue;const tp=TT[t.tid];if(tp.eff!=="wall"&&tp.eff!=="barricade")continue;if(Math.hypot(z.x-t.x,z.y-t.y)<tp.range+z.sz){z.atk=t;z.atkT=0.3;if(tp.eff==="barricade")z.hp-=tp.dmg*s.twD*(z.armor||1);break;}}}
        const cd2=Math.hypot(z.x-s.mx,z.y-s.my);if(cd2<ecR){let dmg=ecD*dt*25;let isCrit=false;if(s.critCh>0&&Math.random()<s.critCh*dt*5){dmg*=5;isCrit=true;s.parts.push({x:z.x,y:z.y-z.sz-10,vx:0,vy:-20,life:0.5,col:"#ef4444",sz:3});}z.hp-=dmg;
          z._accDmg=(z._accDmg||0)+dmg;z._accT=(z._accT||0)+dt;
          if(z._accT>=0.3||isCrit){if(s.dmgNums.length<30)s.dmgNums.push({x:z.x+(Math.random()-0.5)*10,y:z.y-z.sz-5,v:Math.floor(z._accDmg)+(isCrit?" CRIT!":""),col:isCrit?"#ef4444":"#93c5fd",t:0.8,big:isCrit});z._accDmg=0;z._accT=0;}
          z.markT+=dt;if(z.markT>=0.2&&s.markTower>0&&s.towers.length<s.maxTowers){z.markT=0;if(Math.random()<s.markTower){const tid=Math.floor(Math.random()*4);s.towers.push({x:z.x+(Math.random()-0.5)*40,y:z.y+(Math.random()-0.5)*40,tid,hp:Math.floor(TT[tid].mhp*s.twH),cd:0});s.newDrops.push({special:"🏗 召喚!",t:1.2,x:z.x,y:z.y-25});}}}else{z.markT=Math.max(0,z.markT-dt*2);}
        for(const c of s.clones){const cdC=Math.hypot(z.x-c.x,z.y-c.y);if(cdC<ecR)z.hp-=ecD*dt*25*0.6;}
        if(z.type==="healer"){z._healT=(z._healT||0)+dt;if(z._healT>=1.2){z._healT=0;for(const o of s.zombies){if(o!==z&&o.hp<o.mhp&&Math.hypot(o.x-z.x,o.y-z.y)<65){o.hp=Math.min(o.mhp,o.hp+o.mhp*0.06);if(s.parts.length<300)s.parts.push({x:o.x,y:o.y-5,vx:(Math.random()-0.5)*20,vy:-22,life:0.45,col:"#f0abfc",sz:2});}}}}
        let slowed=false;for(const t of s.towers){if(TT[t.tid].eff==="wall"&&t.hp>0&&Math.hypot(z.x-t.x,z.y-t.y)<55){slowed=true;break;}}
        if(slowed&&!z.atk){const d2=Math.hypot(CX-z.x,CY-z.y);if(d2>1){z.x-=((CX-z.x)/d2)*z.spd*dt*0.35;z.y-=((CY-z.y)/d2)*z.spd*dt*0.35;}}
        if(z.hp<=0){onKill(s,z);s.zombies.splice(i,1);}}
      // Deferred wave wipe (flagged in onKill, processed safely after loop)
      if(s._wipeTriggered&&s.zombies.length>0){
        s._wipeTriggered=false;
        for(let i=s.zombies.length-1;i>=0;i--){const wz=s.zombies[i];wz.hp-=wz.mhp*0.2;if(s.parts.length<300)for(let p=0;p<2;p++)s.parts.push({x:wz.x,y:wz.y,vx:(Math.random()-0.5)*80,vy:(Math.random()-0.5)*80,life:0.4,col:"#facc15",sz:3});if(wz.hp<=0){onKill(s,wz);s.zombies.splice(i,1);}}
        if(s.newDrops.length<20)s.newDrops.push({special:"⚡ 天罰発動!",t:2.5,x:CX,y:CY-40});
      }else{s._wipeTriggered=false;}
      // Deferred chain kills (max 5 per frame)
      const chains=Math.min(s._chainPending||0,5);s._chainPending=0;
      for(let c=0;c<chains&&s.zombies.length>0;c++){const ci=Math.floor(Math.random()*s.zombies.length);const cz=s.zombies[ci];s.tears+=cz.val;s.kills++;if(s.parts.length<300)s.parts.push({x:cz.x,y:cz.y,vx:0,vy:-15,life:0.5,col:"#f43f5e",sz:4});if(s.newDrops.length<20)s.newDrops.push({special:"⛓ 連鎖!",t:1.5,x:cz.x,y:cz.y-15});s.zombies.splice(ci,1);}
      if(s.parts.length>400)s.parts.splice(0,s.parts.length-400);
      if(s.newDrops.length>25)s.newDrops.splice(0,s.newDrops.length-25);
      if(s.drops.length>60)s.drops.splice(0,s.drops.length-60);
      if(s.projs.length>100)s.projs.splice(0,s.projs.length-100);
      for(let i=s.dmgNums.length-1;i>=0;i--){s.dmgNums[i].y-=30*dt;s.dmgNums[i].t-=dt;if(s.dmgNums[i].t<=0)s.dmgNums.splice(i,1);}
      if(s.dmgNums.length>40)s.dmgNums.splice(0,s.dmgNums.length-40);
      for(let i=s.newDrops.length-1;i>=0;i--){s.newDrops[i].t-=dt;s.newDrops[i].y-=15*dt;if(s.newDrops[i].t<=0)s.newDrops.splice(i,1);}
      s.towers=s.towers.filter(t=>t.hp>0);for(let i=s.projs.length-1;i>=0;i--){s.projs[i].p+=dt*7;if(s.projs[i].p>=1)s.projs.splice(i,1);}for(let i=s.parts.length-1;i>=0;i--){const p=s.parts[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;if(p.life<=0)s.parts.splice(i,1);}
      render(ctx,s,ecR);ut+=dt;if(ut>0.12){ut=0;sync();}anim=requestAnimationFrame(loop);};anim=requestAnimationFrame(loop);return()=>cancelAnimationFrame(anim);
  },[phase,startW,spawn1,endRun,onKill]);

  const render=(ctx,s,ecR)=>{
    const cr=ecR||s.cR,atlas=assets.current.atlas,bg=assets.current.bg,walk=assets.current.walk,now=performance.now();
    if(okImg(bg)){ctx.drawImage(bg,0,0,W,H);ctx.fillStyle="rgba(2,8,7,0.28)";ctx.fillRect(0,0,W,H);}
    else{ctx.fillStyle="#070b07";ctx.fillRect(0,0,W,H);ctx.globalAlpha=0.03;for(let i=0;i<80;i++){ctx.fillStyle=i%3===0?"#1a3a1a":"#0d1f0d";ctx.fillRect((i*137.5)%W,(i*89.3)%H,12+(i%20),1.5);}ctx.globalAlpha=1;}
    const vign=ctx.createRadialGradient(CX,CY,40,CX,CY,Math.max(W,H)*0.65);vign.addColorStop(0,"rgba(80,160,130,0.08)");vign.addColorStop(1,"rgba(0,0,0,0.58)");ctx.fillStyle=vign;ctx.fillRect(0,0,W,H);

    for(const t of s.towers){if(t.hp<=0)continue;const tp=TT[t.tid];if(tp.eff==="dmgUp"||tp.eff==="heal"){ctx.strokeStyle=tp.eff==="dmgUp"?"rgba(192,132,252,0.12)":"rgba(74,222,128,0.1)";ctx.lineWidth=1;ctx.beginPath();ctx.arc(t.x,t.y,tp.range,0,Math.PI*2);ctx.stroke();}if(tp.cat===0){ctx.strokeStyle="rgba(74,222,128,0.07)";ctx.lineWidth=1;ctx.beginPath();ctx.arc(t.x,t.y,tp.range,0,Math.PI*2);ctx.stroke();}}

    if(s.mx>0&&s.my>0){const g=ctx.createRadialGradient(s.mx,s.my,0,s.mx,s.my,cr);g.addColorStop(0,"rgba(96,165,250,0.24)");g.addColorStop(0.6,"rgba(96,165,250,0.07)");g.addColorStop(1,"rgba(96,165,250,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(s.mx,s.my,cr,0,Math.PI*2);ctx.fill();}
    for(const c of s.clones){drawSprite(ctx,atlas,SPR.cloneRing,c.x,c.y,cr*2.1,cr*2.1,0.42,now/1200);const g2=ctx.createRadialGradient(c.x,c.y,0,c.x,c.y,cr);g2.addColorStop(0,"rgba(165,180,252,0.18)");g2.addColorStop(1,"rgba(165,180,252,0)");ctx.fillStyle=g2;ctx.beginPath();ctx.arc(c.x,c.y,cr,0,Math.PI*2);ctx.fill();}
    for(const d of s.drops){ctx.globalAlpha=Math.min(1,d.life/0.3)*0.72;if(!drawSprite(ctx,atlas,SPR.droplet,d.x,d.y,8,13,0.7)){ctx.strokeStyle="#93c5fd";ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(d.x,d.y+5);ctx.stroke();}}ctx.globalAlpha=1;

    const pulse=Math.sin(now/400)*0.15+0.85;
    ctx.shadowColor="rgba(251,191,36,0.45)";ctx.shadowBlur=16;ctx.fillStyle=`rgba(251,191,36,${0.7*pulse})`;ctx.beginPath();ctx.arc(CX,CY,16,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    ctx.strokeStyle="rgba(253,224,71,0.55)";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(CX,CY,16,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle="#fef3c7";ctx.font="bold 10px sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("種",CX,CY+1);
    const chr=Math.max(0,s.coreHp/s.coreMax);ctx.fillStyle="#1a1a0a";ctx.fillRect(CX-24,CY+22,48,5);ctx.fillStyle=chr>0.5?"#fbbf24":chr>0.25?"#f97316":"#ef4444";ctx.fillRect(CX-24,CY+22,48*chr,5);ctx.font="bold 11px monospace";ctx.fillStyle=chr>0.5?"#fef3c7":chr>0.25?"#fde68a":"#fca5a5";ctx.fillText(`${Math.ceil(s.coreHp)}/${s.coreMax}`,CX,CY+36);

    for(const t of s.towers){if(t.hp<=0)continue;const{x,y,tid}=t;const tp=TT[tid];ctx.fillStyle="rgba(0,0,0,0.28)";ctx.beginPath();ctx.ellipse(x,y+13,13,4,0,0,Math.PI*2);ctx.fill();const size=tp.cat===0?30:tp.cat===1?29:27;if(!drawSprite(ctx,atlas,SPR.towers[tid],x,y,size,size*1.05,1)){if(tp.cat===0){const r={0:10,1:12,2:14,3:13}[tid]||10;ctx.fillStyle=tp.col+"cc";ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}else if(tp.cat===1){const r=11;ctx.fillStyle=tp.col+"88";ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r*0.7,y);ctx.lineTo(x,y+r);ctx.lineTo(x-r*0.7,y);ctx.closePath();ctx.fill();}else{ctx.fillStyle=tp.col+"dd";ctx.fillRect(x-11,y-8,22,16);}}const mhp=Math.floor(TT[tid].mhp*s.twH);const hr=t.hp/mhp;if(hr<1){ctx.fillStyle="#111";ctx.fillRect(x-10,y+15,20,3);ctx.fillStyle=hr>0.5?"#4ade80":hr>0.25?"#fbbf24":"#ef4444";ctx.fillRect(x-10,y+15,20*hr,3);}}

    for(const pr of s.projs){const px=pr.x+(pr.tx-pr.x)*pr.p,py=pr.y+(pr.ty-pr.y)*pr.p;ctx.globalAlpha=1-pr.p*0.45;if(!drawSprite(ctx,atlas,SPR.droplet,px,py,10,15,ctx.globalAlpha,Math.atan2(pr.ty-pr.y,pr.tx-pr.x)+Math.PI/2)){ctx.fillStyle=pr.col;ctx.beginPath();ctx.arc(px,py,3,0,Math.PI*2);ctx.fill();}}ctx.globalAlpha=1;

    for(const z of s.zombies){const hr=z.hp/z.mhp;const tc=TYPE_COL[z.type]||TYPE_COL.basic;const dmg=1-hr;if(z.type==="healer"){ctx.strokeStyle="rgba(240,171,252,0.18)";ctx.lineWidth=1;ctx.beginPath();ctx.arc(z.x,z.y,65,0,Math.PI*2);ctx.stroke();}ctx.fillStyle="rgba(0,0,0,0.24)";ctx.beginPath();ctx.ellipse(z.x,z.y+z.sz*0.7,z.sz*1.15,z.sz*0.35,0,0,Math.PI*2);ctx.fill();const sr=z.boss?SPR.enemies.boss:SPR.enemies[z.type];const ew=z.sz*(z.boss?3.0:3.35),eh=z.sz*(z.boss?3.5:3.75);const ph=((z.x*0.07+z.y*0.11)|0);if(!(drawWalk(ctx,walk,z.type,z.x,z.y,ew,eh,now,ph)||drawSprite(ctx,atlas,sr,z.x,z.y,ew,eh,1))){ctx.fillStyle=`rgb(${tc.r+dmg*tc.dr|0},${tc.g+dmg*tc.dg|0},${tc.b+dmg*tc.db|0})`;ctx.beginPath();ctx.arc(z.x,z.y,z.sz,0,Math.PI*2);ctx.fill();ctx.fillStyle="#ef4444";ctx.beginPath();ctx.arc(z.x-z.sz*0.28,z.y-z.sz*0.15,z.sz*0.15,0,Math.PI*2);ctx.arc(z.x+z.sz*0.28,z.y-z.sz*0.15,z.sz*0.15,0,Math.PI*2);ctx.fill();}if(z.type==="armor"){ctx.strokeStyle="rgba(210,220,240,0.8)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(z.x,z.y,z.sz+3,0,Math.PI*2);ctx.stroke();}if(z.boss){ctx.strokeStyle="#facc15";ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(z.x,z.y,z.sz+5,0,Math.PI*2);ctx.stroke();}if(z.markT>0.08){ctx.strokeStyle="rgba(232,121,249,0.55)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(z.x,z.y,z.sz+8,0,Math.PI*2*(z.markT/0.2));ctx.stroke();}if(hr<1){const bw=z.sz*2.4;ctx.fillStyle="#111";ctx.fillRect(z.x-bw/2,z.y-z.sz-13,bw,3);ctx.fillStyle=hr>0.5?"#4ade80":hr>0.25?"#fbbf24":"#ef4444";ctx.fillRect(z.x-bw/2,z.y-z.sz-13,bw*hr,3);}}

    for(const p of s.parts){ctx.globalAlpha=Math.max(0,p.life/0.7);if((p.col==="#facc15"||p.col==="#fb923c")&&drawSprite(ctx,atlas,SPR.lightning,p.x,p.y,p.sz*9,p.sz*9,ctx.globalAlpha)){}else if(p.col==="#f0abfc"&&drawSprite(ctx,atlas,SPR.heal,p.x,p.y,p.sz*12,p.sz*10,ctx.globalAlpha)){}else{ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.sz,0,Math.PI*2);ctx.fill();}}ctx.globalAlpha=1;
    for(const d of s.newDrops){ctx.globalAlpha=Math.min(1,d.t/0.5);ctx.font=`bold ${(d.rar||0)>=3?12:11}px sans-serif`;ctx.textAlign="center";ctx.fillStyle=d.special?"#facc15":RARS[d.rar||0].col;ctx.fillText(d.special||d.label||"",d.x,d.y-20);}ctx.globalAlpha=1;
    for(const dn of s.dmgNums){ctx.globalAlpha=Math.min(1,dn.t/0.3);ctx.font=dn.big?"bold 14px monospace":"bold 10px monospace";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=dn.col;ctx.fillText(dn.v,dn.x,dn.y);}ctx.globalAlpha=1;
    if(s.placing&&s.sel!==null&&s.mx>0){const tp=TT[s.sel];if(tp.range>0){ctx.strokeStyle="rgba(255,255,255,0.18)";ctx.setLineDash([4,4]);ctx.lineWidth=1;ctx.beginPath();ctx.arc(s.mx,s.my,tp.range,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}ctx.globalAlpha=0.55;drawSprite(ctx,atlas,SPR.towers[s.sel],s.mx,s.my,30,32,0.65)||(()=>{ctx.fillStyle=tp.col;ctx.beginPath();ctx.arc(s.mx,s.my,10,0,Math.PI*2);ctx.fill();})();ctx.globalAlpha=1;}
    if(s.buffs.length>0){let bx=8,by=8;for(const b of s.buffs){ctx.fillStyle="rgba(0,0,0,0.5)";const bw=62;ctx.fillRect(bx,by,bw,18);ctx.fillStyle=b.col;ctx.fillRect(bx,by+14,bw*(b.rem/b.dur),4);ctx.font="bold 9px sans-serif";ctx.textAlign="left";ctx.textBaseline="top";ctx.fillStyle=b.col;ctx.fillText(b.name,bx+3,by+2);by+=22;}}
    if(!s.wActive&&!s.vic&&!s.go&&s.wave>0){ctx.fillStyle="rgba(0,0,0,0.45)";ctx.fillRect(0,H/2-18,W,36);ctx.font="bold 15px sans-serif";ctx.fillStyle="#93c5fd";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(`Wave ${s.wave}/${s.tgt} Clear!`,W/2,H/2);}
    if(s.go){ctx.fillStyle="rgba(0,0,0,0.72)";ctx.fillRect(0,0,W,H);ctx.font="bold 20px sans-serif";ctx.fillStyle="#ef4444";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("生命の種が破壊された…",W/2,H/2);}
    if(s.vic){ctx.fillStyle="rgba(0,0,10,0.75)";ctx.fillRect(0,0,W,H);ctx.font="bold 20px sans-serif";ctx.fillStyle="#fbbf24";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(`✨ Wave ${s.tgt} 達成! ✨`,W/2,H/2);}
  };

  const hM=e=>{if(!cv.current||!gs.current)return;const r=cv.current.getBoundingClientRect();gs.current.mx=(e.clientX-r.left)*(W/r.width);gs.current.my=(e.clientY-r.top)*(H/r.height);};
  const hL=()=>{if(gs.current)gs.current.mx=-300;};
  const hC=e=>{const s=gs.current;if(!s||!s.placing||s.sel===null)return;const r=cv.current.getBoundingClientRect();const fx=(e.clientX-r.left)*(W/r.width),fy=(e.clientY-r.top)*(H/r.height);if(Math.hypot(fx-CX,fy-CY)<30)return;if(s.towers.length>=s.maxTowers)return;const tp=TT[s.sel];const cost=Math.floor(tp.cost*s.costP);if(s.tears>=cost){s.tears-=cost;s.towers.push({x:fx,y:fy,tid:tp.id,hp:Math.floor(tp.mhp*s.twH),cd:0});}};
  const selT=id=>{const s=gs.current;if(s.sel===id&&s.placing){s.placing=false;s.sel=null;}else{s.sel=id;s.placing=true;}sync();};

  const css={root:{maxWidth:780,margin:"0 auto",fontFamily:"'Palatino Linotype','Book Antiqua','Georgia',serif",background:"#060a06",backgroundImage:`linear-gradient(rgba(3,8,7,0.88),rgba(3,8,7,0.94)),url(${ASSET_PATHS.bg})`,backgroundSize:"cover",border:"1px solid rgba(147,197,253,0.14)",borderRadius:10,overflow:"hidden",color:"#c8d6c8",boxShadow:"0 18px 50px rgba(0,0,0,0.55)"},panel:{background:"linear-gradient(180deg,rgba(11,18,11,0.92),rgba(9,14,9,0.96))",borderBottom:"1px solid #162016",backdropFilter:"blur(2px)"},hdr:{padding:"14px 20px",background:"radial-gradient(ellipse at 50% 0%,rgba(96,165,250,0.13),transparent 70%)",textAlign:"center",borderBottom:"1px solid rgba(147,197,253,0.12)"}};

  /* ═══ HUB ═══ */
  if(phase==="hub"){
    const synthRes=synA&&synB?synthResult(synA,synB):null;
    return(<div style={css.root}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translate(-50%,-100%) translateY(4px)}to{opacity:1;transform:translate(-50%,-100%) translateY(0)}} input[type=range]{height:6px;}`}</style>
      <div style={css.hdr}>
        <div style={{fontSize:10,letterSpacing:6,color:"#3a5a3a",textTransform:"uppercase"}}>Incremental Tower Defense</div>
        <h1 style={{fontSize:28,fontWeight:400,color:"#93c5fd",margin:"4px 0",textShadow:"0 0 24px rgba(96,165,250,0.2)",fontFamily:"'Palatino Linotype',serif"}}>天国の涙</h1>
        <div style={{fontSize:15,color:"#fbbf24",fontWeight:600,fontFamily:"monospace"}}>💧 {tears}</div>
      </div>
      <div style={{padding:"12px 20px",...css.panel}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <span style={{fontSize:12,color:"#6b8f6b",letterSpacing:1}}>目標Wave</span>
          <input type="range" min={1} max={100} step={1} value={target} onChange={e=>setTarget(+e.target.value)} style={{flex:1,accentColor:"#60a5fa"}}/>
          <span style={{fontSize:22,fontWeight:700,color:"#93c5fd",minWidth:40,textAlign:"right",fontFamily:"monospace"}}>{target}</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#3a5a3a",marginTop:4}}>
          <span>✓ 達成: 涙x2 + ドロップ持帰り</span><span>✗ 失敗: 装備1~3ロスト</span>
        </div>
        {(()=>{const power=computeCombatPower(rlv,equipped);const need=waveExpectedHp(target);const ratio=power/need;const status=ratio>=1.2?{c:"#4ade80",t:"安全"}:ratio>=0.8?{c:"#a3e635",t:"適正"}:ratio>=0.5?{c:"#fbbf24",t:"挑戦的"}:ratio>=0.25?{c:"#fb923c",t:"危険"}:{c:"#ef4444",t:"無謀"};const barPct=Math.min(100,(ratio/2)*100);return(<div style={{marginTop:8,padding:"7px 10px",background:"rgba(96,165,250,0.04)",border:"1px solid rgba(96,165,250,0.12)",borderRadius:6,fontSize:11}}><div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}><span style={{color:"#9ca3af"}}>戦闘力 <b style={{color:"#93c5fd",fontFamily:"monospace"}}>{power.toLocaleString()}</b></span><span style={{color:"#3a5a3a"}}>/</span><span style={{color:"#9ca3af"}}>Wave {target} 推奨 <b style={{color:"#fbbf24",fontFamily:"monospace"}}>{need.toLocaleString()}</b></span><span style={{marginLeft:"auto",color:status.c,fontWeight:700,fontSize:12}}>{status.t}</span></div><div style={{height:4,background:"#1a2a1a",borderRadius:2,marginTop:5,overflow:"hidden"}}><div style={{height:"100%",width:`${barPct}%`,background:status.c,transition:"all .2s"}}/></div></div>);})()}
        {grave&&<div style={{marginTop:6,padding:"6px 10px",background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:6,fontSize:10,color:"#f97316"}}>⚠ Wave {grave.wave} に装備 {grave.items.length}個 が眠っている</div>}
        <div style={{textAlign:"center",marginTop:10}}><GlowBtn on={startRun} color="#2563eb" style={{padding:"10px 48px",fontSize:15,letterSpacing:3}}>ランを開始</GlowBtn></div>
      </div>
      <div style={{display:"flex",background:"#090e09"}}>
        {["装備","合成","レリック"].map((t,i)=>(<button key={i} onClick={()=>{setHubTab(i);if(i!==1){setSynA(null);setSynB(null);}}} style={{flex:1,padding:"8px 0",background:"transparent",color:hubTab===i?["#f9a8d4","#fbbf24","#a5b4fc"][i]:"#3a5a3a",border:"none",borderBottom:hubTab===i?`2px solid ${["#f472b6","#fbbf24","#818cf8"][i]}`:"2px solid transparent",fontSize:12,cursor:"pointer",fontWeight:hubTab===i?700:400,letterSpacing:1,transition:"all .2s"}}>{t}{i===0?` (${stash.length})`:""}</button>))}
      </div>
      <div style={{background:"#090e09",minHeight:90,maxHeight:230,overflowY:"auto",padding:"10px 14px"}}>
        {hubTab===0&&(<div>
          <div style={{fontSize:10,color:"#5a7a5a",marginBottom:6}}>装備をタップでON/OFF — スロット <b style={{color:"#f9a8d4"}}>{equipped.length}/{maxSlots()}</b></div>
          {stash.length===0?<div style={{color:"#2a4a2a",fontSize:12,padding:16,textAlign:"center"}}>装備なし — ランで敵を倒してドロップ獲得</div>:
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{stash.map(item=>(<EqBadge key={item.uid} item={item} on={()=>toggleEquip(item)} active={!!equipped.find(e=>e.uid===item.uid)}/>))}</div>}
        </div>)}
        {hubTab===1&&(<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <span style={{fontSize:10,color:"#5a7a5a"}}>同ステータスはx1.5強化 / 異なるステータスは両方保持（最大5種）</span>
            {canBulk&&<GlowBtn on={bulkSynth} color="#d97706" style={{padding:"3px 10px",fontSize:10}}>一括合成</GlowBtn>}
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",justifyContent:"center",marginBottom:8,flexWrap:"wrap"}}>
            {[synA,synB].map((slot,i)=>(<div key={i} onClick={()=>{if(i===0)setSynA(null);else setSynB(null);}} style={{minWidth:90,minHeight:46,borderRadius:6,border:slot?`1px solid ${rarCol(slot)}`:"1px dashed #1a2a1a",background:slot?"rgba(255,255,255,0.02)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:slot?"pointer":"default",padding:4}}>
              {slot?<EqBadge item={slot} small/>:<span style={{fontSize:10,color:"#2a3a2a"}}>空</span>}
            </div>))}
            <span style={{fontSize:14,color:"#1a2a1a"}}>→</span>
            <div style={{minWidth:90,minHeight:46,borderRadius:6,border:synthRes?"1px solid #4ade80":"1px dashed #1a2a1a",background:synthRes?"rgba(74,222,128,0.04)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",padding:4}}>
              {synthRes?<EqBadge item={synthRes} small/>:synA&&synB&&!synthRes?<span style={{fontSize:9,color:"#ef4444"}}>5種超過</span>:<span style={{fontSize:10,color:"#2a3a2a"}}>結果</span>}
            </div>
          </div>
          {synthRes&&<div style={{textAlign:"center",marginBottom:6}}><GlowBtn on={doSynth} color="#d97706">合成する</GlowBtn></div>}
          <div style={{display:"flex",flexWrap:"wrap",gap:4}}>{stash.map(item=>{const sA=synA?.uid===item.uid,sB=synB?.uid===item.uid;return(<EqBadge key={item.uid} item={item} small on={()=>{if(sA)setSynA(null);else if(sB)setSynB(null);else if(!synA)setSynA(item);else if(!synB)setSynB(item);}} active={sA||sB}/>);})}</div>
        </div>)}
        {hubTab===2&&(<div>
          <div style={{fontSize:10,color:"#5a7a5a",marginBottom:6}}>永続パッシブ強化</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{RL.map(r=>{const lv=rlv[r.id];const maxed=r.mx&&lv>=r.mx;const cost=maxed?0:rlC(r,lv);const ok=!maxed&&tears>=cost;return(
            <button key={r.id} onClick={()=>buyRelic(r.id)} disabled={!ok} style={{minWidth:100,background:ok?"rgba(129,140,248,0.05)":"rgba(255,255,255,0.01)",border:"1px solid rgba(129,140,248,0.12)",borderRadius:6,padding:"6px 8px",cursor:ok?"pointer":"default",opacity:maxed?0.35:ok?1:0.45,color:"#c8d6c8",fontSize:10,textAlign:"left",transition:"all .2s"}}>
              <div><span style={{fontSize:13}}>{r.icon}</span> <span style={{fontWeight:700,color:"#a5b4fc"}}>{r.name}</span></div>
              <div style={{fontSize:9,color:"#4a6a4a",marginTop:2}}>{r.desc} — Lv <b>{lv}</b>{r.mx?`/${r.mx}`:""}</div>
              {!maxed?<div style={{fontSize:9,color:ok?"#93c5fd":"#333",marginTop:2}}>💧 {cost}</div>:<div style={{fontSize:9,color:"#fbbf24",marginTop:2}}>MAX</div>}
            </button>)})}</div>
        </div>)}
      </div>
    </div>);
  }

  /* ═══ RESULT ═══ */
  if(phase==="result"&&runResult){const r=runResult;return(<div style={{...css.root,padding:28,textAlign:"center"}}>
    <style>{`@keyframes fadeIn{from{opacity:0;transform:translate(-50%,-100%) translateY(4px)}to{opacity:1;transform:translate(-50%,-100%) translateY(0)}}`}</style>
    <div style={{fontSize:36,marginBottom:4}}>{r.vic?"✨":"💀"}</div>
    <h2 style={{fontSize:20,fontWeight:400,color:r.vic?"#fbbf24":"#ef4444",margin:"0 0 4px"}}>{r.vic?`Wave ${r.tgt} 達成!`:"生命の種が破壊された…"}</h2>
    <div style={{fontSize:11,color:"#6b8f6b",marginBottom:12}}>Wave {r.w}/{r.tgt} | 💀 {r.k}</div>
    <div style={{background:"rgba(255,255,255,0.02)",borderRadius:8,padding:14,maxWidth:420,margin:"0 auto 14px",border:"1px solid #162016"}}>
      <div style={{fontSize:14,color:"#93c5fd",fontFamily:"monospace",fontWeight:700}}>💧 {r.et}{r.vic?" (x2)":""}</div>
      {r.kept.length>0&&<><div style={{fontSize:11,color:"#4ade80",margin:"8px 0 4px"}}>🎒 {r.kept.length}個 持帰り</div><div style={{display:"flex",flexWrap:"wrap",gap:4,justifyContent:"center"}}>{r.kept.map(e=>(<EqBadge key={e.uid} item={e} small/>))}</div></>}
      {r.lostEq&&r.lostEq.length>0&&<><div style={{fontSize:11,color:"#ef4444",marginTop:8}}>⚠ {r.lostEq.length}個 ロスト（Wave {r.w} で回収可）</div><div style={{display:"flex",flexWrap:"wrap",gap:4,justifyContent:"center",marginTop:4}}>{r.lostEq.map(e=>(<EqBadge key={e.uid} item={e} small/>))}</div></>}
    </div>
    <GlowBtn on={()=>{setPhase("hub");setRunResult(null);}} color="#2563eb" style={{padding:"10px 36px",fontSize:14}}>拠点に戻る</GlowBtn>
  </div>);}

  /* ═══ RUN ═══ */
  const s=gs.current;const shopItems=runTab<3?TT.filter(t=>t.cat===runTab):[];
  return(<div style={{...css.root,position:"relative"}}>
    <style>{`@keyframes fadeIn{from{opacity:0;transform:translate(-50%,-100%) translateY(4px)}to{opacity:1;transform:translate(-50%,-100%) translateY(0)}}`}</style>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 12px",...css.panel,fontSize:11,flexWrap:"wrap",gap:3}}>
      <div style={{display:"flex",gap:9,alignItems:"center",color:"#6b8f6b",fontFamily:"monospace",fontSize:11}}>
        <span style={{color:"#93c5fd",fontWeight:700}}>💧{ui.t}</span>
        <span>W<b style={{color:"#e2e8f0"}}>{ui.w}</b><span style={{color:"#333"}}>/{s?.tgt||target}</span></span>
        <span>🧟{ui.zn}</span>
        <span style={{color:ui.chp/ui.cm>0.5?"#fbbf24":ui.chp/ui.cm>0.25?"#f97316":"#ef4444"}}>❤️{ui.chp}/{ui.cm}</span>
        <span style={{color:ui.tw>=ui.tm?"#ef4444":"#6b8f6b"}}>🏗{ui.tw}/{ui.tm}</span>
        {ui.nDrop>0&&<span style={{color:"#f9a8d4"}}>🎒{ui.nDrop}</span>}
      </div>
      <div style={{display:"flex",gap:4}}>
        <GlowBtn on={rushW} dis={!ui.canRush} color="#d97706" style={{padding:"3px 10px",fontSize:10}}>⚡追加</GlowBtn>
        <GlowBtn on={rushAllW} dis={!ui.canRush} color="#b91c1c" style={{padding:"3px 10px",fontSize:10}}>⚡全</GlowBtn>
        {(ui.go||ui.vic)&&<GlowBtn on={()=>setPhase("result")} color="#6366f1" style={{fontSize:10}}>結果</GlowBtn>}
      </div>
    </div>
    <canvas ref={cv} width={W} height={H} style={{width:"100%",display:"block",cursor:ui.pl?"crosshair":"default"}} onMouseMove={hM} onMouseLeave={hL} onClick={hC}/>
    <div style={{display:"flex",background:"#090e09",borderTop:"1px solid #162016"}}>
      {["攻撃","支援","防御"].map((t,i)=>(<button key={i} onClick={()=>setRunTab(i)} style={{flex:1,padding:"6px 0",background:"transparent",color:runTab===i?["#4ade80","#a78bfa","#f59e0b"][i]:"#3a5a3a",border:"none",borderBottom:runTab===i?`2px solid ${["#4ade80","#a78bfa","#f59e0b"][i]}`:"2px solid transparent",fontSize:11,cursor:"pointer",fontWeight:runTab===i?700:400,letterSpacing:0.5,transition:"all .2s"}}>{t}</button>))}
    </div>
    <div style={{display:"flex",gap:5,padding:"7px 10px",background:"#090e09",overflowX:"auto",minHeight:50}}>
      {shopItems.map(t=>{const cost=s?Math.floor(t.cost*s.costP):t.cost;const ok=ui.t>=cost&&!ui.go;const sel=s?.sel===t.id&&ui.pl;return(
        <button key={t.id} onClick={()=>selT(t.id)} disabled={ui.go} style={{flex:"0 0 auto",display:"flex",alignItems:"center",gap:6,minWidth:115,background:sel?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.015)",border:sel?`1px solid ${t.col}55`:"1px solid #162016",borderRadius:6,padding:"6px 9px",cursor:ok?"pointer":"default",opacity:ok?1:0.3,color:"#c8d6c8",fontSize:11,textAlign:"left",transition:"all .15s"}}>
          <div style={{width:24,height:24,borderRadius:5,background:t.col+"14",border:`1px solid ${t.col}44`,flexShrink:0,overflow:"hidden",position:"relative",boxShadow:`inset 0 0 8px ${t.col}22`}}>
            <img src={ASSET_PATHS.atlas} alt="" draggable={false} style={{position:"absolute",left:-(SPR.towers[t.id]?.[0]||0)*0.14,top:-(SPR.towers[t.id]?.[1]||0)*0.14,width:1254*0.14,height:1254*0.14,pointerEvents:"none"}}/>
          </div>
          <div><div style={{fontWeight:700,fontSize:10,color:t.col}}>{t.name}</div><div style={{fontSize:9,color:"#93c5fd",fontFamily:"monospace"}}>💧{cost}</div></div>
        </button>);})}
      {ui.pl&&<div style={{flex:"0 0 auto",padding:"0 8px",fontSize:10,color:"#4ade80",display:"flex",alignItems:"center",fontWeight:600}}>⇒ 配置</div>}
    </div>
  </div>);
}
