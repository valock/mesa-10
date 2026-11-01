/* Mesa 10 · mesa contínua. Valores internos em centavos de real. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./engine.js'):root.MesaEngine);if(typeof module==='object'&&module.exports)module.exports=api;else root.MesaCash=api;})(typeof globalThis!=='undefined'?globalThis:this,function(E){
'use strict';
const POS=['BTN','UTG','UTG+1','UTG+2','MP','MP+1','LJ','HJ','CO'];
const STREETS=['Pré-flop','Flop','Turn','River'];
const money=n=>Math.round(n*100),bb=n=>n/100;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function rand(t){let x=t.seed|0;x^=x<<13;x^=x>>>17;x^=x<<5;t.seed=x>>>0;return t.seed/4294967296;}
function make(options={},seed=Math.floor(E.random()*4294967295)||17){
 const t={version:3,currencyVersion:1,houseRake:0,entryFees:200,contributions:2200,ledger:[{type:'entry',net:-200}],ruleStart:0,id:'cash-'+Date.now().toString(36)+'-'+seed,seed:seed||17,config:{rule:'button',atmosphere:['mixed','pressure','wild'].includes(options.atmosphere)?options.atmosphere:'mixed'},players:[],dealer:0,number:0,hand:null,history:[],reserve:0,initialBankroll:2200,rebuyCount:0,botRefills:0,reportSeen:0};
 const names=['Você','Léo','Nina','Rafa','Bia','Caio','Duda','Gui','Iza'],styles=E.shuffle([{loose:.35,aggression:.65},{loose:.7,aggression:.22},{loose:.55,aggression:.8},{loose:.3,aggression:.4},{loose:.75,aggression:.55},{loose:.4,aggression:.5},{loose:.6,aggression:.35},{loose:.25,aggression:.7}],()=>rand(t));
 t.players=names.map((name,i)=>({id:i,name,stack:2000,...(i?{style:styles[i-1]}:{})}));t.dealer=Math.floor(rand(t)*9);return t;
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
function minimum(t){return (t.number+1)%10===0?100:25;}
function start(t){
 if(t.hand&&t.hand.phase!=='finished')throw new Error('Conclua a mão atual.');
 if(t.players[0].stack<minimum(t))return false;
 if(t.number)t.dealer=(t.dealer+1)%9;
 for(let i=1;i<9;i++)if(t.players[i].stack<minimum(t)){const add=2000-t.players[i].stack;t.players[i].stack+=add;t.botRefills+=add;}
 t.number++;const kind=t.number%10===0?'omaha':'holdem',deck=E.shuffle(E.deck(),()=>rand(t)),count=kind==='omaha'?4:2;
 const holes=Array.from({length:9},()=>[]);for(let r=0;r<count;r++)for(let off=1;off<=9;off++)holes[(t.dealer+off)%9].push(deck.pop());
 const board=deck.splice(0,5);
 t.hand={id:t.id+'-'+t.number,number:t.number,kind,dealer:t.dealer,rule:t.config.rule,atmosphere:t.config.atmosphere,phase:'posting',street:0,board,visible:0,holes,dealt:[0,0,0,0,0,0,0,0,0],startStacks:t.players.map(p=>p.stack),total:[0,0,0,0,0,0,0,0,0],wagers:[0,0,0,0,0,0,0,0,0],folded:[false,false,false,false,false,false,false,false,false],dead:0,distributed:0,currentBet:0,lastRaise:kind==='omaha'?100:25,acted:[false,false,false,false,false,false,false,false,false],actedAt:[0,0,0,0,0,0,0,0,0],pending:[false,false,false,false,false,false,false,false,false],actor:null,events:[],decisions:[],postIndex:0,dealIndex:0,roundRaises:0,payouts:null,settleIndex:0,showdown:false,assisted:false,mood:(rand(t)-.5)*(t.config.atmosphere==='wild'?.6:.14),finishedAt:null};
 log(t,'button',t.dealer);return true;
}
function spend(t,seat,amount,dead=false){const h=t.hand,n=Math.min(t.players[seat].stack,Math.max(0,Math.round(amount)));t.players[seat].stack-=n;if(dead)h.dead+=n;else{h.total[seat]+=n;h.wagers[seat]+=n;}return n;}
function orderNext(t,seat){const h=t.hand;for(let n=1;n<=9;n++){const i=(seat+n)%9;if(h.pending[i]&&!h.folded[i]&&t.players[i].stack>0)return i;}return null;}
function settleRound(t){const h=t.hand;if(live(h).length===1){h.phase='collect';h.actor=null;return;}
 const can=live(h).filter(i=>t.players[i].stack>0);if(can.length<=1)for(const i of can)if(h.wagers[i]>=h.currentBet)h.pending[i]=false;
 const next=orderNext(t,h.actor??t.dealer);if(next===null){h.phase='collect';h.actor=null;}else h.actor=next;
}
function beginRound(t){const h=t.hand;h.phase='betting';h.pending=t.players.map((p,i)=>p.stack>0&&!h.folded[i]);h.acted=Array(9).fill(false);h.actedAt=Array(9).fill(0);h.roundRaises=0;
 h.actor=t.dealer;settleRound(t);
}
function legal(t,seat=t.hand.actor){const h=t.hand;if(h.phase!=='betting'||seat===null||seat!==h.actor)return null;
 const stack=t.players[seat].stack,call=Math.min(stack,Math.max(0,h.currentBet-h.wagers[seat]));
 const reopen=!h.acted[seat]||h.currentBet-h.actedAt[seat]>=h.lastRaise;
 const minTo=h.currentBet?h.currentBet+h.lastRaise:h.kind==='omaha'?100:25;
 const stackTo=h.wagers[seat]+stack,cap=h.kind==='omaha'?Math.min(stackTo,h.wagers[seat]+pot(t)+2*call):stackTo;
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
 if(l.raise&&h.currentBet===0&&rand(t)<agg*(.28+power*.5)){return {action:'raise',to:sizing(l,Math.max(h.kind==='omaha'?100:25,pot(t)*(rand(t)<.5?.5:.75)))};}
 return {action:'check'};
}
function publicSpot(t){const h=t.hand,l=legal(t,0);if(!l)return null;return {currencyVersion:t.currencyVersion||0,kind:h.kind,number:h.number,street:h.street,position:position(t),rule:t.config.rule,cards:[...h.holes[0]],board:h.board.slice(0,h.visible),pot:bb(pot(t)),stack:bb(t.players[0].stack),toCall:bb(l.call),minRaiseTo:bb(l.minTo),maxRaiseTo:bb(l.maxTo),currentBet:bb(h.currentBet),already:bb(l.already),canRaise:l.raise,canCheck:l.check,opponents:live(h).length-1,opened:h.roundRaises>0,assisted:h.assisted};}
const equityCache=new Map();
function equity(spot){const key=JSON.stringify([spot.kind,spot.cards,spot.board,spot.opponents]);if(equityCache.has(key))return equityCache.get(key);
 if(!spot.board.length)return null;
 const rng=E.seededRandom(key),known=[...spot.cards,...spot.board],available=E.deck().filter(c=>!known.includes(c)),evaluate=spot.kind==='omaha'?E.bestOmaha:E.bestHoldem,count=spot.kind==='omaha'?4:2,n=spot.kind==='omaha'?120:200;let score=0;
 for(let i=0;i<n;i++){const shuffled=E.shuffle(available,rng),board=[...spot.board,...shuffled.splice(0,5-spot.board.length)],hero=evaluate(spot.cards,board);let beaten=false,ties=1;for(let o=0;o<spot.opponents;o++){const other=evaluate(shuffled.splice(0,count),board),cmp=E.compareVectors(hero.vector,other.vector);if(cmp<0){beaten=true;break;}if(cmp===0)ties++;}if(!beaten)score+=1/ties;}
 const result={value:score/n,samples:n};if(equityCache.size>150)equityCache.clear();equityCache.set(key,result);return result;
}
function reference(s){const gross=money(s.pot+s.toCall),fee=s.currencyVersion?rake(gross):0;const price=s.toCall/(bb(gross-fee))||0;let expected,accepted,reason,theme,eq=null;
 if(s.street===0){const power=holePower(s.cards),pos=({'UTG+1':'UTG','UTG+2':'UTG',MP:'UTG','MP+1':'HJ',LJ:'HJ',BB:'SB'})[s.position]||s.position;
  if(!s.opened){const open=s.kind==='holdem'?E.recommended(pos,s.cards)==='raise':power>=.62;expected=open&&s.canRaise?'raise':s.canCheck?'check':'fold';theme='selection';reason=s.kind==='holdem'?`${E.handClass(s.cards)} no ${s.position}: referência de seleção por posição. ${s.rule==='button'?'A entrada do dealer já vale como aposta. Esta faixa por ordem de ação é apenas uma aproximação para a regra da mesa.':'Faixa didática de abertura, sem rake.'}`:'No Omaha, priorize cartas conectadas, pares altos e naipes que trabalhem juntos. Referência heurística de seleção.';}
  else{expected=power>=.87&&s.canRaise?'raise':power>=(s.kind==='omaha'?.61:.57)?s.toCall?'call':s.canRaise?'raise':'check':s.canCheck?'check':'fold';theme='defense';reason='Ao enfrentar aumento, a referência fica mais seletiva. Força inicial, posição e preço importam; não é um range de defesa resolvido por solver.';}
  accepted=[expected];
 }else{eq=equity(s).value;const made=(s.kind==='omaha'?E.bestOmaha:E.bestHoldem)(s.cards,s.board);
  if(s.toCall){expected=eq>=price?'call':'fold';accepted=Math.abs(eq-price)<=.07?['call','fold']:[expected];if(eq>.82&&s.canRaise)accepted.push('raise');theme='price';reason=`Equidade estimada ${Math.round(eq*100)}% contra ${s.opponents} mão(s) aleatória(s); preço ${Math.round(price*100)}%${s.currencyVersion?' após taxa estimada da casa':''}. No flop/turn, apostas futuras podem mudar o valor de pagar. A faixa não foi ajustada ao perfil do adversário.`;}
  else{expected=eq>.65&&made.category>=1&&s.canRaise?'raise':'check';accepted=Math.abs(eq-.65)<.1?['raise','check']:[expected];theme='value';reason=`Equidade estimada ${Math.round(eq*100)}%. O modelo sugere ${expected==='raise'?'apostar por valor':'controlar o pote'} contra mãos aleatórias. Uma faixa que paga pode ser mais forte que essa amostra.`;}
 }
 return {expected,accepted,reason,theme,equity:eq,price};
}
function act(t,action,to,options={}){const h=t.hand,seat=h.actor,l=legal(t,seat);if(!l)throw new Error('Não é hora de agir.');
 if(!['fold','check','call','raise'].includes(action)||action==='check'&&!l.check||action==='call'&&!l.call||action==='raise'&&(!l.raise||!Number.isInteger(to)||to<l.minTo||to>l.maxTo||(to%25!==0&&!(l.allIn&&to===l.maxTo))))throw new Error('Ação ou valor inválido.');
 if(seat===0){const context=publicSpot(t),ref=reference(context);h.decisions.push({id:h.decisions.length+1,context,action,to:action==='raise'?bb(to):null,correct:ref.accepted.includes(action),...ref,assisted:h.assisted});h.assisted=false;}
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
function finish(t){const h=t.hand;h.phase='finished';h.actor=null;h.finishedAt=new Date().toISOString();h.delta=t.players[0].stack-h.startStacks[0];h.endStacks=t.players.map(p=>p.stack);
 const record={rake:bb(h.rake||0),grossPot:bb(h.grossPot||0),net:bb(t.reserve+t.players[0].stack-(t.contributions??t.initialBankroll)),id:h.id,number:h.number,kind:h.kind,rule:h.rule,atmosphere:h.atmosphere,position:position(t),delta:bb(h.delta),stack:bb(t.players[0].stack),bankroll:bb(t.reserve+t.players[0].stack),cards:[...h.holes[0]],board:h.board.slice(0,h.visible),showdown:h.showdown,revealed:revealedHands(t),decisions:JSON.parse(JSON.stringify(h.decisions)),events:h.events.filter(e=>!['deal','reveal','button'].includes(e.type)),payouts:h.payouts,finishedAt:h.finishedAt};t.history.push(record);if(t.currencyVersion)t.ledger.push({type:'hand',hand:h.number,net:money(record.net)});log(t,'finished',0,h.delta);
}
function step(t){const h=t.hand;if(!h||h.phase==='finished')return false;
 if(h.phase==='posting'){const posts=[{seat:t.dealer,amount:h.kind==='omaha'?100:25}];const post=posts[h.postIndex++];if(post){const n=spend(t,post.seat,post.amount,post.dead);h.currentBet=Math.max(...h.wagers);log(t,'entry',post.seat,n);return true;}h.phase='dealing';}
 if(h.phase==='dealing'){const count=h.kind==='omaha'?4:2;if(h.dealIndex<count*9){const seat=(t.dealer+1+h.dealIndex)%9;h.dealt[seat]++;h.dealIndex++;log(t,'deal',seat);return true;}beginRound(t);return true;}
 if(h.phase==='betting'){if(h.actor===0)return false;if(h.actor===null){settleRound(t);return true;}const choice=bot(t,h.actor);act(t,choice.action,choice.to);return true;}
 if(h.phase==='collect'){const amounts=[...h.wagers];h.wagers.fill(0);h.currentBet=0;h.lastRaise=h.kind==='omaha'?100:25;log(t,'collect',null,amounts.reduce((a,b)=>a+b,0),{amounts});if(live(h).length===1||h.street===3){h.showdown=live(h).length>1;h.phase='settle';}else{h.street++;h.phase='reveal';}return true;}
 if(h.phase==='reveal'){const count=h.street+2;if(h.visible<count){h.visible++;log(t,'reveal',null,0,{cardIndex:h.visible-1});return true;}beginRound(t);return true;}
 if(h.phase==='settle'){h.revealedSeats ||= [];if(h.revealedSeats.length<9){const seat=(t.dealer+1+h.revealedSeats.length)%9;h.revealedSeats.push(seat);log(t,'show-cards',seat);return true;}if(!h.payouts){h.payouts=payoutPlan(t);h.distributed+=h.rake||0;t.houseRake=(t.houseRake||0)+(h.rake||0);log(t,'showdown');return true;}const pay=h.payouts[h.settleIndex++];if(pay){t.players[pay.seat].stack+=pay.amount;h.distributed+=pay.amount;log(t,pay.type,pay.seat,pay.amount,{label:pay.label});return true;}finish(t);return true;}
 return false;
}
function runToHero(t,max=500){let steps=0;while(steps++<max&&step(t)){}if(steps>=max)throw new Error('Limite de ações excedido.');return t.hand;}
function rebuy(t){if(t.hand&&t.hand.phase!=='finished')return false;t.players[0].stack+=2000;t.contributions=(t.contributions??t.initialBankroll)+2000;t.rebuyCount++;t.ledger||=[];t.ledger.push({type:'rebuy',net:t.reserve+t.players[0].stack-t.contributions});return true;}
function visible(t){const h=t.hand;if(!h)return null;return {number:h.number,kind:h.kind,phase:h.phase,street:h.street,dealer:t.dealer,actor:h.actor,pot:bb(pot(t)),centerPot:bb(Math.max(0,pot(t)-h.wagers.reduce((a,b)=>a+b,0))),board:h.board.slice(0,h.visible),event:h.event,players:t.players.map((p,i)=>({seat:i,name:p.name,stack:bb(p.stack),position:position(t,i),folded:h.folded[i],wager:bb(h.wagers[i]),dealt:h.dealt[i],cards:i===0?h.holes[i].slice(0,h.dealt[i]):h.phase==='finished'||(h.phase==='settle'&&h.revealedSeats?.includes(i))?h.holes[i]:null,allIn:p.stack===0})),legal:h.actor===0?legal(t,0):null};}
return {sizing,minimum,rake,make,upgrade,start,step,act,legal,position,pot,visible,runToHero,rebuy,publicSpot,reference,equity,holePower,payoutPlan,revealedHands,bb,money,STREETS};
});
