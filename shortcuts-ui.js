import {iconCandidates,loadShortcutIcon,discoverIcons} from './shortcut-icons.js';
import {i18n} from './i18n.js';
import {createI18n} from './packages/app-i18n/index.js';
import {safeUrl,resolveSlots,DEFAULT_SITES,droppedSite,moveShortcut} from './shortcuts.js';
const messages={en:{drop:'Drag a website here',dropped:'Shortcut saved',badDrop:'Drag an HTTP or HTTPS link here.',title:'Frequent sites',add:'Add site',edit:'Edit shortcut {number}',heading:'Edit bookmark',name:'Name',url:'Website URL',save:'Save',cancel:'Cancel',reset:'Use default',invalid:'Enter a name and a valid HTTP or HTTPS URL.',error:'Could not save. Please try again.'},'zh-CN':{drop:'拖拽网址到这里',dropped:'快捷网址已保存',badDrop:'请拖入 HTTP 或 HTTPS 网页链接。',title:'常用网址',add:'添加网址',edit:'编辑快捷网址 {number}',heading:'编辑书签',name:'名称',url:'网址',save:'保存',cancel:'取消',reset:'恢复默认',invalid:'请填写名称和有效的 HTTP 或 HTTPS 网址。',error:'保存失败，请重试。'}};
const strings=createI18n({messages,preference:i18n.locale});
const root=document.getElementById('shortcuts'),dialog=document.createElement('dialog');
dialog.dataset.languageUi='';dialog.id='shortcut-dialog';dialog.setAttribute('aria-labelledby','shortcut-heading');
dialog.innerHTML='<form><h2 id="shortcut-heading"></h2><label><span data-label="name"></span><input id="shortcut-name" maxlength="40"></label><label><span data-label="url"></span><input id="shortcut-url" type="text" inputmode="url" required placeholder="https://example.com"></label><p role="status"></p><div class="dialog-actions"><button type="button" data-action="reset"></button><button type="button" data-action="cancel"></button><button class="primary" data-action="save"></button></div></form>';
document.body.append(dialog);
const feedback=document.createElement('span');feedback.className='shortcut-feedback';feedback.dataset.languageUi='';feedback.setAttribute('role','status');root.after(feedback);
const nameInput=dialog.querySelector('#shortcut-name'),urlInput=dialog.querySelector('#shortcut-url'),notice=dialog.querySelector('[role="status"]');
let defaults=DEFAULT_SITES,custom={},slot=0,iconTabs=[];
const storage=globalThis.chrome?.storage?.local;
let dragging=null;
function render(){
 root.replaceChildren();root.setAttribute('aria-label',strings.t('title'));root.title=strings.t('title');
 resolveSlots(defaults,custom).forEach((site,index)=>{
  const group=document.createElement('div');group.className='shortcut';group.oncontextmenu=e=>{e.preventDefault();edit(index);};
  const link=document.createElement(site?'a':'button');link.className='shortcut-link';
  link.setAttribute('aria-label',site?site.name:strings.t('add'));
  if(site){
   link.draggable=true;
   link.ondragstart=e=>{dragging=index;e.dataTransfer.effectAllowed='copyMove';e.dataTransfer.setData('text/uri-list',site.url);group.classList.add('dragging');};
   link.ondragend=()=>{dragging=null;root.querySelectorAll('.drag-over,.dragging').forEach(node=>node.classList.remove('drag-over','dragging'));};
   link.href=site.url;link.target='_blank';link.rel='noopener noreferrer';link.title=`${site.name}\n${site.url}`;
   const fallback=document.createElement('span');fallback.textContent='◎';fallback.setAttribute('aria-hidden','true');link.append(fallback);
   const icon=document.createElement('img');icon.width=24;icon.height=24;icon.alt='';icon.hidden=true;icon.draggable=false;link.append(icon);
   const candidates=iconCandidates(site.url,iconTabs,globalThis.chrome?.runtime);
   loadShortcutIcon(icon,fallback,candidates,()=>discoverIcons(site.url));
  }else {link.textContent='+';link.title=strings.t('drop');link.onclick=()=>edit(index);}
  group.ondragover=e=>{if([...e.dataTransfer.types].some(t=>['text/uri-list','text/plain'].includes(t))){e.preventDefault();e.dataTransfer.dropEffect=dragging===null?'copy':'move';group.classList.add('drag-over');}};
  group.ondragleave=e=>{if(!group.contains(e.relatedTarget))group.classList.remove('drag-over');};
  group.ondrop=async e=>{
   e.preventDefault();group.classList.remove('drag-over');
   if(dragging!==null){
    const from=dragging;dragging=null;if(from===index)return;
    const moved=moveShortcut(resolveSlots(defaults,custom),from,index);
    try{
     if(!storage)throw Error();
     await storage.set(Object.fromEntries(moved.map((value,i)=>[`shortcut-slot-${i}`,value])));
     custom=Object.fromEntries(moved.map((value,i)=>[i,value]));render();feedback.textContent=strings.t('dropped');
    }catch{feedback.textContent=strings.t('error');}
    return;
   }
   const value=droppedSite(e.dataTransfer);
   if(!value){feedback.textContent=strings.t('badDrop');return;}
   try{if(!storage)throw Error();await storage.set({[`shortcut-slot-${index}`]:value});custom[index]=value;render();feedback.textContent=strings.t('dropped');}
   catch{feedback.textContent=strings.t('error');}
  };
  const button=document.createElement('button');button.textContent='✎';button.title=strings.t('edit',{number:index+1});button.setAttribute('aria-label',button.title);button.onclick=()=>edit(index);
  group.append(link,button);root.append(group);
 });
 dialog.querySelector('h2').textContent=strings.t('heading');
 for(const key of ['name','url'])dialog.querySelector(`[data-label="${key}"]`).textContent=strings.t(key);
 for(const key of ['save','cancel','reset'])dialog.querySelector(`[data-action="${key}"]`).textContent=strings.t(key);
}
function edit(index){slot=index;const site=resolveSlots(defaults,custom)[index];nameInput.value=site?.name||'';urlInput.value=site?.url||'';notice.textContent='';dialog.showModal();nameInput.focus();}
async function save(reset=false){
 const url=safeUrl(urlInput.value.trim()),name=nameInput.value.trim()||(url?new URL(url).hostname.replace(/^www\./,''):'');
 if(!reset&&(!url||!name)){notice.textContent=strings.t('invalid');return;}
 const key=`shortcut-slot-${slot}`;
 try {
  if(!storage)throw Error('No extension storage');
  if(reset)await storage.remove(key);else await storage.set({[key]:{name,url}});
  if(reset)delete custom[slot];else custom[slot]={name,url};render();dialog.close();
 }catch{notice.textContent=strings.t('error');}
}
dialog.querySelector('form').onsubmit=e=>{e.preventDefault();save();};
dialog.querySelector('[data-action="reset"]').onclick=()=>save(true);
dialog.querySelector('[data-action="cancel"]').onclick=()=>dialog.close();
i18n.subscribe(()=>{strings.setPreference(i18n.locale);render();});
async function load(){
 if(storage){const data=await storage.get(Array.from({length:5},(_,i)=>`shortcut-slot-${i}`));custom={};for(let i=0;i<5;i++){const value=data[`shortcut-slot-${i}`];if(value===null||(value?.name&&safeUrl(value.url||'')))custom[i]=value;}}
 render();
}
render();load().catch(()=>{});
if(storage)chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&Object.keys(changes).some(k=>k.startsWith('shortcut-slot-')))load().catch(()=>{});});

if(globalThis.chrome?.tabs)chrome.tabs.query({}).then(tabs=>{iconTabs=tabs;render();}).catch(()=>{});

if(globalThis.chrome?.tabs?.onUpdated)chrome.tabs.onUpdated.addListener((id,change,tab)=>{
 if(!change.favIconUrl)return;
 const index=iconTabs.findIndex(item=>item.id===id);
 if(index>=0)iconTabs[index]=tab;else iconTabs.push(tab);
 if(resolveSlots(defaults,custom).some(site=>{try{return site&&new URL(site.url).origin===new URL(tab.url).origin;}catch{return false;}}))render();
});
