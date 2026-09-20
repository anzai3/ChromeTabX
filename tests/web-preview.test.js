import {test} from 'node:test';
import assert from 'node:assert/strict';
import {previewUrl} from '../web-preview.js';
test('web previews only embed public HTTP(S) URL schemes without credentials',()=>{
 for(const url of ['javascript:alert(1)','data:text/html,test','chrome://settings','chrome-extension://id/newtab.html','https://user:secret@example.com','bad'])assert.equal(previewUrl(url),null);
 assert.equal(previewUrl('https://example.com/doc?q=1#section'),'https://example.com/doc?q=1#section');
});
