import {test} from 'node:test';
import assert from 'node:assert/strict';
import {donationUrl,supportModel} from '../packages/app-support/index.js';
test('missing and unsafe destinations keep donations hidden',()=>{
 for(const url of [null,undefined,'','garbage','javascript:alert(1)','http://example.com','https://user:pass@example.com']) {
  assert.equal(donationUrl(url),null);
  assert.equal(supportModel({url}).enabled,false);
 }
});
test('configured HTTPS destinations preserve payment path and query',()=>{
 const url='https://example.com/support?creator=demo';
 assert.equal(supportModel({url}).href,url);
 assert.equal(supportModel({url}).enabled,true);
});
test('language changes and app names are represented as text',()=>{
 assert.equal(supportModel({},'zh-CN').action,'捐款支持');
 assert.equal(supportModel({},'en').action,'Donate');
 assert.equal(supportModel({},'fr').action,'Donate');
 assert.ok(supportModel({appName:'<Example>'}).thanks.includes('<Example>'));
});
