// Where the theme and the language are set, which an admin has and this one did
// not (owner, 2026-10-10).
//
// Both are page-wide facts the Framework reads, and it reads them differently,
// which is why they are handled differently here.
//
// The THEME is a class on the document — `theme-light` or `theme-dark`, which
// carry nothing but `color-scheme` for `light-dark()` to branch on. Changing
// the class is enough: no component has to be told.
//
// The LANGUAGE is `lang` on the document, and every component resolves its text
// from the nearest `[lang]` AT RENDER TIME. Nothing observes it afterwards, so
// changing it on a page that has already drawn leaves every drawn label in the
// old language — which is exactly the half-translated head this polygon showed
// an hour before this was written. So a language change reloads the page, and
// the reload lands on the same record because the record is in the address.
//
// Both are applied before anything renders, by the inline script in each page's
// head. Applying them from a module would be too late for the same reason: the
// components would already have chosen their words.
const STORE = 'simai.admin.appearance';

export type Appearance = { theme: 'system' | 'light' | 'dark'; lang: 'ru' | 'en' };

const DEFAULTS: Appearance = { theme: 'system', lang: 'ru' };

export const readAppearance = (): Appearance => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORE) ?? '{}') as Partial<Appearance>;
    return {
      theme: stored.theme === 'light' || stored.theme === 'dark' || stored.theme === 'system'
        ? stored.theme : DEFAULTS.theme,
      lang: stored.lang === 'en' || stored.lang === 'ru' ? stored.lang : DEFAULTS.lang,
    };
  } catch {
    // A private window, or storage the browser refuses: the defaults are not an
    // error state.
    return { ...DEFAULTS };
  }
};

const write = (appearance: Appearance) => {
  try {
    localStorage.setItem(STORE, JSON.stringify(appearance));
  } catch { /* nothing to do and nothing to say: the choice lasts this visit */ }
};

export const applyTheme = (theme: Appearance['theme']) => {
  const dark = theme === 'dark'
    || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('theme-dark', dark);
  document.documentElement.classList.toggle('theme-light', !dark);
};

const TEXT = {
  ru: { title: 'Оформление', theme: 'Тема', lang: 'Язык', system: 'Системная', light: 'Светлая', dark: 'Тёмная', ru: 'Русский', en: 'English', menu: 'Оформление и язык' },
  en: { title: 'Appearance', theme: 'Theme', lang: 'Language', system: 'System', light: 'Light', dark: 'Dark', ru: 'Русский', en: 'English', menu: 'Appearance and language' },
};

/**
 * The control itself: an avatar that opens a small menu of two choices. Built
 * from the Framework's own parts, because a reference that drew its own
 * controls would be showing something nobody can copy.
 */
export const mountAppearanceMenu = (slot: Element) => {
  const current = readAppearance();
  const words = TEXT[current.lang];

  const popover = document.createElement('sf-popover');
  popover.setAttribute('placement', 'bottom-end');
  popover.setAttribute('label', words.menu);

  const trigger = document.createElement('sf-avatar');
  trigger.setAttribute('slot', 'trigger');
  trigger.setAttribute('size', '1');
  trigger.setAttribute('text', 'РЗ');
  trigger.setAttribute('role', 'button');
  trigger.setAttribute('tabindex', '0');
  trigger.setAttribute('aria-label', words.menu);
  trigger.style.cursor = 'pointer';

  const content = document.createElement('div');
  content.setAttribute('slot', 'content');
  content.className = 'flex flex-col gap-2 p-2';
  content.style.minWidth = '15rem';

  const group = (
    label: string,
    options: Array<{ value: string; text: string }>,
    chosen: string,
    choose: (value: string) => void,
  ) => {
    const box = document.createElement('div');
    box.className = 'flex flex-col gap-1/2';

    const title = document.createElement('span');
    title.className = 'sf-text-1/2 color-on-surface-variant';
    title.textContent = label;
    box.append(title);

    const row = document.createElement('div');
    row.className = 'flex gap-1/3';
    for (const option of options) {
      const button = document.createElement('sf-button');
      button.setAttribute('size', '1');
      button.setAttribute('text', option.text);
      // The chosen one is filled, the others outlined: one glance says which.
      button.setAttribute('appearance', option.value === chosen ? 'tonal' : 'outline');
      button.setAttribute('scheme', 'on-surface');
      button.addEventListener('click', () => choose(option.value));
      row.append(button);
    }
    box.append(row);
    return box;
  };

  content.append(
    group(words.theme, [
      { value: 'system', text: words.system },
      { value: 'light', text: words.light },
      { value: 'dark', text: words.dark },
    ], current.theme, (value) => {
      const next = { ...readAppearance(), theme: value as Appearance['theme'] };
      write(next);
      applyTheme(next.theme);
      // Rebuilt rather than patched, so the chosen button is the filled one.
      slot.replaceChildren();
      mountAppearanceMenu(slot);
    }),
    group(words.lang, [
      { value: 'ru', text: words.ru },
      { value: 'en', text: words.en },
    ], current.lang, (value) => {
      if (value === current.lang) return;
      write({ ...readAppearance(), lang: value as Appearance['lang'] });
      // Every drawn label chose its words when it rendered and nothing observes
      // `lang` afterwards, so the page is read again. The address carries the
      // record, so this lands where it was.
      location.reload();
    }),
  );

  popover.append(trigger, content);
  slot.append(popover);
};
