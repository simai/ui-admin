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
// The LANGUAGE used to need a reload: a component chose its words when it drew
// and nothing watched afterwards. From the pair with the language registry it
// does not — `SF.language.use()` tells every mounted component to draw again.
// The page's own `lang` is still set before anything renders, by the inline
// script in each head, so the first paint is right and there is no flash of the
// wrong language; the switch after that is immediate.
//
// A product adds a language the Framework never shipped with
// `SF.language.registerAll(code, byComponent)`, and the menu below lists
// whatever is available rather than two names written into this file.
const STORE = 'simai.admin.appearance';

export type Appearance = { theme: 'system' | 'light' | 'dark'; lang: string };

const DEFAULTS: Appearance = { theme: 'system', lang: 'ru' };

export const readAppearance = (): Appearance => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORE) ?? '{}') as Partial<Appearance>;
    return {
      theme: stored.theme === 'light' || stored.theme === 'dark' || stored.theme === 'system'
        ? stored.theme : DEFAULTS.theme,
      lang: typeof stored.lang === 'string' && stored.lang in LANGUAGE_NAMES ? stored.lang : DEFAULTS.lang,
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

const TEXT: Record<string, Record<string, string>> = {
  ru: { theme: 'Тема', lang: 'Язык', system: 'Системная', light: 'Светлая', dark: 'Тёмная', menu: 'Оформление и язык' },
  en: { theme: 'Theme', lang: 'Language', system: 'System', light: 'Light', dark: 'Dark', menu: 'Appearance and language' },
  // The polygon's own third language, registered below, so the menu is not a
  // demonstration of two.
  tr: { theme: 'Tema', lang: 'Dil', system: 'Sistem', light: 'Açık', dark: 'Koyu', menu: 'Görünüm ve dil' },
};

/** A language's own name, which is how a person recognises it in a list. */
const LANGUAGE_NAMES: Record<string, string> = { ru: 'Русский', en: 'English', tr: 'Türkçe' };

type LanguageApi = {
  use(code: string | null): unknown;
  registerAll(code: string, byComponent: Record<string, Record<string, string>>): unknown;
  current(node?: unknown): string;
};

const api = (): LanguageApi | null =>
  (globalThis as { SF?: { language?: LanguageApi } }).SF?.language ?? null;

/**
 * Turkish for a few of the words, so the polygon shows what a product does
 * rather than describing it: these are registered at runtime, for components
 * the Framework ships with English and Russian only.
 */
export const teachTurkish = () => {
  api()?.registerAll('tr', {
    'sf-table': {
      filterText: 'Filtre', createText: 'Oluştur', searchPlaceholder: 'Ara',
      emptyText: 'Veri yok', filterApplyText: 'Filtreyi uygula',
    },
    'sf-pagination': {
      totalLabel: 'Toplam:', pagesLabel: 'Sayfalar:', pageSizeLabel: 'Sayfa başına:',
      showMoreText: 'Daha fazla göster',
    },
    'sf-property-view': { closeLabel: 'Kapat', copyLinkLabel: 'Bağlantıyı kopyala' },
  });
};

/**
 * The control itself: an avatar that opens a small menu of two choices. Built
 * from the Framework's own parts, because a reference that drew its own
 * controls would be showing something nobody can copy.
 */
export const mountAppearanceMenu = (slot: Element) => {
  const current = readAppearance();
  const words = TEXT[current.lang] ?? TEXT.en;

  const popover = document.createElement('sf-popover');
  popover.setAttribute('placement', 'bottom-end');
  popover.setAttribute('label', words.menu);

  const trigger = document.createElement('sf-avatar');
  trigger.setAttribute('slot', 'trigger');
  trigger.setAttribute('size', '1');
  trigger.setAttribute('text', 'ИС');
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
    // Every language the admin knows a name for, by its own name: a list that
    // said «Русский, English» in English would be a list of two, and there are
    // going to be many more.
    group(words.lang, Object.entries(LANGUAGE_NAMES).map(([value, text]) => ({ value, text })),
      current.lang, (value) => {
        if (value === current.lang) return;
        write({ ...readAppearance(), lang: value });
        // No reload: the registry tells every mounted component to draw again.
        // The document's own `lang` is set too, so anything that mounts later
        // starts in the right language.
        document.documentElement.lang = value;
        api()?.use(value);
        slot.replaceChildren();
        mountAppearanceMenu(slot);
      }),
  );

  popover.append(trigger, content);
  slot.append(popover);
};
