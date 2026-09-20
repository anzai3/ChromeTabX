import './thumbnail-background.js';
chrome.action.onClicked.addListener(() => chrome.tabs.create({url: chrome.runtime.getURL('newtab.html')}));
