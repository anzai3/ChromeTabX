// Local title clustering: Unicode word segmentation, stop words, shared terms.
const segmenter = new Intl.Segmenter('zh-CN', {granularity:'word'});
const stopWords = new Set(('the a an and or to of in on for with from by is are at your you my home new tab page untitled welcome official website document docs google chrome www com html http https 的 了 和 与 在 是 我 你 我们 一个 这个 如何 什么 关于 首页 官网 官方 网站 页面 网页 标签 飞书 云文档 feishu 新建 文档 无标题 欢迎 登录 注册 搜索 结果 在线 查看 更多 使用 最新').split(' '));
const suffixSeparator = /\s+[-–—]\s+|\s*[|｜]\s*/;
function normalizeTitle(title) {
 return (title||'').normalize('NFKC').replace(/[\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g,'').trim();
}
const siteSuffix = /^(?:飞书(?:云文档|文档)?|feishu(?: docs)?|lark(?: docs)?|google (?:docs|sheets|slides|drive)|notion|youtube|github|知乎|哔哩哔哩|bilibili|百度(?:搜索)?|豆包(?:工作伙伴)?|chatgpt|claude|gemini)$/i;
export function titleSubject(title, ignoredSuffixes = new Set()) {
 const parts=normalizeTitle(title).split(suffixSeparator);
 while(parts.length>1){
  const tail=parts.at(-1).trim();
  if(!siteSuffix.test(tail)&&!ignoredSuffixes.has(tail.toLowerCase()))break;
  parts.pop();
 }
 return parts.join(' — ');
}
function corpusSuffixes(tabs){
 const tails=new Map();
 for(const tab of tabs){
  const parts=normalizeTitle(tab.title).split(suffixSeparator);
  if(parts.length<2)continue;
  const suffix=parts.at(-1).trim().toLowerCase();
  let host;try{host=new URL(tab.url).hostname;}catch{continue;}
  const key=host+'|'+suffix;
  if(!tails.has(key))tails.set(key,{suffix,prefixes:new Set()});
  tails.get(key).prefixes.add(parts.slice(0,-1).join(' ').toLowerCase());
 }
 // Repeated suffixes across distinct titles on one site are site boilerplate.
 return new Set([...tails.values()].filter(t=>t.prefixes.size>=3).map(t=>t.suffix));
}
export function tokenizeTitle(title) {
 const normalized=titleSubject(title);
 const words=new Map();
 // Preserve adjacent one-character Chinese fragments (e.g. 印+巴, 月+会).
 const parts=[...segmenter.segment(normalized)];
 for(let i=0;i<parts.length-1;i++){
  const a=parts[i].segment,b=parts[i+1].segment;
  if(/^\p{Script=Han}$/u.test(a)&&/^\p{Script=Han}$/u.test(b)&&!stopWords.has(a)&&!stopWords.has(b)&&!stopWords.has(a+b))words.set(a+b,a+b);
 }

 for(const part of segmenter.segment(normalized)) {
  const label=part.segment.trim(),key=label.toLowerCase();
  if(!part.isWordLike || [...key].length<2 || /^(?:[_\d]+|[qh][1-4]|\d{4}[_-]?[qh]?[1-4]?)$/i.test(key) || stopWords.has(key))continue;
  if(!words.has(key))words.set(key,label);
 }
 return words;
}
export function clusterTitles(tabs) {
 const ignored=corpusSuffixes(tabs);
 const entries=tabs.map(tab=>({tab,words:tokenizeTitle(titleSubject(tab.title,ignored))}));
 const terms=new Map();
 for(const {tab,words} of entries)for(const [key,label] of words){
  if(!terms.has(key))terms.set(key,{label,ids:new Set(),position:0});
  const term=terms.get(key);term.ids.add(tab.id);
  term.position += [...words.keys()].indexOf(key);
 }
 const remaining=new Set(tabs.map(t=>t.id)), assignments=new Map();
 // Greedily group shared words; every tab appears once, and groups contain >= 2 tabs.
 while(remaining.size){
  const candidates=[...terms.entries()].map(([key,term])=>({key,...term,ids:[...term.ids].filter(id=>remaining.has(id))})).filter(t=>t.ids.length>=2);
  candidates.sort((a,b)=>b.ids.length-a.ids.length || a.position/a.ids.length-b.position/b.ids.length || a.key.localeCompare(b.key));
  const best=candidates[0];if(!best)break;
  for(const id of best.ids){assignments.set(id,best.label);remaining.delete(id);}
 }
 for(const id of remaining)assignments.set(id,'其他');
 return assignments;
}

export function titleHierarchy(tabs, minimumSize = 6) {
 const ignored=corpusSuffixes(tabs);
 const primary=clusterTitles(tabs), children=new Map(), membership=new Map();
 for(const parent of new Set(primary.values())) {
  const members=tabs.filter(t=>primary.get(t.id)===parent);
  if(parent==='其他'||members.length<minimumSize)continue;
  const terms=new Map();
  for(const tab of members)for(const [key,label] of tokenizeTitle(titleSubject(tab.title,ignored))){
   if(key===parent.toLowerCase())continue;
   if(!terms.has(key))terms.set(key,{label,ids:[]});
   terms.get(key).ids.push(tab.id);
  }
  const groups=[...terms.values()].filter(t=>t.ids.length>=2&&t.ids.length<members.length)
   .sort((a,b)=>b.ids.length-a.ids.length||a.label.localeCompare(b.label))
   .slice(0,3)
   .map(t=>({id:JSON.stringify([parent,t.label.toLowerCase()]),name:`${parent} ${t.label}`,ids:t.ids}));
  children.set(parent,groups);
  for(const group of groups)membership.set(group.id,group);
 }
 return {primary,children,membership};
}
