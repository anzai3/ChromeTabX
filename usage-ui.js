import {i18n} from './i18n.js';
import {createI18n} from './packages/app-i18n/index.js';
import {dayKey} from './usage.js';
const text=createI18n({preference:i18n.locale,messages:{en:{title:'Usage time',today:'Today',total:'All time',hint:'Time with ChromeTabX in the foreground. Starts from this update; stored only on this device.',duration:'{hours}h {minutes}m',short:'Less than 1 min',unavailable:'Usage tracking is unavailable.'},'zh-CN':{title:'使用时长',today:'今日使用',total:'累计使用',hint:'仅统计 ChromeTabX 处于前台的时间，从本次更新开始累计，仅保存在本机。',duration:'{hours} 小时 {minutes} 分钟',short:'不足 1 分钟',unavailable:'使用时长暂不可用。'}}});
const section=document.createElement('section');section.className='usage-card';section.dataset.languageUi='';
section.innerHTML='<h3></h3><div class="usage-values"><div><span></span><strong></strong></div><div><span></span><strong></strong></div></div><p></p>';
document.querySelector('.settings-content').append(section);
let state={},failed=false,last=null;
const live=!!globalThis.chrome?.runtime?.sendMessage;
const foreground=()=>!document.hidden&&document.hasFocus();
const duration=ms=>ms<60000?text.t('short'):text.t('duration',{hours:Math.floor(ms/3600000),minutes:Math.floor(ms/60000)%60});
function render(){section.querySelector('h3').textContent=text.t('title');const cells=section.querySelectorAll('.usage-values>div');['today','total'].forEach((key,index)=>{cells[index].querySelector('span').textContent=text.t(key);cells[index].querySelector('strong').textContent=failed?'—':duration(key==='today'&&state.day!==dayKey(Date.now())?0:state[key]||0);});section.querySelector('p').textContent=text.t(failed?'unavailable':'hint');}
function tick(){const now=Date.now(),start=last;last=foreground()?now:null;if(start!==null&&now-start<=15000&&live)chrome.runtime.sendMessage({type:'usage-interval',start,end:now}).then(value=>{if(value){state=value;failed=false;}else failed=true;render();},()=>{failed=true;render();});}
window.addEventListener('focus',()=>{last=foreground()?Date.now():null;});
window.addEventListener('blur',()=>{tick();last=null;});
document.addEventListener('visibilitychange',()=>{tick();last=foreground()?Date.now():null;});
window.addEventListener('pagehide',()=>{tick();last=null;});
if(live){chrome.storage.local.get('usage-time').then(data=>{state=data['usage-time']||{};render();},()=>{failed=true;render();});chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes['usage-time']){state=changes['usage-time'].newValue||{};render();}});last=foreground()?Date.now():null;setInterval(tick,5000);}else failed=true;
i18n.subscribe(()=>{text.setPreference(i18n.locale);render();});render();
