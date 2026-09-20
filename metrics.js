const extensionPage = location.protocol === 'chrome-extension:';
const live = !!globalThis.chrome?.runtime?.sendNativeMessage;
let busy = false;
const $ = id => document.getElementById(id);
export async function updateMetrics() {
 if(busy || document.hidden)return;
 busy=true;
 $('refresh-metrics').disabled=true;
 try {
  if(!live)throw Error('预览模式');
  const data=await chrome.runtime.sendNativeMessage('com.tabmatrix.metrics',{command:'metrics'});
  if(!data?.ok || !Number.isFinite(data.memoryBytes))throw Error('采集失败');
  $('chrome-memory').textContent=(data.memoryBytes/1024**3).toFixed(2)+' GB';
  $('chrome-memory').removeAttribute('title');
 } catch(error) {
  $('chrome-memory').textContent='—';
  $('chrome-memory').title=!extensionPage?'预览模式 · 无实时数据':!live?'请重新加载扩展以启用本机通信':'本机采集未连接';
 } finally {busy=false;$('refresh-metrics').disabled=false;}
}
$('refresh-metrics').onclick=updateMetrics;
document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateMetrics();});
setInterval(updateMetrics,10000);
updateMetrics();
