import test from 'node:test';
import assert from 'node:assert/strict';
import {iconCandidates,loadShortcutIcon} from '../shortcut-icons.js';
test('prefer actual same-site icons, ignore unrelated tabs, and include page-specific cache',()=>{
 const values=iconCandidates('https://example.com/',[{url:'https://example.com/doc',favIconUrl:'https://cdn.example.com/logo.png'},{url:'https://other.com/',favIconUrl:'https://other.com/icon.png'}],{getURL:p=>'chrome-extension://abc'+p});
 assert.equal(values[0],'https://cdn.example.com/logo.png');
 assert.equal(values.at(-1),'https://example.com/favicon.ico');
 assert.ok(values[1].includes(encodeURIComponent('https://example.com/doc')));
 assert.ok(!values.some(v=>v.includes('other.com')));
});
test('failed image tries next source and only hides fallback after success',()=>{
 const img={remove(){this.removed=true;}},fallback={hidden:false};
 loadShortcutIcon(img,fallback,['https://a/icon','https://b/icon']);
 assert.equal(fallback.hidden,false);img.onerror();assert.equal(img.src,'https://b/icon');
 img.onload();assert.equal(fallback.hidden,true);assert.equal(img.hidden,false);
});
test('all sources failing retains the letter fallback',()=>{
 const img={remove(){this.removed=true;}},fallback={hidden:false};
 loadShortcutIcon(img,fallback,['https://a/icon']);img.onerror();
 assert.equal(img.removed,true);assert.equal(fallback.hidden,false);
});
test('declared favicon resolves relative URLs and ignores unrelated or unsafe links',async()=>{
 const {declaredIcons}=await import('../shortcut-icons.js');
 const link=(rel,href)=>({getAttribute:key=>key==='rel'?rel:href});
 const doc={querySelector:()=>null,querySelectorAll:()=>[link('shortcut icon','/assets/logo.svg'),link('stylesheet','/style.css'),link('icon','javascript:alert(1)'),link('apple-touch-icon','touch.png')]};
 assert.deepEqual(declaredIcons(doc,'https://example.com/app/'),['https://example.com/assets/logo.svg','https://example.com/app/touch.png']);
});
test('website discovery is lazy and only used after known sources fail',async()=>{
 let calls=0;const img={remove(){}},fallback={hidden:false};
 loadShortcutIcon(img,fallback,['https://example.com/icon'],async()=>{calls++;return ['https://example.com/declared.svg'];});
 assert.equal(calls,0);img.onerror();await Promise.resolve();
 assert.equal(calls,1);assert.equal(img.src,'https://example.com/declared.svg');img.onload();assert.equal(fallback.hidden,true);
});
