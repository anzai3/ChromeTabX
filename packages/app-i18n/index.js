// Framework-independent runtime. No browser globals or storage side effects on import.
const canonical = value => { try { return Intl.getCanonicalLocales(value)[0] || ''; } catch { return ''; } };
export function resolveLocale(preference, systemLocales, supported, fallback = supported[0]) {
  const match = value => {
    const tag = canonical(value);
    if (!tag) return undefined;
    const exact = supported.find(x => canonical(x) === tag);
    if (exact) return exact;
    const candidates = supported.filter(x => canonical(x).split('-')[0] === tag.split('-')[0]);
    const script = new Intl.Locale(tag).maximize().script;
    return candidates.find(x => new Intl.Locale(x).maximize().script === script) || candidates[0];
  };
  if (preference && preference !== 'system') return match(preference) || fallback;
  for (const value of typeof systemLocales === 'string' ? [systemLocales] : systemLocales || []) {
    const found = match(value); if (found) return found;
  }
  return fallback;
}

// Run in CI, not on every render. Catalog entries are strings or plural maps.
export function validateCatalogs(messages, baseLocale = 'en') {
  const issues = [], base = messages[baseLocale];
  if (!base) return [{locale:baseLocale, key:'', reason:'missing-base'}];
  const placeholders = entry => [...new Set((typeof entry === 'string' ? [entry] : Object.values(entry || {})).flatMap(value => typeof value === 'string' ? [...value.matchAll(/\{(\w+)\}/g)].map(m => m[1]) : []))].sort().join(',');
  for (const [locale, catalog] of Object.entries(messages)) {
    for (const key of Object.keys(base)) {
      if (!Object.hasOwn(catalog, key)) { issues.push({locale,key,reason:'missing-key'}); continue; }
      const value = catalog[key];
      if (typeof value !== 'string' && (!value || typeof value !== 'object' || typeof value.other !== 'string' || Object.values(value).some(v => typeof v !== 'string'))) issues.push({locale,key,reason:'invalid-message'});
      if (placeholders(value) !== placeholders(base[key])) issues.push({locale,key,reason:'placeholder-mismatch'});
    }
    for (const key of Object.keys(catalog)) if (!Object.hasOwn(base,key)) issues.push({locale,key,reason:'extra-key'});
  }
  return issues;
}

export function createI18n({messages, fallbackLocale = 'en', preference, getSystemLocales = () => ['en'], storage, storageKey = 'app.locale', onMissing = () => {}}) {
  const supported = Object.keys(messages);
  if (!supported.includes(fallbackLocale)) throw new Error('fallbackLocale must have a catalog');
  let choice = preference;
  if (choice == null) { try { choice = storage?.getItem(storageKey); } catch {} }
  const normalize = value => value === 'system' || supported.includes(value) ? value : 'system';
  choice = normalize(choice);
  const detect = () => { try { return getSystemLocales(); } catch { return [fallbackLocale]; } };
  let locale = resolveLocale(choice, detect(), supported, fallbackLocale);
  const listeners = new Set();
  function update(value, persist) {
    const previous = choice, oldLocale = locale;
    choice = normalize(value);
    locale = resolveLocale(choice, detect(), supported, fallbackLocale);
    if (persist) { try { storage?.setItem(storageKey, choice); } catch {} }
    if (previous !== choice || oldLocale !== locale) for (const listener of [...listeners]) listener(api);
  }
  function template(key, params) {
    for (const lang of [...new Set([locale, fallbackLocale])]) {
      const entry = Object.hasOwn(messages[lang], key) ? messages[lang][key] : undefined;
      if (typeof entry === 'string') return entry;
      if (entry && typeof entry === 'object') {
        const rule = Number.isFinite(params.count) ? new Intl.PluralRules(lang).select(params.count) : 'other';
        const value = entry[`=${params.count}`] ?? entry[rule] ?? entry.other;
        if (typeof value === 'string') return value;
      }
    }
    onMissing(key, locale); return key;
  }
  const api = {
    get locale() { return locale; },
    get preference() { return choice; },
    get direction() { return /^(ar|fa|he|ur|ps|dv|yi)(-|$)/.test(locale) ? 'rtl' : 'ltr'; },
    t(key, params = {}) { return template(key, params).replace(/\{(\w+)\}/g, (token, name) => Object.hasOwn(params, name) ? String(params[name]) : token); },
    number(value, options) { return new Intl.NumberFormat(locale, options).format(value); },
    date(value, options) { return new Intl.DateTimeFormat(locale, options).format(value); },
    relative(value, unit, options) { return new Intl.RelativeTimeFormat(locale, {numeric:'auto', ...options}).format(value, unit); },
    setPreference(value, {persist = true} = {}) { update(value, persist); },
    refreshSystem() { update(choice, false); },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
  };
  return api;
}
