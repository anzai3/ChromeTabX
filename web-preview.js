import {isGenericTitle} from './tab-titles.js';
import {i18n} from './i18n.js';

export function previewUrl(value) {
 try {const url=new URL(value);return /^https?:$/.test(url.protocol)&&!url.username&&!url.password?url.href:null;} catch{return null;}
}

export function mountWebPreview({root=document.getElementById('content'),doc=document,locale=i18n}={}) {
 const panel=doc.createElement('section');panel.id='web-preview';panel.dataset.languageUi='';panel.hidden=true;
 panel.setAttribute('role','region');
 const header=doc.createElement('div');header.className='web-preview-header';
 const title=doc.createElement('strong'),close=doc.createElement('button');close.type='button';close.textContent='×';
 const note=doc.createElement('p'),frameHost=doc.createElement('div'),open=doc.createElement('button');open.type='button';
 frameHost.className='web-preview-viewport';
 const loading=doc.createElement('div');loading.className='web-preview-loading';loading.setAttribute('role','status');loading.hidden=true;
 const spinner=doc.createElement('span');spinner.className='web-preview-spinner';spinner.setAttribute('aria-hidden','true');
 const loadingText=doc.createElement('span');loading.append(spinner,loadingText);
 let loadTimer;
 function stopLoading(){clearTimeout(loadTimer);loading.hidden=true;frameHost.setAttribute('aria-busy','false');}

 const toolbar=doc.createElement('div');toolbar.className='web-preview-tools';
 const zoomLabel=doc.createElement('label'),zoom=doc.createElement('select'),zoomText=doc.createElement('span');
 for(const value of [70,80,90,100]){const option=doc.createElement('option');option.value=String(value);option.textContent=`${value}%`;zoom.append(option);}
 zoom.value='80';zoomLabel.append(zoomText,zoom);
 const textPreview=doc.createElement('button');textPreview.type='button';
 toolbar.append(zoomLabel,textPreview,open);
 header.append(title,loading,close);panel.append(header,note,frameHost,toolbar);doc.body.append(panel);
 function applyZoom(){const scale=Number(zoom.value)/100;const frame=frameHost.querySelector('iframe');if(frame){frame.style.width=`${100/scale}%`;frame.style.height=`${100/scale}%`;frame.style.transform=`scale(${scale})`;}}
 zoom.onchange=applyZoom;
 textPreview.onclick=()=>{const button=trigger;hide();button?.click();};
 let trigger=null,showTimer,hideTimer,epoch=0,tab=null,selectedId=null,selectedUrl=null;
 const words=()=>locale.locale.startsWith('zh')?{
  loading:'正在加载网页…',slow:'网页加载较慢，可稍后查看或打开原标签。',title:'网页预览',close:'关闭预览',open:'打开原标签',zoom:'缩放',text:'文字预览',
  note:'临时加载网页；若空白、登录失败或网站禁止嵌入，请打开原标签。',
  unavailable:'该页面无法嵌入预览，请打开原标签。'
 }:{loading:'Loading page…',slow:'This page is taking longer to load. Wait or open the original tab.',title:'Web preview',close:'Close preview',open:'Open original tab',zoom:'Zoom',text:'Text preview',note:'Loads a temporary page. If blank, signed out, or blocked by the site, open the original tab.',unavailable:'This page cannot be embedded. Open the original tab.'};
 function hide(){stopLoading();clearTimeout(showTimer);clearTimeout(hideTimer);epoch++;panel.hidden=true;frameHost.replaceChildren();trigger=null;tab=null;selectedId=null;selectedUrl=null;}
 function leave(){clearTimeout(showTimer);}
 async function show(button){
  if(!button.isConnected || doc.querySelector('dialog[open]'))return;
  const node=button.closest('.card')?.querySelector('[data-summary]');if(!node)return;
  if(!panel.hidden&&selectedId===button.dataset.preview&&selectedUrl===node.dataset.url){trigger=button;return;}
  hide();trigger=button;selectedId=button.dataset.preview;selectedUrl=node.dataset.url;const token=++epoch;const w=words();
  title.textContent=node.dataset.title||w.title;panel.setAttribute('aria-label',w.title);close.setAttribute('aria-label',w.close);open.textContent=w.open;open.disabled=true;note.textContent=w.note;
  zoomText.textContent=w.zoom;zoom.setAttribute('aria-label',w.zoom);textPreview.textContent=w.text;
  loadingText.textContent=w.loading;loading.hidden=false;frameHost.replaceChildren();frameHost.setAttribute('aria-busy','true');
  loadTimer=setTimeout(()=>{if(token===epoch){stopLoading();note.textContent=w.slow;}},15000);
  panel.hidden=false;
  const rect=button.getBoundingClientRect(),width=panel.offsetWidth,height=panel.offsetHeight;
  let left=rect.right+10;
  if(left+width>innerWidth-12)left=rect.left-width-10;
  panel.style.left=`${Math.max(12,Math.min(left,innerWidth-width-12))}px`;
  panel.style.top=`${Math.max(12,Math.min(rect.top,innerHeight-height-12))}px`;
  try {
   const live=!!globalThis.chrome?.tabs?.get;
   const target={id:Number(button.dataset.preview),url:node.dataset.url,title:node.dataset.title};
   if(token!==epoch)return;
   tab=target;open.disabled=true;
   if(!isGenericTitle(target.title))title.textContent=target.title;
   const url=previewUrl(target.url);if(!url){stopLoading();note.textContent=w.unavailable;return;}
   const frame=doc.createElement('iframe');frame.title=w.title;
   // Isolate external content; no popups, top navigation, forms, or downloads.
   frame.setAttribute('sandbox','allow-scripts allow-same-origin');frame.referrerPolicy='no-referrer';
   frame.addEventListener('load',()=>{if(token===epoch)stopLoading();},{once:true});
   frame.addEventListener('error',()=>{if(token===epoch){stopLoading();note.textContent=w.unavailable;}},{once:true});
   frame.src=url;frameHost.append(frame);applyZoom();
   // Start the network request immediately; validate live metadata without delaying it.
   if(live)chrome.tabs.get(target.id).then(current=>{
    if(token!==epoch)return;
    if(current.url!==target.url){hide();return;}
    tab=current;open.disabled=false;if(!isGenericTitle(current.title))title.textContent=current.title;
   }).catch(()=>{if(token===epoch){open.disabled=true;stopLoading();note.textContent=w.unavailable;}});
   // Cross-origin load events cannot prove successful rendering. Keep the fallback visible.
  }catch{if(token===epoch){stopLoading();note.textContent=w.unavailable;}}
 }
 const over=event=>{
  if(event.pointerType!=='mouse')return;
  const button=event.target.closest('[data-preview]');if(!button||button.contains(event.relatedTarget))return;
  clearTimeout(hideTimer);clearTimeout(showTimer);
  if(trigger===button)return;
  showTimer=setTimeout(()=>show(button),150);
 };
 const out=event=>{const b=event.target.closest('[data-preview]');if(b&&!b.contains(event.relatedTarget)&&!panel.contains(event.relatedTarget))leave();};
 const click=event=>{if(!panel.contains(event.target))hide();};
 const key=event=>{if(event.key==='Escape')hide();};
 const scroll=event=>{if(!panel.contains(event.target))hide();};
 const visibility=()=>{if(doc.hidden)hide();};
 panel.addEventListener('pointerenter',()=>{clearTimeout(hideTimer);clearTimeout(showTimer);});
 close.onclick=hide;open.onclick=async()=>{try{if(tab){await chrome.tabs.update(tab.id,{active:true});await chrome.windows.update(tab.windowId,{focused:true});hide();}}catch{note.textContent=words().unavailable;}};
 root.addEventListener('pointerover',over);root.addEventListener('pointerout',out);doc.addEventListener('click',click,true);doc.addEventListener('keydown',key);doc.addEventListener('visibilitychange',visibility);window.addEventListener('resize',hide);window.addEventListener('scroll',scroll,true);
 const observer=new MutationObserver(()=>{
  if(trigger&&!trigger.isConnected){
   const replacement=[...root.querySelectorAll('[data-preview]')].find(button=>button.dataset.preview===selectedId&&button.closest('.card')?.querySelector('[data-summary]')?.dataset.url===selectedUrl);
   if(replacement)trigger=replacement;else hide();
  }
 });observer.observe(root,{childList:true});
 const unsubscribe=locale.subscribe(hide);
 return {destroy(){hide();observer.disconnect();unsubscribe();root.removeEventListener('pointerover',over);root.removeEventListener('pointerout',out);doc.removeEventListener('click',click,true);doc.removeEventListener('keydown',key);doc.removeEventListener('visibilitychange',visibility);window.removeEventListener('resize',hide);window.removeEventListener('scroll',scroll,true);panel.remove();}};
}
