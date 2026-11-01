/* Mesa 10 — motor independente, sem dependências. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MesaEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const RANKS = 'AKQJT98765432'.split('');
  const SUITS = ['s', 'h', 'd', 'c'];
  const SYMBOLS = { s: '♠', h: '♥', d: '♦', c: '♣' };
  const SUIT_NAMES = { s: 'espadas', h: 'copas', d: 'ouros', c: 'paus' };
  const POSITIONS = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
  const OPEN_POSITIONS = POSITIONS.slice(0, 5);
  const RANK_NAMES = { 14: 'ás', 13: 'rei', 12: 'dama', 11: 'valete', 10: 'dez', 9: 'nove', 8: 'oito', 7: 'sete', 6: 'seis', 5: 'cinco', 4: 'quatro', 3: 'três', 2: 'dois' };
  const CATEGORY_NAMES = ['Carta alta', 'Um par', 'Dois pares', 'Trinca', 'Sequência', 'Flush', 'Full house', 'Quadra', 'Straight flush'];
  // Faixas próprias e simplificadas para treino de RFI. Ver FONTES.md.
  // Não são frequências de solver. O small blind usa a convenção raise/fold.
  const RANGE_NOTATION = {
    UTG: '55+ A2s+ K9s+ Q9s+ JTs T9s 98s 87s 76s 65s ATo+ KJo+',
    HJ:  '22+ A2s+ K8s+ Q9s+ J9s+ T9s 98s 87s 76s 65s 54s ATo+ KJo+ QJo',
    CO:  '22+ A2s+ K5s+ Q8s+ J8s+ T8s+ 97s+ 86s+ 75s+ 65s 54s A9o+ KTo+ QTo+ JTo',
    BTN: '22+ A2s+ K2s+ Q4s+ J6s+ T6s+ 96s+ 85s+ 74s+ 64s+ 54s 53s A2o+ K8o+ Q9o+ J9o+ T9o 98o',
    SB:  '22+ A2s+ K2s+ Q2s+ J4s+ T5s+ 95s+ 84s+ 73s+ 63s+ 53s+ 52s A2o+ K7o+ Q8o+ J8o+ T8o+ 97o+ 87o 86o 76o'
  };
  const POSITION_INFO = {
    UTG: { name: 'Under the gun', short: 'Primeiro a falar', detail: 'Você abre a ação com cinco jogadores pela frente. Priorize mãos que suportem continuar contra ranges fortes.' },
    HJ: { name: 'Hijack', short: 'Posição intermediária', detail: 'Quatro jogadores ainda podem reagir. A faixa de abertura cresce um pouco em relação ao UTG.' },
    CO: { name: 'Cutoff', short: 'Antes do botão', detail: 'Só o botão e os blinds estão por falar. Há mais espaço para abrir pares, mãos do mesmo naipe e cartas conectadas.' },
    BTN: { name: 'Button', short: 'Botão do dealer', detail: 'Restam os dois blinds. Depois do flop, você age por último contra eles, uma vantagem importante.' },
    SB: { name: 'Small blind', short: 'Blind pequeno', detail: 'Resta apenas o big blind, mas você jogará fora de posição após o flop. Este treino adota uma estratégia simplificada de aumentar ou desistir.' },
    BB: { name: 'Big blind', short: 'Blind grande', detail: 'Se todos desistirem antes de você, a mão termina e você ganha os blinds. Por isso, não há exercício de primeira abertura no BB.' }
  };
  function rankValue(rank) { return 14 - RANKS.indexOf(rank); }
  function random() {
    if (typeof globalThis.crypto?.getRandomValues === 'function') {
      return globalThis.crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
    }
    return Math.random();
  }
  function shuffle(items, rng = random) {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
  function deck() { return RANKS.flatMap(r => SUITS.map(s => r + s)); }
  function handClass(cards) {
    if (cards.length !== 2) throw new Error('Hold’em usa duas cartas.');
    const [a, b] = [...cards].sort((a, b) => rankValue(b[0]) - rankValue(a[0]));
    return a[0] + b[0] + (a[0] === b[0] ? '' : a[1] === b[1] ? 's' : 'o');
  }
  function expandRange(notation) {
    const result = new Set();
    for (const token of notation.trim().split(/\s+/)) {
      const plus = token.endsWith('+');
      const key = token.replace('+', '');
      if (!/^[AKQJT2-9]{2}[so]?$/.test(key)) throw new Error('Faixa inválida: ' + token);
      if (key[0] === key[1]) {
        if (key.length !== 2) throw new Error('Par inválido');
        const floor = rankValue(key[0]);
        for (const r of RANKS) if (plus ? rankValue(r) >= floor : r === key[0]) result.add(r + r);
      } else if (plus) {
        const high = rankValue(key[0]), floor = rankValue(key[1]);
        for (const r of RANKS) if (rankValue(r) < high && rankValue(r) >= floor) result.add(key[0] + r + key[2]);
      } else result.add(key);
    }
    return result;
  }
  const RANGES = Object.fromEntries(OPEN_POSITIONS.map(p => [p, expandRange(RANGE_NOTATION[p])]));
  function recommended(position, cardsOrClass) {
    if (!RANGES[position]) throw new Error('Posição sem abertura RFI');
    return RANGES[position].has(Array.isArray(cardsOrClass) ? handClass(cardsOrClass) : cardsOrClass) ? 'raise' : 'fold';
  }
  function rangeStats(position) {
    const combos = [...RANGES[position]].reduce((n, h) => n + (h.length === 2 ? 6 : h.endsWith('s') ? 4 : 12), 0);
    return { classes: RANGES[position].size, combos, percent: combos / 1326 * 100 };
  }
  function raiseSize(position) { return position === 'SB' ? 3 : 2.5; }
  function combinations(items, k) {
    const out = [];
    function visit(start, selected) {
      if (selected.length === k) { out.push(selected); return; }
      for (let i = start; i <= items.length - (k - selected.length); i++) visit(i + 1, [...selected, items[i]]);
    }
    visit(0, []);
    return out;
  }
  function compareVectors(a, b) {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if ((a[i] || 0) !== (b[i] || 0)) return (a[i] || 0) > (b[i] || 0) ? 1 : -1;
    }
    return 0;
  }
  function validateCards(cards, length) {
    if (cards.length !== length || new Set(cards).size !== cards.length || cards.some(c => !/^[AKQJT2-9][shdc]$/.test(c))) throw new Error('Cartas inválidas ou repetidas.');
  }
  function evaluateFive(cards, checked = true) {
    if (checked) validateCards(cards, 5);
    const values = cards.map(c => rankValue(c[0])).sort((a, b) => b - a);
    const counts = new Map();
    values.forEach(v => counts.set(v, (counts.get(v) || 0) + 1));
    const groups = [...counts].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
    const flush = cards.every(c => c[1] === cards[0][1]);
    const unique = [...counts.keys()].sort((a, b) => b - a);
    let straightHigh = 0;
    if (unique.length === 5 && unique[0] - unique[4] === 4) straightHigh = unique[0];
    if (unique.join(',') === '14,5,4,3,2') straightHigh = 5;
    let vector;
    if (flush && straightHigh) vector = [8, straightHigh];
    else if (groups[0][1] === 4) vector = [7, groups[0][0], groups[1][0]];
    else if (groups[0][1] === 3 && groups[1][1] === 2) vector = [6, groups[0][0], groups[1][0]];
    else if (flush) vector = [5, ...values];
    else if (straightHigh) vector = [4, straightHigh];
    else if (groups[0][1] === 3) vector = [3, groups[0][0], ...groups.slice(1).map(g => g[0])];
    else if (groups[0][1] === 2 && groups[1][1] === 2) vector = [2, groups[0][0], groups[1][0], groups[2][0]];
    else if (groups[0][1] === 2) vector = [1, groups[0][0], ...groups.slice(1).map(g => g[0])];
    else vector = [0, ...values];
    return { category: vector[0], vector, cards: [...cards], name: vector[0] === 8 && vector[1] === 14 ? 'Royal flush' : CATEGORY_NAMES[vector[0]] };
  }
  function bestOmaha(hole, board) {
    validateCards([...hole, ...board], hole.length+board.length);
    if (hole.length !== 4 || board.length < 3 || board.length > 5) throw new Error('Omaha requer quatro cartas próprias e de três a cinco comunitárias.');
    let best = null;
    for (const h of combinations(hole, 2)) for (const b of combinations(board, 3)) {
      const current = { ...evaluateFive([...h, ...b], false), holeUsed: h, boardUsed: b };
      if (!best || compareVectors(current.vector, best.vector) > 0) best = current;
    }
    return best;
  }
  function showdown(hero, villain, board) {
    validateCards([...hero, ...villain, ...board], 13);
    const yours = bestOmaha(hero, board), theirs = bestOmaha(villain, board);
    const comparison = compareVectors(yours.vector, theirs.vector);
    return { hero: yours, villain: theirs, winner: comparison > 0 ? 'hero' : comparison < 0 ? 'villain' : 'tie' };
  }
  function describeHand(evaluation) {
    const v = evaluation.vector;
    const r = n => RANK_NAMES[n];
    switch (v[0]) {
      case 8: return v[1] === 14 ? 'Royal flush' : `Straight flush até ${r(v[1])}`;
      case 7: return `Quadra de ${r(v[1])} · kicker ${r(v[2])}`;
      case 6: return `Full house: trinca de ${r(v[1])} e par de ${r(v[2])}`;
      case 5: return `Flush: ${v.slice(1).map(r).join(', ')}`;
      case 4: return `Sequência até ${r(v[1])}${v[1] === 5 ? ' (ás vale 1)' : ''}`;
      case 3: return `Trinca de ${r(v[1])} · kickers ${v.slice(2).map(r).join(', ')}`;
      case 2: return `Dois pares: ${r(v[1])} e ${r(v[2])} · kicker ${r(v[3])}`;
      case 1: return `Par de ${r(v[1])} · kickers ${v.slice(2).map(r).join(', ')}`;
      default: return `Carta alta: ${v.slice(1).map(r).join(', ')}`;
    }
  }
  function showdownReason(result) {
    if (result.winner === 'tie') return 'As duas melhores combinações têm os mesmos valores. O pote é dividido: o naipe e as cartas que ficaram de fora não desempatam.';
    const win = result[result.winner], lose = result[result.winner === 'hero' ? 'villain' : 'hero'];
    const subject = result.winner === 'hero' ? 'Você vence' : 'O adversário vence';
    if (win.category !== lose.category) return `${subject} com ${win.name.toLowerCase()}, contra ${lose.name.toLowerCase()}. A comparação usa somente as cinco cartas válidas de cada jogador.`;
    const index = win.vector.findIndex((v, i) => v !== lose.vector[i]);
    const labels = { 0: ['','a maior carta','a segunda carta','a terceira carta','a quarta carta','a quinta carta'], 1: ['','o par','o primeiro kicker','o segundo kicker','o terceiro kicker'], 2: ['','o par mais alto','o segundo par','o kicker'], 3: ['','a trinca','o primeiro kicker','o segundo kicker'], 4: ['','o topo da sequência'], 5: ['','a maior carta do flush','a segunda carta do flush','a terceira carta do flush','a quarta carta do flush','a quinta carta do flush'], 6: ['','a trinca do full house','o par do full house'], 7: ['','a quadra','o kicker'], 8: ['','o topo do straight flush'] };
    return `${subject}. Na mesma categoria, ${labels[win.category][index]} decide: ${RANK_NAMES[win.vector[index]]} supera ${RANK_NAMES[lose.vector[index]]}. Nenhuma carta fora da combinação pode entrar como kicker extra.`;
  }
  function createOpponents(rng = random) {
    const styles = shuffle([
      {lead:.72,fold:.18,continue:.9},
      {lead:.22,fold:.12,continue:.94},
      {lead:.4,fold:.5,continue:.65}
    ],rng);
    return ['Léo','Nina','Rafa'].map((name,i)=>({id:'bot-'+(i+1),name,style:styles[i]}));
  }
  const ATMOSPHERES = {
    mixed:{name:'Mesa mista',icon:'♧',description:'Estilos variados, pressão moderada e apostas de vários tamanhos.'},
    pressure:{name:'Pressão alta',icon:'↗',description:'Mais apostas, sequências de ataques e tamanhos maiores.'},
    wild:{name:'Imprevisível',icon:'◇',description:'O ritmo oscila a cada mão, com mais variação de tamanhos.'}
  };
  function randomPlan(style, atmosphere='mixed', rng=random) {
    const mood=ATMOSPHERES[atmosphere]?atmosphere:'mixed';
    const offset=mood==='pressure'?.22:0;
    const swing=(rng()-.5)*(mood==='wild'?.72:.22);
    const clamp=n=>Math.max(.08,Math.min(.94,n));
    const lead=clamp(style.lead+offset+swing);
    const fold=clamp(style.fold-(mood==='pressure'?.08:0)-swing*.2);
    const sizes=mood==='pressure'?[.5,.75,.75,1,1,1.25]:mood==='wild'?[.25,.33,.5,.75,1,1.25]:[.25,.33,.5,.5,.75,1];
    let prior=false;
    return [1,2,3].map(street=>{
      const attack=clamp(lead+(prior?.1:0)+(street===3&&mood==='pressure'?.05:0));
      const leads=rng()<attack,probes=rng()<clamp(attack+.08);
      prior=leads||probes;
      return {leads,probes,fraction:sizes[Math.floor(rng()*sizes.length)],folds:rng()<fold};
    });
  }
  function observe(hand, context, action, amount=0) {
    hand.observations ||= [];
    const street=hand.play.street;
    if(!hand.observations.some(e=>e.street===street&&e.context===context))
      hand.observations.push({street,context,action,amount});
  }
  function createSession(options = {}, rng = random) {
    const mode = options.mode === 'deck' ? 'deck' : 'balanced';
    const atmosphere=ATMOSPHERES[options.atmosphere]?options.atmosphere:'mixed';
    const fixed = OPEN_POSITIONS.includes(options.position) ? options.position : null;
    const positions = shuffle([...OPEN_POSITIONS, ...shuffle(OPEN_POSITIONS, rng).slice(0, 4)], rng);
    for (let i = 1; i < positions.length; i++) if (positions[i] === positions[i - 1]) {
      const j = positions.findIndex((p, k) => k > i && p !== positions[i]);
      if (j >= 0) [positions[i], positions[j]] = [positions[j], positions[i]];
      else positions[i] = OPEN_POSITIONS.find(p => p !== positions[i - 1]);
    }
    const targets = shuffle(['raise','raise','raise','raise','fold','fold','fold','fold', rng() < .5 ? 'raise' : 'fold'], rng);
    const opponents=options.opponents?.length===3?options.opponents:createOpponents(rng);
    const opponentOrder=shuffle(opponents,rng);
    const seen = new Set(), hands = [];
    for (let i = 0; i < 9; i++) {
      const position = fixed || positions[i];
      let cards, key;
      for (let tries = 0; tries < 10000; tries++) {
        cards = shuffle(deck(), rng).slice(0, 2);
        key = position + ':' + handClass(cards);
        if (!seen.has(key) && (mode === 'deck' || recommended(position, cards) === targets[i])) break;
      }
      seen.add(key);
      const available = deck().filter(c => !cards.includes(c));
      const villainCards = shuffle(callingCombos(cards), rng)[0];
      const board = shuffle(available.filter(c => !villainCards.includes(c)), rng).slice(0, 5);
      const after = POSITIONS.slice(POSITIONS.indexOf(position) + 1);
      const villainPosition = after[Math.floor(rng() * after.length)];
      const opponent=opponentOrder[i%3];
      hands.push({ kind: 'holdem', position, cards, villainCards, board, villainPosition, villainId:opponent.id, villainName:opponent.name, observations:[], preflopContinues: rng() < opponent.style.continue, plan: randomPlan(opponent.style,atmosphere,rng), answer: null, assisted: false, decisions: [], play: null });
    }
    const omaha = shuffle(deck(), rng);
    hands.push({ kind: 'omaha', hero: omaha.slice(0, 4), villain: omaha.slice(4, 8), board: omaha.slice(8, 13), answer: null, assisted: false, decisions: [], play: null });
    return { id: Date.now().toString(36) + '-' + Math.floor(rng() * 1e9).toString(36), startedAt: new Date().toISOString(), mode, atmosphere, simulationVersion:2, position: fixed || 'all', current: 0, complete: false, hands };
  }
  function correctAction(hand) { return hand.kind === 'holdem' ? recommended(hand.position, hand.cards) : showdown(hand.hero, hand.villain, hand.board).winner; }
  function feedback(hand, action) {
    if (hand.kind === 'omaha') {
      const result = showdown(hand.hero, hand.villain, hand.board);
      return { correct: action === result.winner, expected: result.winner, title: result.winner === 'hero' ? 'Você tem a melhor mão.' : result.winner === 'villain' ? 'O adversário tem a melhor mão.' : 'O pote é dividido.', explanation: showdownReason(result), result };
    }
    const expected = recommended(hand.position, hand.cards);
    const key = handClass(hand.cards), high = rankValue(key[0]);
    let reason;
    if (expected === 'fold') reason = `${key} fica fora da faixa de abertura adotada para ${hand.position}. ${key.endsWith('o') ? 'Naipes diferentes e pouca conexão reduzem as possibilidades de formar mãos fortes.' : 'Mesmo mãos do mesmo naipe ou pares precisam ser avaliados em função da posição.'} Desistir faz parte da estratégia.`;
    else if (key.length === 2) reason = high >= 11 ? `${key} é um par forte e entra na abertura de todas as posições deste treino. Um aumento normal permite construir o pote e manter mãos piores na disputa.` : `${key} entra na faixa desta posição. Pares podem melhorar para trinca, mas exigem cuidado contra muitas cartas mais altas no flop.`;
    else if (key[0] === 'A' && key.endsWith('s')) reason = `${key} pode formar o flush mais alto e remove um ás das mãos possíveis dos adversários. Está na faixa de abertura de ${hand.position}; isso não significa pagar qualquer reaumento.`;
    else if (key.endsWith('s')) reason = `${key} está na faixa de ${hand.position}. Cartas do mesmo naipe${rankValue(key[0]) - rankValue(key[1]) <= 2 ? ' e próximas em valor' : ''} têm mais possibilidades de formar flushes${rankValue(key[0]) - rankValue(key[1]) <= 2 ? ' e sequências' : ''}.`;
    else reason = `${key} está na faixa de abertura de ${hand.position}. ${['BTN','CO','SB'].includes(hand.position) ? 'Com menos jogadores pela frente, você pode disputar os blinds com mais mãos.' : 'As cartas altas podem formar pares fortes, mas o kicker continua importante.'}`;
    if (action === 'call') reason += hand.position === 'SB' ? ' Completar o small blind existe em estratégias mistas; aqui a convenção é aumentar ou desistir.' : ' Pagar sem aumento (limp) não faz parte da estratégia de primeira abertura deste treino.';
    if (action === 'shove') reason += ' Colocar 100 BB no pote inicial de 1,5 BB é um tamanho excessivo para a abertura ensinada aqui.';
    return { correct: action === expected, expected, title: expected === 'raise' ? `Abra para ${String(raiseSize(hand.position)).replace('.', ',')} BB.` : 'Desistir é a escolha da tabela.', explanation: reason, key };
  }
  const CALL_RANGE = expandRange('22+ A2s+ K9s+ Q9s+ J9s+ T8s+ 97s+ 86s+ 75s+ 65s 54s ATo+ KJo+ QJo');
  const STREETS = ['Pré-flop', 'Flop', 'Turn', 'River'];
  const POST_ORDER = ['SB','BB','UTG','HJ','CO','BTN'];
  function callingCombos(visible) {
    const available = deck().filter(c => !visible.includes(c));
    return combinations(available, 2).filter(c => CALL_RANGE.has(handClass(c)));
  }
  function bestHoldem(hole, board) {
    if (hole.length !== 2 || board.length < 3 || board.length > 5) throw new Error('Hold’em: duas cartas e de três a cinco comunitárias.');
    validateCards([...hole,...board],hole.length+board.length);
    let best = null;
    for (const combo of combinations([...hole,...board], 5)) {
      const score = evaluateFive(combo,false);
      if (!best || compareVectors(score.vector,best.vector)>0) best = {...score, holeUsed:combo.filter(c=>hole.includes(c)),boardUsed:combo.filter(c=>board.includes(c))};
    }
    return best;
  }
  function holdemShowdown(hand) {
    const hero=bestHoldem(hand.cards,hand.board),villain=bestHoldem(hand.villainCards,hand.board);
    const comparison=compareVectors(hero.vector,villain.vector);
    return {hero,villain,winner:comparison>0?'hero':comparison<0?'villain':'tie'};
  }
  function seededRandom(seed) {
    let n=2166136261;
    for(const ch of String(seed)) {n^=ch.charCodeAt(0);n=Math.imul(n,16777619);}
    return function(){n+=0x6D2B79F5;let t=n;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};
  }
  function estimateEquity(hole, board, samples=400) {
    const rng=seededRandom(hole.join('')+board.join(''));
    const combos=callingCombos([...hole,...board]);
    let score=0;
    const exact=board.length===5;
    const total=exact?combos.length:samples;
    const fixedHero=exact?bestHoldem(hole,board):null;
    for(let i=0;i<total;i++){
      const opponent=exact?combos[i]:combos[Math.floor(rng()*combos.length)];
      const runout=exact?board:[...board,...shuffle(deck().filter(c=>![...hole,...board,...opponent].includes(c)),rng).slice(0,5-board.length)];
      const comparison=compareVectors((fixedHero||bestHoldem(hole,runout)).vector,bestHoldem(opponent,runout).vector);
      score+=comparison>0?1:comparison===0?.5:0;
    }
    return {value:score/total,samples:total,exact};
  }
  function blind(position){return position==='SB'?.5:position==='BB'?1:0;}
  function roundBB(n){return Math.round(n*100)/100;}
  function initPlay(hand) {
    if(hand.play)return hand.play;
    hand.decisions ||= [];
    hand.play={street:hand.kind==='omaha'?3:0,phase:'decision',pot:hand.kind==='omaha'?20:1.5,heroStack:100-blind(hand.position),villainStack:100-blind(hand.villainPosition),node:null,pending:null,feedback:null,result:null,endReason:null,assisted:false};
    return hand.play;
  }
  function visibleBoard(hand){return hand.kind==='omaha'?hand.board:hand.board.slice(0,hand.play?.street?hand.play.street+2:0);}
  function postflopNode(hand, afterCheck=false) {
    const p=initPlay(hand);
    if(p.node)return p.node;
    const board=visibleBoard(hand),equity=estimateEquity(hand.cards,board);
    const inPosition=POST_ORDER.indexOf(hand.position)>POST_ORDER.indexOf(hand.villainPosition);
    const plan=hand.plan[p.street-1];
    const potBefore=p.pot;
    const facing=(afterCheck?plan.probes:inPosition&&plan.leads)?Math.min(p.villainStack,p.heroStack,Math.max(.5,roundBB(potBefore*plan.fraction))):0;
    if(facing){p.villainStack=roundBB(p.villainStack-facing);p.pot=roundBB(p.pot+facing);}
    if(inPosition||afterCheck)observe(hand,afterCheck?'after-check':'lead',facing?'bet':'check',facing);
    const odds=facing?facing/(p.pot+facing):0;
    const made=bestHoldem(hand.cards,board);
    const expected=facing?(equity.value>=odds?'call':'fold'):(equity.value>=.68&&made.category>=1?'bet':'check');
    const marginal=facing?Math.abs(equity.value-odds)<=.06:Math.abs(equity.value-.68)<=.08;
    const accepted=marginal?(facing?['call','fold']:['bet','check']):[expected];
    p.node={facing,potBefore,odds,equity,inPosition,afterCheck,made,expected,accepted,betSize:Math.min(p.heroStack,p.villainStack,Math.max(.5,roundBB(p.pot*.5)))};
    return p.node;
  }
  function postflopFeedback(hand, action) {
    const n=postflopNode(hand),expected=n.expected;
    const pct=x=>Math.round(x*100)+'%';
    let explanation;
    if(n.facing) explanation=`Pagar custa ${String(n.facing).replace('.',',')} BB para um pote final de ${String(roundBB(hand.play.pot+n.facing)).replace('.',',')} BB: o preço exige ${pct(n.odds)} de equidade. A estimativa contra a faixa ilustrativa é ${pct(n.equity.value)}. ${n.accepted.length>1?'A diferença é pequena; este treino aceita pagar ou desistir.':expected==='call'?'O modelo favorece pagar.':'O modelo favorece desistir.'} ${hand.play.street<3?'Ainda há cartas e possíveis apostas futuras; equidade bruta não é garantia de realização.':'No river, comparamos todas as combinações legais da faixa.'}`;
    else explanation=`Sua equidade ${n.equity.exact?'calculada':'estimada'} contra a faixa ilustrativa é ${pct(n.equity.value)}. ${expected==='bet'?'Com mão feita e vantagem de equidade, o modelo propõe apostar meio pote por valor.':'O modelo prioriza dar check para controlar o pote e preservar fichas.'} ${n.accepted.length>1?'Nesta região, apostar ou dar check são aceitos.':''} Este é um exercício de fundamentos, não uma recomendação de solver.`;
    return {correct:n.accepted.includes(action),expected,accepted:n.accepted,title:n.accepted.length>1?'Há mais de uma linha aceita.':expected==='call'?'O preço permite pagar.':expected==='fold'?'O preço não compensa.':expected==='bet'?'Aposte por valor.':'Dê check e controle o pote.',explanation,equity:n.equity.value,odds:n.odds};
  }
  function endOrNext(hand){return hand.play.street===3||hand.play.heroStack<=0||hand.play.villainStack<=0?'showdown':'street';}
  function act(hand, action) {
    const p=initPlay(hand);
    if(p.phase!=='decision')return null;
    if(hand.kind==='holdem'&&p.street>0)postflopNode(hand);
    const context={board:[...visibleBoard(hand)],pot:p.pot,heroStack:p.heroStack,toCall:p.node?.facing||0,betSize:p.node?.betSize||0,equity:p.node?.equity?.value??null,observationCount:(hand.observations||[]).length};
    let fb;
    if(hand.kind==='omaha'){
      if(!['hero','villain','tie'].includes(action))throw new Error('Ação inválida');
      fb=feedback(hand,action);p.result=fb.result;p.pending='end';hand.answer=action;
    }else if(p.street===0){
      if(!['fold','call','raise','shove'].includes(action))throw new Error('Ação inválida');
      fb=feedback(hand,action);hand.answer=action;
      if(action==='fold'){p.pending='end';p.endReason='Você desistiu pré-flop.';}
      else {
        const total=action==='shove'?100:action==='raise'?raiseSize(hand.position):1;
        const add=total-blind(hand.position);
        p.heroStack=roundBB(p.heroStack-add);p.pot=roundBB(p.pot+add);
        if(!hand.preflopContinues&&action!=='call'){p.pending='end';p.endReason='Todos desistiram. Você ganhou o pote sem ver o flop.';observe(hand,'preflop','fold');}
        else {
          if(action==='call'){
            hand.villainPosition='BB';p.villainStack=99;
          }
          const villainAdd=total-blind(hand.villainPosition);
          p.villainStack=roundBB(p.villainStack-villainAdd);p.pot=roundBB(p.pot+villainAdd);
          observe(hand,'preflop','call',villainAdd);
          p.pending=action==='shove'?'showdown':'street';
        }
      }
    }else{
      const n=postflopNode(hand);
      if(!(n.facing?['fold','call']:['check','bet']).includes(action))throw new Error('Ação inválida nesta rodada');
      fb=postflopFeedback(hand,action);
      if(action==='fold'){p.pending='end';p.endReason=`Você desistiu no ${STREETS[p.street].toLowerCase()}.`;}
      else if(action==='call'){p.heroStack=roundBB(p.heroStack-n.facing);p.pot=roundBB(p.pot+n.facing);p.pending=endOrNext(hand);}
      else if(action==='check'){
        const plan=hand.plan[p.street-1];
        if(!n.inPosition&&typeof plan.probes==='boolean'&&p.heroStack>0&&p.villainStack>0){
          if(plan.probes)p.pending='probe';
          else {observe(hand,'after-check','check');p.pending=endOrNext(hand);}
        }else p.pending=endOrNext(hand);
      }
      else{
        p.heroStack=roundBB(p.heroStack-n.betSize);p.pot=roundBB(p.pot+n.betSize);
        if(hand.plan[p.street-1].folds){p.pending='end';p.endReason='O adversário desistiu da sua aposta. Você ganhou o pote.';observe(hand,'response','fold');}
        else{p.villainStack=roundBB(p.villainStack-n.betSize);p.pot=roundBB(p.pot+n.betSize);p.pending=endOrNext(hand);observe(hand,'response','call',n.betSize);}
      }
    }
    const decision={street:p.street,action,correct:fb.correct,expected:fb.expected,assisted:p.assisted||hand.assisted,explanation:fb.explanation,context};
    hand.decisions.push(decision);p.feedback=fb;p.phase='feedback';
    return decision;
  }
  function advance(hand){
    const p=initPlay(hand);
    if(p.phase==='showdown'){p.phase='done';return 'done';}
    if(p.phase!=='feedback')return 'unchanged';
    if(p.pending==='end'){p.phase='done';return 'done';}
    if(p.pending==='probe'){p.phase='decision';p.pending=null;p.feedback=null;p.node=null;p.assisted=false;hand.assisted=false;postflopNode(hand,true);return 'response';}
    if(p.pending==='showdown'){p.street=3;p.result=holdemShowdown(hand);p.phase='showdown';return 'showdown';}
    p.street++;p.phase='decision';p.feedback=null;p.pending=null;p.node=null;p.assisted=false;hand.assisted=false;
    postflopNode(hand);return 'street';
  }
  return { RANKS, SUITS, SYMBOLS, SUIT_NAMES, POSITIONS, OPEN_POSITIONS, RANGES, RANGE_NOTATION, POSITION_INFO, CATEGORY_NAMES, CALL_RANGE, STREETS, rankValue, random, shuffle, deck, handClass, expandRange, recommended, rangeStats, raiseSize, combinations, compareVectors, evaluateFive, bestOmaha, showdown, describeHand, showdownReason, createSession, createOpponents, ATMOSPHERES, randomPlan, correctAction, feedback, validateCards, bestHoldem, holdemShowdown, seededRandom, estimateEquity, callingCombos, blind, initPlay, visibleBoard, postflopNode, postflopFeedback, act, advance };
});
