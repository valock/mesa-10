const {test}=require('node:test');
const assert=require('node:assert/strict');
const E=require('../dist/engine.js');
const parse=s=>s.split(' ');
test('baralho com 52 cartas distintas e 169 classes; 1326 combinações',()=>{
  assert.equal(E.deck().length,52);assert.equal(new Set(E.deck()).size,52);
  const combos=E.combinations(E.deck(),2);assert.equal(combos.length,1326);
  assert.equal(new Set(combos.map(E.handClass)).size,169);
  assert.equal(E.handClass(['Th','As']),'ATo');assert.equal(E.handClass(['2c','Ac']),'A2s');
  let previous=0;
  for(const p of E.OPEN_POSITIONS){const n=E.rangeStats(p);assert.ok(n.combos>previous);previous=n.combos;assert.equal(E.recommended(p,'AA'),'raise');assert.equal(E.recommended(p,'72o'),'fold');}
  assert.throws(()=>E.recommended('BB','AA'));
});
test('ranking de todas as categorias, sequência de ás baixo e desempates',()=>{
  const fixtures=[['As Kd Jh 8c 4h',0],['As Ad Jh 8c 4h',1],['As Ad Jh Jc 4h',2],['As Ad Ah Jc 4h',3],['As 2d 3h 4c 5h',4],['As Js 9s 5s 2s',5],['As Ad Ah Jc Jh',6],['As Ad Ah Ac Jh',7],['As Ks Qs Js Ts',8]];
  fixtures.forEach(([cards,category])=>assert.equal(E.evaluateFive(parse(cards)).category,category));
  assert.equal(E.evaluateFive(parse('As 2d 3h 4c 5h')).vector[1],5);
  assert.equal(E.evaluateFive(parse('Qs Kd Ah 2c 3h')).category,0);
  assert.ok(E.compareVectors(E.evaluateFive(parse('As Ad 2c 2s Qh')).vector,E.evaluateFive(parse('Ah Ac 2d 2h Js')).vector)>0);
  assert.equal(E.compareVectors(E.evaluateFive(parse('As Kd Qh Jc Ts')).vector,E.evaluateFive(parse('Ah Kc Qd Js Th')).vector),0);
});
test('Omaha: um único naipe não faz flush; nunca usa três cartas próprias',()=>{
  const h=E.bestOmaha(parse('Ah Qs Jc Td'),parse('Kh 2h 9h 8s 7h'));
  assert.equal(h.category,4);assert.equal(h.holeUsed.length,2);assert.equal(h.boardUsed.length,3);
  const trips=E.bestOmaha(parse('2c 2d 2s 3s'),parse('Kh 2h 9h 8s 7h'));
  assert.equal(trips.category,3);
});
test('Omaha: kicker extra não desempata AA22Q iguais',()=>{
  const r=E.showdown(parse('As 2c Kh 9d'),parse('Ad 2s Jh 8d'),parse('Ah 2h Qc 6s 4d'));
  assert.equal(r.winner,'tie');assert.deepEqual(r.hero.vector,[2,14,2,12]);assert.deepEqual(r.villain.vector,[2,14,2,12]);
  assert.match(E.showdownReason(r),/dividido/);
});
test('Omaha: kicker válido decide dois pares; naipes não desempatem',()=>{
  const r=E.showdown(parse('As Kc 8d 7d'),parse('Ah Qc 9d 6d'),parse('Ad 2c 2s 4h 5h'));
  assert.equal(r.winner,'hero');assert.equal(r.hero.vector[0],2);assert.equal(r.hero.vector[3],13);assert.match(E.showdownReason(r),/kicker/);
});
test('Hold’em pode jogar as cinco cartas da mesa; Omaha não',()=>{
  const board=parse('As Ks Qs Js Ts');
  assert.equal(E.bestHoldem(parse('2h 3d'),board).category,8);
  assert.equal(E.bestOmaha(parse('2h 3d 4c 5c'),board).category,0);
  assert.throws(()=>E.bestOmaha(parse('As 2h 3d 4c'),board));
});
test('sessões têm 9 Hold’em + 1 Omaha, posições alternadas e cartas sem repetição',()=>{
  for(let i=0;i<50;i++){
    const s=E.createSession({},E.seededRandom('session-'+i));
    assert.equal(s.hands.length,10);assert.equal(s.hands.filter(h=>h.kind==='omaha').length,1);assert.equal(s.hands[9].kind,'omaha');
    const recommendations=s.hands.slice(0,9).map(h=>E.recommended(h.position,h.cards));
    const raises=recommendations.filter(a=>a==='raise').length;assert.ok(raises===4||raises===5);
    s.hands.slice(0,9).forEach((h,index)=>{assert.equal(new Set([...h.cards,...h.villainCards,...h.board]).size,9);if(index)assert.notEqual(h.position,s.hands[index-1].position);});
    const h=s.hands[9];assert.equal(new Set([...h.hero,...h.villain,...h.board]).size,13);
  }
});
test('simulação segue pré-flop → flop → turn → river → showdown, conservando fichas',()=>{
  const h=E.createSession({position:'BTN'},E.seededRandom('runout')).hands[0];
  h.villainPosition='BB';h.preflopContinues=true;h.plan=h.plan.map(()=>({leads:false,fraction:.5,folds:false}));
  E.initPlay(h);E.act(h,'raise');assert.equal(h.play.pot,5.5);assert.equal(E.act(h,'raise'),null);
  const total=200.5;
  for(let street=1;street<=3;street++){
    assert.equal(E.advance(h),'street');assert.equal(h.play.street,street);assert.equal(E.visibleBoard(h).length,street+2);
    E.act(h,'bet');assert.ok(Math.abs(h.play.heroStack+h.play.villainStack+h.play.pot-total)<.001);
  }
  assert.equal(E.advance(h),'showdown');assert.ok(h.play.result.winner);assert.equal(E.advance(h),'done');assert.equal(h.decisions.length,4);
});
test('fold encerra; all-in não permite apostas posteriores; small blind completa corretamente',()=>{
  const session=E.createSession({position:'SB'},E.seededRandom('edges'));
  const fold=session.hands[0];E.act(fold,'fold');assert.equal(E.advance(fold),'done');assert.equal(E.visibleBoard(fold).length,0);
  const shove=session.hands[1];shove.preflopContinues=true;E.act(shove,'shove');assert.equal(shove.play.heroStack,0);assert.equal(shove.play.villainStack,0);assert.equal(shove.play.pot,200);assert.equal(E.advance(shove),'showdown');assert.equal(E.act(shove,'bet'),null);
  const limp=session.hands[2];E.act(limp,'call');assert.equal(limp.play.pot,2);assert.equal(limp.play.heroStack,99);assert.equal(limp.play.villainStack,99);
});
test('preço para pagar usa o pote final e não duplica a aposta ao renderizar',()=>{
  const h=E.createSession({position:'BTN'},E.seededRandom('odds')).hands[0];h.villainPosition='BB';h.preflopContinues=true;h.plan[0]={leads:true,fraction:.5,folds:false};
  E.act(h,'raise');E.advance(h);const n=E.postflopNode(h),before=h.play.pot;
  assert.equal(n.facing,2.75);assert.equal(n.odds,.25);E.postflopNode(h);assert.equal(h.play.pot,before);
  E.act(h,'call');assert.equal(h.play.pot,11);assert.equal(h.play.heroStack,94.75);
});
test('equidade depende apenas de cartas visíveis; royal flush na mesa empata sempre',()=>{
  const e=E.estimateEquity(parse('2h 3d'),parse('As Ks Qs Js Ts'));
  assert.equal(e.value,.5);assert.equal(e.exact,true);
  const a=E.estimateEquity(parse('Ah Kh'),parse('Qh Jh 2c'),30);
  const b=E.estimateEquity(parse('Ah Kh'),parse('Qh Jh 2c'),30);
  assert.equal(a.value,b.value);assert.ok(a.value>=0&&a.value<=1);assert.equal(a.samples,30);
});
test('uma sessão completa registra decisões únicas e valida o Omaha final',()=>{
  const s=E.createSession({},E.seededRandom('full-session'));
  for(const h of s.hands){
    E.initPlay(h);
    let guard=0;
    while(h.play.phase!=='done'&&guard++<20){
      if(h.play.phase==='decision')E.act(h,h.kind==='omaha'?E.correctAction(h):h.play.street===0?E.correctAction(h):E.postflopNode(h).expected);
      else E.advance(h);
    }
    assert.equal(h.play.phase,'done');assert.ok(h.decisions.length>=1);assert.ok(h.decisions.every(d=>d.correct));
  }
});
