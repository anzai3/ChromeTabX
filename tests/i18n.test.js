import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveLanguage,translateText} from '../i18n.js';
test('system default and manual language override',()=>{
 assert.equal(resolveLanguage('system','zh-TW'),'zh-CN');
 assert.equal(resolveLanguage('system','en-US'),'en');
 assert.equal(resolveLanguage('system','fr-FR'),'en');
 assert.equal(resolveLanguage('en','zh-CN'),'en');
 assert.equal(resolveLanguage('zh-CN','en-US'),'zh-CN');
});
test('dynamic labels and user text',()=>{
 assert.equal(translateText('窗口 2'),'Window 2');
 assert.equal(translateText('47 个进程 · 刚刚更新'),'47 processes · Updated just now');
 assert.equal(translateText('已清理 3 个重复标签'),'Closed 3 duplicate tabs');
 assert.equal(translateText('Mico 月会'),'Mico 月会');
});
