// Explicit bindings only; never walk or translate user-provided text.
export function bindI18n(i18n, {root = document.documentElement, picker, eventTarget = window, storageKey = 'app.locale'} = {}) {
  function render() {
    root.lang = i18n.locale; root.dir = i18n.direction;
    const elements = [root, ...root.querySelectorAll('[data-i18n], [data-i18n-placeholder], [data-i18n-title], [data-i18n-aria-label]')];
    for (const element of elements) {
      const params = JSON.parse(element.getAttribute('data-i18n-params') || '{}');
      const key = element.getAttribute('data-i18n');
      if (key) element.textContent = i18n.t(key, params);
      for (const attr of ['placeholder', 'title', 'aria-label']) {
        const key = element.getAttribute(`data-i18n-${attr}`);
        if (key) element.setAttribute(attr, i18n.t(key, params));
      }
    }
    if (picker) picker.value = i18n.preference;
  }
  const change = () => i18n.setPreference(picker.value);
  const system = () => i18n.refreshSystem();
  const storage = event => { if (event.key === storageKey || event.key === null) i18n.setPreference(event.newValue || 'system', {persist:false}); };
  picker?.addEventListener('change', change);
  eventTarget.addEventListener('languagechange', system);
  eventTarget.addEventListener('storage', storage);
  const unsubscribe = i18n.subscribe(render);
  render();
  return {render, destroy() { unsubscribe(); picker?.removeEventListener('change', change); eventTarget.removeEventListener('languagechange', system); eventTarget.removeEventListener('storage', storage); }};
}
