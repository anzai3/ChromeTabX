# @startups/app-support

**English** · [简体中文](#中文)

A dependency-free donation entry for Web, Chrome extensions, and Electron UI. Version 0.1.0. No payment processing, analytics, donor database, or backend required.

```js
import {mountSupport} from './index.js';
const view = mountSupport(document.querySelector('#support'), {
  config: {appName:'My App', url:verifiedDonationUrl},
  getLocale: () => i18n.locale,
  subscribe: i18n.subscribe
});
// On unmount: view.destroy()
```

`supportModel(config, locale)` provides the framework-independent view model. `mountSupport` owns a container and renders safe text plus an external link. Import your own CSS or use the host app's styling. Subscribe is optional and should return an unsubscribe function. React/Vue apps can render the model themselves using their default text escaping.

Only HTTPS destinations without embedded credentials are accepted. Missing or invalid URLs hide the entry. Configure the creator's verified donation URL; URL validation does not verify recipient ownership. English and Chinese copy is included. Other languages fall back to English. The message thanks supporters generally; opening a link does not imply a successful payment. Never show invented donor names or amounts. Named acknowledgements require confirmed data and donor consent.

Run `npm pack` in this directory to make a versioned local package; it has not been published to npm. Native Swift/Kotlin apps can reuse the configuration and behavior, but need a native UI adapter. Current consumer: ChromeTabX. Payment flow remains unverified until the owner supplies a destination.

## 中文

零依赖的捐款入口模块，适用于 Web、Chrome 扩展和 Electron。支持收款链接配置、中英文切换、感谢文案和卸载清理，不处理支付、不追踪用户、不存储捐款人信息。

ChromeTabX 在 `support-config.js` 配置真实收款链接，入口位于设置。未配置或链接不合法时隐藏；只有不含账号密码的 HTTPS 链接才被接受。URL 合法性不代表已核验收款人。

`supportModel` 提供与框架无关的数据，`mountSupport` 提供可选 DOM 组件；可直接订阅 app-i18n 的语言变化。感谢文案是对支持者的统一致谢，不将点击视为支付成功。展示捐款人名单需要真实记录和本人同意。

运行 `npm pack` 可供其他项目安装固定版本，尚未发布 npm。原生 App 需单独适配。目前仅 ChromeTabX 接入，仍待提供收款链接后验证实际跳转。
