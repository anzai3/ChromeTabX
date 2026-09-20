import {i18n} from './i18n.js';
if(globalThis.chrome?.runtime?.getManifest){
 (async()=>{
  try{
   const manifest=await (await fetch(chrome.runtime.getURL('manifest.json'),{cache:'no-store'})).json();
   if(manifest.version===chrome.runtime.getManifest().version)return;
   const banner=document.createElement('div');banner.className='extension-update';banner.dataset.languageUi='';
   const text=document.createElement('span'),button=document.createElement('button');button.type='button';
   const labels=()=>{
    const zh=i18n.locale.startsWith('zh');
    text.textContent=zh?'后台仍在运行旧版本，请应用更新以启用缩略图修复。':'The background is running an older version. Apply the update to enable thumbnail fixes.';
    button.textContent=zh?'应用更新':'Apply update';
   };
   labels();i18n.subscribe(labels);
   button.onclick=()=>chrome.runtime.reload();
   banner.append(text,button);document.querySelector('main').prepend(banner);
  }catch{}
 })();
}
