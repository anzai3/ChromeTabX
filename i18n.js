import {createI18n, resolveLocale} from './packages/app-i18n/index.js';
import {translateText} from './legacy-translations.js';
export {translateText} from './legacy-translations.js';
export const resolveLanguage = (preference, systemLanguage) => resolveLocale(preference, systemLanguage, ['zh-CN','en'], 'en');
const messages = {
 'zh-CN': {'language.system':'跟随系统（{language}）','language.saved':'语言已切换为{language}','language.hint':'即时生效，保留搜索和筛选'},
 en: {'language.system':'System ({language})','language.saved':'Language changed to {language}','language.hint':'Applies instantly; keeps your search and filters'}
};
let storage; try { storage = globalThis.localStorage; } catch {}
export const i18n = createI18n({messages, storage, storageKey:'ui-language', getSystemLocales:() => [globalThis.chrome?.i18n?.getUILanguage?.(), ...(globalThis.navigator?.languages || [globalThis.navigator?.language])].filter(Boolean)});
if (typeof document !== 'undefined') {
 // Migration adapter for pre-keyed ChromeTabX labels only. Not part of the shared module.
 const sources = new WeakMap();
 const excluded = '.tab-title,.tab-domain,.match-snippet,#duplicate-preview,.group-heading h3,#title-categories button:not([data-view="all"]),#view-title';
 function translate(node, attr, current) {
  let values=sources.get(node); if(!values){values=new Map();sources.set(node,values);}
  let record=values.get(attr);
  if(!record || current!==record.output) record={source:current,output:current};
  let output=record.source;
  if(i18n.locale==='en') {
   output=translateText(output);
   if(attr!=='text' && node.matches('[data-close]'))output=output.replace(/^关闭 /,'Close ');
   if(attr!=='text' && node.matches('[data-pin]'))output=output.replace(/^取消固定 /,'Unpin ').replace(/^固定 /,'Pin ');
  }
  record.output=output;values.set(attr,record);
  if(output!==current) {if(attr==='text')node.nodeValue=output;else node.setAttribute(attr,output);}
 }
 function visit(node) {
  if(node.nodeType===Node.TEXT_NODE) {
   const parent=node.parentElement;
   if(parent?.closest('[data-language-ui]'))return;
   if(parent?.closest(excluded) && !parent.matches('.match-snippet span') && !(parent.id==='view-title' && !document.querySelector('#title-categories .active:not([data-view="all"])')))return;
   translate(node,'text',node.nodeValue);
  } else if(node.nodeType===Node.ELEMENT_NODE) {
   if(node.matches('script,style,[data-language-ui]'))return;
   for(const attr of ['placeholder','aria-label','title'])if(node.hasAttribute(attr))translate(node,attr,node.getAttribute(attr));
   node.childNodes.forEach(visit);
  }
 }
 const picker=document.getElementById('language');
 const label=locale=>locale==='zh-CN'?'简体中文':'English';
 function renderLanguage(){
  document.documentElement.lang=i18n.locale;document.documentElement.dir=i18n.direction;
  visit(document.documentElement);
  picker.value=i18n.preference;
  const system=resolveLanguage('system',globalThis.chrome?.i18n?.getUILanguage?.()||navigator.language);
  picker.querySelector('[value="system"]').textContent=i18n.t('language.system',{language:label(system)});
  document.getElementById('language-hint').textContent=i18n.t('language.hint');
 }
 picker.addEventListener('change',()=>{i18n.setPreference(picker.value);document.getElementById('language-status').textContent=i18n.t('language.saved',{language:label(i18n.locale)});});
 window.addEventListener('storage',event=>{if(event.key==='ui-language'||event.key===null)i18n.setPreference(event.newValue||'system',{persist:false});});
 window.addEventListener('languagechange',()=>{i18n.refreshSystem();renderLanguage();});
 i18n.subscribe(renderLanguage);
 renderLanguage();
 new MutationObserver(records=>{for(const record of records){if(record.type==='childList')record.addedNodes.forEach(visit);else visit(record.target);}}).observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title']});
}
