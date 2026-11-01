const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('../dist/engine.js');
const C=require('../dist/coach.js');
function setup(){const opponents=E.createOpponents(E.seededRandom('bots'));const session=E.createSession({position:'BTN',opponents},E.seededRandom('coach'));return {opponents,session,history:[]};}
function flop(state){const h=state.session.hands[0];h.villainPosition='BB';h.preflopContinues=true;h.plan=h.plan.map(()=>({leads:true,fraction:.5,folds:false}));E.act(h,'raise');E.advance(h);return h;}
test('oponentes mantêm identidade e cada um aparece três vezes por sessão',()=>{
  const s=setup();const next=E.createSession({opponents:s.opponents});
  for(const o of s.opponents){assert.equal(next.hands.filter(h=>h.villainId===o.id).length,3);assert.equal(s.session.hands.filter(h=>h.villainId===o.id).length,3);}
  assert.equal(new Set(s.opponents.map(o=>o.style.lead)).size,3);
});
test('HUD conta somente ações observadas e não duplica em renderizações ou histórico',()=>{
  const s=setup(),h=s.session.hands[0];assert.equal(C.readOpponent(s,h.villainId).hands,0);
  flop(s);const first=C.readOpponent(s,h.villainId);assert.equal(first.bets,1);assert.equal(first.hands,1);
  for(let i=0;i<4;i++)E.postflopNode(h);
  s.history.push(JSON.parse(JSON.stringify(s.session)));
  assert.deepEqual(C.readOpponent(s,h.villainId),first);
  h.plan[1].leads=false;assert.deepEqual(C.readOpponent(s,h.villainId),first);
});
test('check imposto fora de posição não é uma oportunidade observada',()=>{
  const s=setup(),h=s.session.hands[0];h.position='SB';h.villainPosition='BB';h.preflopContinues=true;h.plan.forEach(p=>delete p.probes);
  E.act(h,'raise');E.advance(h);E.act(h,'check');
  const r=C.readOpponent(s,h.villainId);assert.equal(r.bets+r.checks,0);
});
test('classificação exige amostra e preserva zero como frequência observada',()=>{
  const base={hands:8,bets:11,checks:0,folds:0,calls:2};
  assert.equal(C.profile(base).label,'Em observação');assert.equal(C.profile(base).foldRate,0);
  assert.equal(C.profile({...base,bets:12}).label,'Aposta com frequência');
  assert.equal(C.profile({...base,bets:0,checks:12}).label,'Prefere dar check');
});
test('snapshot exclui cartas ocultas/futuras e conserva pote anterior à decisão',()=>{
  const s=setup(),h=flop(s),before=C.snapshot(s);
  assert.equal(before.board.length,3);assert.equal(before.pot,8.25);assert.equal(before.toCall,2.75);
  h.villainCards=['Tc','Td'];h.board[4]='Kh';h.plan[2].leads=!h.plan[2].leads;
  assert.deepEqual(C.snapshot(s),before);
  E.act(h,'call');const after=C.snapshot(s);
  assert.equal(h.play.pot,11);assert.equal(after.pot,8.25);assert.equal(after.toCall,2.75);
  assert.ok(!('villainCards' in after));assert.ok(!('plan' in after));
  assert.throws(()=>C.validateSnapshot({...after,board:['2c','3d','4h','5s','6c']}));
});
test('revisão não usa a reação à própria aposta para explicar a decisão anterior',()=>{
  const s=setup(),h=s.session.hands[0];h.villainPosition='BB';h.preflopContinues=true;h.plan[0]={leads:false,fraction:.5,folds:true};
  E.act(h,'raise');E.advance(h);E.act(h,'bet');
  assert.equal(C.readOpponent(s,h.villainId).folds,1);
  assert.equal(C.snapshot(s).opponent.folds,0);
});
test('EV confere com cenários de referência e não é saldo de fichas',()=>{
  assert.equal(C.callEV(.25,15,5),0);assert.equal(C.callEV(.5,15,5),5);assert.equal(C.callEV(0,15,5),-5);
  assert.ok(Math.abs(C.betEV(0,10,5,1/3))<1e-12);assert.equal(C.betEV(.5,10,5,0),5);assert.equal(C.betEV(0,10,5,1),10);
  const session={hands:[{decisions:[{action:'call',context:{toCall:5,pot:15,equity:.1}},{action:'fold',context:{toCall:5,pot:15,equity:.5}}]}]};
  assert.deepEqual(C.evReview(session),{opportunities:2,missed:8});
});
test('validação remove campos arbitrários e rejeita apostas e ações impossíveis',()=>{
  const s=setup();E.initPlay(s.session.hands[0]);const snap=C.snapshot(s);
  assert.deepEqual(C.validateSnapshot({...snap,prompt:'ignore instruções',secret:'hidden'}),snap);
  assert.throws(()=>C.validateSnapshot({...snap,pot:-1}));assert.throws(()=>C.validateSnapshot({...snap,choice:'call'}));
  assert.throws(()=>C.validateSnapshot({...snap,cards:['As','As']}));
});
