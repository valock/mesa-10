/* Mesa 10 · mesa contínua. Valores internos em centavos de real. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./engine.js'):root.MesaEngine);if(typeof module==='object'&&module.exports)module.exports=api;else root.MesaCash=api;})(typeof globalThis!=='undefined'?globalThis:this,function(E){
'use strict';
const POS=['BTN','UTG','UTG+1','UTG+2','MP','MP+1','LJ','HJ','CO'];
const STREETS=['Pré-flop','Flop','Turn','River'];
const money=n=>Math.round(n*100),bb=n=>n/100;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function rand(t){let x=t.seed|0;x^=x<<13;x^=x>>>17;x^=x<<5;t.seed=x>>>0;return t.seed/4294967296;}
const PROFILES=[
 ['guilherme','Guilherme','O Anfitrião',.40,.50,'Equilibra entradas e pressão.'],
 ['ernane','Ernane','O Estrategista',.28,.60,'Seleciona mais as mãos e aumenta com frequência.'],
 ['daniel','Daniel','O Explorador',.65,.40,'Entra em mais potes e observa as próximas cartas.'],
 ['joubert','Joubert','O Acelerador',.52,.82,'Pressiona com apostas e aumentos.'],
 ['gustavo','Gustavo','O Paciente',.24,.30,'Espera mais e controla o tamanho dos potes.'],
 ['lucas','Lucas','O Curioso',.72,.25,'Paga mais para continuar nas mãos.'],
 ['neves','Neves','O Calculista',.32,.64,'Combina seleção de mãos com iniciativa.'],
 ['vitor','Vitor','O Dinâmico',.55,.66,'Alterna entradas amplas e pressão.'],
 ['fernando','Fernando','O Observador',.42,.32,'Prefere acompanhar antes de acelerar.'],
 ['maycon','Maycon','O Ousado',.70,.76,'Disputa mais potes e aposta com frequência.'],
 ['lucas-cunhado','Lucas (cunhado do Ernane)','O Equilibrado',.38,.48,'Mistura cautela e iniciativa.'],
 ['negued','Negued','O Criativo',.60,.58,'Explora mais combinações e tamanhos.'],
 ['beto','Beto','O Mineiro',.45,.35,'Prefere potes controlados e observa a mesa.'],
 ['chico','Chico','O Veterano',.30,.55,'Seleciona entradas e valoriza a posição.'],
 ['rafa','Rafa','O Veloz',.58,.72,'Disputa a iniciativa com frequência.'],
 ['bia','Bia','A Analista',.32,.62,'Combina seleção e pressão.'],
 ['nina','Nina','A Cautelosa',.26,.30,'Evita potes grandes com mãos frágeis.'],
 ['duda','Duda','A Inquieta',.68,.57,'Explora mais entradas e alterna tamanhos.'],
 ['caio','Caio','O Tranquilo',.50,.28,'Acompanha mais e aumenta menos.']
].map(([id,name,nickname,loose,aggression,description])=>({id,name,nickname,loose,aggression,description,source:'fictional',version:1}));
function seatProfiles(t){if(t.rosterVersion)return;const roster=E.shuffle(PROFILES,()=>rand(t)).slice(0,8);t.players.slice(1).forEach((p,i)=>{const v=roster[i];if(t.session){const old=t.session.participants[participantId(p)];if(old){delete t.session.participants[old.id];old.id=v.id;old.name=v.name;t.session.participants[v.id]=old;}}p.name=v.name;p.profileId=v.id;p.nickname=v.nickname;p.style={loose:v.loose,aggression:v.aggression};});t.rosterVersion=1;t.rosterStart=t.history.length;if(t.session){const active=new Set(t.players.map(participantId));t.session.queue=PROFILES.filter(p=>!active.has(p.id)).map(p=>p.id);}}
const SESSION_HANDS=120;
function participantId(p){return p.profileId||(p.id===0?'hero':'legacy-seat-'+p.id);}
function ensureSession(t){
 if(t.session)return t.session;
 const active=t.hand&&t.hand.phase!=='finished';
 t.session={version:1,maxHands:Math.max(SESSION_HANDS,t.number+(active?0:1)),hours:5,handsPerHour:24,closed:false,participants:{},queue:[],rotations:[],startedAt:new Date().toISOString()};
 for(const p of t.players){const id=participantId(p);t.session.participants[id]={id,name:p.name,invested:p.id===0?(t.contributions??2200):t.number>0?(active?t.hand.startStacks[p.id]:p.stack)+200:2200,cashout:0,hands:p.id===0?t.history.length:0};}
 const seated=new Set(t.players.map(participantId));t.session.queue=E.shuffle(PROFILES.filter(p=>!seated.has(p.id)).map(p=>p.id),()=>rand(t));
 t.session.legacy=t.number>0;return t.session;
}
function joinSeat(t,seat){const ss=ensureSession(t),old=t.players[seat],oldId=participantId(old),out=ss.participants[oldId];
 if(out)out.cashout+=old.stack;
 const active=new Set(t.players.filter(p=>p.id!==seat).map(participantId));
 const index=ss.queue.findIndex(id=>id!==oldId&&!active.has(id));if(index<0)throw new Error('Elenco sem substituto disponível.');
 const id=ss.queue.splice(index,1)[0],v=PROFILES.find(p=>p.id===id);
 if(PROFILES.some(p=>p.id===oldId))ss.queue.push(oldId);
 if(!ss.participants[id])ss.participants[id]={id,name:v.name,invested:2200,cashout:0,hands:0};else ss.participants[id].invested+=2000;
 t.players[seat]={id:seat,name:v.name,profileId:v.id,nickname:v.nickname,style:{loose:v.loose,aggression:v.aggression},stack:2000,seatedAt:t.number+1};t.botRefills+=2000;
 ss.rotations.push({afterHand:t.number,seat,out:old.name,in:v.name});
}
function watch(t){if(t.session?.closed||!t.hand||t.hand.phase!=='finished'||t.spectating)return false;ensureSession(t);t.spectating=true;joinSeat(t,0);return true;}
function finishSession(t){const ss=ensureSession(t);if(ss.closed)return ss.result;if(t.number<ss.maxHands||(t.hand&&t.hand.phase!=='finished'))return null;
 const rows=Object.values(ss.participants).map(p=>{const seated=t.players.find(x=>participantId(x)===p.id),cashout=p.cashout+(seated?seated.stack:0)+(p.id==='hero'?t.reserve:0),net=cashout-p.invested,profitXP=Math.floor(Math.max(0,net)/100);return {...p,cashout,net,profitXP,xp:p.hands+profitXP};});
 ss.closed=true;ss.closedAt=new Date().toISOString();ss.result={id:t.id,hands:t.history.length,closedAt:ss.closedAt,rows:rows.sort((a,b)=>b.xp-a.xp||b.net-a.net||a.id.localeCompare(b.id))};return ss.result;
}
function ranking(tables){const all=new Map(),seen=new Set();for(const t of tables){if(seen.has(t.id)||!t.session?.closed)continue;seen.add(t.id);for(const p of t.session.result.rows){const r=all.get(p.id)||{id:p.id,name:p.name,xp:0,net:0,sessions:0};r.xp+=p.xp;r.net+=p.net;r.sessions++;all.set(p.id,r);}}return [...all.values()].sort((a,b)=>b.xp-a.xp||b.net-a.net||a.id.localeCompare(b.id));}
function opening(h){return h.kind==='omaha'?(h.houseRules===2?50:100):25;}
function potLimited(h){return h.kind==='omaha'&&(h.houseRules!==2||h.street===0);}
function decisionComment(d){if(!d||d.assisted)return null;const c=d.context;
 if(d.action==='fold'&&c.toCall===0)return {tone:'caution',title:'Aqui dava para pedir mesa.',text:'Você desistiu sem precisar pagar. Pedir mesa preservava sua chance de disputar o pote, sem custo agora.'};
 if(c.street===3&&d.equity!==null&&c.toCall>0){const gap=d.equity-d.price;if(Math.abs(gap)<.20)return null;
 if(d.action==='call'&&gap<0)return {tone:'caution',title:'Esse pagamento merece revisão.',text:'No modelo didático, a chance estimada ficou bem abaixo do preço para pagar. Compare o pote líquido e a faixa do adversário antes de colocar mais fichas.'};
 if((d.action==='fold'&&gap<0)||(d.action==='call'&&gap>0))return {tone:'good',title:'Boa leitura do preço neste modelo.',text:'Sua decisão acompanhou uma diferença ampla entre a estimativa e o custo para continuar. O resultado da mão ainda pode variar.'};}
 return null;
}
function make(options={},seed=Math.floor(E.random()*4294967295)||17){
 const t={version:3,currencyVersion:1,houseRake:0,entryFees:200,contributions:2200,ledger:[{type:'entry',net:-200}],ruleStart:0,id:'cash-'+Date.now().toString(36)+'-'+seed,seed:seed||17,config:{rule:'button',atmosphere:['mixed','pressure','wild'].includes(options.atmosphere)?options.atmosphere:'mixed'},players:[],dealer:0,number:0,hand:null,history:[],reserve:0,initialBankroll:2200,rebuyCount:0,botRefills:0,reportSeen:0};
 const names=['Você','Léo','Nina','Rafa','Bia','Caio','Duda','Gui','Iza'],styles=E.shuffle([{loose:.35,aggression:.65},{loose:.7,aggression:.22},{loose:.55,aggression:.8},{loose:.3,aggression:.4},{loose:.75,aggression:.55},{loose:.4,aggression:.5},{loose:.6,aggression:.35},{loose:.25,aggression:.7}],()=>rand(t));
 t.players=names.map((name,i)=>({id:i,name,stack:2000,...(i?{style:styles[i-1]}:{})}));t.dealer=Math.floor(rand(t)*9);seatProfiles(t);ensureSession(t);return t;
}
// Preserve completed results; refund and retain one unfinished hand from the old rules.
function upgrade(t){
 if(t.version>=3)return false;
 const h=t.hand;let refunded=false;
 if(h&&h.phase!=='finished'){
  t.cancelledHands||=[];t.cancelledHands.push({...h,cancelledAt:new Date().toISOString(),reason:'Atualização da regra de entrada',endStacks:t.players.map(p=>p.stack)});
  t.players.forEach((p,i)=>p.stack=h.startStacks[i]);
  t.number=Math.max(0,h.number-1);t.dealer=t.number?(h.dealer+8)%9:h.dealer;t.hand=null;refunded=true;
 }
 t.config.rule='button';t.version=3;t.ruleStart=t.history.length;t.reportSeen=0;t.ruleNotice={refunded};return true;
}
function position(t,seat=0){return POS[(seat-t.dealer+9)%9];}
function live(h){return h.folded.map((f,i)=>!f?i:-1).filter(i=>i>=0);}
function pot(t){const h=t.hand;return h?h.dead+h.total.reduce((a,b)=>a+b,0)-h.distributed:0;}
function log(t,type,seat=null,amount=0,extra={}){const h=t.hand;const ev={id:h.events.length+1,type,seat,amount,street:h.street,...extra};h.events.push(ev);h.event=ev;return ev;}
function minimum(t){return (t.number+1)%10===0?50:25;}
function start(t){
 if(t.hand&&t.hand.phase!=='finished')throw new Error('Conclua a mão atual.');
 if(t.session?.closed)return false;seatProfiles(t);const ss=ensureSession(t);if(t.number>=ss.maxHands){finishSession(t);return false;}
 if(!t.spectating&&t.players[0].stack<minimum(t))return false;
 if(t.number)t.dealer=(t.dealer+1)%9;
 for(let i=t.spectating?0:1;i<9;i++)if(t.players[i].stack===0)joinSeat(t,i);
 t.number++;const kind=t.number%10===0?'omaha':'holdem',deck=E.shuffle(E.deck(),()=>rand(t)),count=kind==='omaha'?4:2;
 const holes=Array.from({length:9},()=>[]);for(let r=0;r<count;r++)for(let off=1;off<=9;off++)holes[(t.dealer+off)%9].push(deck.pop());
 const board=deck.splice(0,5);
 t.hand={playerIds:t.players.map(participantId),playerNames:t.players.map(p=>p.name),houseRules:2,id:t.id+'-'+t.number,number:t.number,kind,dealer:t.dealer,rule:t.config.rule,atmosphere:t.config.atmosphere,phase:'posting',street:0,board,visible:0,holes,dealt:[0,0,0,0,0,0,0,0,0],startStacks:t.players.map(p=>p.stack),total:[0,0,0,0,0,0,0,0,0],wagers:[0,0,0,0,0,0,0,0,0],folded:[false,false,false,false,false,false,false,false,false],dead:0,distributed:0,currentBet:0,lastRaise:kind==='omaha'?50:25,acted:[false,false,false,false,false,false,false,false,false],actedAt:[0,0,0,0,0,0,0,0,0],pending:[false,false,false,false,false,false,false,false,false],actor:null,events:[],decisions:[],postIndex:0,dealIndex:0,roundRaises:0,payouts:null,settleIndex:0,showdown:false,assisted:false,mood:(rand(t)-.5)*(t.config.atmosphere==='wild'?.6:.14),finishedAt:null};
 log(t,'button',t.dealer);return true;
}
function spend(t,seat,amount,dead=false){const h=t.hand,n=Math.min(t.players[seat].stack,Math.max(0,Math.round(amount)));t.players[seat].stack-=n;if(dead)h.dead+=n;else{h.total[seat]+=n;h.wagers[seat]+=n;}return n;}
function orderNext(t,seat){const h=t.hand;for(let n=1;n<=9;n++){const i=(seat+n)%9;if(h.pending[i]&&!h.folded[i]&&t.players[i].stack>0)return i;}return null;}
function settleRound(t){const h=t.hand;if(live(h).length===1){h.phase='collect';h.actor=null;return;}
 const can=live(h).filter(i=>t.players[i].stack>0);if(can.length<=1)for(const i of can)if(h.wagers[i]>=h.currentBet)h.pending[i]=false;
 const next=orderNext(t,h.actor??t.dealer);if(next===null){h.phase='collect';h.actor=null;}else h.actor=next;
}
function beginRound(t){const h=t.hand;h.phase='betting';h.pending=t.players.map((p,i)=>p.stack>0&&!h.folded[i]);h.acted=Array(9).fill(false);h.actedAt=Array(9).fill(0);h.roundRaises=0;
 h.actor=h.houseRules===2&&h.kind==='omaha'&&h.street===0?(t.dealer+8)%9:t.dealer;settleRound(t);
}
function legal(t,seat=t.hand.actor){const h=t.hand;if(h.phase!=='betting'||seat===null||seat!==h.actor)return null;
 const stack=t.players[seat].stack,call=Math.min(stack,Math.max(0,h.currentBet-h.wagers[seat]));
 const reopen=!h.acted[seat]||h.currentBet-h.actedAt[seat]>=h.lastRaise;
 const minTo=h.currentBet?h.currentBet+h.lastRaise:opening(h);
 const stackTo=h.wagers[seat]+stack,cap=potLimited(h)?Math.min(stackTo,h.wagers[seat]+pot(t)+2*call):stackTo;
 const maxTo=cap===stackTo?stackTo:Math.floor(cap/25)*25,roundedMin=Math.ceil(minTo/25)*25;const raise=reopen&&stack>call&&maxTo>h.currentBet&&(maxTo>=roundedMin||maxTo===stackTo);
 return {fold:true,check:call===0,call,minTo:Math.min(roundedMin,maxTo),fullMinTo:roundedMin,maxTo,raise,allIn:raise&&maxTo===stackTo,stack,already:h.wagers[seat],currentBet:h.currentBet};
}
function sizing(l,n){const rounded=Math.floor(n/25)*25;return Math.min(l.maxTo,Math.max(l.minTo,rounded));}
function holePower(cards){const vals=cards.map(c=>E.rankValue(c[0])).sort((a,b)=>b-a),pair=vals[0]===vals[1];if(cards.length===2)return clamp((vals[0]+vals[1]-4)/26*.65+(pair?.3:0)+(cards[0][1]===cards[1][1]?.06:0)+(vals[0]-vals[1]<=2?.06:0),.05,.99);
 const counts={};vals.forEach(v=>counts[v]=(counts[v]||0)+1);const suits={};cards.forEach(c=>suits[c[1]]=(suits[c[1]]||0)+1);return clamp(vals.reduce((a,b)=>a+b,0)/56*.52+Object.values(counts).filter(n=>n>=2).length*.12+Object.values(suits).filter(n=>n===2).length*.1+(new Set(vals).size>=3&&vals[0]-vals.at(-1)<=5?.12:0),.1,.98);
}
function bot(t,seat){const h=t.hand,l=legal(t,seat),style=t.players[seat].style,pressure=t.config.atmosphere==='pressure'?.18:0,agg=clamp(style.aggression+pressure+h.mood,.1,.95),loose=style.loose;
 let power=holePower(h.holes[seat]);if(h.street){const made=(h.kind==='omaha'?E.bestOmaha:E.bestHoldem)(h.holes[seat],h.board.slice(0,h.visible));power=clamp(.1+made.category*.14+(made.vector[1]||0)/140,0,.99);}
 const odds=l.call/(pot(t)+l.call),r=rand(t),raiseChance=agg*(power>.65?.65:.13);
 if(l.raise&&h.roundRaises<3&&r<raiseChance){const fractions=t.config.atmosphere==='pressure'?[.75,1,1.25]:[.33,.5,.75,1],size=fractions[Math.floor(rand(t)*fractions.length)];const target=h.street===0?Math.max(l.fullMinTo,h.currentBet?Math.round(h.currentBet*(2.2+rand(t))):63):Math.max(l.fullMinTo,l.already+l.call+Math.round((pot(t)+l.call)*size));return {action:'raise',to:sizing(l,target)};}
 if(l.call){const confidence=power+loose*.23-odds*.6;return {action:confidence<.33&&rand(t)>.12?'fold':'call'};}
 if(l.raise&&h.currentBet===0&&rand(t)<agg*(.28+power*.5)){return {action:'raise',to:sizing(l,Math.max(opening(h),pot(t)*(rand(t)<.5?.5:.75)))};}
 return {action:'check'};
}
/* Leitura pública: o que cada adversário ativo fez nesta mão. Nunca usa cartas ocultas.
   Código por ação: rua + l (pagou a entrada), c (pagou aposta ou aumento), r (aumentou), b (abriu aposta), x (mesa). */
function reads(h){const out=[],raised=[false,false,false,false];const acts={};for(const e of h.events||[]){if(!['raise','call','check'].includes(e.type)||e.seat===0||e.seat===null)continue;const st=e.street||0;let k=e.type==='check'?'x':e.type==='call'?(st===0&&!raised[0]?'l':'c'):(st>0&&!e.previousBet?'b':'r');if(e.type==='raise')raised[st]=true;(acts[e.seat]||=[]).push(st+k);}
 for(const seat of live(h))if(seat!==0)out.push((acts[seat]||[]).join(''));return out;}
function readFactors(hole,read,board,kind){const pre=holePower(hole),evaluate=kind==='omaha'?E.bestOmaha:E.bestHoldem,seen={},out=[];
 for(let i=0;i+1<read.length;i+=2){const st=Number(read[i]),k=read[i+1];if(st>0&&board.length<st+2)continue;out.push(()=>{if(st===0)return k==='r'?(pre>.65?1:.2):k==='c'?clamp((pre-.35)/.25,.12,1):k==='l'?clamp((pre-.25)/.25,.15,1):(pre>.65?.5:1);
   if(seen[st]===undefined){const made=evaluate(hole,board.slice(0,st+2));seen[st]=clamp(.1+made.category*.14+(made.vector[1]||0)/140,0,.99);}const m=seen[st];return k==='r'?(m>.65?1:.2):k==='b'?.28+m*.5:k==='c'?clamp((m-.2)/.25,.12,1):1-(.28+m*.5)*.5;});}
 return out;}
function likelihood(hole,read,board,kind){return read?readFactors(hole,read,board,kind).reduce((w,f)=>w*f(),1):1;}
/* Aceita a mão com probabilidade igual ao produto dos fatores, parando no primeiro que rejeita. */
function consistent(hole,read,board,kind,rng){for(const f of readFactors(hole,read,board,kind))if(rng()>=f())return false;return true;}
function publicSpot(t){const h=t.hand,l=legal(t,0);if(!l)return null;return {currencyVersion:t.currencyVersion||0,kind:h.kind,number:h.number,street:h.street,position:position(t),rule:t.config.rule,cards:[...h.holes[0]],board:h.board.slice(0,h.visible),pot:bb(pot(t)),stack:bb(t.players[0].stack),toCall:bb(l.call),minRaiseTo:bb(l.minTo),maxRaiseTo:bb(l.maxTo),currentBet:bb(h.currentBet),already:bb(l.already),canRaise:l.raise,canCheck:l.check,opponents:live(h).length-1,opened:h.roundRaises>0,assisted:h.assisted,reads:reads(h)};}
const equityCache=new Map();
function equity(spot){const ranged=Array.isArray(spot.reads)&&spot.reads.some(Boolean),key=JSON.stringify([spot.kind,spot.cards,spot.board,spot.opponents,ranged?spot.reads:0]);if(equityCache.has(key))return equityCache.get(key);
 if(!spot.board.length)return null;
 const rng=E.seededRandom(key),known=[...spot.cards,...spot.board],available=E.deck().filter(c=>!known.includes(c)),evaluate=spot.kind==='omaha'?E.bestOmaha:E.bestHoldem,count=spot.kind==='omaha'?4:2,n=spot.kind==='omaha'?120:ranged?260:200,limit=spot.kind==='omaha'?8:14,tries=Array(spot.opponents).fill(0),kept=Array(spot.opponents).fill(0);let score=0;
 for(let i=0;i<n;i++){const shuffled=E.shuffle(available,rng),holes=[];
  for(let o=0;o<spot.opponents;o++){const read=ranged?spot.reads[o]:'';let hole=shuffled.splice(0,count);if(read){for(let attempt=0;attempt<limit;attempt++){tries[o]++;if(consistent(hole,read,spot.board,spot.kind,rng)){kept[o]++;break;}if(attempt===limit-1)break;shuffled.push(...hole);hole=shuffled.splice(0,count);}}holes.push(hole);}
  const board=[...spot.board,...shuffled.splice(0,5-spot.board.length)],hero=evaluate(spot.cards,board);let beaten=false,ties=1;for(const hole of holes){const other=evaluate(hole,board),cmp=E.compareVectors(hero.vector,other.vector);if(cmp<0){beaten=true;break;}if(cmp===0)ties++;}if(!beaten)score+=1/ties;}
 const result={value:score/n,samples:n,ranged,ranges:ranged?tries.map((t,o)=>t?Math.round(Math.max(kept[o],1)/t*100)/100:1):null};if(equityCache.size>150)equityCache.clear();equityCache.set(key,result);return result;
}
function reference(s){const gross=money(s.pot+s.toCall),fee=s.currencyVersion?rake(gross):0;const price=s.toCall/(bb(gross-fee))||0;let expected,accepted,reason,theme,eq=null,ranged=false,ranges=null,line=null;
 if(s.street===0){const power=holePower(s.cards),pos=({'UTG+1':'UTG','UTG+2':'UTG',MP:'UTG','MP+1':'HJ',LJ:'HJ',BB:'SB'})[s.position]||s.position;
  if(!s.opened){const open=s.kind==='holdem'?E.recommended(pos,s.cards)==='raise':power>=.62;expected=open&&s.canRaise?'raise':s.canCheck?'check':'fold';theme='selection';reason=s.kind==='holdem'?`${E.handClass(s.cards)} no ${s.position}: referência de seleção por posição. ${s.rule==='button'?'A entrada do dealer já vale como aposta. Esta faixa por ordem de ação é apenas uma aproximação para a regra da mesa.':'Faixa didática de abertura, sem rake.'}`:'No Omaha, priorize cartas conectadas, pares altos e naipes que trabalhem juntos. Referência heurística de seleção.';}
  else{expected=power>=.87&&s.canRaise?'raise':power>=(s.kind==='omaha'?.61:.57)?s.toCall?'call':s.canRaise?'raise':'check':s.canCheck?'check':'fold';theme='defense';reason='Ao enfrentar aumento, a referência fica mais seletiva. Força inicial, posição e preço importam; não é um range de defesa resolvido por solver.';}
  accepted=[expected];
 }else{const est=equity(s);eq=est.value;ranged=est.ranged;ranges=est.ranges;line=ranged?.6:.65;const made=(s.kind==='omaha'?E.bestOmaha:E.bestHoldem)(s.cards,s.board);
  if(s.toCall){expected=eq>=price?'call':'fold';accepted=Math.abs(eq-price)<=.07?['call','fold']:[expected];if(eq>.82&&s.canRaise)accepted.push('raise');theme='price';reason=`Equidade estimada ${Math.round(eq*100)}% contra ${ranged?`a faixa estimada de ${s.opponents} adversário(s), pelas ações desta mão`:`${s.opponents} mão(s) aleatória(s)`}; preço ${Math.round(price*100)}%${s.currencyVersion?' após taxa estimada da casa':''}. No flop/turn, apostas futuras podem mudar o valor de pagar. ${ranged?'A faixa é uma estimativa a partir do que cada um fez; não usa cartas ocultas nem o estilo individual.':'A faixa não foi ajustada ao perfil do adversário.'}`;}
  else{expected=eq>line&&made.category>=1&&s.canRaise?'raise':'check';accepted=Math.abs(eq-line)<.1?['raise','check']:[expected];theme='value';reason=`Equidade estimada ${Math.round(eq*100)}%. O modelo sugere ${expected==='raise'?'apostar por valor':'controlar o pote'} contra ${ranged?'a faixa estimada dos adversários. Quem paga uma aposta costuma ter uma faixa ainda mais forte.':'mãos aleatórias. Uma faixa que paga pode ser mais forte que essa amostra.'}`;}
 }
 return {expected,accepted,reason,theme,equity:eq,price,ranged,ranges,line};
}
function act(t,action,to,options={}){const h=t.hand,seat=h.actor,l=legal(t,seat);if(!l)throw new Error('Não é hora de agir.');
 if(!['fold','check','call','raise'].includes(action)||action==='check'&&!l.check||action==='call'&&!l.call||action==='raise'&&(!l.raise||!Number.isInteger(to)||to<l.minTo||to>l.maxTo||(to%25!==0&&!(l.allIn&&to===l.maxTo))))throw new Error('Ação ou valor inválido.');
 if(seat===0&&!t.spectating){const context=publicSpot(t),ref=reference(context);h.decisions.push({id:h.decisions.length+1,context,action,to:action==='raise'?bb(to):null,correct:ref.accepted.includes(action),...ref,villains:ref.ranges?live(h).filter(i=>i!==0).map(i=>t.players[i].name):null,assisted:h.assisted});h.assisted=false;}
 let amount=0;const previousBet=h.currentBet;
 if(action==='fold')h.folded[seat]=true;
 if(action==='call')amount=spend(t,seat,l.call);
 if(action==='raise'){const old=h.currentBet;amount=spend(t,seat,to-h.wagers[seat]);h.currentBet=h.wagers[seat];const increment=h.currentBet-old;if(increment>=h.lastRaise)h.lastRaise=increment;h.roundRaises++;for(let i=0;i<9;i++)if(i!==seat&&!h.folded[i]&&t.players[i].stack>0&&h.wagers[i]<h.currentBet)h.pending[i]=true;}
 h.acted[seat]=true;h.actedAt[seat]=h.currentBet;h.pending[seat]=false;
 log(t,action,seat,amount,{to:h.wagers[seat],previousBet,allIn:t.players[seat].stack===0});settleRound(t);return h.event;
}
function rake(cents){return cents>1000?Math.round(cents*0.05):0;}
function payoutPlan(t){const h=t.hand,contenders=live(h),result=[],evaluated={};
 const sorted=[...h.total].sort((a,b)=>b-a),refund=Math.max(0,sorted[0]-sorted[1]),gross=h.dead+h.total.reduce((a,b)=>a+b,0)-refund;
 h.grossPot=gross;h.rake=t.currencyVersion?rake(gross):0;let feeLeft=h.rake,grossLeft=gross;
 const score=i=>evaluated[i]||=(h.kind==='omaha'?E.bestOmaha:E.bestHoldem)(h.holes[i],h.board);
 function award(amount,eligible,label){if(!amount)return;const fee=grossLeft===amount?feeLeft:Math.floor(h.rake*amount/Math.max(1,gross));grossLeft-=amount;feeLeft-=fee;amount-=fee;if(!eligible.length)throw new Error('Pote sem jogador elegível.');let winners=[eligible[0]];if(eligible.length>1){for(const i of eligible.slice(1)){const cmp=E.compareVectors(score(i).vector,score(winners[0]).vector);if(cmp>0)winners=[i];else if(cmp===0)winners.push(i);}}
  winners.sort((a,b)=>((a-t.dealer+8)%9)-((b-t.dealer+8)%9));const share=Math.floor(amount/winners.length),odd=amount%winners.length;winners.forEach((seat,i)=>result.push({seat,amount:share+(i<odd?1:0),type:'award',label}));
 }
 {if(h.dead)award(h.dead,contenders,'Ante do botão');let prev=0;const levels=[...new Set(h.total.filter(n=>n>0))].sort((a,b)=>a-b);for(const level of levels){const contributors=h.total.map((n,i)=>n>=level?i:-1).filter(i=>i>=0),amount=(level-prev)*contributors.length;prev=level;if(contributors.length===1)result.push({seat:contributors[0],amount,type:'refund',label:'Aposta não paga'});else award(amount,contributors.filter(i=>!h.folded[i]),result.length?'Pote lateral':'Pote principal');}}
 h.evaluated=Object.fromEntries(Object.entries(evaluated).map(([i,v])=>[i,{name:v.name,holeUsed:v.holeUsed,boardUsed:v.boardUsed,vector:v.vector}]));return result;
}
function revealedHands(t){const h=t.hand;if(!h||!['settle','finished'].includes(h.phase))return [];const board=h.board.slice(0,h.visible);return h.holes.map((hole,seat)=>{const evaluated=board.length>=3?(h.kind==='omaha'?E.bestOmaha:E.bestHoldem)(hole,board):null;return {seat,name:t.players[seat].name,position:position(t,seat),cards:[...hole],folded:h.folded[seat],won:(h.payouts||[]).some(p=>p.seat===seat&&p.type==='award'),combination:evaluated?{name:evaluated.name,holeUsed:evaluated.holeUsed,boardUsed:evaluated.boardUsed}:null};});}
function finish(t){const h=t.hand;h.phase='finished';h.actor=null;h.finishedAt=new Date().toISOString();h.delta=t.spectating?0:t.players[0].stack-h.startStacks[0];h.endStacks=t.players.map(p=>p.stack);
 const record={playerIds:h.playerIds,playerNames:h.playerNames,rake:bb(h.rake||0),grossPot:bb(h.grossPot||0),net:bb(t.spectating?t.session.participants.hero.cashout+t.reserve-t.contributions:t.reserve+t.players[0].stack-(t.contributions??t.initialBankroll)),id:h.id,number:h.number,kind:h.kind,rule:h.rule,atmosphere:h.atmosphere,position:position(t),delta:bb(h.delta),stack:bb(t.spectating?t.session.participants.hero.cashout:t.players[0].stack),bankroll:bb(t.reserve+(t.spectating?t.session.participants.hero.cashout:t.players[0].stack)),cards:[...h.holes[0]],board:h.board.slice(0,h.visible),showdown:h.showdown,revealed:revealedHands(t),decisions:JSON.parse(JSON.stringify(h.decisions)),events:h.events.filter(e=>!['deal','reveal','button'].includes(e.type)),payouts:h.payouts,finishedAt:h.finishedAt};t.history.push(record);if(t.currencyVersion)t.ledger.push({type:'hand',hand:h.number,net:money(record.net)});log(t,'finished',0,h.delta);const ss=ensureSession(t);for(const id of h.playerIds||t.players.map(participantId))if(ss.participants[id])ss.participants[id].hands++;if(t.number>=ss.maxHands)finishSession(t);
}
function step(t){const h=t.hand;if(!h||h.phase==='finished')return false;
 if(h.phase==='posting'){const posts=[{seat:t.dealer,amount:opening(h)}];const post=posts[h.postIndex++];if(post){const n=spend(t,post.seat,post.amount,post.dead);h.currentBet=Math.max(opening(h),...h.wagers);log(t,'entry',post.seat,n);return true;}h.phase='dealing';}
 if(h.phase==='dealing'){const count=h.kind==='omaha'?4:2;if(h.dealIndex<count*9){const seat=(t.dealer+1+h.dealIndex)%9;h.dealt[seat]++;h.dealIndex++;log(t,'deal',seat);return true;}beginRound(t);return true;}
 if(h.phase==='betting'){if(h.actor===0&&!t.spectating)return false;if(h.actor===null){settleRound(t);return true;}const choice=bot(t,h.actor);act(t,choice.action,choice.to);return true;}
 if(h.phase==='collect'){const amounts=[...h.wagers];h.wagers.fill(0);h.currentBet=0;h.lastRaise=opening(h);log(t,'collect',null,amounts.reduce((a,b)=>a+b,0),{amounts});if(live(h).length===1||h.street===3){h.showdown=live(h).length>1;h.phase='settle';}else{h.street++;h.phase='reveal';}return true;}
 if(h.phase==='reveal'){const count=h.street+2;if(h.visible<count){h.visible++;log(t,'reveal',null,0,{cardIndex:h.visible-1});return true;}beginRound(t);return true;}
 if(h.phase==='settle'){h.revealedSeats ||= [];if(h.revealedSeats.length<9){const seat=(t.dealer+1+h.revealedSeats.length)%9;h.revealedSeats.push(seat);log(t,'show-cards',seat);return true;}if(!h.payouts){h.payouts=payoutPlan(t);h.distributed+=h.rake||0;t.houseRake=(t.houseRake||0)+(h.rake||0);log(t,'showdown');return true;}const pay=h.payouts[h.settleIndex++];if(pay){t.players[pay.seat].stack+=pay.amount;h.distributed+=pay.amount;log(t,pay.type,pay.seat,pay.amount,{label:pay.label});return true;}finish(t);return true;}
 return false;
}
function runToHero(t,max=500){let steps=0;while(steps++<max&&step(t)){}if(steps>=max)throw new Error('Limite de ações excedido.');return t.hand;}
function rebuy(t){if(t.session?.closed||t.spectating)return false;if(t.hand&&t.hand.phase!=='finished')return false;t.players[0].stack+=2000;t.contributions=(t.contributions??t.initialBankroll)+2000;t.rebuyCount++;if(t.session?.participants.hero)t.session.participants.hero.invested+=2000;t.ledger||=[];t.ledger.push({type:'rebuy',net:t.reserve+t.players[0].stack-t.contributions});return true;}
function visible(t){const h=t.hand;if(!h)return null;return {number:h.number,kind:h.kind,phase:h.phase,street:h.street,dealer:t.dealer,actor:h.actor,pot:bb(pot(t)),centerPot:bb(Math.max(0,pot(t)-h.wagers.reduce((a,b)=>a+b,0))),board:h.board.slice(0,h.visible),event:h.event,players:t.players.map((p,i)=>({seat:i,name:p.name,stack:bb(p.stack),position:position(t,i),folded:h.folded[i],wager:bb(h.wagers[i]),dealt:h.dealt[i],cards:i===0?h.holes[i].slice(0,h.dealt[i]):h.phase==='finished'||(h.phase==='settle'&&h.revealedSeats?.includes(i))?h.holes[i]:null,allIn:p.stack===0})),legal:h.actor===0&&!t.spectating?legal(t,0):null};}
/* Leitura no estilo de ferramentas GTO: números do spot, textura do board e nota por decisão.
   Tudo deriva do modelo didático já registrado na decisão; não é saída de solver. */
const GRADES={best:{label:'Melhor jogada',weight:100},ok:{label:'Boa alternativa',weight:90},inaccuracy:{label:'Imprecisão',weight:55},mistake:{label:'Erro',weight:25},blunder:{label:'Erro grave',weight:0}};
const RANGE_ORDER=['UTG','HJ','CO','BTN'];
function rangeGroup(position){return ({'UTG+1':'UTG','UTG+2':'UTG',MP:'UTG','MP+1':'HJ',LJ:'HJ',BB:'SB'})[position]||position;}
function texture(board){if(!board||board.length<3)return null;
 const vals=board.map(c=>E.rankValue(c[0])),suits={};board.forEach(c=>suits[c[1]]=(suits[c[1]]||0)+1);const flush=Math.max(...Object.values(suits)),paired=new Set(vals).size<vals.length;
 const span=list=>{let best=1;for(let i=0;i<list.length;i++){let n=1;for(let j=i+1;j<list.length&&list[j]-list[i]<=4;j++)n++;best=Math.max(best,n);}return best;},plain=[...new Set(vals)].sort((a,b)=>a-b),low=[...new Set(vals.map(v=>v===14?1:v))].sort((a,b)=>a-b),wheel=span(low);let run=Math.max(span(plain),wheel>=3?wheel:1);if(run===2&&!plain.some((v,i)=>i&&v-plain[i-1]<=2))run=1;
 const high=vals.filter(v=>v>=10).length,score=(flush>=3?2:flush===2&&board.length<5?1:0)+(run>=3?2:run===2&&board.length<5?1:0),key=score>=3?'wet':score>=1?'semi':'dry',tags=[];
 tags.push(flush>=4?'quatro cartas do mesmo naipe':flush===3?'três cartas do mesmo naipe':flush===2&&board.length<5?'dois naipes iguais':'naipes variados');
 if(run>=3)tags.push('cartas conectadas');else if(run===2&&board.length<5)tags.push('alguma conexão');else tags.push('cartas distantes');
 if(paired)tags.push('mesa pareada');if(high>=2)tags.push('cartas altas');
 return {key,label:{dry:'Board seco',semi:'Board semi-coordenado',wet:'Board coordenado'}[key],tags,paired,flush,run,sizing:{dry:'Em boards secos, ferramentas de estudo costumam usar apostas menores (25–33% do pote) com mais frequência.',semi:'Em boards semi-coordenados, tamanhos médios (50–66% do pote) aparecem com frequência nas ferramentas de estudo.',wet:'Em boards coordenados, ferramentas de estudo costumam apostar maior (66–100% do pote) e com menos mãos.'}[key]};}
function spotMetrics(c){if(!c)return null;const pot=Number(c.pot)||0,call=Number(c.toCall)||0,before=Math.max(0,pot-call),gross=money(pot+call),fee=c.currencyVersion?rake(gross):0,net=bb(gross-fee);
 return {potOdds:call&&net>0?call/net:null,betPct:call&&before>0?call/before:null,mdf:call&&pot>0&&c.opponents===1?clamp(1-call/pot,0,1):null,spr:pot>0&&c.stack!==undefined?c.stack/pot:null,texture:texture(c.board),finalPot:net};}
function inRange(group,cards){try{return E.RANGES[group]?E.RANGES[group].has(E.handClass(cards)):null;}catch(e){return null;}}
function grade(d){const done=(key,loss=null,ratio=null)=>({key,label:GRADES[key].label,weight:GRADES[key].weight,loss:loss===null?null:Math.round(loss*100)/100,ratio});
 if(!d||!d.context)return done('ok');const c=d.context,accepted=d.accepted||[d.expected];
 if(d.action===d.expected)return done('best');if(accepted.includes(d.action))return done('ok');
 const m=spotMetrics(c),eq=typeof d.equity==='number'?d.equity:null,byGap=(gap,a,b)=>gap<=a?'inaccuracy':gap<=b?'mistake':'blunder';
 if(d.action==='fold'&&!c.toCall){if(eq===null)return done('mistake');const pot=bb(money(c.pot)-(c.currencyVersion?rake(money(c.pot)):0));return done(byGap(eq,.12,.30),eq*pot,eq);}
 if(c.street>0&&c.toCall>0&&eq!==null&&d.price>0){const gap=Math.abs(eq-d.price);return done(byGap(gap,.15,.30),gap*m.finalPot,gap);}
 if(c.street>0&&eq!==null)return done(Math.abs(eq-(d.line||.65))<.25?'inaccuracy':'mistake');
 if(c.street===0&&c.kind==='holdem'&&!c.opened&&d.theme!=='defense'){const group=rangeGroup(c.position),entered=d.action==='raise'||d.action==='call';
  if(d.expected==='raise')return done(entered?'inaccuracy':inRange('UTG',c.cards)?'mistake':'inaccuracy');
  return done(entered&&inRange('BTN',c.cards)&&group!=='BTN'?'inaccuracy':'mistake');}
 if(c.street===0&&c.cards){const power=holePower(c.cards),call=c.kind==='omaha'?.61:.57,line=d.theme==='defense'?(d.expected==='raise'?.87:call):.62;
  if(d.theme==='defense'&&d.expected==='raise')return done(d.action==='fold'?'mistake':'inaccuracy');
  if(d.theme==='defense'&&d.expected!=='fold'&&d.expected!=='check'&&d.action==='raise')return done('inaccuracy');
  return done(Math.abs(power-line)<.08?'inaccuracy':'mistake');}
 return done('inaccuracy');}
function callEV(d){if(!d||!d.context||!(d.context.street>0)||!(d.context.toCall>0)||typeof d.equity!=='number'||!(d.price>0))return null;return Math.round(d.context.toCall*(d.equity/d.price-1)*100)/100;}
return {reads,likelihood,consistent,GRADES,RANGE_ORDER,rangeGroup,texture,spotMetrics,grade,callEV,SESSION_HANDS,ensureSession,finishSession,watch,ranking,participantId,PROFILES,decisionComment,opening,potLimited,sizing,minimum,rake,make,upgrade,start,step,act,legal,position,pot,visible,runToHero,rebuy,publicSpot,reference,equity,holePower,payoutPlan,revealedHands,bb,money,STREETS};
});
