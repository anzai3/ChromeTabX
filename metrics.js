const extensionPage = location.protocol === 'chrome-extension:';
const live = !!globalThis.chrome?.runtime?.sendNativeMessage;
const REFRESH_INTERVAL = 5 * 60 * 1000;
let busy = false, lastAttempt = null, refreshTimer;
const $ = id => document.getElementById(id);
export async function updateMetrics({initial = false} = {}) {
 if(busy || (document.hidden && !initial))return;
 clearTimeout(refreshTimer);
 lastAttempt = Date.now();
 busy=true;
 $('refresh-metrics').disabled=true;
 $('refresh-metrics').classList.add('is-loading');
 $('refresh-metrics').setAttribute('aria-busy','true');
 try {
  if(!live)throw Error('预览模式');
  const data=await chrome.runtime.sendNativeMessage('com.tabmatrix.metrics',{command:'metrics'});
  if(!data?.ok || !Number.isFinite(data.memoryBytes))throw Error('采集失败');
  $('chrome-memory').textContent=(data.memoryBytes/1024**3).toFixed(2)+' GB';
  $('chrome-memory').removeAttribute('title');
 } catch(error) {
  $('chrome-memory').textContent='—';
  $('chrome-memory').title=!extensionPage?'预览模式 · 无实时数据':!live?'请重新加载扩展以启用本机通信':'本机采集未连接';
 } finally {
  busy=false;
  $('refresh-metrics').disabled=false;
  $('refresh-metrics').classList.remove('is-loading');
  $('refresh-metrics').setAttribute('aria-busy','false');
  refreshTimer=setTimeout(refreshIfDue,REFRESH_INTERVAL);
 }
}
$('refresh-metrics').onclick=()=>updateMetrics();
function refreshIfDue(){
 if(!document.hidden && (lastAttempt === null || Date.now()-lastAttempt >= REFRESH_INTERVAL))updateMetrics();
}
document.addEventListener('visibilitychange',refreshIfDue);
updateMetrics({initial:true});
