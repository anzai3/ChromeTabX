const root=document.getElementById('content');
const live=location.protocol==='chrome-extension:';
const queue=[];let active=0;
const observer=new IntersectionObserver(entries=>{
 for(const entry of entries)if(entry.isIntersecting){observer.unobserve(entry.target);const img=entry.target.querySelector('[data-thumbnail]');if(img)queue.push(img);}
 drain();
},{rootMargin:'80px'});
function drain(){
 while(active<2 && queue.length){
  const img=queue.shift();if(!img.isConnected)continue;
  active++;
  chrome.runtime.sendMessage({type:'thumbnail',id:Number(img.dataset.thumbnail),url:img.dataset.url}).then(data=>{
   if(img.isConnected && typeof data==='string' && data.startsWith('data:image/webp;base64,')){
    img.onload=()=>{img.hidden=false;};img.src=data;
   }
  }).catch(()=>{}).finally(()=>{active--;drain();});
 }
}
const watched=new Set();
function discover(){
 for(const img of watched)if(!img.isConnected){observer.unobserve(img.closest('.card') || img);watched.delete(img);}
 root.querySelectorAll('[data-thumbnail]').forEach(img=>{if(!watched.has(img)){watched.add(img);observer.observe(img.closest('.card'));}});
}
if(live){new MutationObserver(discover).observe(root,{childList:true});discover();}

if(live)chrome.storage.onChanged.addListener((changes,area)=>{
 if(area!=='session')return;
 for(const img of watched)if(changes[`thumb:${img.dataset.thumbnail}`])observer.observe(img.closest('.card'));
});
