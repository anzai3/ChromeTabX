import test from 'node:test';
import assert from 'node:assert/strict';
import {iconCandidates,loadShortcutIcon} from '../shortcut-icons.js';
test('prefer actual same-site icons, ignore unrelated tabs, and include page-specific cache',()=>{
 const values=iconCandidates('https://example.com/',[{url:'https://example.com/doc',favIconUrl:'https://cdn.example.com/logo.png'},{url:'https://other.com/',favIconUrl:'https://other.com/icon.png'}],{getURL:p=>'chrome-extension://abc'+p});
 assert.equal(values[0],'https://cdn.example.com/logo.png');
 assert.equal(values[1],'https://example.com/favicon.ico');
 assert.ok(values[2].includes(encodeURIComponent('https://example.com/doc')));
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
