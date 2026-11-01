const {test}=require('node:test');
const assert=require('node:assert/strict');
const base={kind:'holdem',street:0,position:'BTN',cards:['As','Kh'],board:[],pot:1.5,toCall:0,betSize:0,phase:'decision',choice:null,opponent:{hands:0,bets:0,checks:0,folds:0,calls:0}};
const request=(body=base,extra={})=>new Request('https://mesa.example/api/coach',{method:'POST',headers:{origin:'https://mesa.example','content-type':'application/json',...extra},body:JSON.stringify(body)});
const responseNote={summary:'Estude o aumento.',opponentRead:'Poucas ações.',adjustment:'Observe antes de ajustar.',exercise:'Compare posições.',caveat:'Sem promessa de lucro.'};
async function handler(fetchImpl,env={GEMINI_API_KEY:'fake-test-key'}){return (await import('../netlify/functions/coach.mjs')).createHandler({env,fetchImpl});}
test('API sem chave informa modo local sem chamar provedor',async()=>{
  const h=await handler(()=>assert.fail('Não deveria chamar API'),{});
  const status=await h(new Request('https://mesa.example/api/coach'));assert.equal((await status.json()).ready,false);
  assert.equal((await h(request())).status,503);
});
test('API bloqueia origem externa, tipo incorreto, corpo grande e contexto inválido',async()=>{
  const h=await handler(()=>assert.fail('Não deveria chamar API'));
  assert.equal((await h(request(base,{origin:'https://evil.example'}))).status,403);
  assert.equal((await h(request(base,{'content-type':'text/plain'}))).status,415);
  assert.equal((await h(request({...base,board:['2s','3s','4s']}))).status,400);
  assert.equal((await h(request({...base,padding:'a'.repeat(10000)}))).status,413);
});
test('API usa chave no cabeçalho do servidor e envia somente dados permitidos',async()=>{
  let calls=0;
  const h=await handler(async(url,options)=>{
    calls++;assert.ok(!url.includes('fake-test-key'));assert.equal(options.headers['x-goog-api-key'],'fake-test-key');
    const body=JSON.parse(options.body),input=JSON.parse(body.contents[0].parts[0].text);
    assert.deepEqual(input.scenario,base);assert.equal(input.calculation.recommendedAction,'raise');
    assert.equal(input.calculation.equity,null);assert.ok(!JSON.stringify(body).includes('hidden-secret'));
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(responseNote)}]}}]});
  });
  const r=await h(request({...base,villainCards:['Qc','Qd'],prompt:'hidden-secret',apiKey:'hidden-secret'}));
  assert.equal(r.status,200);const data=await r.json();assert.deepEqual(data.analysis,responseNote);assert.equal(calls,1);assert.ok(!JSON.stringify(data).includes('fake-test-key'));
});
test('API trata cota, erro e resposta truncada sem vazar detalhes ou repetir chamada',async()=>{
  for(const [upstream,code] of [[new Response('private key error',{status:429}),'quota_exceeded'],[new Response('private key error',{status:403}),'provider_unavailable'],[Response.json({candidates:[{finishReason:'MAX_TOKENS'}]}),'incomplete_response']]){
    let calls=0;const h=await handler(async()=>{calls++;return upstream;});const r=await h(request());assert.equal((await r.json()).code,code);assert.equal(calls,1);
  }
  const h=await handler(async()=>{throw new DOMException('timeout','AbortError');});assert.equal((await h(request())).status,504);
});
test('resposta estrutural inválida é rejeitada; regra de limite está configurada',async()=>{
  const h=await handler(async()=>Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:'{"summary":"incompleto"}'}]}}]}));
  assert.equal((await h(request())).status,502);
  const {config}=await import('../netlify/functions/coach.mjs');assert.equal(config.rateLimit.windowLimit,6);assert.deepEqual(config.rateLimit.aggregateBy,['ip','domain']);
});
test('API de calibração usa somente contagens validadas e não recebe cartas ocultas',async()=>{
 const {createHandler}=await import('../netlify/functions/coach.mjs');
 const D=require('../dist/cash-coach.js'),Cash=require('../dist/cash.js');const t=Cash.make({},15);const payload=D.payload(t);let captured;
 const handler=createHandler({report:true,env:{GEMINI_API_KEY:'test-only'},fetchImpl:async(url,options)=>{captured=JSON.parse(options.body);return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({summary:'Amostra inicial.',opponentRead:'Sem dados suficientes.',adjustment:'Observe a seleção.',exercise:'Reveja uma decisão.',caveat:'Não prevê lucro.'})}]}}]}),{status:200});}});
 const response=await handler(new Request('https://test.example/api/calibration',{method:'POST',headers:{Origin:'https://test.example','Content-Type':'application/json'},body:JSON.stringify({...payload,secret:'HIDDEN_SECRET',holes:['As','Ks'],prompt:'INJECTION'})}));
 assert.equal(response.status,200);assert.ok(!JSON.stringify(captured).includes('HIDDEN_SECRET'));assert.ok(!JSON.stringify(captured).includes('INJECTION'));assert.ok(captured.systemInstruction.parts[0].text.includes('aposta viva'));assert.equal(JSON.parse(captured.contents[0].parts[0].text).observations.version,4);
 const invalid=await handler(new Request('https://test.example/api/calibration',{method:'POST',headers:{Origin:'https://test.example','Content-Type':'application/json'},body:JSON.stringify({...payload,vpip:500})}));assert.equal(invalid.status,400);
});
