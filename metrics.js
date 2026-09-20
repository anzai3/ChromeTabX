const extensionPage = location.protocol === 'chrome-extension:';
const live = !!globalThis.chrome?.runtime?.sendNativeMessage;
let busy = false, last = null;
const $ = id => document.getElementById(id);
export async function updateMetrics() {
 if(busy || document.hidden)return;
 busy=true;
 $('metrics-state').textContent='采样中…';
 try {
  if(!live)throw Error('预览模式');
  const data=await chrome.runtime.sendNativeMessage('com.tabmatrix.metrics',{command:'metrics'});
  if(!data?.ok || !Number.isFinite(data.memoryBytes))throw Error('采集失败');
  $('chrome-memory').textContent=(data.memoryBytes/1024**3).toFixed(2)+' GB';
  const delta=last ? (data.memoryBytes-last.memoryBytes)/1024**2 : null;
  $('metrics-state').textContent=`${data.processCount} 个进程 · 刚刚更新`;
  $('metrics-delta').textContent=delta===null?'':`较上次内存 ${delta>=0?'+':''}${delta.toFixed(0)} MB`;
  last=data;
 } catch(error) {
  $('chrome-memory').textContent='—';
  $('metrics-state').textContent=!extensionPage?'预览模式 · 无实时数据':!live?'请重新加载扩展以启用本机通信':'本机采集未连接';
  $('metrics-state').title=extensionPage&&live?String(error.message||error):'';
  $('metrics-delta').textContent='';
 } finally {busy=false;}
}
$('refresh-metrics').onclick=updateMetrics;
document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateMetrics();});
setInterval(updateMetrics,10000);
updateMetrics();
