import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createI18n,resolveLocale,validateCatalogs} from '../packages/app-i18n/index.js';
const messages={en:{hello:'Hello {name}',tabs:{one:'{count} tab',other:'{count} tabs'},fallback:'Fallback'},'zh-CN':{hello:'你好，{name}'},ar:{hello:'مرحبا {name}'}};
test('locale priority, variants, unsupported preferences and invalid tags',()=>{
 assert.equal(resolveLocale('system',['invalid_!','de','zh-TW'],Object.keys(messages),'en'),'zh-CN');
 assert.equal(resolveLocale('en',['zh-CN'],Object.keys(messages),'en'),'en');
 assert.equal(resolveLocale('system',['en-GB'],Object.keys(messages),'en'),'en');
 assert.equal(resolveLocale('system',['zh-HK'],['en','zh-CN','zh-TW'],'en'),'zh-TW');
});
test('catalog audit detects missing messages and broken placeholders',()=>{
 const issues=validateCatalogs({en:{a:'Hello {name}',b:{one:'{count} tab',other:'{count} tabs'}},zh:{a:'你好 {username}'}});
 assert.deepEqual(issues,[{locale:'zh',key:'a',reason:'placeholder-mismatch'},{locale:'zh',key:'b',reason:'missing-key'}]);
 assert.deepEqual(validateCatalogs({en:{a:'{count} tabs'},zh:{a:'{count} 个标签'}}),[]);
});
test('hot switching, persistence, fallback plural rules and missing keys',()=>{
 const values=new Map(), storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 const missing=[]; const i=createI18n({messages,storage,getSystemLocales:()=>['zh-CN'],onMissing:k=>missing.push(k)});
 assert.equal(i.t('hello',{name:'Mico'}),'你好，Mico');
 assert.equal(i.t('tabs',{count:1}),'1 tab');
 assert.equal(i.t('tabs',{count:3}),'3 tabs');
 let calls=0;const stop=i.subscribe(()=>calls++);
 i.setPreference('en');assert.equal(i.t('hello',{name:'Mico'}),'Hello Mico');
 assert.equal(values.get('app.locale'),'en');assert.equal(calls,1);
 i.setPreference('en');assert.equal(calls,1);stop();
 i.setPreference('ar');assert.equal(i.direction,'rtl');assert.equal(calls,1);
 assert.equal(i.t('unknown'),'unknown');assert.deepEqual(missing,['unknown']);
});
test('system changes follow system only; storage failures and cross-window updates are safe',()=>{
 let system=['en'];const storage={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};
 const i=createI18n({messages,storage,getSystemLocales:()=>system});
 system=['zh-CN'];i.refreshSystem();assert.equal(i.locale,'zh-CN');
 i.setPreference('en');i.refreshSystem();assert.equal(i.locale,'en');
 i.setPreference('system',{persist:false});assert.equal(i.locale,'zh-CN');
 i.setPreference('removed-language');assert.equal(i.preference,'system');
});
test('formatters and interpolation do not interpret user text as HTML',()=>{
 const i=createI18n({messages,preference:'en'});
 assert.equal(i.t('hello',{name:'<img src=x>'}),'Hello <img src=x>');
 assert.equal(i.number(1234.5),'1,234.5');
 assert.equal(i.relative(-1,'day'),'yesterday');
 assert.equal(i.date(new Date('2026-09-20T00:00:00Z'),{timeZone:'UTC',year:'numeric'}),'2026');
});
