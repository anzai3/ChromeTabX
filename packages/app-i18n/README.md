# @startups/app-i18n · 0.1.0

零依赖 ES module，适用于 Web、Chrome 扩展、Electron 的界面层及 JS/TS 应用。纯运行时不访问 DOM，可在 Node 中运行。Swift/Kotlin 等原生 App 复用行为约定，需独立适配，并不能直接导入本 JS 包。

## 接入

在本目录执行 `npm pack` 生成版本固定的 tgz，然后在其他项目执行 `npm install /绝对路径/startups-app-i18n-0.1.0.tgz`。尚未发布 npm registry。Chrome 无构建项目将 index.js、dom.js 随扩展一起打包，不从远程加载代码。

```js
import {createI18n, validateCatalogs} from '@startups/app-i18n';
const messages = {
  en: { 'tabs.count': {one:'{count} tab', other:'{count} tabs'}, 'search.placeholder':'Search tabs' },
  'zh-CN': { 'tabs.count':'{count} 个标签', 'search.placeholder':'搜索标签' }
};
// 获取 localStorage 本身也可能抛错。
let storage; try { storage = globalThis.localStorage; } catch {}
const i18n = createI18n({messages, storage, storageKey:'my-app.locale',
  getSystemLocales:() => navigator.languages, fallbackLocale:'en'});
console.log(i18n.t('tabs.count', {count:2}));
const unsubscribe = i18n.subscribe(() => render());
i18n.setPreference('zh-CN'); // 即时切换，业务状态不重建
i18n.setPreference('system'); // 恢复跟随系统
// 卸载组件时 unsubscribe()
if (validateCatalogs(messages).length) throw Error('Translation catalog needs review');
```

浏览器环境使用 navigator.languages；Chrome 扩展优先 chrome.i18n.getUILanguage()，再传入 navigator.languages。手动选择优先于系统，系统语言按优先级逐一匹配：精确 locale → 同语言同 script → 同语言 → fallback。只支持简体中文时，繁体环境回退简体；配置 zh-TW 后优先选择繁体。

### DOM / 框架

```html
<input data-i18n-placeholder="search.placeholder">
<span data-i18n="tabs.count" data-i18n-params='{"count":2}'></span>
```

```js
import {bindI18n} from '@startups/app-i18n/dom';
const binding = bindI18n(i18n, {picker:document.querySelector('#language'), storageKey:'my-app.locale'});
// 动态新增绑定节点、修改参数后 binding.render()；卸载时 binding.destroy()
```

选择器 option.value 为 system 或语言包键；语言名称用本语言名称（简体中文、English）。DOM 适配器更新 lang/dir、监听 languagechange 和同源 storage 事件，且只更新显式标记的节点。data-i18n 放在叶子节点，否则 textContent 会替换子元素。参数必须是有效 JSON。

React/Vue 等框架使用 subscribe 更新 locale 状态，渲染中调用 t；组件卸载时取消订阅。不要同时让 DOM adapter 管理框架拥有的节点。SSR 每个请求创建实例，注入请求 locale，不共享用户偏好。复杂 ICU/select/rich-text/自动翻译不在首版范围内。

## 接口与约定

- `t(key, params)`：固定语义键，字符串或 plural 对象；支持 `one/other` 等 Intl 类别及 `=0` 精确数量。数字 count 决定复数。缺少翻译回退基础语言，再返回 key 并调用 onMissing；未传参数保留占位符供发现问题。
- `number / date / relative`：使用 Intl 格式化；date 可传 timeZone，默认运行设备时区。
- `locale / preference / direction`：实际语言、用户偏好、常见 RTL 语言方向。新增特殊 script 需补方向适配与验收。
- `setPreference(value, {persist:false})`：跨窗口同步可避免循环写入；无效偏好恢复 system。存储受限时保留当前会话内切换。
- `refreshSystem()`：重新读取系统语言；手动语言不会被覆盖。subscribe 返回取消监听函数。
- `validateCatalogs(messages, baseLocale)`：报告缺失/多余 key、非法消息和占位符不一致；用于 CI，不证明译文质量。

返回值是纯文本，DOM 使用 textContent 或框架默认转义；不要传给 innerHTML。用户标题、文件名、正文、分类词不进入翻译目录。不上传任何内容，不做机器翻译。

## 维护和验证

在来源项目根目录执行 `npm test`。新增语言时提供完整目录并运行 validateCatalogs，检查长文案、复数 0/1/2、日期时区、RTL（若适用）及无障碍名称。先验证系统默认，再验证手动覆盖、刷新保留、即时切换不丢失业务状态、存储失败与跨窗口同步。

来源：ChromeTabX/packages/app-i18n。当前接入 ChromeTabX 一个真实项目，状态为试用；独立 DOM 样例用于验证通用接口，不计为第二个真实 App。已有 ChromeTabX 中文句子匹配留在 legacy-translations.js 与 i18n.js 兼容层，不纳入公共 API。以后逐步改成稳定 key。

升级使用固定版本包；破坏性改动升主版本并写迁移。回滚保留上一 tgz 与项目锁文件，避免修改共享目录就让所有消费者无验证升级。
