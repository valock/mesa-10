/* Mesa 10 — leitura de ações públicas e calculadora de valor esperado. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./engine.js'));
  else root.MesaCoach=factory(root.MesaEngine);
})(typeof globalThis!=='undefined'?globalThis:this,function(E){
  'use strict';
  function sessionsOf(state){
    const unique=new Map((state.history||[]).map(s=>[s.id,s]));
    unique.set(state.session.id,state.session);
    return [...unique.values()];
  }
  function readOpponent(state,id,atDecision=false){
    const current=state.session.hands[state.session.current];
    const stats={hands:0,bets:0,checks:0,folds:0,calls:0};
    if(!id)return stats;
    for(const session of sessionsOf(state))for(const hand of session.hands){
      if(hand.villainId!==id)continue;
      const all=hand.observations||[];
      const decisionContext=atDecision&&hand===current&&current.play?.phase==='feedback'?current.decisions.at(-1)?.context:null;
      const visible=Number.isInteger(decisionContext?.observationCount)?all.slice(0,decisionContext.observationCount):all;
      const events=visible.filter(e=>{
        if(!atDecision||hand!==current)return true;
        if(Number.isInteger(decisionContext?.observationCount)||current.play?.phase==='decision')return true;
        const street=current.play?.street||0;
        return e.street<street||(e.street===street&&e.context==='lead');
      });
      if(events.length)stats.hands++;
      for(const e of events){
        if(['lead','after-check'].includes(e.context)&&e.action==='bet')stats.bets++;
        if(['lead','after-check'].includes(e.context)&&e.action==='check')stats.checks++;
        if(e.context==='response'&&e.action==='fold')stats.folds++;
        if(e.context==='response'&&e.action==='call')stats.calls++;
      }
    }
    return stats;
  }
  function profile(stats){
    const opportunities=stats.bets+stats.checks, faced=stats.folds+stats.calls;
    const aggression=opportunities?stats.bets/opportunities:null;
    const foldRate=faced?stats.folds/faced:null;
    let label='Em observação',tip='Ainda há poucas ações. Continue coletando dados antes de mudar sua estratégia.';
    if(opportunities>=12){
      if(aggression>=.6){label='Aposta com frequência';tip='Investigue apostas mais amplas, mas agressividade sozinha não prova blefe. Compare preço, textura da mesa e força da sua mão.';}
      else if(aggression<=.3){label='Prefere dar check';tip='Amostra com poucos ataques. Não presuma fraqueza em todo check; observe as mãos mostradas e o tamanho das apostas.';}
      else {label='Frequência intermediária';tip='A frequência de apostas não mostra um desvio claro. Priorize posição, preço e a faixa de mãos possíveis.';}
    }
    if(faced>=10)tip+=foldRate>=.55?' Desistiu de muitas apostas nesta amostra; explore hipóteses de blefe no laboratório de EV.':foldRate<=.25?' Pagou muitas apostas nesta amostra; valorize mãos fortes e tenha cuidado com blefes.':'';
    return {...stats,opportunities,faced,aggression,foldRate,label,tip,confidence:opportunities<12?'Amostra pequena':opportunities<40?'Leitura inicial':'Tendência da amostra'};
  }
  function callEV(equity,pot,toCall){return equity*(pot+toCall)-toCall;}
  function betEV(equityWhenCalled,pot,bet,foldRate){return foldRate*pot+(1-foldRate)*(equityWhenCalled*(pot+2*bet)-bet);}
  function snapshot(state){
    const h=state.session.hands[state.session.current],p=h.play;
    if(h.kind!=='holdem'||!p||p.phase==='showdown'||p.phase==='done'||state.session.complete)return null;
    const context=p.phase==='feedback'?h.decisions.at(-1)?.context:null;
    if(p.phase==='feedback'&&!context)return null;
    const n=p.node;
    return {kind:'holdem',street:p.street,position:h.position,cards:[...h.cards],board:context?[...context.board]:E.visibleBoard(h),pot:context?.pot??p.pot,toCall:context?.toCall??n?.facing??0,betSize:context?.betSize??n?.betSize??0,phase:p.phase,choice:p.phase==='feedback'?h.decisions.at(-1).action:null,opponent:readOpponent(state,h.villainId,true)};
  }
  function validateSnapshot(value){
    if(!value||value.kind!=='holdem'||!Number.isInteger(value.street)||value.street<0||value.street>3||!E.OPEN_POSITIONS.includes(value.position)||!['decision','feedback'].includes(value.phase))throw new Error('Contexto inválido.');
    if(!Array.isArray(value.cards)||value.cards.length!==2||!Array.isArray(value.board)||value.board.length!==(value.street===0?0:value.street+2))throw new Error('Cartas incompatíveis com a rodada.');
    E.validateCards([...value.cards,...value.board],value.cards.length+value.board.length);
    const number=(v,max)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<0||v>max)throw new Error('Valor fora do limite.');return v;};
    const pot=number(value.pot,202),toCall=number(value.toCall,100),betSize=number(value.betSize,100);
    if(pot<1||toCall>pot||toCall&&betSize<0||value.street===0&&(toCall!==0||betSize!==0))throw new Error('Pote inválido.');
    const legal=value.street===0?['fold','call','raise','shove']:toCall?['fold','call']:['check','bet'];
    if(value.choice!==null&&!legal.includes(value.choice)||value.phase==='decision'&&value.choice!==null||value.phase==='feedback'&&value.choice===null)throw new Error('Ação inválida.');
    const opponent={};for(const k of ['hands','bets','checks','folds','calls']){const n=number(value.opponent?.[k],10000);if(!Number.isInteger(n))throw new Error('Contagem inválida.');opponent[k]=n;}
    return {kind:'holdem',street:value.street,position:value.position,cards:[...value.cards],board:[...value.board],pot,toCall,betSize,phase:value.phase,choice:value.choice,opponent};
  }
  function analyze(snapshot,equityOverride){
    const s=validateSnapshot(snapshot),read=profile(s.opponent);
    const equity=s.street?(equityOverride??E.estimateEquity(s.cards,s.board).value):null;
    const price=s.toCall?s.toCall/(s.pot+s.toCall):null;
    const ev=s.toCall?callEV(equity,s.pot,s.toCall):null;
    const expected=!s.street?E.recommended(s.position,s.cards):s.toCall?(equity>=price?'call':'fold'):(equity>=.68&&E.bestHoldem(s.cards,s.board).category>=1?'bet':'check');
    const labels={raise:'Aumentar',fold:'Desistir',call:'Pagar',check:'Dar check',bet:'Apostar'};
    let reason=!s.street?E.feedback({kind:'holdem',position:s.position,cards:s.cards},expected).explanation:s.toCall?`O preço para pagar é ${Math.round(price*100)}%. A equidade estimada contra a faixa fixa é ${Math.round(equity*100)}%. O EV de pagar neste modelo é ${ev.toFixed(2).replace('.',',')} BB, considerando que não haverá novas apostas.`:`Com ${Math.round(equity*100)}% de equidade estimada contra a faixa fixa, o modelo didático sugere ${labels[expected].toLowerCase()}. A equidade contra quem paga uma aposta pode ser diferente.`;
    return {expected,label:labels[expected],reason,read,equity,price,callEV:ev,limits:'A leitura usa somente ações observadas. A faixa de equidade ainda é fixa; a frequência de apostas não revela as cartas. EV é uma hipótese sem apostas futuras, rake ou garantia de lucro.'};
  }
  function evReview(session){
    let opportunities=0,missed=0;
    for(const h of session.hands)for(const d of h.decisions||[]){
      const c=d.context;
      if(!c||!c.toCall||c.equity===null||!['call','fold'].includes(d.action))continue;
      const ev=callEV(c.equity,c.pot,c.toCall);
      opportunities++;missed+=Math.max(0,ev)-(d.action==='call'?ev:0);
    }
    return {opportunities,missed};
  }
  return {sessionsOf,readOpponent,profile,callEV,betEV,snapshot,validateSnapshot,analyze,evReview};
});
