const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('../dist/engine.js');
const C=require('../dist/coach.js');
function fixture(probes=true){
  const session=E.createSession({position:'SB',atmosphere:'pressure'},E.seededRandom('probe'));
  const h=session.hands[0];h.villainPosition='BB';h.preflopContinues=true;
  h.plan=h.plan.map(()=>({leads:false,probes,fraction:.75,folds:false}));
  E.act(h,'raise');E.advance(h);
  return {session,history:[],h};
}
test('climas têm sorteio reprodutível, tamanhos variados e pressão maior no agregado',()=>{
  const style={lead:.4,fold:.3};const aggregate={};
  for(const mode of Object.keys(E.ATMOSPHERES)){
    const rng=E.seededRandom('pressure-distribution');let bets=0,total=0,size=0;const fractions=new Set();
    for(let i=0;i<1000;i++)for(const p of E.randomPlan(style,mode,rng)){
      assert.equal(typeof p.probes,'boolean');assert.equal(typeof p.folds,'boolean');
      assert.ok(p.fraction>=.25&&p.fraction<=1.25);fractions.add(p.fraction);
      bets+=Number(p.leads);size+=p.fraction;total++;
    }
    aggregate[mode]={bets:bets/total,size:size/total};assert.ok(fractions.size>=4);
    assert.deepEqual(E.randomPlan(style,mode,E.seededRandom('same')),E.randomPlan(style,mode,E.seededRandom('same')));
  }
  assert.ok(aggregate.pressure.bets>aggregate.mixed.bets+.1);
  assert.ok(aggregate.pressure.size>aggregate.mixed.size+.2);
  const s=E.createSession({atmosphere:'wild'},E.seededRandom('wild-session'));
  assert.equal(s.atmosphere,'wild');assert.equal(s.simulationVersion,2);assert.equal(s.hands[9].kind,'omaha');
  assert.equal(E.createSession({atmosphere:'invalid'}).atmosphere,'mixed');
});
test('check fora de posição pode receber aposta na mesma rodada sem duplicar fichas',()=>{
  const s=fixture(),h=s.h,total=h.play.heroStack+h.play.villainStack+h.play.pot;
  assert.equal(E.postflopNode(h).facing,0);E.act(h,'check');
  assert.equal(h.play.pending,'probe');assert.equal(C.readOpponent(s,h.villainId).bets,0);
  assert.equal(E.advance(h),'response');assert.equal(h.play.street,1);
  assert.equal(h.play.node.afterCheck,true);assert.equal(h.play.node.facing,4.5);assert.equal(h.play.pot,10.5);
  const read=C.readOpponent(s,h.villainId);assert.equal(read.bets,1);
  const restored=JSON.parse(JSON.stringify(h));E.postflopNode(restored);assert.equal(restored.play.pot,10.5);
  assert.deepEqual(C.readOpponent(s,h.villainId),read);
  E.act(h,'call');assert.equal(h.play.pot,15);assert.equal(h.decisions.length,3);
  assert.equal(h.play.heroStack+h.play.villainStack+h.play.pot,total);
  assert.equal(C.snapshot(s).opponent.bets,1);assert.equal(E.advance(h),'street');assert.equal(h.play.street,2);
});
test('a revisão de check não usa a reação futura; check voluntário entra nas estatísticas',()=>{
  const s=fixture(false),h=s.h;
  E.act(h,'check');assert.equal(h.play.pending,'street');
  assert.equal(C.readOpponent(s,h.villainId).checks,1);
  assert.equal(C.snapshot(s).opponent.checks,0);
  E.advance(h);assert.equal(C.snapshot(s).opponent.checks,1);
});
test('fold diante da reação encerra a mão; call com stack esgotado vai ao showdown',()=>{
  const first=fixture();E.act(first.h,'check');E.advance(first.h);E.act(first.h,'fold');assert.equal(E.advance(first.h),'done');
  const second=fixture(),h=second.h;
  h.play.heroStack=2;h.play.villainStack=2;const total=h.play.pot+4;
  E.act(h,'check');E.advance(h);assert.equal(h.play.node.facing,2);
  E.act(h,'call');assert.equal(h.play.pending,'showdown');assert.equal(E.advance(h),'showdown');
  assert.equal(E.visibleBoard(h).length,5);assert.equal(h.play.heroStack,0);assert.equal(h.play.villainStack,0);
  assert.equal(h.play.pot,total);assert.equal(E.act(h,'bet'),null);
});
test('planos antigos continuam abrindo sem reinterpretar o check imposto',()=>{
  const s=fixture(),h=s.h;h.plan.forEach(p=>delete p.probes);
  E.act(h,'check');assert.equal(h.play.pending,'street');assert.equal(C.readOpponent(s,h.villainId).checks,0);
  assert.equal(E.advance(h),'street');assert.equal(h.play.street,2);
});
