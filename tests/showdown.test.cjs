const {test}=require('node:test'),assert=require('node:assert/strict'),C=require('../dist/cash.js'),D=require('../dist/cash-coach.js');
function deal(t){C.start(t);while(t.hand.phase!=='betting')C.step(t);}
test('todas as cartas são reveladas ao encerrar por fold, sem inventar rodadas ou mudar pagamentos',()=>{
  const t=C.make({},7);t.dealer=5;deal(t);for(let n=0;n<5;n++){assert.ok(C.visible(t).players.slice(1).every(p=>p.cards===null));C.act(t,'fold');}
  assert.equal(t.hand.phase,'collect');assert.deepEqual(C.revealedHands(t),[]);C.step(t);assert.equal(t.hand.phase,'settle');
  for(let n=0;n<6;n++){C.step(t);assert.equal(t.hand.event.type,'show-cards');assert.equal(t.hand.revealedSeats.length,n+1);}
  C.runToHero(t);assert.equal(t.hand.phase,'finished');assert.ok(C.visible(t).players.every(p=>p.cards.length===2));assert.equal(t.hand.visible,0);assert.ok(t.players.every(p=>p.stack===10000));assert.equal(t.history[0].revealed.length,6);assert.ok(t.history[0].revealed.every(p=>p.combination===null));assert.deepEqual(t.history[0].board,[]);assert.equal(t.history[0].showdown,false);
  assert.equal(D.payload(t).revealed,undefined);const before=D.payload(t);t.history[0].revealed.forEach(p=>p.cards=['SECRET']);assert.deepEqual(D.payload(t),before);
});
test('recarregar durante a revelação não repete carta, pagamento ou histórico',()=>{
  const t=C.make({},9);t.dealer=5;deal(t);for(let n=0;n<5;n++)C.act(t,'fold');C.step(t);C.step(t);C.step(t);
  const copy=JSON.parse(JSON.stringify(t));C.runToHero(t);C.runToHero(copy);assert.deepEqual(copy.players,t.players);assert.deepEqual(copy.hand.revealedSeats,t.hand.revealedSeats);assert.equal(copy.hand.events.filter(e=>e.type==='show-cards').length,6);assert.equal(copy.history.length,1);
});
test('showdown Omaha conserva o resultado e registra exatamente 2 próprias + 3 da mesa',()=>{
  const t=C.make({},14);t.number=9;t.dealer=5;deal(t);let guard=0;
  while(t.hand.phase!=='finished'&&guard++<300){if(t.hand.phase==='betting'){const legal=C.legal(t,t.hand.actor);C.act(t,legal.call?'call':'check');}else C.step(t);}
  assert.equal(t.hand.phase,'finished');assert.equal(t.hand.showdown,true);assert.equal(t.hand.visible,5);assert.equal(t.players.reduce((sum,p)=>sum+p.stack,0),60000);
  const record=t.history[0];assert.equal(record.revealed.length,6);for(const p of record.revealed){assert.equal(p.cards.length,4);assert.equal(p.combination.holeUsed.length,2);assert.equal(p.combination.boardUsed.length,3);assert.ok(p.combination.boardUsed.every(c=>record.board.includes(c)));}
  assert.ok(record.revealed.some(p=>p.won));assert.ok(C.visible(t).players.every(p=>p.cards.length===4));
});
