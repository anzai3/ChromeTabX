import {scopeTabs,countCategories} from './tab-scope.js';
import {updateMetrics} from './metrics.js';
import {titleHierarchy,titleSubject} from './title-rules.js';
import {findPageText, scanTabs} from './content-search.js';
import {domain, duplicateGroups, duplicateIds, isInactive, accessLabel} from './core.js';
const $ = selector => document.querySelector(selector);
const live = !!globalThis.chrome?.tabs?.query;
let tabs = [], view = 'all', selectedWindow = 'all', query = '', list = false;
let inactiveDays = 7;
let currentWindowId = null;
let titleGroups = new Map(), hierarchy = {children:new Map(),membership:new Map()};
let searchEpoch = 0, searchTimer, searchBusy = false;
const bodyMatches = new Map();
let closing = false, pendingIds = [], timer;
const demoRows = [
 ['GitHub · Where software is built','https://github.com/'],['React — The library for web interfaces','https://react.dev/'],['Vercel · Dashboard','https://vercel.com/dashboard'],['Figma — Design without limits','https://figma.com/'],['Dribbble · Discover great design','https://dribbble.com/'],['Pinterest · 发现你的下一个灵感','https://pinterest.com/'],['Notion · 我的工作空间','https://notion.so/'],['ChatGPT','https://chatgpt.com/'],['Linear · My issues','https://linear.app/'],['GitHub · Where software is built','https://github.com/'],['The creative independent','https://thecreativeindependent.com/'],['YouTube · Music for focus','https://youtube.com/watch?v=focus']];
const esc = text => String(text ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function colorStyle(name, child = '') {
 const hash = text => [...text.normalize('NFKC').toLowerCase()].reduce((value,char)=>Math.imul(value ^ char.codePointAt(0),16777619) >>> 0,2166136261);
 const hues = [215,155,275,25,335,185,245,85,305,45,130,5];
 const hue = (hues[hash(name) % hues.length] + (child ? (hash(child)%25)-12 : 0) + 360)%360;
 return `--tag-bg:hsl(${hue} 65% 95%);--tag-border:hsl(${hue} 42% 76%);--tag-ink:hsl(${hue} 58% 27%);--tag-accent:hsl(${hue} 57% 43%)`;
}
function toast(message) { $('#toast').textContent = message; $('#toast').hidden = false; clearTimeout(timer); timer = setTimeout(() => $('#toast').hidden = true, 4200); }
function guard(fn) { return async (...args) => { try { await fn(...args); } catch(error) { toast(`操作未完成：${error.message}`); } }; }
async function refresh() {
 if(live) { const all = await chrome.tabs.query({}); tabs = all.filter(t => t.url !== chrome.runtime.getURL('newtab.html') && t.url !== 'chrome://newtab/' && !t.url?.startsWith(chrome.runtime.getURL('newtab.html')+'?')); }
 const wins = [...new Set([...(currentWindowId === null ? [] : [currentWindowId]), ...tabs.map(t => t.windowId)])];
 if(selectedWindow !== 'all' && !wins.includes(Number(selectedWindow))) selectedWindow = 'all';
 $('#window-filter').innerHTML = '<option value="all">所有窗口</option>'+wins.map(id => `<option value="${id}">窗口 ${wins.indexOf(id)+1}</option>`).join('');
 $('#window-filter').value = selectedWindow;
 render();
 if(query.trim()) scheduleSearch();
}
function filtered() {
 const dup = new Set(duplicateGroups(tabs).flatMap(g => g.map(t => t.id)));
 return scopeTabs(tabs,selectedWindow,query,bodyMatches).filter(t => (view === 'all' || (view === 'duplicates' ? dup.has(t.id) : view === 'pinned' ? t.pinned : view === 'inactive' ? isInactive(t,inactiveDays) : view.startsWith('sub:') ? hierarchy.membership.get(view.slice(4))?.ids.includes(t.id) : view.startsWith('category:') && (titleGroups.get(t.id)||'其他')===view.slice(9)))).sort((a,b)=>view==='inactive' ? a.lastAccessed-b.lastAccessed : 0);
}
function scheduleSearch() {
 clearTimeout(searchTimer);
 const epoch = ++searchEpoch;
 bodyMatches.clear(); searchBusy = !!query.trim(); render();
 if(!query.trim()) return;
 searchTimer = setTimeout(async () => {
  const needle = query.trim();
  await scanTabs([...tabs],needle,async (tab,term) => {
   if(live) return chrome.scripting.executeScript({target:{tabId:tab.id},func:findPageText,args:[term]});
   const text = tab.id===2 ? 'React 支持组件开发，通过状态管理构建交互界面。' : tab.id===7 ? '项目计划：本周完成标签管理和全文搜索功能。' : '';
   return [{frameId:0,result:{url:tab.url,matched:text.toLowerCase().includes(term.toLowerCase()),snippet:text}}];
  },(tab,result)=>{bodyMatches.set(tab.id,result);render();},()=>epoch===searchEpoch);
  if(epoch===searchEpoch){searchBusy=false;render();}
 },300);
}
function render() {
 hierarchy=titleHierarchy(tabs);titleGroups=hierarchy.primary;
 if(view.startsWith('sub:')&&!hierarchy.membership.has(view.slice(4)))view='all';
 if(view.startsWith('category:')&&![...titleGroups.values()].includes(view.slice(9)))view='all';
 $('#inactive-controls').hidden = view !== 'inactive';
 const unknown = tabs.filter(t=>!t.active && (!Number.isFinite(t.lastAccessed)||t.lastAccessed<=0||t.lastAccessed>Date.now())).length;
 $('#inactive-note').textContent = `按最久未访问优先排列 · 不含各窗口当前活动标签${unknown ? ` · ${unknown} 个标签访问时间未知，未计入` : ''}`;
 const searched = [...bodyMatches.values()];
 $('#search-status').hidden = !query.trim();
 $('#search-status-text').textContent = searchBusy ? `正在搜索网页正文… ${searched.length}/${tabs.length}` : `找到 ${filtered().length} 个标签（当前筛选） · 已搜索 ${searched.filter(r=>r.state==='done').length} 页正文 · ${searched.filter(r=>r.state==='unavailable').length} 页正文不可读取，仅匹配标题和网址`;
 const dupeIds = duplicateIds(tabs), dupSet = new Set(duplicateGroups(tabs).flatMap(g => g.map(t => t.id)));
 $('#dedupe-count').textContent = dupeIds.length;
 $('#dedupe').disabled = !dupeIds.length || closing;
 const counts=countCategories(scopeTabs(tabs,selectedWindow,query,bodyMatches),hierarchy);
 const categoryNames=[...new Set(titleGroups.values())].sort((a,b)=>a==='其他'?1:b==='其他'?-1:(counts.primary.get(b)||0)-(counts.primary.get(a)||0));
 $('#title-categories').innerHTML=`<button data-view="all" style="${colorStyle('全部')}" class="${view==='all'?'active':''}"><span>全部</span><span class="count">${counts.all}</span></button>`+categoryNames.map(name=>`<button style="${colorStyle(name)}" data-view="${esc('category:'+name)}" class="${view==='category:'+name?'active':''}"><span>${esc(name)}</span><span class="count">${counts.primary.get(name)||0}</span></button>${(hierarchy.children.get(name)||[]).map(child=>`<button style="${colorStyle(name,child.name)}" data-view="${esc('sub:'+child.id)}" class="subcategory ${view==='sub:'+child.id?'active':''}"><span>${esc(child.name)}</span><span class="count">${counts.secondary.get(child.id)||0}</span></button>`).join('')}`).join('');
 const title = ({all:'全部标签',duplicates:'重复标签',pinned:'固定标签',inactive:'久未访问'})[view] || (view.startsWith('sub:')?hierarchy.membership.get(view.slice(4))?.name:view.slice(9));
 const visible = filtered(); $('#view-title').innerHTML=`${esc(title)} <span>${visible.length}</span>`;
 $('#view-description').textContent=view==='inactive'?`查看至少 ${inactiveDays} 天没有切换到的标签。`:view==='duplicates'?'相同网址，只留一个。清理操作覆盖所有窗口。':'搜索和管理所有打开的网页。';
 const groups = new Map();
 visible.forEach(t=> { const key=view==='inactive'?'久未访问 · 最久优先':(titleGroups.get(t.id)||'其他'); if(!groups.has(key))groups.set(key,[]); groups.get(key).push(t); });
 $('#content').className=list?'list':'';

 $('#content').innerHTML = groups.size ? [...groups].map(([name,items],index)=>`<section class="group" style="${colorStyle(name)}"><div class="group-heading"><span class="dot"></span><h3>${esc(name)}</h3><span class="number">${String(items.length).padStart(2,'0')}</span><span class="line"></span></div><div class="cards">${items.map(t=>`<article class="card" style="${colorStyle(titleGroups.get(t.id)||'其他',view.startsWith('sub:')?view.slice(4):'')}"><div class="card-top"><span class="favicon">${esc(domain(t.url).replace(/^www\./,'')[0]?.toUpperCase() || '↗')}</span><button class="tab-open" data-open="${t.id}" title="${esc(t.title)} · ${esc(t.url)} · ${esc(accessLabel(t))}"><span class="tab-title">${esc(titleSubject(t.title) || '未命名标签')}</span></button><button class="close-tab" data-close="${t.id}" aria-label="关闭 ${esc(t.title)}" title="关闭标签">×</button></div>${query.trim() && bodyMatches.get(t.id)?.url===t.url && bodyMatches.get(t.id)?.matched ? `<p class="match-snippet"><span>正文命中</span> ${esc(bodyMatches.get(t.id).snippet)}</p>` : ''}<p class="page-summary" data-language-ui data-summary="${t.id}" data-summary-state="loading" data-url="${esc(t.url)}" data-title="${esc(t.title)}"></p><div class="last-access">${esc(accessLabel(t))}</div><div class="card-bottom"><button class="preview-button" data-language-ui data-preview="${t.id}" aria-haspopup="dialog">预览</button>${dupSet.has(t.id)?'<span class="badge">重复</span>':''}<button class="pin ${t.pinned?'pinned':''}" data-pin="${t.id}" title="${t.pinned?'取消固定':'固定标签'}" aria-label="${t.pinned?'取消固定':'固定'} ${esc(t.title)}">⌖</button></div></article>`).join('')}</div></section>`).join('') : `<div class="empty"><strong>${query.trim()?(searchBusy?'正在搜索正文…':'没有找到匹配的标签。'):view==='duplicates'?'没有重复标签。':'这里暂时没有标签。'}</strong><p>${query?'换个关键词，或调整窗口筛选。':view==='duplicates'?'没有发现相同网址的重复页面。':view==='inactive'?'没有符合此时长的标签，可以缩短筛选时长。':'打开一些网页，或者选择其他视图。'}</p></div>`;

}
document.addEventListener('click',guard(async event=>{
 const button=event.target.closest('button'); if(!button)return;
 if(button.dataset.view){view=button.dataset.view;render();}
 if(button.dataset.open){const t=tabs.find(t=>t.id===Number(button.dataset.open)); if(live){await chrome.tabs.update(t.id,{active:true});await chrome.windows.update(t.windowId,{focused:true});}else toast('预览模式：加载扩展后可跳转到真实标签');}
 if(button.dataset.close){const id=Number(button.dataset.close);if(live)await chrome.tabs.remove(id);else tabs=tabs.filter(t=>t.id!==id);await refresh();toast('标签已关闭');setTimeout(updateMetrics,1200);}
 if(button.dataset.pin){const t=tabs.find(t=>t.id===Number(button.dataset.pin));if(live)await chrome.tabs.update(t.id,{pinned:!t.pinned});else t.pinned=!t.pinned;await refresh();}
}));
$('#search').oninput=event=>{query=event.target.value;scheduleSearch();};
$('#rescan').onclick=()=>scheduleSearch();
$('#inactive-days').onchange=event=>{inactiveDays=Number(event.target.value);render();};
$('#window-filter').onchange=event=>{selectedWindow=event.target.value;render();};
$('#layout').onclick=()=>{list=!list;$('#layout').setAttribute('aria-label',list?'切换卡片视图':'切换列表视图');render();};
$('#dedupe').onclick=guard(async()=>{await refresh();pendingIds=duplicateIds(tabs);if(!pendingIds.length)return;$('#confirm-text').textContent=`将关闭 ${pendingIds.length} 个重复标签，覆盖所有窗口，每个相同网址保留 1 个。`;$('#duplicate-preview').innerHTML=duplicateGroups(tabs).map(g=>`<div>${esc(g[0].title)} · ${g.length} → 1</div>`).join('');$('#confirm-dialog').showModal();});
$('#confirm-dialog').addEventListener('close',guard(async()=>{
 if($('#confirm-dialog').returnValue!=='confirm'||closing)return;closing=true;render();
 try {await refresh();const currentIds=new Set(duplicateIds(tabs));const ids=pendingIds.filter(id=>currentIds.has(id));let removed=0;for(const id of ids){if(live){try{await chrome.tabs.remove(id);removed++;}catch{}}else{tabs=tabs.filter(t=>t.id!==id);removed++;}}toast(`已清理 ${removed} 个重复标签${removed<ids.length?'，部分标签已变更或无法关闭':''}`);}finally{closing=false;pendingIds=[];await refresh();setTimeout(updateMetrics,1200);}
}));
document.addEventListener('keydown',event=>{if(event.key==='/'&&!['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)&&!document.querySelector('dialog[open]')){event.preventDefault();$('#search').focus();}});
async function init(){
 // Resolve the window containing this new-tab page once; later refreshes preserve the user's filter.
 currentWindowId = live ? (await chrome.windows.getCurrent()).id : 1;
 selectedWindow = String(currentWindowId);
 if(live){let debounce;const update=()=>{clearTimeout(debounce);debounce=setTimeout(guard(refresh),120);};for(const name of ['onCreated','onRemoved','onUpdated','onMoved','onAttached','onDetached','onActivated'])chrome.tabs[name].addListener(update);}
 else{tabs=demoRows.map(([title,url],i)=>{return{id:i+1,title,url,windowId:i>8?2:1,pinned:i===0,lastAccessed:Date.now()-[0.1,2,9,35,15,0.5,60,4,8,1,31,3][i]*86400000};});$('#demo-banner').hidden=false;}
 await refresh();
 setInterval(()=>{if(view==='inactive')guard(refresh)();},60000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)guard(refresh)();});
}
guard(init)();

const settingsDialog = $('#settings-dialog');
$('#open-settings').addEventListener('click', () => settingsDialog.showModal());
$('#close-settings').addEventListener('click', () => settingsDialog.close());
settingsDialog.addEventListener('click', event => {
 if(event.target !== settingsDialog)return;
 const rect=settingsDialog.getBoundingClientRect();
 if(event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom)settingsDialog.close();
});
