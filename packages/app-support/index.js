// Local configuration only. This module does not process payments or track donors.
export function donationUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function supportModel({url, appName = 'this app'} = {}, locale = 'en') {
  const href = donationUrl(url);
  const chinese = /^zh(?:-|$)/i.test(locale);
  return {
    enabled: !!href, href,
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
    const link = doc.createElement('a'); link.textContent = model.action;
    link.href = model.href; link.target = '_blank'; link.rel = 'noopener noreferrer';
    const note = doc.createElement('small'); note.textContent = model.note;
    container.append(heading, thanks, link, note);
  }
  const unsubscribe = subscribe?.(render);
  render();
  return {render, destroy() {unsubscribe?.(); container.replaceChildren(); container.hidden = true;}};
}
