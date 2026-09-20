import {i18n} from './i18n.js';
import {mountSupport} from './packages/app-support/index.js';
import {supportConfig} from './support-config.js';
mountSupport(document.getElementById('support'), {
 config:supportConfig, getLocale:()=>i18n.locale, subscribe:i18n.subscribe
});
