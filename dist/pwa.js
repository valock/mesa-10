(function(root){
  'use strict';
  let registration=null,installPrompt=null,ready=false,updating=false,newController=false,offlineError=false;
  const display=root.matchMedia('(display-mode: standalone)');
  const installed=()=>display.matches||navigator.standalone===true;
  const supported=()=>root.isSecureContext&&'serviceWorker' in navigator&&/^https?:$/.test(location.protocol)&&!location.pathname.endsWith('/mesa-10.html');
  const ios=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)||(/Mac/.test(navigator.platform)&&navigator.maxTouchPoints>1);
  const waiting=()=>Boolean(registration?.waiting||newController);
  function settingsHTML(){return `<section class="pwa-settings"><div class="pwa-heading"><img src="icons/icon.svg" width="44" height="44" alt=""><div><span class="eyebrow">Mesa 10 no seu celular</span><h3>${installed()?'Seu app de treino.':'Sua mesa, sempre à mão.'}</h3></div></div><div class="pwa-state"><span class="status-dot ${ready?'':'pending'}"></span><span>${ready?'Treino offline pronto neste aparelho.':offlineError?'O modo offline ainda não está pronto. Reabra com internet para tentar novamente.':supported()?'Preparando o treino offline…':'Abra o endereço HTTPS no Safari ou Chrome para preparar o modo offline.'}</span></div><p>Mesa, tabelas e diagnóstico local funcionam sem internet depois do primeiro carregamento. A revisão com Gemini precisa de conexão.</p>${installed()?'<span class="pwa-installed">✓ Aberto como aplicativo</span>':`<button class="next-button" data-do="pwa-install">${installPrompt?'Instalar Mesa 10':'Como adicionar à tela inicial'} <span>↗</span></button>`}${waiting()?'<button class="outline-btn" data-do="pwa-update">Salvar e atualizar o app ↻</button>':''}<p class="pwa-data-note">Seu histórico fica neste navegador e dispositivo. Instale antes de começar seu treino principal. Trocar de domínio ou limpar os dados do site pode remover o progresso.</p></section>`;}
  function sync(){
    document.querySelectorAll('[data-pwa-settings]').forEach(el=>{el.innerHTML=settingsHTML();});
    const notice=document.getElementById('pwa-notice');if(!notice)return;
    notice.hidden=navigator.onLine&&!waiting();
    notice.innerHTML=waiting()?`<span><b>Uma nova versão está pronta.</b> Seu treino será salvo antes de atualizar.</span><button data-do="pwa-update" ${updating?'disabled':''}>${updating?'Atualizando…':'Salvar e atualizar ↻'}</button>`:!navigator.onLine?`<span><b>Você está offline.</b> ${ready?'O treino continua. Gemini disponível ao reconectar.':'Mantenha esta tela aberta; reconecte para preparar o acesso offline.'}</span>`:'';
  }
  function help(openModal){openModal('Instalar o Mesa 10',`<div class="pwa-install-help"><img src="icons/icon.svg" width="64" height="64" alt="Ícone do Mesa 10"><p>Abra o endereço do aplicativo no navegador do celular. A instalação usa o site hospedado, não o arquivo HTML baixado.</p>${ios()?'<span class="eyebrow">Neste iPhone ou iPad</span>':''}<h3>iPhone · Safari</h3><ol><li>Toque em <strong>Compartilhar</strong> (no menu de página ou no botão de compartilhamento).</li><li>Escolha <strong>Adicionar à Tela de Início</strong>.</li><li>Se aparecer, ative <strong>Abrir como App da Web</strong> e toque em <strong>Adicionar</strong>.</li></ol><h3>Android · Chrome</h3><ol><li>Abra o menu <strong>⋮</strong> do Chrome.</li><li>Escolha <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong> e confirme.</li></ol><p>Abra pelo novo ícone com internet e aguarde “Treino offline pronto” nas configurações. Depois você pode treinar sem conexão.</p><p class="modal-note">Se estiver dentro de outro aplicativo, escolha abrir no Safari ou Chrome primeiro. Os nomes dos menus variam conforme a versão do sistema.</p></div>`);}
  function handle(action,host){
    if(!action.startsWith('pwa-'))return false;
    if(action==='pwa-help')help(host.openModal);
    if(action==='pwa-install'){
      if(!installPrompt){help(host.openModal);return true;}
      const prompt=installPrompt;installPrompt=null;
      prompt.prompt().then(()=>prompt.userChoice).then(()=>sync()).catch(()=>help(host.openModal));
    }
    if(action==='pwa-update'){
      if(updating)return true;if(host.save()===false){host.toast('O navegador não conseguiu salvar a mão. Continue o treino antes de atualizar.');return true;}updating=true;sync();
      if(registration?.waiting)registration.waiting.postMessage({type:'ACTIVATE_UPDATE'});
      else if(newController)location.reload();
      else{updating=false;sync();host.toast('A versão atual já está em uso.');}
    }
    return true;
  }
  root.MesaPWA={settingsHTML,handle};
  root.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;sync();});
  root.addEventListener('appinstalled',()=>{installPrompt=null;sync();});
  display.addEventListener?.('change',sync);
  root.addEventListener('online',sync);root.addEventListener('offline',sync);
  async function start(){
    if(!supported()){sync();return;}
    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      ready=true;
      if(updating){location.reload();return;}
      // Another open tab may activate an update. Never reload an active hand here.
      newController=Boolean(registration?.active&&hadController);
      sync();
    });
    const hadController=Boolean(navigator.serviceWorker.controller);
    try{
      registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
      ready=Boolean(registration.active);
      registration.addEventListener('updatefound',()=>{
        const worker=registration.installing;
        worker?.addEventListener('statechange',()=>{if(worker.state==='installed'||worker.state==='activated'){ready=Boolean(registration.active);sync();}});
      });
      navigator.serviceWorker.ready.then(()=>{ready=true;sync();});
      sync();
    }catch(_){registration=await navigator.serviceWorker.getRegistration('./').catch(()=>null);ready=Boolean(registration?.active);offlineError=!ready;sync();}
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&navigator.onLine)registration?.update().catch(()=>{});});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(window);
