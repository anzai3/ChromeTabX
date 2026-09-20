// Local configuration only. This module does not process payments or track donors.
export function donationUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

// Configuration completeness check only; not chain validation or proof of ownership.
export function cryptoDestinations(wallets) {
  if (!Array.isArray(wallets)) return [];
  return wallets.filter(w => w && ['asset','network','address'].every(k => typeof w[k] === 'string' && w[k].trim()) && !/\s/.test(w.address.trim()))
    .map(w => ({asset:w.asset.trim(), network:w.network.trim(), address:w.address.trim(), memo:typeof w.memo === 'string' ? w.memo.trim() : ''}));
}

export function supportModel({url, crypto = [], appName = 'this app'} = {}, locale = 'en') {
  const href = donationUrl(url);
  const wallets = cryptoDestinations(crypto);
  const chinese = /^zh(?:-|$)/i.test(locale);
  return {
    enabled: !!href || wallets.length > 0, href, wallets,
    copy: chinese ? '复制地址' : 'Copy address',
    copied: chinese ? '地址已复制' : 'Address copied',
    copyFailed: chinese ? '复制失败，请手动选择地址复制' : 'Could not copy. Select the address and copy manually.',
    memoLabel: chinese ? '备注 / Tag（转账时必填）' : 'Memo / Tag (required for transfer)',
    networkNote: chinese ? '请使用上方标明的币种和网络。转账前核对完整地址。' : 'Use the asset and network shown above. Verify the full address before sending.',
    cryptoNote: chinese ? '感谢你的支持。请在自己的钱包中完成转账；此处不连接钱包，也不确认到账。' : 'Thank you for your support. Send from your own wallet; this page does not connect wallets or confirm payments.',
    title: chinese ? '支持改进' : 'Support development',
    action: chinese ? '捐款支持' : 'Donate',
    thanks: chinese
      ? `感谢每一位捐款者，你的支持帮助 ${appName} 持续改进。`
      : `Thank you to everyone who donates. Your support helps improve ${appName}.`,
    note: chinese ? '自愿支持，前往外部收款页面。' : 'Optional support via an external donation page.'
  };
}

// Container is owned by this component. Safe text rendering; no HTML interpolation.
export function mountSupport(container, {config = {}, getLocale = () => 'en', subscribe} = {}) {
  function render() {
    const model = supportModel(config, getLocale());
    container.replaceChildren();
    container.hidden = !model.enabled;
    if (!model.enabled) return;
    const doc = container.ownerDocument;
    const heading = doc.createElement('h3'); heading.textContent = model.title;
    const thanks = doc.createElement('p'); thanks.textContent = model.thanks;
    container.append(heading, thanks);
    if (model.href) {
      const link = doc.createElement('a'); link.textContent = model.action;
      link.href = model.href; link.target = '_blank'; link.rel = 'noopener noreferrer';
      const note = doc.createElement('small'); note.textContent = model.note;
      container.append(link, note);
    }
    for (const wallet of model.wallets) {
      const card = doc.createElement('div'); card.className = 'support-wallet';
      const label = doc.createElement('strong'); label.textContent = `${wallet.asset} · ${wallet.network}`;
      const address = doc.createElement('code'); address.textContent = wallet.address;
      const button = doc.createElement('button'); button.type = 'button'; button.textContent = model.copy;
      button.setAttribute('aria-label', `${model.copy}: ${wallet.asset} · ${wallet.network}`);
      const status = doc.createElement('small'); status.setAttribute('role', 'status');
      button.addEventListener('click', async () => {
        try {
          await doc.defaultView.navigator.clipboard.writeText(wallet.address);
          status.textContent = model.copied;
        } catch { status.textContent = model.copyFailed; }
      });
      card.append(label, address);
      if (wallet.memo) {
        const memo = doc.createElement('p'); memo.textContent = `${model.memoLabel}: ${wallet.memo}`; card.append(memo);
      }
      const warning = doc.createElement('small'); warning.textContent = model.networkNote;
      card.append(button, status, warning); container.append(card);
    }
    if (model.wallets.length) {
      const note = doc.createElement('small'); note.textContent = model.cryptoNote; container.append(note);
    }
  }
  const unsubscribe = subscribe?.(render);
  render();
  return {render, destroy() {unsubscribe?.(); container.replaceChildren(); container.hidden = true;}};
}
