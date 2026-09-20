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
 const toolbar=doc.createElement('div');toolbar.className='web-preview-tools';
 const zoomLabel=doc.createElement('label'),zoom=doc.createElement('select'),zoomText=doc.createElement('span');
 for(const value of [70,80,90,100]){const option=doc.createElement('option');option.value=String(value);option.textContent=`${value}%`;zoom.append(option);}
 zoom.value='80';zoomLabel.append(zoomText,zoom);
 const textPreview=doc.createElement('button');textPreview.type='button';
 toolbar.append(zoomLabel,textPreview,open);
 header.append(title,close);panel.append(header,note,frameHost,toolbar);doc.body.append(panel);
 function applyZoom(){const scale=Number(zoom.value)/100;const frame=frameHost.querySelector('iframe');if(frame){frame.style.width=`${100/scale}%`;frame.style.height=`${100/scale}%`;frame.style.transform=`scale(${scale})`;}}
 zoom.onchange=applyZoom;
 textPreview.onclick=()=>{const button=trigger;hide();button?.click();};
 let trigger=null,showTimer,hideTimer,epoch=0,tab=null;
 const words=()=>locale.locale.startsWith('zh')?{
  title:'网页预览',close:'关闭预览',open:'打开原标签',zoom:'缩放',text:'文字预览',
  note:'临时加载网页；若空白、登录失败或网站禁止嵌入，请打开原标签。',
  unavailable:'该页面无法嵌入预览，请打开原标签。'
 }:{title:'Web preview',close:'Close preview',open:'Open original tab',zoom:'Zoom',text:'Text preview',note:'Loads a temporary page. If blank, signed out, or blocked by the site, open the original tab.',unavailable:'This page cannot be embedded. Open the original tab.'};
 function hide(){clearTimeout(showTimer);clearTimeout(hideTimer);epoch++;panel.hidden=true;frameHost.replaceChildren();trigger=null;tab=null;}
 function leave(){clearTimeout(showTimer);clearTimeout(hideTimer);hideTimer=setTimeout(hide,220);}
 async function show(button){
  if(!button.isConnected || doc.querySelector('dialog[open]'))return;
  const node=button.closest('.card')?.querySelector('[data-summary]');if(!node)return;
  hide();trigger=button;const token=++epoch;const w=words();
  title.textContent=node.dataset.title||w.title;panel.setAttribute('aria-label',w.title);close.setAttribute('aria-label',w.close);open.textContent=w.open;open.disabled=true;note.textContent=w.note;
  zoomText.textContent=w.zoom;zoom.setAttribute('aria-label',w.zoom);textPreview.textContent=w.text;
  panel.hidden=false;
  const rect=button.getBoundingClientRect(),width=panel.offsetWidth,height=panel.offsetHeight;
  let left=rect.right+10;
  if(left+width>innerWidth-12)left=rect.left-width-10;
  panel.style.left=`${Math.max(12,Math.min(left,innerWidth-width-12))}px`;
  panel.style.top=`${Math.max(12,Math.min(rect.top,innerHeight-height-12))}px`;
  try {
   const live=!!globalThis.chrome?.tabs?.get;
   const target=live?await chrome.tabs.get(Number(button.dataset.preview)):{id:Number(button.dataset.preview),url:node.dataset.url};
   if(token!==epoch)return;
   tab=target;open.disabled=!live;
   if(!isGenericTitle(target.title))title.textContent=target.title;
   const url=previewUrl(target.url);if(!url){note.textContent=w.unavailable;return;}
   const frame=doc.createElement('iframe');frame.title=w.title;
   // Isolate external content; no popups, top navigation, forms, or downloads.
   frame.setAttribute('sandbox','allow-scripts allow-same-origin');frame.referrerPolicy='no-referrer';
   frame.src=url;frameHost.append(frame);applyZoom();
   // Cross-origin load events cannot prove successful rendering. Keep the fallback visible.
  }catch{if(token===epoch)note.textContent=w.unavailable;}
 }
 const over=event=>{
  if(event.pointerType!=='mouse')return;
  const button=event.target.closest('[data-preview]');if(!button||button.contains(event.relatedTarget))return;
  clearTimeout(hideTimer);clearTimeout(showTimer);
  if(trigger===button)return;
  hide();showTimer=setTimeout(()=>show(button),350);
 };
 const out=event=>{const b=event.target.closest('[data-preview]');if(b&&!b.contains(event.relatedTarget)&&!panel.contains(event.relatedTarget))leave();};
 const click=event=>{if(!panel.contains(event.target))hide();};
 const key=event=>{if(event.key==='Escape')hide();};
 const scroll=event=>{if(!panel.contains(event.target))hide();};
 const visibility=()=>{if(doc.hidden)hide();};
 panel.addEventListener('pointerenter',()=>clearTimeout(hideTimer));panel.addEventListener('pointerleave',leave);
 close.onclick=hide;open.onclick=async()=>{try{if(tab){await chrome.tabs.update(tab.id,{active:true});await chrome.windows.update(tab.windowId,{focused:true});hide();}}catch{note.textContent=words().unavailable;}};
 root.addEventListener('pointerover',over);root.addEventListener('pointerout',out);doc.addEventListener('click',click,true);doc.addEventListener('keydown',key);doc.addEventListener('visibilitychange',visibility);window.addEventListener('resize',hide);window.addEventListener('scroll',scroll,true);
 const observer=new MutationObserver(()=>{if(trigger&&!trigger.isConnected)hide();});observer.observe(root,{childList:true});
 const unsubscribe=locale.subscribe(hide);
 return {destroy(){hide();observer.disconnect();unsubscribe();root.removeEventListener('pointerover',over);root.removeEventListener('pointerout',out);doc.removeEventListener('click',click,true);doc.removeEventListener('keydown',key);doc.removeEventListener('visibilitychange',visibility);window.removeEventListener('resize',hide);window.removeEventListener('scroll',scroll,true);panel.remove();}};
}
