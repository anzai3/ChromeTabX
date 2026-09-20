import test from 'node:test';
import assert from 'node:assert/strict';
import {readThumbnail} from '../thumbnail-state.js';
test('image is retrieved directly from storage without worker response',async()=>{
 const url='https://example.com',image='data:image/webp;base64,AAAA';
 const storage={get:async()=>({'thumb:1':{url,image,time:100}})};
 assert.deepEqual(await readThumbnail(storage,1,url,200),{status:'ready',image});
 assert.deepEqual(await readThumbnail(storage,1,'https://other.com',200),{status:'pending'});
});
test('obsolete background capture state is ignored',async()=>{
 const storage={get:async()=>({'thumb-state:1':{url:'https://example.com',status:'loading'}})};
 assert.deepEqual(await readThumbnail(storage,1,'https://example.com'),{status:'pending'});
});
