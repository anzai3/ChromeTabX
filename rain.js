(() => {
 const canvas=document.getElementById('rain'),ctx=canvas.getContext('2d');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let enabled=!reduced.matches, drops=[],last=0,raf;
 const chars='アイウエオカキクケコサシスセソタチツテト012345789';
 function resize(){canvas.width=innerWidth;canvas.height=innerHeight;drops=Array.from({length:Math.ceil(innerWidth/23)},()=>Math.random()*innerHeight/20);}
 function draw(time){if(!enabled||document.hidden)return;if(time-last>70){last=time;ctx.fillStyle='rgba(8,12,11,.08)';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.font='13px monospace';drops.forEach((y,i)=>{ctx.fillStyle=Math.random()>.98?'#c3ffd4':'#39af62';ctx.fillText(chars[Math.floor(Math.random()*chars.length)],i*23,y*20);if(y*20>canvas.height&&Math.random()>.98)drops[i]=-10;else drops[i]+=.4;});}raf=requestAnimationFrame(draw);}
 function sync(){cancelAnimationFrame(raf);document.getElementById('motion').textContent=enabled?'雨幕 ON':'雨幕 OFF';canvas.style.display=enabled?'block':'none';if(enabled&&!document.hidden)raf=requestAnimationFrame(draw);}
 document.getElementById('motion').onclick=()=>{enabled=!enabled;sync();};document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',()=>{enabled=!reduced.matches;sync();});window.addEventListener('resize',resize);resize();sync();
})();
