export function dayKey(time){const d=new Date(time);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function addUsage(state={},start,end){
 const next={total:state.total||0,day:state.day||dayKey(end),today:state.today||0,lastEnd:state.lastEnd||0};
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>15000)return next;
 start=Math.max(start,next.lastEnd);if(start>=end)return next;
 const today=dayKey(end);if(next.day!==today){next.day=today;next.today=0;}
 const midnight=new Date(end);midnight.setHours(0,0,0,0);
 next.total+=end-start;next.today+=Math.max(0,end-Math.max(start,midnight.getTime()));next.lastEnd=end;
 return next;
}
