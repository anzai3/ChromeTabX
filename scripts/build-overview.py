"""Generate bilingual overview SVGs for the current product architecture."""
from pathlib import Path
from html import escape
ROOT = Path(__file__).resolve().parents[1]
COPY = {
 'en': {
  'headline':'Many tabs. Less searching. More focus.',
  'sub':'Open a new tab to manage the pages you already have open.',
  'lanes':[
   ('Find your page',['Search titles and URLs','Search readable page text','Click to return to the original tab'],'Less time hunting for pages'),
   ('Organize your tabs',['All windows in one view','Topic cloud + up to 3 subcategories','Browse tabs in cards'],'Keep lots of tabs manageable'),
   ('Clear the clutter',['Review duplicate URLs','Keep one copy per URL','Close pages you no longer need'],'Fewer unnecessary pages')],
  'monitor':'Optional macOS monitor: observe Chrome memory and CPU',
  'settings':'Settings: language · donations when configured',
  'note':'Closing active pages may reduce resource usage. Speed improvements vary.',
  'footer':'Runs locally · No account needed · Product architecture, not a screenshot'},
 'zh-CN': {
  'headline':'标签再多，也能清楚管理。',
  'sub':'打开新标签页，集中管理已经打开的网页，少翻找、更专注。',
  'lanes':[
   ('快速找页面',['搜索标题和网址','搜索可读取的网页正文','点击结果，回到原来的标签'],'减少翻找时间，提高工作效率'),
   ('分类浏览与管理',['统一展示所有窗口的标签','主题分类云 + 最多三个二级分类','使用卡片浏览标签'],'大量标签也能井然有序'),
   ('清理多余标签',['先预览重复网址','每个相同网址保留一个','关闭不再需要的页面'],'减少不必要的页面')],
  'monitor':'可选 macOS 监控：观察 Chrome 内存与 CPU 占用',
  'settings':'设置：语言 · 配置后可用的捐款入口',
  'note':'关闭活跃页面有助于降低资源占用，实际提速效果因页面而异。',
  'footer':'本机运行 · 无需账号 · 产品信息架构示意，并非实际截图'}
}
for lang, c in COPY.items():
 out=['<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="940" viewBox="0 0 1440 940" role="img">',f'<title>{escape(c["headline"])}</title>', '<rect width="1440" height="940" rx="28" fill="#f6f8fc"/>']
 def text(x,y,s,size=22,fill='#17243b',weight=400):
  out.append(f'<text x="{x}" y="{y}" font-family="Arial, Noto Sans CJK SC, PingFang SC, sans-serif" font-size="{size}" fill="{fill}" font-weight="{weight}">{escape(s)}</text>')
 text(64,66,'ChromeTabX',25,'#2563eb',700)
 text(64,140,c['headline'],44,weight=700);text(64,186,c['sub'],24,'#52627a')
 colors=['#2563eb','#8151bc','#218267']
 for i,(name,items,result) in enumerate(c['lanes']):
  x=64+i*442
  out.append(f'<rect x="{x}" y="236" width="420" height="368" rx="20" fill="white" stroke="#d9e2ef"/>')
  text(x+24,283,f'0{i+1}',21,colors[i],700);text(x+24,330,name,29,weight=700)
  for j,line in enumerate(items):text(x+24,386+j*44,line,20,'#52627a')
  out.append(f'<path d="M{x+24} 512h372" stroke="#e3e9f2"/>')
  text(x+24,557,result,20,colors[i],700)
 out.append('<rect x="64" y="640" width="1304" height="144" rx="18" fill="#eaf0fa"/>')
 text(88,689,c['monitor'],24,weight=600);text(88,742,c['settings'],23,'#52627a')
 text(64,838,c['note'],22,'#52627a');text(64,892,c['footer'],18,'#687890')
 out.append('</svg>')
 (ROOT/'docs/images'/f'architecture-{lang}.svg').write_text('\n'.join(out))
