const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function worker({base='https://example.test/app/sw.js',failInstall=false}={}){
  const listeners={},buckets=new Map(),network=[];let activated=0,claimed=0;
  const caches={
    async open(key){if(!buckets.has(key))buckets.set(key,new Map());const map=buckets.get(key);return {
      async addAll(urls){if(failInstall)throw new Error('offline');urls.forEach(url=>map.set(url,{ok:true,type:'basic',body:'cached:'+url}));},
      async match(key){return map.get(key);},async put(key,value){map.set(key,value);}
    };},async keys(){return [...buckets.keys()];},async delete(key){return buckets.delete(key);}
  };
  const self={location:new URL(base),addEventListener:(type,fn)=>listeners[type]=fn,skipWaiting:async()=>{activated++;},clients:{claim:async()=>{claimed++;}}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'dist/sw.js'),'utf8'),{self,caches,URL,fetch:async request=>{network.push(request);return {ok:false,status:503,type:'basic'};}});
  async function event(type,extra={}){let work;listeners[type]({...extra,waitUntil:p=>{work=p;}});await work;}
  function fetch(url,method='GET',mode='cors'){let response;listeners.fetch({request:{url,method,mode},respondWith:p=>{response=p;}});return response;}
  return {event,fetch,buckets,network,get activated(){return activated;},get claimed(){return claimed;}};
}
test('PWA instala todos os assets e reabre o shell e scripts sem acessar a rede',async()=>{
  const w=worker();await w.event('install');assert.equal(w.activated,0);
  const shell=await w.fetch('https://example.test/app/?source=home','GET','navigate');assert.match(shell.body,/index.html$/);
  const js=await w.fetch('https://example.test/app/cash.js?v=1');assert.match(js.body,/cash.js$/);assert.equal(w.network.length,0);
  assert.equal(w.fetch('https://example.test/outside/','GET','navigate'),undefined);
});
test('PWA nunca intercepta API, POST, outro domínio ou downloads fora do shell',async()=>{
  const w=worker();await w.event('install');
  for(const url of ['https://example.test/api/calibration','https://example.test/.netlify/functions/coach','https://example.test/app/api/coach','https://other.test/app/cash.js','https://example.test/app/mesa-10-netlify.zip'])assert.equal(w.fetch(url),undefined);
  assert.equal(w.fetch('https://example.test/app/cash.js','POST'),undefined);assert.equal(w.network.length,0);
});
test('nova versão espera pedido explícito e limpa somente caches deste escopo',async()=>{
  const w=worker();await w.event('install');const current=[...w.buckets.keys()][0];
  w.buckets.set('mesa10:/app/:old',new Map());w.buckets.set('mesa10:/other/:old',new Map());w.buckets.set('another-app',new Map());
  await w.event('message',{data:{type:'UNRELATED'}});assert.equal(w.activated,0);
  await w.event('message',{data:{type:'ACTIVATE_UPDATE'}});assert.equal(w.activated,1);
  await w.event('activate');assert.equal(w.claimed,1);assert.ok(w.buckets.has(current));assert.ok(!w.buckets.has('mesa10:/app/:old'));assert.ok(w.buckets.has('mesa10:/other/:old'));assert.ok(w.buckets.has('another-app'));
});
test('instalação incompleta falha e resposta de erro não contamina o cache',async()=>{
  const broken=worker({failInstall:true});await assert.rejects(()=>broken.event('install'));assert.equal(broken.activated,0);
  const w=worker();await w.event('install');const cache=[...w.buckets.values()][0];cache.delete('https://example.test/app/cash.js');
  assert.equal((await w.fetch('https://example.test/app/cash.js')).status,503);assert.equal(cache.has('https://example.test/app/cash.js'),false);
});
test('manifesto e ícones resolvem dentro do escopo, com PNGs nas dimensões declaradas',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'dist/manifest.webmanifest')));assert.equal(manifest.display,'standalone');
  for(const key of ['id','scope','start_url'])assert.equal(new URL(manifest[key],'https://example.test/app/manifest.webmanifest').pathname,'/app/');
  for(const item of [...manifest.icons,{src:'icons/apple-touch-icon.png',sizes:'180x180'}]){const png=fs.readFileSync(path.join(root,'dist',item.src));assert.equal(png.toString('hex',0,8),'89504e470d0a1a0a');assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`,item.sizes);}
  assert.ok(manifest.icons.some(i=>i.purpose==='maskable'));
});
function client(){
  const listeners={},swListeners={},workerListeners={},messages=[];let reloads=0,saves=0,toast='';
  const registration={active:{},waiting:{postMessage:message=>messages.push(message)},addEventListener:(name,fn)=>workerListeners[name]=fn};
  const navigator={onLine:true,serviceWorker:{controller:{},addEventListener:(name,fn)=>swListeners[name]=fn,register:async()=>registration,ready:Promise.resolve(),getRegistration:async()=>registration}};
  const window={isSecureContext:true,matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener:(name,fn)=>listeners[name]=fn};
  const document={readyState:'loading',addEventListener:(name,fn)=>listeners[name]=fn,querySelectorAll:()=>[],getElementById:()=>null};
  const location={protocol:'https:',pathname:'/',reload:()=>reloads++};
  vm.runInNewContext(fs.readFileSync(path.join(root,'dist/pwa.js'),'utf8'),{window,document,navigator,location});
  return {window,navigator,registration,messages,listeners,swListeners,host:{save:()=>{saves++;return true;},toast:m=>{toast=m;}},get reloads(){return reloads;},get saves(){return saves;},get toast(){return toast;}};
}
test('cliente só ativa atualização após salvar e não recarrega sozinho durante uma mão',async()=>{
  const c=client();await c.listeners.DOMContentLoaded();assert.equal(c.messages.length,0);c.swListeners.controllerchange();assert.equal(c.reloads,0);
  c.window.MesaPWA.handle('pwa-update',c.host);assert.equal(c.saves,1);assert.equal(c.messages[0].type,'ACTIVATE_UPDATE');assert.equal(c.reloads,0);
  c.swListeners.controllerchange();assert.equal(c.reloads,1);
});
test('falha ao salvar bloqueia a atualização para preservar a mão aberta',async()=>{
  const c=client();await c.listeners.DOMContentLoaded();c.window.MesaPWA.handle('pwa-update',{...c.host,save:()=>false});assert.equal(c.messages.length,0);assert.equal(c.reloads,0);assert.match(c.toast,/não conseguiu salvar/);
});
