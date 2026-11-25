/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "151a293c8c90"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ariaKeyShortcuts: () => (/* binding */ ariaKeyShortcuts),
/* harmony export */   isApplePlatform: () => (/* binding */ isApplePlatform),
/* harmony export */   isCommandShortcut: () => (/* binding */ isCommandShortcut),
/* harmony export */   isEditableTarget: () => (/* binding */ isEditableTarget),
/* harmony export */   matchesShortcut: () => (/* binding */ matchesShortcut),
/* harmony export */   parseShortcut: () => (/* binding */ parseShortcut),
/* harmony export */   shortcutCaps: () => (/* binding */ shortcutCaps),
/* harmony export */   shortcutView: () => (/* binding */ shortcutView)
/* harmony export */ });
// A key combination as a `shortcut` setting writes it (sf-button, an entry
// of sf-menu-context, a row of sf-search): words joined by +, the modifiers
// first and the key last -- mod+k, shift+/, /, escape. `mod` is the
// platform's command modifier: Cmd on Apple platforms, Ctrl elsewhere. Read
// once per render; nothing here holds state.
//
// The kbd component owns how a combination reads (owner decision 2026-11-07,
// docs review R030, rule C04): on an Apple platform the modifiers are glyphs
// in the platform's order, side by side (⇧⌘P); elsewhere they are words in
// Ctrl+Shift+P order, and shortcutView() says to join them with + -- the kbd
// sheet shows the joins where keys are plain glyphs (a menu row, a tooltip)
// and hides them between caps, which stand apart. A host renders the view
// and never styles the keys.
const MODIFIERS = ['mod', 'ctrl', 'alt', 'shift', 'meta']; // What a person reads on a key cap, per platform.

const MAC_CAPS = {
  mod: '⌘',
  meta: '⌘',
  ctrl: '⌃',
  alt: '⌥',
  shift: '⇧'
};
const OTHER_CAPS = {
  mod: 'Ctrl',
  meta: 'Win',
  ctrl: 'Ctrl',
  alt: 'Alt',
  shift: 'Shift'
}; // A cap of one character -- a letter, ⌘, ⇧, ↵ -- is a square key; a cap of
// several letters (Esc, Ctrl, Shift) hugs its word (sheet:
// .sf-button-shortcut-key--square). A modifier's cap is the platform's own
// word, so a page printed on a Mac and drawn on Windows widens by the
// difference: the keys are true to their caps, not to the widest platform
// (docs review R010, 2026-11-06).

const KEY_CAPS = {
  enter: '↵',
  return: '↵',
  escape: 'Esc',
  esc: 'Esc',
  tab: 'Tab',
  space: 'Space',
  backspace: '⌫',
  delete: 'Del',
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
  home: 'Home',
  end: 'End',
  pageup: 'PgUp',
  pagedown: 'PgDn'
}; // An Apple keyboard's own signs where they differ (component.kbd 1.3.3, CM-9
// of ui-control research 2026-11-14-context-menu): forward delete is ⌦, as
// macOS menus print it; Del is a Windows word.

const MAC_KEY_CAPS = {
  delete: '⌦'
}; // The names of KeyboardEvent.key for the words above.

const KEY_NAMES = {
  enter: 'Enter',
  return: 'Enter',
  escape: 'Escape',
  esc: 'Escape',
  tab: 'Tab',
  space: ' ',
  backspace: 'Backspace',
  delete: 'Delete',
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  arrowup: 'ArrowUp',
  arrowdown: 'ArrowDown',
  arrowleft: 'ArrowLeft',
  arrowright: 'ArrowRight',
  home: 'Home',
  end: 'End',
  pageup: 'PageUp',
  pagedown: 'PageDown'
}; // KeyboardEvent.code of the punctuation a shortcut is usually written with,
// so the combination is heard on any keyboard layout.

const PUNCTUATION_CODES = {
  '/': 'Slash',
  '.': 'Period',
  ',': 'Comma',
  ';': 'Semicolon',
  "'": 'Quote',
  '[': 'BracketLeft',
  ']': 'BracketRight',
  '-': 'Minus',
  '=': 'Equal',
  '`': 'Backquote',
  '\\': 'Backslash'
};
function isApplePlatform() {
  const platform = globalThis.navigator?.userAgentData?.platform || globalThis.navigator?.platform || '';
  return /mac|iphone|ipad|ipod/iu.test(platform);
}
/**
 * The combination as parts: `{modifiers: Set, key}`, or null when there is
 * none. `+` as the key itself is written `mod+plus`.
 */

function parseShortcut(value) {
  const text = String(value ?? '').trim().toLowerCase();
  if (!text) return null;
  const words = text === '+' ? ['+'] : text.split('+').map(word => word.trim()).filter(Boolean);
  if (!words.length) return null;
  const key = words.at(-1) === 'plus' ? '+' : words.at(-1);
  const modifiers = new Set(words.slice(0, -1).filter(word => MODIFIERS.includes(word)));
  return {
    modifiers,
    key
  };
}
/**
 * What the keys read, one cap per key in the platform's words: {text, square},
 * square when the cap is one character.
 */

function shortcutCaps(parsed, apple = isApplePlatform()) {
  if (!parsed) return [];
  const caps = apple ? MAC_CAPS : OTHER_CAPS;
  const order = apple ? ['ctrl', 'alt', 'shift', 'mod', 'meta'] : ['mod', 'ctrl', 'meta', 'alt', 'shift'];
  const modifiers = [];

  for (const name of order.filter(one => parsed.modifiers.has(one))) {
    // On a Mac mod and meta are one key.
    if (modifiers.includes(caps[name])) continue;
    modifiers.push(caps[name]);
  }

  const key = (apple ? MAC_KEY_CAPS[parsed.key] : undefined) ?? KEY_CAPS[parsed.key] ?? (parsed.key.length === 1 ? parsed.key.toUpperCase() : parsed.key.charAt(0).toUpperCase() + parsed.key.slice(1));
  return [...modifiers, key].map(text => ({
    text,
    square: [...text].length === 1
  }));
} // A function key (F1-F24) reads as its name.

const FUNCTION_KEY = /^f(?:[1-9]|1[0-9]|2[0-4])$/u; // Whether a written value is the notation above rather than text a page
// already wrote for people (⇧⌘L, «Ctrl K»): every word but the last a
// modifier, the last one character, a named key or a function key.

function isNotation(value) {
  const text = String(value ?? '').trim().toLowerCase();
  if (!text || /\s/u.test(text.replace(/\s*\+\s*/gu, '+'))) return false;
  if (text === '+') return true;
  const words = text.split('+').map(word => word.trim());
  if (words.some(word => !word)) return false;
  const key = words.at(-1) === 'plus' ? '+' : words.at(-1);
  return words.slice(0, -1).every(word => MODIFIERS.includes(word)) && ([...key].length === 1 || key in KEY_CAPS || FUNCTION_KEY.test(key));
}
/**
 * What a host draws for a `shortcut` value: {keys: [{text, square}], join},
 * the keys in this platform's words and whether they are joined with + (not
 * on an Apple platform, and only between keys). A value that is not the
 * notation -- text a page wrote for people, such as ⇧⌘L -- is one key of
 * that text. Empty: no keys.
 */


function shortcutView(value, apple = isApplePlatform()) {
  const text = String(value ?? '').trim();
  if (!text) return {
    keys: [],
    join: false
  };
  if (!isNotation(text)) return {
    keys: [{
      text,
      square: [...text].length === 1
    }],
    join: false
  };
  const keys = shortcutCaps(parseShortcut(text), apple);
  return {
    keys,
    join: !apple && keys.length > 1
  };
}
/** The value of aria-keyshortcuts (WAI-ARIA 1.2): Meta+K, Control+K, /. */

function ariaKeyShortcuts(parsed, apple = isApplePlatform()) {
  if (!parsed) return '';
  const names = [];
  if (parsed.modifiers.has('ctrl') || parsed.modifiers.has('mod') && !apple) names.push('Control');
  if (parsed.modifiers.has('alt')) names.push('Alt');
  if (parsed.modifiers.has('shift')) names.push('Shift');
  if (parsed.modifiers.has('meta') || parsed.modifiers.has('mod') && apple) names.push('Meta');
  const key = KEY_NAMES[parsed.key] ?? (parsed.key === ' ' ? 'Space' : parsed.key.length === 1 ? parsed.key.toUpperCase() : parsed.key);
  return [...names, key === ' ' ? 'Space' : key].join('+');
} // Whether the event's key is the combination's key: by the character it
// typed, or by the physical key for a letter, a digit or the punctuation
// above, so mod+k is heard on a Russian layout too.

function sameKey(event, key) {
  const name = KEY_NAMES[key];
  if (name) return event.key === name;
  if (String(event.key).toLowerCase() === key) return true;
  if (/^[a-z]$/u.test(key)) return event.code === `Key${key.toUpperCase()}`;
  if (/^[0-9]$/u.test(key)) return event.code === `Digit${key}`;
  return PUNCTUATION_CODES[key] !== undefined && event.code === PUNCTUATION_CODES[key];
}
/** Whether a keydown is the combination. */


function matchesShortcut(event, parsed, apple = isApplePlatform()) {
  if (!parsed || !event) return false;
  const wants = {
    ctrl: parsed.modifiers.has('ctrl') || parsed.modifiers.has('mod') && !apple,
    meta: parsed.modifiers.has('meta') || parsed.modifiers.has('mod') && apple,
    alt: parsed.modifiers.has('alt'),
    shift: parsed.modifiers.has('shift')
  };
  if (Boolean(event.ctrlKey) !== wants.ctrl || Boolean(event.metaKey) !== wants.meta || Boolean(event.altKey) !== wants.alt) return false; // Shift is part of typing a punctuation mark on many layouts (? is shift+/):
  // a combination that does not name it does not mind it for punctuation, and
  // minds it for a letter, a digit or a named key.

  const punctuation = parsed.key.length === 1 && !/^[a-z0-9]$/u.test(parsed.key);
  if (!punctuation && Boolean(event.shiftKey) !== wants.shift) return false;
  if (punctuation && wants.shift && !event.shiftKey) return false;
  return sameKey(event, parsed.key);
}
/** A combination with mod, ctrl, alt or meta is a command even in a field. */

function isCommandShortcut(parsed) {
  return Boolean(parsed) && ['mod', 'ctrl', 'alt', 'meta'].some(name => parsed.modifiers.has(name));
}
/** Whether focus is where a person types: a field, a select or editable text. */

function isEditableTarget(target) {
  const element = target instanceof Element ? target : null;
  if (!element) return false;
  if (element.isContentEditable) return true;
  const tag = element.localName;
  if (tag === 'textarea' || tag === 'select') return true;
  if (tag !== 'input') return false;
  const type = (element.getAttribute('type') || 'text').toLowerCase();
  return !['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'color', 'file', 'image', 'hidden'].includes(type);
}

/***/ },

/***/ "1373e294ec38"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BREAKPOINTS: () => (/* binding */ BREAKPOINTS),
/* harmony export */   breakpointMedia: () => (/* binding */ breakpointMedia),
/* harmony export */   breakpointQuery: () => (/* binding */ breakpointQuery),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   matchesBreakpoint: () => (/* binding */ matchesBreakpoint)
/* harmony export */ });
// The Framework's breakpoints for scripts (reuse audit 2026-11-02, finding 6).
// The sheets switch at the steps of core/scss/vars/_sf_var__breakpoint.scss;
// a component that also decides in script (sf-contents, sf-site-header,
// sf-search) had copied the steps by hand, word for word, and nine such
// constants (48rem, 60rem, 1023px, 1024) had drifted apart elsewhere, so one
// admin screen switched at two points. The same values here, and
// tests/breakpoint-ladder.contract.test.mjs holds the two files equal.

/** The ladder: each name is the width it starts at, in rem as the sheets write it. */
const BREAKPOINTS = Object.freeze({
  xs: '0rem',
  sm: '32rem',
  // g6, 512px
  md: '44rem',
  // h1, 704px
  lg: '60rem',
  // h5, 960px
  xl: '72rem',
  // h8, 1152px
  xxl: '80rem' // i0, 1280px

}); // The step under a threshold, as the sheets' media-breakpoint-down writes it:
// one pixel less, in rem (_mix__breakpoint.scss breakpoint-max).

const PIXEL_REM = 1 / 16;
/**
 * The media query of a breakpoint: from its width up, or with `below: true`
 * the widths under it -- the two sides the sheets switch on. An unknown name
 * is null, so a typo is not a query that always matches.
 *
 *   breakpointQuery('md')                  (min-width: 44rem)
 *   breakpointQuery('md', {below: true})   (max-width: 43.9375rem)
 */

function breakpointQuery(name, {
  below = false
} = {}) {
  if (!Object.hasOwn(BREAKPOINTS, name)) return null;
  const rem = Number.parseFloat(BREAKPOINTS[name]);
  if (below) return rem > 0 ? `(max-width: ${rem - PIXEL_REM}rem)` : 'not all';
  return `(min-width: ${rem}rem)`;
}
/** The page's MediaQueryList for a breakpoint, to read and to follow; null without matchMedia or for an unknown name. */

function breakpointMedia(name, {
  below = false,
  view = globalThis
} = {}) {
  const query = breakpointQuery(name, {
    below
  });
  return query && typeof view?.matchMedia === 'function' ? view.matchMedia(query) : null;
}
/** Whether the page is at least as wide as the breakpoint now (or under it, with `below`). */

function matchesBreakpoint(name, options = {}) {
  return breakpointMedia(name, options)?.matches === true;
}
const Breakpoints = Object.freeze({
  ladder: BREAKPOINTS,
  query: breakpointQuery,
  media: breakpointMedia,
  matches: matchesBreakpoint
}); // Core publishes the helper; component bundles that carry their own copy reuse
// an already published one instead of replacing it.

if (typeof globalThis !== 'undefined') {
  globalThis.SF = globalThis.SF || {};
  if (!globalThis.SF.breakpoints) globalThis.SF.breakpoints = Breakpoints;
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Breakpoints);

/***/ },

/***/ "1b42c5117087"
(module, __webpack_exports__, __webpack_require__) {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ICON_CHOICES: () => (/* binding */ ICON_CHOICES),
/* harmony export */   ICON_CHOICE_WORDS: () => (/* binding */ ICON_CHOICE_WORDS),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   iconWords: () => (/* binding */ iconWords)
/* harmony export */ });
/* harmony import */ var _page_language_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("43090d1c8307");
/* harmony import */ var _lang_icon_search_index_mjs__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("4bd9c3b168e0");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_page_language_js__WEBPACK_IMPORTED_MODULE_0__]);
var __webpack_async_dependencies_result__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);
_page_language_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_async_dependencies_result__[0];
/* harmony import */ var _page_language_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_page_language_js__WEBPACK_IMPORTED_MODULE_0__);
// The glyphs a person may mark a part of an interface with -- a section of a
// record, a row of a menu, a tile of a dashboard. A hundred and twenty names
// from the Framework's own icon set, the ones products actually reach for,
// read in rows of what they are usually about: what a thing is, who it
// belongs to, when it happens, what it costs, what it is made of. One list,
// so every set chooses from the same glyphs.
//
// Raised from ui-pro sf-view-properties (js/icon-choices.js), which sf-admin-menu
// imported across what become two component sets (duplication audit
// 2026-11-03, A-1; owner decision 2026-11-03, component sets, point 13). A
// component imports ICON_CHOICES; a page reads SF.icons.choices, and
// SF.icons.choices.words[name] gives a glyph's Russian and English words
// (C151 point 8). The choice
// itself is drawn by sf-dropdown with options of kind icon (layout grid,
// search), as sf-view-properties and sf-admin-menu do.

 // The words a person searches the choice by (owner decision C151 point 8): a
// Russian and an English word or two for each glyph, the name's own words
// among the English ones. sf-dropdown matches its icon options against them
// in either language, so «папка» finds folder and «folder» still does.
// The words live in core's language files (owner decision C282):
// src/core/js/lang/icon-search/<code>.json, a glyph's words joined by commas.
// English is built in; Russian (and any other language) is the words its
// language file registered for sf-icon-search, its icon-search part, fetched
// the first time a search asks for them. ICON_CHOICE_WORDS keeps its shape,
// {name: {ru: [...], en: [...]}}: ru reads the registered words when it is read.

const splitWords = text => String(text ?? '').split(',').map(word => word.trim()).filter(Boolean);

function languageWords(code, name) {
  const own = _lang_icon_search_index_mjs__WEBPACK_IMPORTED_MODULE_1__["default"][code]?.[name];
  if (own !== undefined) return splitWords(own); // localeText asks core for the language's icon-search part when it is not
  // here yet (and says the English words meanwhile); only a word registered
  // for the language itself counts.

  (0,_page_language_js__WEBPACK_IMPORTED_MODULE_0__.localeText)(_lang_icon_search_index_mjs__WEBPACK_IMPORTED_MODULE_1__["default"], name, code, 'sf-icon-search');
  return splitWords(globalThis.__sfPageLanguage?.registered?.get?.('sf-icon-search')?.get?.(code)?.[name]);
}

const ICON_CHOICE_WORDS = /* @__PURE__ */Object.freeze(Object.fromEntries(Object.keys(_lang_icon_search_index_mjs__WEBPACK_IMPORTED_MODULE_1__["default"].en).map(name => [name, Object.freeze(Object.defineProperties({}, {
  ru: {
    enumerable: true,
    get: () => languageWords('ru', name)
  },
  en: {
    enumerable: true,
    value: Object.freeze(splitWords(_lang_icon_search_index_mjs__WEBPACK_IMPORTED_MODULE_1__["default"].en[name]))
  }
}))]))); // The words of any glyph name: the choice's words, or the name read as words
// (folder_open -> folder open) for a glyph outside the choice.

function iconWords(name) {
  const key = String(name || '').trim();
  const words = Object.hasOwn(ICON_CHOICE_WORDS, key) ? ICON_CHOICE_WORDS[key] : null;
  const own = key.split('_').filter(Boolean);
  return {
    ru: words ? [...words.ru] : [],
    en: [...new Set([...(words ? words.en : []), ...own])]
  };
}
const ICON_CHOICES = Object.freeze(Object.defineProperty(["folder", "folder_open", "topic", "home", "dashboard", "apartment", "store", "storefront", "business_center", "work", "badge", "person", "group", "groups", "account_circle", "manage_accounts", "supervisor_account", "contacts", "school", "menu_book", "assignment", "task", "description", "article", "note_alt", "edit_note", "draft", "receipt", "receipt_long", "request_quote", "inventory_2", "category", "label", "sell", "local_offer", "shopping_cart", "shopping_bag", "payments", "savings", "credit_card", "account_balance", "calculate", "percent", "trending_up", "analytics", "insights", "monitoring", "bar_chart", "pie_chart", "table_chart", "schedule", "event", "today", "calendar_month", "date_range", "history", "alarm", "timer", "update", "hourglass_top", "mail", "outgoing_mail", "chat", "forum", "sms", "call", "phone_in_talk", "contact_support", "campaign", "notifications", "language", "public", "place", "map", "location_on", "travel_explore", "flight", "local_shipping", "route", "directions", "settings", "tune", "build", "construction", "handyman", "code", "terminal", "data_object", "api", "bug_report", "database", "storage", "cloud", "backup", "sync", "folder_zip", "upload_file", "download", "attach_file", "link", "lock", "lock_open", "shield", "verified_user", "key", "admin_panel_settings", "policy", "gavel", "fingerprint", "visibility", "palette", "format_paint", "image", "photo_library", "collections", "movie", "play_circle", "mic", "headphones", "brush"], 'words', {
  value: ICON_CHOICE_WORDS,
  enumerable: false
})); // Core publishes the list; a component bundle that carries its own copy reuses
// the published one instead of replacing it.

if (typeof globalThis !== 'undefined') {
  globalThis.SF = globalThis.SF || {};
  globalThis.SF.icons = globalThis.SF.icons || {};
  if (!globalThis.SF.icons.choices) globalThis.SF.icons.choices = ICON_CHOICES;
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (ICON_CHOICES);
__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ },

/***/ "51250bf01ab0"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createPreferences: () => (/* binding */ createPreferences),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// SF.Preferences: what a person changes about how a thing looks -- column
// order, widths, sort, density, a menu's column widths -- kept one way for
// every component (owner, 2026-10-14; ui-control
// control/designs/2026-10-14-view-preferences.md).
//
// - A preference is a plain JSON value under a key `<component>/<instance>`,
//   e.g. `sf-table/cms.solutions`. No key, nothing is kept.
// - It is read synchronously, so a component applies it before its first
//   paint: the skeleton is already in the person's order.
// - The browser keeps a copy always (localStorage `sf-pref:<key>`), the cache
//   a first paint can read. A host that keeps preferences for its user
//   (Larena) plugs in with useHost(); its values win over the cache, and every
//   write goes to it as well, debounced per key.
// - A page can preload the host's values: preload({key: value}), or a
//   <script type="application/json" data-sf-preferences> (or id
//   "sf-preferences") in the page, read before the first value is.
//
// The registry lives on globalThis.SF: every bundle carries its own copy of
// this module, and two copies with two caches would disagree.
const PREFIX = 'sf-pref:';
const DELAY = 400;
const KEY = /^[\w.*:-]+(?:\/[\w.*:/-]+)?$/u;

function storage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function validKey(key) {
  return typeof key === 'string' && key.length > 0 && key.length <= 200 && KEY.test(key);
}

function same(a, b) {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

function plain(value) {
  return value === null || value === undefined ? null : JSON.parse(JSON.stringify(value));
}

function createPreferences() {
  const host = {
    adapter: null,
    values: new Map()
  };
  const listeners = new Map();
  const timers = new Map(); // The page's own block of the host's values, read once, before the first
  // read: a component may connect before this module's start-up ran.

  let inlineRead = false;

  const readInline = () => {
    if (inlineRead) return;
    const node = globalThis.document?.querySelector?.('script[type="application/json"][data-sf-preferences], script#sf-preferences[type="application/json"]');
    if (!node) return;
    inlineRead = true;

    try {
      api.preload(JSON.parse(node.textContent || '{}'));
    } catch {
      /* not JSON: ignored */
    }
  };

  const notify = (key, value) => {
    for (const listener of listeners.get(key) ?? []) {
      try {
        listener(plain(value), key);
      } catch (error) {
        console.error('SF.Preferences listener failed', key, error);
      }
    }
  };

  const readCache = key => {
    const store = storage();
    if (!store) return null;

    try {
      const raw = store.getItem(PREFIX + key);
      return raw === null ? null : JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const writeCache = (key, value) => {
    const store = storage();
    if (!store) return;

    try {
      if (value === null) store.removeItem(PREFIX + key);else store.setItem(PREFIX + key, JSON.stringify(value));
    } catch {// A full or refused storage keeps the value for this page only.
    }
  };

  const saveToHost = key => {
    clearTimeout(timers.get(key));
    timers.delete(key);
    const adapter = host.adapter;
    if (!adapter) return;
    const value = host.values.has(key) ? host.values.get(key) : readCache(key);

    try {
      const answer = value === null ? adapter.remove?.(key) : adapter.save?.(key, plain(value));
      Promise.resolve(answer).catch(error => console.warn('SF.Preferences: the host did not keep', key, error));
    } catch (error) {
      console.warn('SF.Preferences: the host did not keep', key, error);
    }
  };

  const schedule = key => {
    if (!host.adapter) return;
    clearTimeout(timers.get(key));
    timers.set(key, setTimeout(() => saveToHost(key), DELAY));
  };

  const api = {
    // The value for a key: the host's when it gave one, else this browser's.
    read(key) {
      if (!validKey(key)) return null;
      readInline();
      if (host.values.has(key)) return plain(host.values.get(key));
      return plain(readCache(key));
    },

    // Several keys from the most general to the most particular, merged field
    // by field: `sf-table/*` (the person's tables) under `sf-table/<instance>`.
    readMerged(...keys) {
      const merged = {};
      let found = false;

      for (const key of keys.flat()) {
        const value = api.read(key);

        if (value && typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(merged, value);
          found = true;
        }
      }

      return found ? merged : null;
    },

    write(key, value) {
      if (!validKey(key)) return false;
      const next = plain(value); // The value already kept is not written again: a component restoring
      // what the host gave it (sf-resizer's value) sent it back to the host on
      // every load (docs trial 5).

      if (JSON.stringify(api.read(key)) === JSON.stringify(next)) return true;
      if (host.values.has(key)) host.values.set(key, next);
      writeCache(key, next);
      schedule(key);
      return true;
    },

    // «Сбросить вид»: gone from both.
    remove(key) {
      if (!validKey(key)) return false;
      if (host.values.has(key)) host.values.set(key, null);
      writeCache(key, null);
      schedule(key);
      notify(key, null);
      return true;
    },

    subscribe(key, listener) {
      if (!validKey(key) || typeof listener !== 'function') return () => {};
      if (!listeners.has(key)) listeners.set(key, new Set());
      listeners.get(key).add(listener);
      return () => listeners.get(key)?.delete(listener);
    },

    // The host's values for this person. Each that differs from this
    // browser's copy replaces it and is announced, so a component re-applies.
    preload(values) {
      if (!values || typeof values !== 'object') return;

      for (const [key, value] of Object.entries(values)) {
        if (!validKey(key)) continue;
        const next = plain(value);
        const before = api.read(key);
        host.values.set(key, next);
        writeCache(key, next);
        if (!same(before, next)) notify(key, next);
      }
    },

    // {save(key, value), remove(key), load?(keys) → Promise<{key: value}>}.
    useHost(adapter) {
      if (!adapter || typeof adapter.save !== 'function') throw new TypeError('A preferences host saves: {save(key, value)}');
      host.adapter = adapter;
      return api;
    },

    // Asks the host for keys it has not given yet (a component that appears
    // after the page loaded).
    async load(keys) {
      const wanted = [].concat(keys).filter(key => validKey(key) && !host.values.has(key));
      if (!wanted.length || typeof host.adapter?.load !== 'function') return;

      try {
        api.preload(await host.adapter.load(wanted));
      } catch (error) {
        console.warn('SF.Preferences: the host did not answer', wanted, error);
      }
    },

    get hosted() {
      return Boolean(host.adapter);
    },

    // Writes still waiting go now (a page that is leaving).
    flush() {
      for (const key of [...timers.keys()]) saveToHost(key);
    }

  }; // Another tab changed a preference.

  globalThis.addEventListener?.('storage', event => {
    if (!event.key?.startsWith(PREFIX) || event.storageArea !== storage()) return;
    const key = event.key.slice(PREFIX.length);
    if (host.values.has(key)) return;
    let value = null;

    try {
      value = event.newValue === null ? null : JSON.parse(event.newValue);
    } catch {
      value = null;
    }

    notify(key, value);
  });
  globalThis.addEventListener?.('pagehide', () => api.flush());
  readInline();
  return Object.freeze(api);
}

if (typeof globalThis !== 'undefined') {
  globalThis.SF = globalThis.SF || {};
  if (!globalThis.SF.Preferences) globalThis.SF.Preferences = createPreferences();
}

const Preferences = globalThis.SF?.Preferences;
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Preferences);


/***/ },

/***/ "591a55b96a73"
(module, __webpack_exports__, __webpack_require__) {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _core_js_smart_base__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("deb1a4d61565");
/* harmony import */ var _core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("5b7d7695b41b");
/* harmony import */ var _component_json__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("827a6156cb91");
/* harmony import */ var _aliases_json__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("b80c3b255e84");
/* harmony import */ var _lang_en_json__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__("d21db0cbf190");
/* harmony import */ var _lang_ru_json__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__("38e4a43d47ec");
/* harmony import */ var _lang_zh_json__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__("25668cc92df9");
/* harmony import */ var _lang_es_json__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__("ae69c08f881b");
/* harmony import */ var _lang_pt_json__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__("ca58a096d112");
/* harmony import */ var _lang_de_json__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__("724f233c6209");
/* harmony import */ var _lang_fr_json__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__("e219c434ba68");
/* harmony import */ var _lang_it_json__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__("2c835db75150");
/* harmony import */ var _lang_ja_json__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__("16fc583fb0ee");
/* harmony import */ var _lang_ko_json__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__("4fe6b2964066");
/* harmony import */ var _lang_ar_json__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__("84d79a7cc4a2");
/* harmony import */ var _core_js_page_language__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__("43090d1c8307");
/* harmony import */ var _js_navigation_controller__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__("ad305dc3f27b");
/* harmony import */ var _js_navigation_template__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__("535f6c0ba957");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_core_js_smart_base__WEBPACK_IMPORTED_MODULE_0__, _core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__, _core_js_page_language__WEBPACK_IMPORTED_MODULE_15__, _js_navigation_controller__WEBPACK_IMPORTED_MODULE_16__, _js_navigation_template__WEBPACK_IMPORTED_MODULE_17__]);
([_core_js_smart_base__WEBPACK_IMPORTED_MODULE_0__, _core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__, _core_js_page_language__WEBPACK_IMPORTED_MODULE_15__, _js_navigation_controller__WEBPACK_IMPORTED_MODULE_16__, _js_navigation_template__WEBPACK_IMPORTED_MODULE_17__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);
/* harmony import */ var _core_js_smart_base__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_core_js_smart_base__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _core_js_page_language__WEBPACK_IMPORTED_MODULE_15___default = /*#__PURE__*/__webpack_require__.n(_core_js_page_language__WEBPACK_IMPORTED_MODULE_15__);

















 // sf-admin-menu draws one menu: the navigation shell over the host's
// navigation port (simai.admin-navigation-port). Since 1.15.0 there is no
// other: the menu of child item elements with its own settings
// editor and search panel (the "items" path) was removed before the set's
// first release (AM-7, owner decision C384). Until a port answers, or the page
// prints its first answer (first-answer), the menu is its skeleton.
//
// From its component.json (standard simai.smart-component 1.3.8 §3, §4, §8,
// §11): the settings are declared there and their words are lang/<locale>.json.
// The events take the vocabulary's verbs: what a person asks of the host is
// sf-admin-menu-<verb> (open, toggle, save, query, create, rename, delete,
// reset, read, refresh, sign-out) instead of one sf-admin-menu-intent, which
// follows each of them until 2026-12-01 (aliases.json, split by the detail's
// intent).

const AdminMenuElement = (0,_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__.elementFromManifest)(_component_json__WEBPACK_IMPORTED_MODULE_2__, {
  base: (_core_js_smart_base__WEBPACK_IMPORTED_MODULE_0___default()),
  lang: {
    en: _lang_en_json__WEBPACK_IMPORTED_MODULE_4__,
    ru: _lang_ru_json__WEBPACK_IMPORTED_MODULE_5__,
    zh: _lang_zh_json__WEBPACK_IMPORTED_MODULE_6__,
    es: _lang_es_json__WEBPACK_IMPORTED_MODULE_7__,
    pt: _lang_pt_json__WEBPACK_IMPORTED_MODULE_8__,
    de: _lang_de_json__WEBPACK_IMPORTED_MODULE_9__,
    fr: _lang_fr_json__WEBPACK_IMPORTED_MODULE_10__,
    it: _lang_it_json__WEBPACK_IMPORTED_MODULE_11__,
    ja: _lang_ja_json__WEBPACK_IMPORTED_MODULE_12__,
    ko: _lang_ko_json__WEBPACK_IMPORTED_MODULE_13__,
    ar: _lang_ar_json__WEBPACK_IMPORTED_MODULE_14__
  },
  source: "ru",
  aliases: _aliases_json__WEBPACK_IMPORTED_MODULE_3__
});

class SfAdminMenu extends AdminMenuElement {
  static get props() {
    return { ...super.props,
      ariaLabel: {
        attribute: "aria-label",
        default: "Admin menu"
      },
      rootClass: {
        default: ""
      }
    };
  }

  connectedCallback() {
    // A printed JSON island first (standard 1.3.8 §5.4): first-answer may
    // be in it.
    this.sfReadIsland();

    this._reflectOpen(); // Ask the page for the port before anything else: a host usually
    // answers inside the request, and the menu loads from it at once.


    this._requestHostPort(); // Reconnected after a move: the port is kept, the controller that
    // listened on the document is not.


    if (this.hostPort && !this._navigation) this._navigation = new _js_navigation_controller__WEBPACK_IMPORTED_MODULE_16__.NavigationController(this, this.hostPort); // The host's first answer printed with the page (first-answer): the
    // menu is drawn from it at once, with no skeleton, before any port;
    // the port, when it comes, answers behind it.

    if (!this._navigation && this._firstAnswer) this._navigation = new _js_navigation_controller__WEBPACK_IMPORTED_MODULE_16__.NavigationController(this, null);
    if (this._navigation) this._takeFirstAnswer();
    super.connectedCallback();
    if (this._navigation?.port) this._navigation.load("connected");
  }

  disconnectedCallback() {
    // Once per connection, so an element moved in the DOM asks again.
    this._portRequested = false; // The port stays with the element: moved in the DOM, it reconnects to
    // the same host rather than asking a second time.

    this._navigation?.dispose();
    this._navigation = null;
    super.disconnectedCallback();
  } // sf-admin-menu-intent, the 1.0 name of every request to the host, is
  // made from the request it follows: {intent, payload}.


  sfAliasAdapters() {
    return {
      "sf-admin-menu-intent": detail => detail && detail.intent ? {
        intent: detail.intent,
        payload: detail.payload
      } : undefined
    };
  } // The host's first answer printed with the page (setting first-answer, in
  // the element's data-sf-settings island): navigation.load's applied data,
  // optionally with `capabilities` (the port's, known before the port) and
  // `context` (the object menu of this page). Drawn at once, as if the host
  // had answered; the port's answer to navigation.load replaces it. Taken
  // once: a later answer is the port's.


  get firstAnswer() {
    return this._firstAnswer ?? null;
  }

  set firstAnswer(data) {
    this._firstAnswer = data && typeof data === "object" && !Array.isArray(data) && Array.isArray(data.items) ? JSON.parse(JSON.stringify(data)) : null; // Set after the menu connected: drawn now, if nothing has answered.

    if (!this.isConnected || !this._firstAnswer) return;
    if (!this._navigation) this._navigation = new _js_navigation_controller__WEBPACK_IMPORTED_MODULE_16__.NavigationController(this, this.hostPort ?? null);
    if (this._takeFirstAnswer()) this.requestComponentUpdate("navigation-first-answer");
  }

  _takeFirstAnswer() {
    const data = this._firstAnswer;
    if (!data || !this._navigation) return false;
    this._firstAnswer = null;
    return this._navigation.acceptFirstAnswer(data);
  } // Without a controller the menu waits for its port: its skeleton.


  get awaitsNavigationPort() {
    return !this._navigation;
  } // The navigation skeleton before a port; its columns follow the viewport
  // in the stylesheet, as the answered menu's do (controller.js WIDE_MEDIA_QUERY).


  navigationSkeletonContext() {
    return {
      text: key => (0,_core_js_page_language__WEBPACK_IMPORTED_MODULE_15__.pageText)(_js_navigation_controller__WEBPACK_IMPORTED_MODULE_16__.NAVIGATION_TEXT, key, this, "sf-admin-menu"),
      columns: (0,_js_navigation_controller__WEBPACK_IMPORTED_MODULE_16__.skeletonColumns)(this)
    };
  }

  template() {
    if (this._navigation) return (0,_js_navigation_template__WEBPACK_IMPORTED_MODULE_17__.renderNavigationTemplate)(this._navigation.context());
    return (0,_js_navigation_template__WEBPACK_IMPORTED_MODULE_17__.renderNavigationSkeleton)(this.navigationSkeletonContext());
  } // The shared convention for a component that takes a host port: ask for one
  // rather than wait to be given it. A page that answers nothing keeps the
  // skeleton until it connects a port (connectPort).


  _requestHostPort() {
    if (this.hostPort || this._portRequested) return false;
    this._portRequested = true; // A host usually answers inside the dispatch. While it does, the
    // connection that asked is still setting up and loads the menu itself.

    this._answeringRequest = true;

    try {
      this.dispatchEvent(new CustomEvent("sf-host-port-request", {
        bubbles: true,
        composed: true,
        detail: {
          component: this,
          context: {
            owner: "admin-menu",
            record: null,
            group: null
          }
        }
      }));
    } finally {
      this._answeringRequest = false;
    }

    return true;
  } // Read the menu again from the host: something outside the menu changed what
  // it shows -- a star pressed in the page header, a storage created on the
  // page. The port has no way for a host to push, so the page asks the menu
  // to ask.


  refresh() {
    return this._navigation?.load("requested") ?? Promise.resolve();
  } // ---------- the screen's interface (stand 24 A1) ----------
  // The row the page says it is on. Empty: the row whose address the page
  // is at, as before (the navigation controller follows the address).


  get pageCurrent() {
    return String(this.getAttribute("current") ?? "").trim();
  } // Whether the current row is among the person's favourites, as the host
  // last answered (values.favourite). A component update tells a binding
  // to read it again (sf-props-change).


  get favourite() {
    const navigation = this._navigation;
    const key = this.pageCurrent || navigation?.navigation?.current || "";
    return Boolean(key && navigation?.isFavourite?.(key));
  } // The action toggle {id, on}: the row goes into the person's favourites
  // or out of them through the port (favourite.toggle). The event toggle
  // still tells the page it was asked, as for the menu's own star.


  async toggle(id, on) {
    const params = id && typeof id === "object" ? id : {
      id,
      on
    };
    const key = String(params.id ?? "").trim();
    if (!key) return {
      outcome: "refused",
      reason: "no-id"
    };
    if (!this._navigation) return {
      outcome: "refused",
      reason: "no-port"
    };
    const answer = await this._navigation.setFavourite(key, Boolean(params.on));
    if (answer?.answer === "applied") return {
      outcome: "applied"
    };
    if (answer?.answer === "refused") return {
      outcome: "refused",
      reason: answer.reason ?? "refused"
    };
    return {
      outcome: "unavailable",
      reason: answer?.reason ?? "unavailable"
    };
  } // open, written by a page that opens the menu from a button of its own:
  // data-open says it, and the stylesheet folds the menu away while it is
  // false on a narrow screen. A page that never writes it sees no change.


  _reflectOpen() {
    if (!this._sfOpenGiven && !this.hasAttribute("open")) {
      if (this.hasAttribute("data-open")) this.removeAttribute("data-open");
      return;
    }

    const open = this.hasAttribute("open") && this.getAttribute("open") !== "false";
    if (this.getAttribute("data-open") !== String(open)) this.setAttribute("data-open", String(open));
  }

  get open() {
    return this.hasAttribute("open") && this.getAttribute("open") !== "false";
  }

  set open(value) {
    this._sfOpenGiven = true;
    if (value === true) this.setAttribute("open", "");else this.setAttribute("open", "false");

    this._reflectOpen();
  }

  attributeChangedCallback(name, previous, next) {
    super.attributeChangedCallback?.(name, previous, next);
    if (previous === next) return;

    if (name === "open") {
      this._sfOpenGiven = true;

      this._reflectOpen();
    }

    if (name === "current") this._navigation?.followPageCurrent?.();
  } // The port arrives by the base action connect-port {port} (§4.1, §4.9;
  // the Framework's connectPort, with setHostPort its alias), which keeps it
  // as sfPort and runs this hook. A host adapter exposes {port, version,
  // capabilities, raise(intent, payload)}; only the navigation port is taken.
  // Throwing refuses it
  // (port-unsupported) and the base does not keep it.


  onPortConnected(host) {
    if (!host || typeof host.raise !== "function" || host.port !== _js_navigation_controller__WEBPACK_IMPORTED_MODULE_16__.NAVIGATION_PORT || !_js_navigation_controller__WEBPACK_IMPORTED_MODULE_16__.SUPPORTED_NAVIGATION_VERSIONS.includes(host.version)) {
      throw new TypeError(`sf-admin-menu requires a ${_js_navigation_controller__WEBPACK_IMPORTED_MODULE_16__.NAVIGATION_PORT} host port: ${_js_navigation_controller__WEBPACK_IMPORTED_MODULE_16__.SUPPORTED_NAVIGATION_VERSIONS.join(", ")}`);
    }

    const wasConnected = this.isConnected;
    this.hostPort = host; // Drawn from the page's first answer and waiting for its port: the
    // same menu takes it and asks the host, keeping where the person is.

    if (this._navigation && !this._navigation.port) {
      this._navigation.port = host;
      if (wasConnected && !this._answeringRequest) this._navigation.load("host-connected");
      this.requestComponentUpdate("navigation-port");
      return;
    }

    this._navigation?.dispose();
    this._navigation = new _js_navigation_controller__WEBPACK_IMPORTED_MODULE_16__.NavigationController(this, host); // A port given after connecting replaces the skeleton drawn meanwhile.

    if (wasConnected && !this._answeringRequest) this._navigation.load("host-connected");
    this.requestComponentUpdate("navigation-port");
  } // The navigation shell's interface (C321, AM-36, AM-49): the page's own
  // «Показать колонку» calls showColumn; hideColumn and toggleColumn are
  // the column's button and Ctrl/Cmd+B. Each answers whether the column
  // is open after it.


  showColumn() {
    if (!this._navigation) return {
      outcome: "refused",
      reason: "no-port"
    };

    this._navigation.showColumn();

    return {
      outcome: "applied",
      open: this._navigation.columnState() === "open"
    };
  }

  hideColumn() {
    if (!this._navigation) return {
      outcome: "refused",
      reason: "no-port"
    };

    this._navigation.hideColumn();

    return {
      outcome: "applied",
      open: this._navigation.columnState() === "open"
    };
  }

  toggleColumn() {
    if (!this._navigation) return {
      outcome: "refused",
      reason: "no-port"
    };

    this._navigation.toggleColumn();

    return {
      outcome: "applied",
      open: this._navigation.columnState() === "open"
    };
  }

  afterRender() {
    this._navigation?.rendered();
  }

}

SfAdminMenu.define("sf-admin-menu");
__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ },

/***/ "4dd4db04f0f7"
(module, __webpack_exports__, __webpack_require__) {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   languageEntry: () => (/* binding */ languageEntry),
/* harmony export */   openAccountMenu: () => (/* binding */ openAccountMenu),
/* harmony export */   renderPersonButton: () => (/* binding */ renderPersonButton),
/* harmony export */   themeEntry: () => (/* binding */ themeEntry)
/* harmony export */ });
/* harmony import */ var lit__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("2a080a730149");
/* harmony import */ var _avatar_js_picture__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("c69a3dc158df");
/* harmony import */ var _settings_js_settings__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("bb67a9697f33");
/* harmony import */ var _language_js_languages__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("464bf30e7c23");
/* harmony import */ var _language_data_names_json__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__("9937e6b314d1");
/* harmony import */ var _menu__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__("fa118548e966");
/* harmony import */ var _tips_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__("986f10cdd6ef");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([lit__WEBPACK_IMPORTED_MODULE_0__, _avatar_js_picture__WEBPACK_IMPORTED_MODULE_1__, _language_js_languages__WEBPACK_IMPORTED_MODULE_3__, _tips_js__WEBPACK_IMPORTED_MODULE_6__]);
([lit__WEBPACK_IMPORTED_MODULE_0__, _avatar_js_picture__WEBPACK_IMPORTED_MODULE_1__, _language_js_languages__WEBPACK_IMPORTED_MODULE_3__, _tips_js__WEBPACK_IMPORTED_MODULE_6__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);
/* harmony import */ var lit__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lit__WEBPACK_IMPORTED_MODULE_0__);






 // The profile menu at the bottom of the first column: who is signed in, the
// host's links, the theme and the language, the menu profile, and signing out
// apart (assignment, section 5).

const icon = (name, rootClass = "sf-admin-nav-row-icon") => name ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<sf-icon root-class=${rootClass} aria-hidden="true" icon=${name}></sf-icon>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing; // The person's picture is SIMAI Framework's avatar drawing (K-06, C152; the
// avatar study AV-8): the photo filling the circle, else the initials of the
// name on the neutral plate, from the avatars sheet. It is the picture beside
// the button's own text, not an sf-avatar element: sf-avatar is a button, and
// a button inside the person button would be a second Tab stop with no action
// (AR-1). Size 1/2 is the 32 px mark the column's site mark has.


const avatar = person => (0,_avatar_js_picture__WEBPACK_IMPORTED_MODULE_1__.avatarPicture)({
  imageUrl: person.avatar,
  name: person.name ?? "",
  size: "1/2"
}); // The theme is a setting of the person menu (owner decision C176 (1), (2);
// K-11): SIMAI Framework's settings row, made by sf-settings' own entriesFor
// from one choice item -- «Тема» with its value under the name, the options a
// level deeper in the same panel (the drill look), «Как в системе» first as
// sf-settings writes it. The menu keeps the words and the person's value only.


const THEME_OPTIONS = [{
  id: "system",
  icon: "computer",
  label: "themeSystem"
}, {
  id: "light",
  icon: "light_mode",
  label: "themeLight"
}, {
  id: "dark",
  icon: "dark_mode",
  label: "themeDark"
}];
function themeEntry(text, value) {
  const known = THEME_OPTIONS.some(option => option.id === value) ? value : "system";
  return (0,_settings_js_settings__WEBPACK_IMPORTED_MODULE_2__.entriesFor)([{
    id: "theme",
    type: "choice",
    text: text("theme"),
    icon: "contrast",
    value: known,
    options: THEME_OPTIONS.map(option => ({
      id: option.id,
      text: text(option.label),
      icon: option.icon
    }))
  }], "drill")[0];
} // The language row is the one SIMAI Framework's app menus take
// (SfLanguage.menuEntry, C142 (7); owner decision C176, SM-4): each language
// named in itself, its name in the page's language beside it when that
// differs, a radio row with the language's own lang, the current name the
// row's value, the rows at the panel width, and a search from eight
// languages on. It is built from sf-language's own module (language/js), so
// the rows are the Framework's, not a copy; the element itself is not
// loaded. The menu keeps its words and the note under the rows.

(0,_language_js_languages__WEBPACK_IMPORTED_MODULE_3__.useNames)(_language_data_names_json__WEBPACK_IMPORTED_MODULE_4__);
function languageEntry(text, person) {
  const items = (person?.languages ?? []).map(entry => ({
    code: entry.code,
    label: entry.native
  }));
  const list = (0,_language_js_languages__WEBPACK_IMPORTED_MODULE_3__.normalizeLanguages)([], items);
  const page = person?.language || globalThis.document?.documentElement?.getAttribute("lang") || "en";
  const current = (0,_language_js_languages__WEBPACK_IMPORTED_MODULE_3__.matchLanguage)(list, person?.language) ?? null;
  const entry = {
    id: "language",
    text: text("language"),
    icon: "translate",
    value: current?.label ?? person?.language,
    submenu: [...(0,_language_js_languages__WEBPACK_IMPORTED_MODULE_3__.languageRows)(list, current, {
      page,
      prefix: "language:"
    }), {
      type: "note",
      text: text("languageNote")
    }],
    width: "panel"
  };
  if (list.length >= 8) entry.search = {
    placeholder: text("findLanguage"),
    empty: text("nothingFound")
  };
  return entry;
} // The profile menu is the Framework's standard menu (owner, 2026-10-12): who
// is signed in, the host's links, the theme as a choice row, the language and
// the menu profile as submenus -- the language as SIMAI Framework writes it -- and signing
// out apart. It opens above the person, start-aligned.

function openAccountMenu(context, anchor) {
  const {
    controller,
    navigation,
    text
  } = context;
  const person = navigation?.person;
  if (!person) return null;
  const site = navigation.site?.current;
  const profiles = navigation.profiles;
  const currentProfile = profiles?.list?.find(entry => entry.key === profiles.current);
  const entries = [{
    type: "header",
    text: person.name,
    avatar: person.avatar,
    caption: [person.email, person.role ? `${person.role}${site ? ` · ${site.label}` : ""}` : null].filter(Boolean)
  }];
  const links = person.links ?? [];

  if (links.length) {
    entries.push({
      type: "separator"
    }, ...links.map((link, at) => ({
      id: `link:${at}`,
      text: link.label,
      icon: link.icon,
      href: link.href
    })));
  }

  if (controller.offers("preferences")) {
    entries.push({
      type: "separator"
    }, // A row with its choice a level deeper, as the language and the
    // menu profile are (owner, 2026-10-14): three glyphs side by side
    // said less than the words.
    themeEntry(text, person.theme), languageEntry(text, person));
  } // Configuring the menu sits with the menu profile, in the person's menu: a
  // bare pen under the person said nothing of what it edits (owner,
  // 2026-10-13).
  // On the rail too (AM-22): the setting unfolds the rail for its time.
  // While it is on, the same entry ends it (AM-61).


  const editing = Boolean(controller.edit?.on);
  const canEdit = controller.canEdit?.() || editing;
  const hasProfiles = controller.offers("menu-profiles") && profiles?.list?.length;
  if (canEdit || hasProfiles) entries.push({
    type: "separator"
  });

  if (canEdit) {
    // «Настроить меню» is a press away: its parts come now (1.17.0).
    if (!editing) controller.prefetchEdit?.();
    entries.push(editing ? {
      id: "finish-configure",
      text: text("finishConfigure"),
      icon: "check"
    } : {
      id: "configure-menu",
      text: text("configureMenu"),
      icon: "edit"
    });
  }

  if (hasProfiles) {
    entries.push({
      id: "profile",
      text: text("menuProfile"),
      icon: "view_sidebar",
      value: currentProfile?.label ?? "",
      submenu: profiles.list.map(entry => ({
        id: `profile:${entry.key}`,
        text: entry.label,
        icon: entry.kind === "personal" ? "person" : "group",
        kind: "radio",
        checked: entry.key === profiles.current
      }))
    });
  } // Signing out is last, after a separator, in the plain colour (owner
  // decisions C163 (6), C176; PP-10, SM-5): it ends a session, it destroys
  // nothing, so it is not a danger row.


  if (controller.offers("sign-out")) {
    entries.push({
      type: "separator"
    }, {
      id: "sign-out",
      text: text("signOut"),
      icon: "logout"
    });
  }

  return (0,_menu__WEBPACK_IMPORTED_MODULE_5__.openMenu)(controller, anchor, {
    label: text("account"),
    entries,
    submenu: "drill",
    side: "block-start",
    align: "start",
    // As wide as the person button (owner, 2026-10-14), and never cutting a
    // line: the profile picker's panel rule, max(trigger, the panel step)
    // (decision C32 "panel"; DEV 2026-11-10, G1 320/288/320). In the narrow
    // rail the button is a picture, and the menu is as wide as its lines.
    width: controller.compact ? "content" : "panel",
    select: id => {
      const [kind, value] = String(id ?? "").split(/:(.*)/su);
      if (kind === "language") return controller.chooseLanguage(value);
      if (kind === "profile" && value) return controller.chooseProfile(value);
      if (kind === "sign-out") return controller.signOut();
      if (kind === "configure-menu") return controller.startEdit("person");
      if (kind === "finish-configure") return controller.exitEdit();
      return null;
    },
    // The theme row's choice: the menu marks it and stays open, the page
    // takes the theme at once and the host keeps it (preference.theme).
    change: (id, value) => id === "theme" ? controller.chooseTheme(value) : null
  });
} // The person at the bottom: a button that opens the menu above it.

function renderPersonButton(context) {
  const {
    navigation,
    compact,
    text
  } = context;
  const person = navigation?.person;
  if (!person) return lit__WEBPACK_IMPORTED_MODULE_0__.nothing;
  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<button type="button" class="sf-admin-nav-person"
        aria-haspopup="menu" aria-expanded="false"
        aria-label=${compact ? `${person.name}. ${text("account")}` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
        data-tooltip=${(0,_tips_js__WEBPACK_IMPORTED_MODULE_6__.tip)(context, "person", person.name)}
        @click=${event => openAccountMenu(context, event.currentTarget)}>
        ${avatar(person)}
        ${compact ? lit__WEBPACK_IMPORTED_MODULE_0__.nothing : (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<span class="sf-admin-nav-person-text">
            <span class="sf-admin-nav-person-name">${person.name}</span>
            ${person.email ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<span class="sf-admin-nav-person-email">${person.email}</span>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
        </span>
        ${icon("unfold_more", "sf-admin-nav-site-chevron")}`}
    </button>`;
}
__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ },

/***/ "86bf08ce68be"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isMenuKey: () => (/* binding */ isMenuKey),
/* harmony export */   pointAnchor: () => (/* binding */ pointAnchor)
/* harmony export */ });
// A row's context menu (decision C164 (1)(2), defect TL-2): a right click on
// the row, the context-menu key and Shift+F10 open the same menu, with the
// same list, as the row's ⋯. The menu is SIMAI Framework's sf-menu-context; a
// right click opens it at the pointer through its point anchor
// (sf-menu-context 1.18.0: a fixed box of no size, removed when the menu
// closes). The core's one SF.menu.open (C184) is not in the pair this is built
// over; when it is, the rows open through it and these two helpers go.

/** Whether a keydown asks for a context menu: the menu key or Shift+F10. */
const isMenuKey = event => event?.key === "ContextMenu" || event?.shiftKey === true && event?.key === "F10";
/** A point anchor at the pointer of a right click, for sf-menu-context.openFor(). */

function pointAnchor(event) {
  const point = document.createElement("span");
  point.style.cssText = `position: fixed; left: ${event.clientX}px; top: ${event.clientY}px`;
  document.body.append(point);
  return point;
}

/***/ },

/***/ "ad305dc3f27b"
(module, __webpack_exports__, __webpack_require__) {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   COLUMN_SHORTCUT: () => (/* binding */ COLUMN_SHORTCUT),
/* harmony export */   LIST_ID: () => (/* binding */ LIST_ID),
/* harmony export */   NAVIGATION_PORT: () => (/* binding */ NAVIGATION_PORT),
/* harmony export */   NAVIGATION_TEXT: () => (/* binding */ NAVIGATION_TEXT),
/* harmony export */   NavigationController: () => (/* binding */ NavigationController),
/* harmony export */   OBJECT_MENU: () => (/* binding */ OBJECT_MENU),
/* harmony export */   PALETTE_SHORTCUT: () => (/* binding */ PALETTE_SHORTCUT),
/* harmony export */   SUPPORTED_NAVIGATION_VERSIONS: () => (/* binding */ SUPPORTED_NAVIGATION_VERSIONS),
/* harmony export */   WIDE_STEP: () => (/* binding */ WIDE_STEP),
/* harmony export */   objectMenuOf: () => (/* binding */ objectMenuOf),
/* harmony export */   paletteShortcut: () => (/* binding */ paletteShortcut),
/* harmony export */   setNoticesPanel: () => (/* binding */ setNoticesPanel),
/* harmony export */   skeletonColumns: () => (/* binding */ skeletonColumns)
/* harmony export */ });
/* harmony import */ var _menu__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("fa118548e966");
/* harmony import */ var _notices_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("ef6a2b4af2c6");
/* harmony import */ var _helpers_text__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("cbce4a5232a6");
/* harmony import */ var _core_js_page_language__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("43090d1c8307");
/* harmony import */ var _core_js_preferences_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__("51250bf01ab0");
/* harmony import */ var _words_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__("188c7bc61b17");
/* harmony import */ var _component_kbd_js_shortcut__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__("151a293c8c90");
/* harmony import */ var _core_js_breakpoints_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__("1373e294ec38");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_core_js_page_language__WEBPACK_IMPORTED_MODULE_3__]);
var __webpack_async_dependencies_result__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);
_core_js_page_language__WEBPACK_IMPORTED_MODULE_3__ = __webpack_async_dependencies_result__[0];
/* harmony import */ var _core_js_page_language__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_core_js_page_language__WEBPACK_IMPORTED_MODULE_3__);
// The admin menu that replaced the admin's top bar, driven by
// simai.admin-navigation-port (larena-specs frontend-interface-program,
// sf-admin-menu assignment, mockup v5).
//
// sf-admin-menu draws this when a host answers it with a navigation port, and
// its older `items` menu otherwise. Both live in one element on purpose: a
// fifth element would have had to be added across the build, the package
// reference and the locks, and retired the same way, while the `items` menu
// has to keep working for Larena until it connects the port. The `items` path
// goes when Larena has switched (owner, 2026-10-11).
//
// The host owns everything a person sees here -- sites, rows, profiles,
// favourites, the person, the menu of the object a page shows -- and this
// controller owns only where the person is: which root they are looking at,
// which section is unfolded, what they typed into «Найти в разделе», whether
// the second column is open and whether the menu is on its rail. Every change
// leaves through the port, and nothing the host said is kept past the next
// answer.
//
// Never more than two menus on screen, and the second is about where the
// person is (owner, 2026-11-05, after the Larena Panel audit): the second
// column shows the menu of the object the page shows (the answer's
// `context`), else the root that holds the page's row, else nothing -- never
// a root the person left open on another page. A root clicked in the first
// column is shown until a page is opened; then the column follows the page
// again. Whether the column is open at all is the person's one choice, kept
// across pages (owner, 2026-10-13: the menu must not jump open or closed).








const NAVIGATION_PORT = "simai.admin-navigation-port"; // Every port version this shell accepts, in one place, the way sf-view and
// sf-view-properties keep theirs.

const SUPPORTED_NAVIGATION_VERSIONS = ["1.0.0", "1.1.0", "1.2.0"]; // The width at which the rail and its column become one full screen menu
// (C322): the SIMAI Framework ladder's md step, 44rem (core/js/breakpoints.js,
// AM-6). The menu switched at 48rem, a width of no step of the ladder; the
// sheet (navigation.css) switches at the same step.

const WIDE_STEP = "md";
let TIP_INSTANCES = 0; // «Найти в разделе» is offered only above 12 pages (owner decision C364,
// AM-45): twelve rows fit without scrolling on every screen measured (a
// 375x667 phone holds 12), and below that ⌘K covers search.

const FIND_IN_SECTION_ABOVE = 12; // The palette's keys in SIMAI Framework's shortcut notation (component kbd):
// mod is Cmd on an Apple platform and Ctrl elsewhere. The Framework says which
// platform this is, draws the keys (⌘K, Ctrl+K) and hears them (KB-2, C04):
// the menu keeps no platform test and no key look of its own.

const PALETTE_SHORTCUT = "mod+k"; // The port may name another key for the palette (navigation `search_shortcut`,
// AM-3), in the same notation; an empty or unreadable one keeps mod+k.

function paletteShortcut(navigation) {
  const named = typeof navigation?.search_shortcut === "string" ? navigation.search_shortcut.trim() : "";
  return named && (0,_component_kbd_js_shortcut__WEBPACK_IMPORTED_MODULE_6__.parseShortcut)(named) ? named : PALETTE_SHORTCUT;
} // Hiding and showing the section column (owner decision C321, AM-36): the
// key of Linear, Notion and VS Code, owned by the menu, said on its button.

const COLUMN_SHORTCUT = "mod+b";
const COLUMN_KEYS = (0,_component_kbd_js_shortcut__WEBPACK_IMPORTED_MODULE_6__.parseShortcut)(COLUMN_SHORTCUT); // The id prefix of the lists sf-sortable reorders in the edit mode.

const LIST_ID = "sf-admin-nav-list-";
const NAVIGATION_TEXT = (0,_words_js__WEBPACK_IMPORTED_MODULE_5__.wordsOf)({
  loading: "loading",
  unavailable: "unavailable",
  retry: "retry",
  search: "search",
  favourites: "favourites",
  fold: "fold",
  unfold: "unfold",
  notifications: "notifications",
  collapse: "collapse",
  expand: "expand",
  hideColumn: "hide-column",
  showColumn: "show-column",
  allSections: "all-sections",
  back: "back",
  allSites: "all-sites",
  findInSection: "find-in-section",
  nothingFound: "nothing-found",
  star: "star",
  unstar: "unstar",
  chooseSite: "choose-site",
  findSite: "find-site",
  manageSites: "manage-sites",
  moreSites: "more-sites",
  external: "external",
  paletteHint: "palette-hint",
  account: "account",
  theme: "theme",
  menuWidth: "menu-width",
  columnWidth: "column-width",
  themeLight: "theme-light",
  themeDark: "theme-dark",
  themeSystem: "theme-system",
  language: "language",
  findLanguage: "find-language",
  languageNote: "language-note",
  menuProfile: "menu-profile",
  signOut: "sign-out",
  editMenu: "edit-menu",
  configureMenu: "configure-menu",
  done: "done",
  profileLabel: "profile-label",
  notePersonal: "note-personal",
  noteShared: "note-shared",
  resetToPackages: "reset-to-packages",
  newProfile: "new-profile",
  renameProfile: "rename-profile",
  deleteProfile: "delete-profile",
  sharedProfile: "shared-profile",
  create: "create",
  cancel: "cancel",
  save: "save",
  show: "show",
  hide: "hide",
  more: "more",
  rename: "rename",
  chooseIcon: "choose-icon",
  addSection: "add-section",
  newSection: "new-section",
  packageName: "package-name",
  deleteRow: "delete-row",
  drag: "drag",
  add: "add",
  addDivider: "add-divider",
  addHeading: "add-heading",
  addLink: "add-link",
  linkLabel: "link-label",
  linkHref: "link-href",
  profileName: "profile-name",
  profileNameEmpty: "profile-name-empty",
  linkNameEmpty: "link-name-empty",
  hrefInvalid: "href-invalid",
  hrefInsecure: "href-insecure",
  refused: "refused",
  newHeading: "new-heading",
  conflict: "conflict",
  personalName: "personal-name",
  menu: "menu",
  moveUp: "move-up",
  moveDown: "move-down",
  hideFromMenu: "hide-from-menu",
  lockedHide: "locked-hide",
  moreSections: "more-sections",
  draftLeave: "draft-leave",
  draftDrop: "draft-drop",
  savedForAll: "saved-for-all",
  saveForAll: "save-for-all",
  lockedReason: "locked-reason",
  lockedBy: "locked-by",
  noticesNew: "notices-new",
  noticesNone: "notices-none",
  noticesReadAll: "notices-read-all",
  noticesHistory: "notices-history",
  noticesSettings: "notices-settings",
  noticeOpen: "notice-open",
  favouritesEmpty: "favourites-empty",
  settingTitle: "setting-title",
  levelLabel: "level-label",
  levelPersonal: "level-personal",
  levelEveryone: "level-everyone",
  levelRole: "level-role",
  noteEveryone: "note-everyone",
  noteRole: "note-role",
  noteDirty: "note-dirty",
  reset: "reset",
  finishConfigure: "finish-configure",
  lockForAll: "lock-for-all",
  unlock: "unlock"
});

const copy = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value)); // What a person asks of the host, told on the element by the vocabulary's verb
// (vocabulary 1.1.5 §5.1: sf-admin-menu-intent splits into
// sf-admin-menu-<verb>). Each port intent of simai.admin-navigation-port is a
// verb with a kind; the detail carries the vocabulary's fields, and the port's
// own intent and payload beside them, which is all the 1.0 name carried.


const INTENT_VERBS = {
  "navigation.load": ["refresh", "navigation", p => ({
    reason: p.reason ?? null,
    site: p.site ?? null
  })],
  "item.open": ["open", "item", p => ({
    id: p.key,
    href: p.href ?? null
  })],
  "favourite.toggle": ["toggle", "favourite", p => ({
    id: p.key,
    on: Boolean(p.on)
  })],
  "preference.widths": ["save", "preference", p => ({
    values: {
      widths: p.widths
    }
  })],
  "preference.theme": ["save", "preference", p => ({
    values: {
      theme: p.theme
    }
  })],
  "preference.language": ["save", "preference", p => ({
    values: {
      language: p.language
    }
  })],
  "sites.search": ["query", "site", p => ({
    query: p.query ?? ""
  })],
  "site.switch": ["open", "site", p => ({
    id: p.site
  })],
  "view.profile": ["open", "view", p => ({
    id: p.profile
  })],
  "view.create": ["create", "view", () => ({})],
  "view.save": ["save", "view", p => ({
    id: p.profile ?? null,
    revision: p.revision ?? null
  })],
  "view.reset": ["reset", "view", p => ({
    id: p.profile ?? null
  })],
  "view.rename": ["rename", "view", p => ({
    id: p.profile,
    title: p.label ?? ""
  })],
  "view.delete": ["delete", "view", p => ({
    ids: [p.profile]
  })],
  "search.query": ["query", "search", p => ({
    query: p.query ?? ""
  })],
  "search.choose": ["open", "search", p => ({
    id: p.key,
    group: p.group ?? null
  })],
  "session.sign-out": ["sign-out", "session", () => ({})],
  "notifications.load": ["refresh", "notifications", () => ({})],
  // The port's payload is {keys, all} (simai.admin-navigation-port 1.1.0);
  // the vocabulary's event names them ids.
  "notifications.read": ["read", "notifications", p => ({
    ids: p.all ? [] : [].concat(p.keys ?? [])
  })]
}; // SF.Preferences, the Framework's one store of view preferences (core
// publishes it; this bundle's copy is the fallback).

const preferences = () => globalThis.SF?.Preferences || _core_js_preferences_js__WEBPACK_IMPORTED_MODULE_4__["default"];

const MENU_PREFERENCE = "sf-admin-menu/main";
const FAVOURITES_ROOT = "sf:favourites"; // The key the second column is shown under when it holds the page's object
// menu (navigation.context) rather than a root of the tree.

const OBJECT_MENU = "sf:context"; // The set's notifications panel on the page: an sf-admin-notifications in
// its panel look (not the history page's look="page") inside an sf-drawer,
// or null. Found by markup, so it holds before the list's code has arrived.
// sf-drawer carries its content into a portal at the end of the body
// ([data-sf-drawer-portal] named by the drawer's id) once it is defined, so
// the list is the drawer's either inside the element or inside its portal.

function setNoticesPanel(root = globalThis.document) {
  for (const list of root?.querySelectorAll?.("sf-admin-notifications") ?? []) {
    if (list.getAttribute("look") === "page") continue;
    const drawer = drawerHolding(list, root);
    if (drawer) return {
      list,
      drawer
    };
  }

  return null;
}

function drawerHolding(list, root) {
  const inside = list.closest?.("sf-drawer");
  if (inside) return inside;
  const id = list.closest?.("[data-sf-drawer-portal]")?.getAttribute?.("data-sf-drawer-portal");
  if (!id) return null;
  return [...(root?.querySelectorAll?.("sf-drawer") ?? [])].find(drawer => drawer.id === id || drawer.drawerId === id) ?? null;
} // The page's address as the host is told it (navigation.load `page`): the
// path and the query, without the origin.


function pageAddress(url = globalThis.location?.href) {
  try {
    const address = new URL(url, globalThis.location?.href);
    return `${address.pathname}${address.search}`;
  } catch {
    return null;
  }
} // The menu of the object a page shows (navigation.context), or null: a title
// and groups of rows, each row a link. Anything else the host sent is not a
// menu and is not drawn.


function objectMenuOf(navigation) {
  const context = navigation?.context;
  if (!context || typeof context !== "object" || Array.isArray(context) || !Array.isArray(context.groups)) return null;
  const groups = context.groups.filter(group => group && typeof group === "object" && Array.isArray(group.items)).map(group => ({
    label: typeof group.label === "string" && group.label ? group.label : null,
    items: group.items.filter(item => item && typeof item === "object" && item.key && item.label)
  })).filter(group => group.items.length);
  const back = context.back && typeof context.back === "object" && context.back.href ? {
    label: String(context.back.label ?? ""),
    href: String(context.back.href)
  } : null;
  const status = typeof context.status === "string" && context.status ? {
    text: context.status,
    status: null
  } : context.status && typeof context.status === "object" && context.status.text ? {
    text: String(context.status.text),
    status: context.status.status ? String(context.status.status) : null
  } : null;
  return {
    title: String(context.title ?? ""),
    subtitle: typeof context.subtitle === "string" && context.subtitle ? context.subtitle : null,
    status,
    back,
    groups,
    current: typeof context.current === "string" && context.current ? context.current : null
  };
} // Larena's region contract (larena/admin, 2026-10-15): the shell's revision in
// <meta name="larena-shell-revision">, the content region in
// main#larena-admin-content, asked for with X-Larena-Region: content. Only
// when both are on the page, and once.

function enableRegionNavigation() {
  const navigation = globalThis.SF?.RegionNavigation;
  if (!navigation || navigation.enabled) return;
  const document = globalThis.document;
  if (!document?.querySelector('meta[name="larena-shell-revision"]') || !document.getElementById("larena-admin-content")) return;
  navigation.enable({
    region: "content",
    root: "#larena-admin-content",
    header: "X-Larena-Region",
    revisionMeta: "larena-shell-revision",
    scope: "/admin"
  });
}

class NavigationController {
  constructor(element, port) {
    this.element = element;
    this.port = port;
    this.navigation = null;
    this.status = "loading";
    this.message = ""; // A root the person clicked in the first column, shown in the second
    // until they open a page (and the root being edited in the edit mode).

    this.openRoot = null; // Whether the second column is open: the person's one choice, on
    // every page and every site (SF.Preferences, `second`).

    this.columnOpen = this.keptColumnOpen();
    this.unfolded = new Set();
    this.filter = "";
    this.screen = "first"; // The roots the rail has no room for, under «…» (AM-27): measured
    // after a draw (fitRail), never the current page's root.

    this.overflowRoots = [];
    this.tipPrefix = `sf-admin-nav-tip-${++TIP_INSTANCES}`;
    this.pendingFocus = null;
    this.sequence = 0;
    this.sites = {
      open: false,
      query: "",
      items: [],
      next: null,
      loading: false,
      sequence: 0
    }; // The ⌘K palette is SIMAI Framework's sf-search (palette.js, K-04): the
    // window, its keys, scrim, layer and focus are the element's. The menu
    // answers its provider from the port, numbering its questions so a late
    // answer is not taken, and remembers what each result it handed stands
    // for, to choose it through the port (search.choose).

    this._paletteSequence = 0;
    this._paletteChoices = new Map();

    this.paletteProvider = (query, options) => this.askPalette(query, options); // Not drawn until it is first wanted (paletteElement).


    this.paletteWanted = false;
    this._paletteCode = null; // The edit mode: on or off, what is being renamed or added, the row whose
    // ⋯ is open, the profile list in the banner, and what the last save said.

    this.edit = {
      on: false,
      renaming: null,
      adding: null,
      rowMenu: null,
      profiles: false,
      naming: null,
      message: ""
    }; // The setting mode's level (C326 = C298): «Лично» (the personal
    // profile, saved at once), «Для всех» and «Профиль настроек» (shared
    // profiles: a draft here, saved only by «Сохранить для всех»), and
    // what opened the mode, which gets the focus back when it closes.

    this.level = {
      key: "personal",
      draft: null,
      dirty: false
    };
    this.editOpener = null;

    this._onSortableIntent = event => this.onSortableIntent(event);

    element.addEventListener("sf-sortable-intent", this._onSortableIntent); // What a control opens is fetched when a pointer comes over it or the
    // focus reaches it (1.17.0): a closed menu fetches none of it, and the
    // first press finds the code there (prefetchFor).

    this._prefetched = new Set();

    this._onPrefetch = event => this.prefetchFor(event.target);

    element.addEventListener("pointerover", this._onPrefetch);
    element.addEventListener("focusin", this._onPrefetch); // The rail's «…» follows the window's height (AM-27): measured again
    // after every draw and when the window changes size.

    this._onWindowResize = () => {
      cancelAnimationFrame(this._fitFrame);
      this._fitFrame = requestAnimationFrame(() => this.fitRail());
    };

    globalThis.addEventListener?.("resize", this._onWindowResize);
    this.wideMedia = (0,_core_js_breakpoints_js__WEBPACK_IMPORTED_MODULE_7__.breakpointMedia)(WIDE_STEP);
    this.wide = this.wideMedia ? this.wideMedia.matches : true;

    this._onWideChange = event => {
      this.wide = event.matches; // Screens are a phone idea; a desktop shows both columns at once.

      if (this.wide) this.screen = "first";
      this.update("viewport");
    };

    this.wideMedia?.addEventListener?.("change", this._onWideChange);

    this._onKeyDown = event => {
      // Ctrl or ⌘ alone is most often the first half of ⌘K: the window's
      // code is fetched now, so the key finds it there (1.17.0).
      if ((event.key === "Control" || event.key === "Meta") && this.offers("search")) this.preparePalette(); // ⌘K / Ctrl+K opens the palette from anywhere on the page, in every
      // arrangement of the menu -- the rail and the phone included, which
      // is the reason it is a palette over the page rather than a column.
      // The menu is the key's one owner on the page (AM-1): its own
      // sf-search hears no key of its own (palette.js shortcut="").

      if ((0,_component_kbd_js_shortcut__WEBPACK_IMPORTED_MODULE_6__.matchesShortcut)(event, (0,_component_kbd_js_shortcut__WEBPACK_IMPORTED_MODULE_6__.parseShortcut)(this.paletteShortcut())) && this.offers("search")) {
        // The key is the menu's: the open window's field does not hear
        // it after the window has closed under it.
        event.preventDefault();
        event.stopPropagation();
        this.togglePalette();
        return;
      } // ⌘B / Ctrl+B hides and shows the section column (C321, AM-36);
      // in a text field it is the field's (bold in an editor).


      if ((0,_component_kbd_js_shortcut__WEBPACK_IMPORTED_MODULE_6__.matchesShortcut)(event, COLUMN_KEYS) && this.wide && !this.edit?.on && !(0,_component_kbd_js_shortcut__WEBPACK_IMPORTED_MODULE_6__.isEditableTarget)(event.target)) {
        event.preventDefault();
        this.toggleColumn();
        return;
      } // Escape leaves the setting mode (AM-61), once what is open inside
      // it -- a menu, a window, a name being typed -- has had it.


      if (event.key === "Escape" && this.edit?.on && !event.defaultPrevented && !this.escapeTaken(event)) {
        event.preventDefault();
        this.exitEdit();
      }
    }; // Escape, Tab and a press on the scrim are sf-search's while its
    // window is open (openPalette).


    document.addEventListener("keydown", this._onKeyDown, true); // The admin's pages without full reloads (interface fragments,
    // 2026-10-15), piloted here: the menu turns region navigation on when
    // the page is Larena's shell -- its revision in the head, its content
    // region in the body -- and keeps its current row on the address the
    // region went to, since the shell around it is not drawn again.
    // The new page may show another object, or none: the host is asked for
    // the menu again with its address, and its answer brings the page's
    // object menu or takes it away.

    this._onRegionLoad = event => {
      this.followAddress(event.detail?.url);
      if (this.port) this.load("requested", null, pageAddress(event.detail?.url));
    };

    document.addEventListener("sf-region-load", this._onRegionLoad);
    enableRegionNavigation();
  } // The row whose address is this one becomes current: the deepest match on
  // the path, so /admin/storage/news/42 keeps «Новости» lit.


  followAddress(url) {
    if (!url) return;
    let path;

    try {
      path = new URL(url, globalThis.location.href).pathname;
    } catch {
      return;
    }

    let best = null;

    const visit = rows => {
      for (const row of rows ?? []) {
        if (row.href && !["link", "heading", "divider"].includes(row.kind)) {
          let target = null;

          try {
            target = new URL(row.href, globalThis.location.href).pathname;
          } catch {
            target = null;
          }

          if (target && (path === target || path.startsWith(`${target.replace(/\/$/u, "")}/`)) && (!best || target.length > best.length)) best = {
            key: row.key,
            length: target.length
          };
        }

        visit(row.children);
      }
    };

    visit(this.navigation?.items); // Drawn again whichever row it is: «Уведомления» reads its own mark
    // from the address, not from a row of the tree.
    // The row the page names (setting current) is not moved by the address.

    if (!this.element.pageCurrent && best && best.key !== this.navigation?.current) this.navigation = { ...this.navigation,
      current: best.key
    }; // A row of the object menu at this address is current at once; the
    // host's answer to the new page confirms it or takes the menu away.

    const context = this.navigation?.context;

    if (context && Array.isArray(context.groups)) {
      let found = null;

      for (const group of context.groups) {
        for (const item of group?.items ?? []) {
          let target = null;

          try {
            target = item?.href ? new URL(item.href, globalThis.location.href).pathname : null;
          } catch {
            target = null;
          }

          if (target && (path === target || path.startsWith(`${target.replace(/\/$/u, "")}/`)) && (!found || target.length > found.length)) found = {
            key: item.key,
            length: target.length
          };
        }
      }

      if (found && found.key !== context.current) this.navigation = { ...this.navigation,
        context: { ...context,
          current: found.key
        }
      };
    }

    this.pageOpened();
    this.update("address");
  } // The page named the row it is on (setting current, stand 24 A1): it is
  // current, and the second column follows it as it follows the address.


  followPageCurrent() {
    const key = this.element.pageCurrent;
    if (!this.navigation || !key || key === this.navigation.current) return;
    this.navigation = { ...this.navigation,
      current: key
    };
    this.pageOpened();
    this.update("current");
  } // The first level is always the rail (owner decision C320): there is no
  // «Развернуть» and no preference for it (AM-29). The rail unfolds with
  // its names only for the time of the setting mode (C325, AM-24).


  get compact() {
    return !this.edit?.on;
  } // A page was opened. The column the person has open stays when it holds
  // the page -- a row clicked in it only moves the current mark, the column
  // is not drawn again (AM-58: it vanished for 2-3 frames and the page slid
  // under it) -- else the column gives way to the page's own root (owner,
  // 2026-11-05). The edit mode keeps the root it edits.


  pageOpened() {
    if (this.edit?.on) return;
    const was = this.openRoot;
    const keeps = was && this.wide && !this.objectMenu() && this.holdsCurrent(this.rootByKey(was) ?? {});

    if (!keeps) {
      this.openRoot = null;
      this.filter = "";
    }

    if (!this.wide) this.screen = this.objectMenu() ? "second" : "first";
  } // The root that holds the page's row and has rows of its own: the one the
  // second column shows on this page when the page has no object menu.
  // A root that is itself the page (no rows) has no column: the column is
  // closed there, never another root's (owner, 2026-11-05).


  pageRoot() {
    const current = this.navigation?.current;
    return this.roots().find(root => root.kind === "root" && this.holdsCurrent(root) && root.key !== current && (root.children ?? []).length > 0) ?? null;
  } // The page's object menu (navigation.context), drawn as it came; not in
  // the edit mode, which edits the tree.


  objectMenu() {
    return this.edit?.on ? null : objectMenuOf(this.navigation);
  } // What the second column holds: the root the person clicked (or edits),
  // else -- when the column is open and the menu is not on its rail -- the
  // page's object menu, else the page's root; null: no second column.
  // On a phone the second screen holds the same, whatever the column's
  // choice on a wide screen.


  shownColumn() {
    if (this.edit?.on) return this.openRoot;
    if (this.wide && !this.columnOpen) return null;
    if (this.openRoot) return this.openRoot;
    if (this.objectMenu()) return OBJECT_MENU;
    return this.pageRoot()?.key ?? null;
  } // What the host element says of its column (AM-49), for a page that
  // draws «Показать колонку» in its own head line and holds the menu's
  // width before the menu has drawn: open, hidden by the person, or none
  // (a page with nothing for the column, or a phone).


  columnState() {
    if (!this.wide) return "none";
    if (this.shownColumn()) return "open";
    return this.pageColumn() || this.openRoot ? "hidden" : "none";
  } // What the second column would hold if it were open: the button that
  // opens it is drawn only when there is something to open.


  pageColumn() {
    if (this.objectMenu()) return OBJECT_MENU;
    return this.pageRoot()?.key ?? null;
  }

  dispose() {
    (0,_menu__WEBPACK_IMPORTED_MODULE_0__.removeMenu)(this);
    this._notices?.remove?.();
    this._notices = null;
    this.closePalette();
    this.element.removeEventListener("sf-sortable-intent", this._onSortableIntent);
    this.element.removeEventListener("pointerover", this._onPrefetch);
    this.element.removeEventListener("focusin", this._onPrefetch);
    globalThis.removeEventListener?.("resize", this._onWindowResize);
    cancelAnimationFrame(this._fitFrame);
    this.wideMedia?.removeEventListener?.("change", this._onWideChange);
    document.removeEventListener("keydown", this._onKeyDown, true);
    document.removeEventListener("sf-region-load", this._onRegionLoad);
    this.wideMedia = null;
  }

  text(key) {
    return (0,_core_js_page_language__WEBPACK_IMPORTED_MODULE_3__.pageText)(NAVIGATION_TEXT, key, this.element, "sf-admin-menu");
  }

  update(reason) {
    this.element.requestComponentUpdate(`navigation-${reason}`);
  } // The port's capabilities; before the port, the ones the page printed
  // with its first answer (first-answer.capabilities), so the first draw is
  // the final one.


  offers(capability) {
    const capabilities = this.port?.capabilities ?? this.printedCapabilities;
    return Boolean(capabilities?.includes?.(capability));
  } // The host's first answer printed with the page (setting first-answer):
  // drawn at once, as if the host had answered, with no skeleton; the port's
  // answer to navigation.load replaces it. Taken only before any answer.


  acceptFirstAnswer(data) {
    if (this.navigation || !data || typeof data !== "object" || !Array.isArray(data.items)) return false;
    if (Array.isArray(data.capabilities)) this.printedCapabilities = data.capabilities.map(String);
    this.accept({ ...data,
      answer: "applied"
    }, this.sequence);
    return true;
  } // A host that throws is a host that did not answer; a person sees the same
  // «unavailable» as for a host that said so.
  // Every intent is also told on the element by its verb (INTENT_VERBS), so
  // a page can watch what a person asked of the host without standing
  // between the two; sf-admin-menu-intent, the 1.0 name for all of them,
  // follows each until 2026-12-01 (aliases.json, split).


  async raise(intent, payload = {}) {
    // An intent a later port adds is told as a refresh of its own kind
    // until it has a verb here.
    const [verb, kind, fields] = INTENT_VERBS[intent] ?? ["refresh", String(intent).split(".")[0], () => ({})];
    this.element.sfEmit(verb, {
      kind,
      ...fields(payload ?? {}),
      intent,
      payload: copy(payload)
    }); // Drawn from the page's first answer before the host connected its
    // port: there is no one to ask yet.

    if (!this.port) return {
      answer: "unavailable",
      reason: "no-port"
    };

    try {
      const answer = await this.port.raise(intent, copy(payload), {});
      return answer && typeof answer === "object" ? answer : {
        answer: "unavailable"
      };
    } catch (error) {
      return {
        answer: "unavailable",
        reason: String(error?.message ?? error)
      };
    }
  } // The menu as the host sees it. An answer to an older request than the last
  // one sent is dropped by its echoed sequence: switching sites twice quickly
  // must not end on the first site's rows.
  // `page` is the page's address (path and query): the host answers the
  // menu of the object that page shows (navigation.context) or none.


  async load(reason = "connected", site = null, page = pageAddress()) {
    const sequence = ++this.sequence;
    if (!this.navigation) this.status = "loading";
    this.update("loading");
    const answer = await this.raise("navigation.load", {
      reason,
      site,
      sequence,
      page
    });
    this.accept(answer, sequence);
  }

  accept(answer, sequence) {
    if (answer.answer === "applied") {
      const echoed = answer.echo?.sequence ?? sequence;
      if (echoed !== null && echoed < this.sequence) return;
      const first = !this.navigation;
      const before = this.navigation?.current ?? null; // The row the page says it is on wins over the host's (stand 24 A1).

      const pageCurrent = this.element.pageCurrent; // An answer without `context` takes the object menu away: the page
      // the menu was read for shows no object (a soft swap's answer).

      const {
        answer: _outcome,
        ...data
      } = answer;
      this.navigation = pageCurrent ? { ...data,
        current: pageCurrent
      } : data;
      if (first) this.applyPersonPreferences(answer.person);
      this.preloadFilledIcons(); // The second column follows the page (owner, 2026-11-05): nothing
      // to choose here but what the page is. A root the person was
      // looking at stays only while the page is the same one.

      if (!first && this.navigation.current !== before) this.pageOpened(); // On a phone the menu opens on the page's object menu when it has one.

      if (first && !this.wide) this.screen = this.objectMenu() ? "second" : "first";
      this.status = "ready";
      this.message = ""; // An open root the new menu does not hold closes rather than showing
      // an empty column under a heading that no longer exists.

      if (this.openRoot && this.openRoot !== FAVOURITES_ROOT && !this.roots().some(root => root.key === this.openRoot)) {
        this.openRoot = null;
        this.screen = "first";
      } // A phone on the second screen with nothing left to show there
      // goes back to the first.


      if (!this.wide && this.screen === "second" && !this.shownColumn()) this.screen = "first";
    } else if (!this.navigation) {
      this.status = answer.answer === "refused" ? "refused" : "unavailable";
      this.message = answer.reason || "";
    }

    this.update("state");
  } // The current section's glyph is drawn filled (C354): the icon subset has
  // the FILL axis only for glyphs the page marks filled, so every section of
  // the first column is asked for in its filled form at once -- a section
  // that becomes current later does not wait for another subset.


  preloadFilledIcons() {
    const preload = globalThis.SF?.Loader?.preloadIcons;
    if (typeof preload !== "function") return;
    const icons = new Set();

    const walk = rows => {
      for (const row of rows ?? []) if (row?.icon && row.kind !== "divider" && row.kind !== "heading") icons.add(row.icon);
    };

    walk(this.navigation?.items);
    icons.add("star");
    const fresh = [...icons].filter(name => !this.filledIcons?.has(name));
    if (!fresh.length) return;
    this.filledIcons = new Set([...(this.filledIcons ?? []), ...fresh]);

    try {
      preload.call(globalThis.SF.Loader, fresh.map(name => ({
        icon: name,
        filled: true
      })));
    } catch {// A Loader without the icon subset draws the glyphs as they are.
    }
  } // The person's theme and language are the host's to keep, so the page follows
  // them when the menu first reads them. Without this a page could open dark
  // from the Framework's own cookie while the host -- and the profile menu --
  // said «as the system», two answers to one question.


  applyPersonPreferences(person) {
    if (!person || !this.offers("preferences")) return;
    const loader = globalThis.SF?.Loader;
    if (person.theme && loader?.themePreference !== person.theme) loader?.setTheme?.(person.theme);
    const language = globalThis.SF?.language;
    if (person.language && language?.current?.() !== person.language) language?.use?.(person.language);
  } // ─── what the template reads ─────────────────────────────────────────────
  // Hidden rows are drawn in the edit mode, struck through, so they can be
  // brought back; outside it they are not drawn at all.


  roots() {
    return (this.navigation?.items ?? []).filter(row => this.edit?.on || !row.hidden);
  }

  siteRoots() {
    return this.roots().filter(row => row.level !== "install");
  }

  installRoots() {
    return this.roots().filter(row => row.level === "install");
  }

  rootByKey(key) {
    if (key === FAVOURITES_ROOT) return this.favouritesRoot();
    return (this.navigation?.items ?? []).find(row => row.key === key) ?? null;
  } // Favourites are a section of their own (owner, 2026-10-15): a star at the
  // foot of the first column, its pages in the second column like any
  // section's. They were a block under the sections, in the first column,
  // where the person mostly works in the second.
  // «Избранное» is a rail item with its own column (owner decision C327),
  // there also while it is empty: its column then says how a page gets in
  // -- the star at the page's title (C368, AM-48). A favourite carries the
  // section it is in as a caption under its name, as rows from different
  // sections meet here: the host's caption, else the root that holds it.


  favouritesRoot() {
    if (!this.offers("favourites")) return null;
    const favourites = this.favourites();
    return {
      key: FAVOURITES_ROOT,
      kind: "root",
      level: "site",
      label: this.text("favourites"),
      icon: "star",
      children: favourites.map(entry => ({ ...entry,
        kind: entry.kind === "divider" || entry.kind === "heading" ? entry.kind : "page",
        caption: entry.caption ?? this.sectionOf(entry.key)?.label ?? null
      }))
    };
  } // The root a row is in, at any depth.


  sectionOf(key) {
    const holds = rows => (rows ?? []).some(row => row.key === key || holds(row.children));

    return (this.navigation?.items ?? []).find(root => root.key !== key && holds(root.children)) ?? null;
  } // The rows of the open root as they are drawn: hidden ones gone, headings
  // without a visible row after them gone too (assignment v5, item 9), and the
  // filter applied to pages when one is typed.


  rowsOf(root) {
    if (this.edit?.on) return [...(root?.children ?? [])];
    const rows = (root?.children ?? []).filter(row => !row.hidden);
    const needle = this.filter.trim().toLowerCase();
    const matched = needle ? rows.filter(row => row.kind === "heading" || (row.label ?? "").toLowerCase().includes(needle) || (row.children ?? []).some(child => (child.label ?? "").toLowerCase().includes(needle))) : rows;
    const drawn = [];
    matched.forEach((row, index) => {
      if (row.kind === "heading") {
        const next = matched.slice(index + 1).find(candidate => candidate.kind !== "divider");
        if (!next || next.kind === "heading") return;
      }

      if (row.kind === "divider" && (needle || drawn.length === 0 || drawn[drawn.length - 1].kind === "divider")) return;
      drawn.push(row);
    });

    while (drawn.length && drawn[drawn.length - 1].kind === "divider") drawn.pop();

    return drawn;
  }

  pageCount(root) {
    return (root?.children ?? []).filter(row => !row.hidden && !["heading", "divider"].includes(row.kind)).length;
  }

  offersFind(root) {
    return this.pageCount(root) > FIND_IN_SECTION_ABOVE;
  }

  favourites() {
    return this.offers("favourites") ? this.navigation?.favourites ?? [] : [];
  }

  isFavourite(key) {
    return this.favourites().some(entry => entry.key === key);
  }

  isCurrent(key) {
    return this.navigation?.current === key;
  } // A root is shown as current when the page belongs to one of its rows.


  holdsCurrent(root) {
    const current = this.navigation?.current;
    if (!current) return false;
    if (root.key === current) return true; // At any depth (AM-13): a page three levels down keeps its root lit.

    const holds = rows => (rows ?? []).some(row => row.key === current || holds(row.children));

    return holds(root.children);
  } // ─── what a person does ──────────────────────────────────────────────────
  // A root of the first column was clicked. The one the column shows closes
  // the column (the person's choice, kept on every page); the page's own
  // root opens the column on it; another root is shown until a page is
  // opened. On a phone it is the second screen.


  openRootColumn(key) {
    if (this.edit?.on) {
      this.openRoot = this.openRoot === key && this.wide ? null : key;
      this.filter = "";
      if (!this.wide && this.openRoot) this.screen = "second";
      this.update("root");
      return;
    }

    if (!this.wide) {
      this.openRoot = key === this.pageRoot()?.key && !this.objectMenu() ? null : key;
      this.filter = "";
      this.screen = "second";
      this.update("root");
      return;
    } // A click on a root is «show me this section» (AM-49): its column
    // opens, also when the person had hidden the column; a click on the
    // root whose column is open hides it, which is hiding the column.


    const shown = this.shownColumn();
    const pageRoot = this.pageRoot()?.key ?? null;

    if (shown === key || shown === OBJECT_MENU && this.holdsCurrent(this.rootByKey(key) ?? {}) && !this.openRoot) {
      this.openRoot = null;
      this.setColumnOpen(false);
    } else if (key === pageRoot && !this.objectMenu()) {
      this.openRoot = null;
      this.setColumnOpen(true);
    } else {
      this.openRoot = key;
      this.setColumnOpen(true);
    }

    this.filter = "";
    this.update("root");
  } // The column's «hide» on a wide screen: closed on every page from now on,
  // until the person opens it again.


  hideColumn() {
    this.openRoot = null;
    this.screen = "first";
    if (this.wide) this.setColumnOpen(false);
    this.update("root");
  } // «Показать колонку» (the page's head line, ⌘B, the element's
  // showColumn): the column again, on what the page has -- its object menu
  // or its root. With nothing for it nothing opens.


  showColumn() {
    if (!this.pageColumn() && !this.openRoot) return false;
    this.setColumnOpen(true);
    this.update("root");
    return true;
  } // ⌘B / Ctrl+B and the element's toggleColumn: hide the column that is
  // open, show the one that is hidden (C321, AM-36).


  toggleColumn() {
    if (!this.wide || this.edit?.on) return false;

    if (this.shownColumn()) {
      this.hideColumn();
      return true;
    }

    return this.showColumn();
  }

  setColumnOpen(open) {
    const next = Boolean(open);
    const changed = next !== this.columnOpen;
    this.columnOpen = next;
    this.keepPreference({
      second: this.columnOpen
    });
    if (changed) this.element.sfEmit("column-change", {
      open: this.columnOpen
    });
  } // The menu's view preference (SF.Preferences, owner 2026-10-14): whether
  // the section column is open, kept for the person with every other view
  // preference (C321: remembered per person). The rail is not a choice.


  get preference() {
    return preferences()?.read(MENU_PREFERENCE) ?? {};
  }

  keepPreference(patch) {
    preferences()?.write(MENU_PREFERENCE, { ...this.preference,
      v: 1,
      ...patch
    });
  } // Open unless the person closed it. Before 1.7.0 the menu kept the root
  // left open per site (openRoots), "" for a closed column: a person who
  // had closed it everywhere they went finds it closed.


  keptColumnOpen() {
    const kept = this.preference;
    if (typeof kept.second === "boolean") return kept.second;
    const former = kept.openRoots && typeof kept.openRoots === "object" ? Object.values(kept.openRoots) : [];
    return !(former.length && former.every(value => value === ""));
  }

  back() {
    this.screen = "first";
    if (!this.edit?.on) this.openRoot = null;
    this.update("screen");
  }

  toggleSection(key) {
    if (this.unfolded.has(key)) this.unfolded.delete(key);else this.unfolded.add(key);
    this.update("section");
  }

  setFilter(value) {
    this.filter = String(value ?? "");
    this.update("filter");
  } // A row is a link the browser understands -- a middle click or a modified
  // click opens it in a tab as any link would -- and a plain click is the
  // host's to answer, because what opening a row means is the host's.


  async openRow(row, event) {
    if (event && (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
    if (row.kind === "link") return; // Drawn from the page's first answer, before the port: a page row is
    // the link it is, and the browser follows it.

    if (!this.port && row.kind !== "root" && row.kind !== "section") return;
    event?.preventDefault?.();

    if (row.kind === "root") {
      this.openRootColumn(row.key);
      return;
    }

    if (row.kind === "section") {
      this.toggleSection(row.key);
      return;
    }

    const answer = await this.raise("item.open", {
      key: row.key,
      href: row.href ?? null
    });

    if (answer.answer === "applied") {
      const href = answer.href ?? row.href ?? null; // With region navigation on, the menu goes there itself and says so:
      // `region: true` tells a host listener the page is already on its
      // way, so it does not load it a second time.

      const region = Boolean(href && globalThis.SF?.RegionNavigation?.enabled); // The page may refuse to leave (AS-6: unsaved changes): navigate is
      // cancelable and asked first; refused, the current row, the screen
      // and the focus stay as they are and the menu goes nowhere. The page
      // that later agrees goes there itself and names the row (current).

      if (!this.mayLeave({
        id: row.key,
        key: row.key,
        href,
        region
      })) return;
      this.navigation = { ...this.navigation,
        current: row.key
      };
      this.pageOpened();
      if (!this.wide) this.screen = "first";
      this.update("open");
      if (region) globalThis.SF.RegionNavigation.navigate(new URL(href, globalThis.location.href).href);
    }
  } // sf-admin-menu-navigate, cancelable (AS-6): false when a listener refused.


  mayLeave(detail) {
    return this.element.sfEmit("navigate", detail, {
      cancelable: true
    }) !== false;
  } // A row of the object menu, or its «back»: an ordinary link, the page's
  // and not the tree's -- no port intent, no favourite, nothing to edit. A
  // middle or modified click opens a tab as any link does; a plain click
  // goes by region when the shell has it, else the browser follows the
  // link. `navigate` tells a host listener either way.


  openObjectRow(item, event, {
    back = false
  } = {}) {
    if (event && (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
    const href = item?.href ?? null;
    if (!href) return;
    const region = Boolean(globalThis.SF?.RegionNavigation?.enabled);
    const key = back ? "sf:context-back" : item.key; // Refused (AS-6): the link is not followed and nothing is marked.

    if (!this.mayLeave({
      id: key,
      key,
      href,
      region
    })) {
      event?.preventDefault?.();
      return;
    }

    if (!back && this.navigation?.context) {
      this.navigation = { ...this.navigation,
        context: { ...this.navigation.context,
          current: item.key
        }
      };
      if (!this.wide) this.screen = "second";
      this.update("open");
    }

    if (region) {
      event?.preventDefault?.();
      globalThis.SF.RegionNavigation.navigate(new URL(href, globalThis.location.href).href);
    }
  }

  async toggleFavourite(row) {
    return this.setFavourite(row.key, !this.isFavourite(row.key));
  } // The row into the person's favourites or out of them, as the menu's star
  // and the element's action toggle {id, on} ask (favourite.toggle).


  async setFavourite(key, on) {
    const answer = await this.raise("favourite.toggle", {
      key,
      on
    });

    if (answer.answer === "applied" && Array.isArray(answer.favourites)) {
      this.navigation = { ...this.navigation,
        favourites: answer.favourites
      };
      this.update("favourite");
    }

    return answer;
  } // ─── the site switcher ───────────────────────────────────────────────────
  // Whenever the host switches sites, however many there are now: with one
  // site the switcher was a dead button, and read as broken (owner,
  // 2026-10-14). Its list says which site this is and finds the others.


  canSwitchSite() {
    return this.offers("site-switch");
  } // The sites are the Framework's standard menu (owner, 2026-10-12): the
  // same list with a search as the languages in the profile menu, searched by
  // the host because an agency may have hundreds of sites.


  async openSites(anchor) {
    if (!this.canSwitchSite()) return;
    this.sites = { ...this.sites,
      open: true,
      query: "",
      items: [],
      next: null
    };
    const opened = await (0,_menu__WEBPACK_IMPORTED_MODULE_0__.openMenu)(this, anchor, {
      label: this.text("chooseSite"),
      // As wide as the switcher it opens from (owner, 2026-10-14), but in
      // the narrow rail, where the switcher is a picture.
      width: this.compact ? "content" : "trigger",
      entries: this.siteEntries(),
      search: {
        placeholder: this.text("findSite"),
        empty: this.text("nothingFound"),
        remote: true
      },
      onSearch: query => this.searchSites(query),
      onClose: () => {
        this.sites = { ...this.sites,
          open: false
        };
      },
      select: id => {
        const [kind, key] = String(id ?? "").split(/:(.*)/su);
        if (kind === "site") return this.switchSite(key);
        if (kind === "more") return this.searchSites(this.sites.query, {
          more: true
        });
        return null;
      }
    }); // openMenu answers whether the menu opened (true), for the boolean
    // menu and the outcome menu alike; a refused or unavailable open
    // leaves the switcher closed.

    if (opened !== true) {
      this.sites = { ...this.sites,
        open: false
      };
      return;
    }

    await this.searchSites("");
  }

  siteEntries() {
    const current = this.navigation?.site?.current?.key;
    const entries = this.sites.items.map(site => ({
      id: `site:${site.key}`,
      text: site.label,
      caption: site.caption,
      initials: site.mark || (0,_helpers_text__WEBPACK_IMPORTED_MODULE_2__.getInitials)(site.label ?? ""),
      kind: "radio",
      checked: site.key === current
    }));

    if (this.sites.next !== null && this.sites.next !== undefined) {
      entries.push({
        id: "more",
        text: this.text("moreSites"),
        icon: "expand_more",
        keepOpen: true,
        disabled: this.sites.loading
      });
    }

    const manage = this.navigation?.site?.manage_href;
    if (manage) entries.push({
      type: "separator"
    }, {
      id: "manage",
      text: this.text("manageSites"),
      icon: "settings",
      href: manage
    });
    return entries;
  }

  closeSites() {
    if (this.sites.open) (0,_menu__WEBPACK_IMPORTED_MODULE_0__.closeMenu)(this);
    this.sites = { ...this.sites,
      open: false
    };
  } // Asked of the host, a page at a time; never filtered here, because an
  // agency may have hundreds of sites.


  async searchSites(query, {
    more = false
  } = {}) {
    const sequence = ++this.sites.sequence;
    this.sites = { ...this.sites,
      query,
      loading: true
    };
    const answer = await this.raise("sites.search", {
      query,
      cursor: more ? this.sites.next : null
    });
    if (sequence !== this.sites.sequence) return;

    if (answer.answer === "applied") {
      this.sites = { ...this.sites,
        loading: false,
        items: more ? [...this.sites.items, ...(answer.items ?? [])] : answer.items ?? [],
        next: answer.next_cursor ?? null
      };
    } else {
      this.sites = { ...this.sites,
        loading: false
      };
    }

    if (this.sites.open) (0,_menu__WEBPACK_IMPORTED_MODULE_0__.updateMenu)(this, this.siteEntries());
  }

  async switchSite(key) {
    this.closeSites();
    if (key === this.navigation?.site?.current?.key) return;
    const sequence = ++this.sequence;
    const answer = await this.raise("site.switch", {
      site: key,
      sequence
    });
    this.accept(answer, sequence);
  } // ─── the profile menu ────────────────────────────────────────────────────


  currentLanguage() {
    const code = this.navigation?.person?.language;
    return (this.navigation?.person?.languages ?? []).find(entry => entry.code === code) ?? null;
  } // Applied at once through the Framework's own theme switch, which every page
  // on the Framework already answers; the host keeps it for the next page.


  async chooseTheme(theme) {
    globalThis.SF?.Loader?.setTheme?.(theme);
    this.navigation = { ...this.navigation,
      person: { ...this.navigation.person,
        theme
      }
    };
    this.update("theme");
    if (this.offers("preferences")) await this.raise("preference.theme", {
      theme
    });
  } // Framework components change language without a reload; whether the host's
  // own page needs one is the host's answer, not this component's guess.


  async chooseLanguage(code) {
    globalThis.SF?.language?.use?.(code);
    this.navigation = { ...this.navigation,
      person: { ...this.navigation.person,
        language: code
      }
    };
    if (!this.offers("preferences")) return;
    const answer = await this.raise("preference.language", {
      language: code
    });
    if (answer.answer === "applied" && answer.reload === true) globalThis.location?.reload?.();
  }

  async chooseProfile(key) {
    if (key === this.navigation?.profiles?.current) return;
    const answer = await this.raise("view.profile", {
      profile: key
    });

    if (answer.answer === "applied" && answer.navigation) {
      this.accept({ ...answer.navigation,
        answer: "applied"
      }, this.sequence);
    }
  }

  async signOut() {
    const answer = await this.raise("session.sign-out", {});
    if (answer.answer !== "applied") return;
    this.mayLeave({
      id: "session.sign-out",
      key: "session.sign-out",
      href: answer.href ?? null
    });
  } // ─── the edit mode ───────────────────────────────────────────────────────


  currentProfile() {
    const profiles = this.navigation?.profiles;
    return profiles?.list?.find(entry => entry.key === profiles.current) ?? null;
  }

  mayEdit(profile = this.currentProfile()) {
    const rights = this.navigation?.rights ?? {};
    if (!profile) return false;
    return profile.kind === "shared" ? Boolean(rights.edit_shared) : Boolean(rights.edit_personal);
  } // The pencil is there when something can be edited at all: the current
  // profile, or a personal one the edit mode can move to.


  canEdit() {
    if (!this.offers("menu-profiles") || !this.navigation) return false;
    return this.mayEdit() || Boolean(this.navigation.rights?.edit_personal);
  } // ─── the setting mode's levels (C326 = C298, AM-28) ────────────────────
  // The profiles a level stands for: «Лично» is the person's personal
  // profile; «Для всех» the shared profile everyone starts from (the port's
  // profiles.default, else the first shared one); «Профиль настроек» every
  // other shared profile, one at a time (a role's, as «Операторы»).


  personalProfile() {
    return (this.navigation?.profiles?.list ?? []).find(entry => entry.kind === "personal") ?? null;
  }

  everyoneProfile() {
    const profiles = this.navigation?.profiles;
    const shared = (profiles?.list ?? []).filter(entry => entry.kind === "shared");
    return shared.find(entry => entry.key === profiles?.default) ?? shared[0] ?? null;
  }

  roleProfiles() {
    const everyone = this.everyoneProfile()?.key;
    return (this.navigation?.profiles?.list ?? []).filter(entry => entry.kind === "shared" && entry.key !== everyone);
  } // The levels this person has: «Лично» with the right to a personal menu,
  // the shared two with the right to change shared menus.


  levels() {
    const rights = this.navigation?.rights ?? {};
    const list = [];
    if (rights.edit_personal) list.push("personal");
    if (rights.edit_shared && this.everyoneProfile()) list.push("everyone");
    if (rights.edit_shared && (this.roleProfiles().length || rights.create_shared)) list.push("role");
    return list;
  }

  levelOf(profileKey) {
    const entry = (this.navigation?.profiles?.list ?? []).find(one => one.key === profileKey);
    if (!entry) return null;
    if (entry.kind === "personal") return "personal";
    return entry.key === this.everyoneProfile()?.key ? "everyone" : "role";
  } // A shared level is a draft until «Сохранить для всех».


  isDraft() {
    return this.edit?.on && this.level.key !== "personal";
  } // Whether «Сбросить» has anything to bring back (AM-61: off when nothing
  // differs). A shared draft: its unsaved changes. «Лично»: the personal
  // profile differs from «Для всех» -- the port says so on the profile
  // (changed), else the menu knows it from its own saves and resets.


  canReset() {
    if (this.isDraft()) return this.level.dirty;
    const personal = this.personalProfile();
    if (typeof this.level.personalChanged === "boolean") return this.level.personalChanged;
    return personal?.changed !== false;
  } // The sections an administrator locked for everyone, by name, for the
  // lock line of the setting header (AM-42).


  lockedNames() {
    return (this.navigation?.items ?? []).filter(row => row.locked).map(row => row.label).filter(Boolean);
  }

  isLocked(row) {
    return Boolean(row?.locked) && !this.isDraft();
  } // ─── the setting mode (C325, AM-22, AM-24, AM-41, AM-61) ────────────────
  // A shared profile this person may not change is not edited by stealth:
  // the mode opens on «Лично», their personal profile, made from the one
  // they were looking at when they have none. `opener` is what opened the
  // mode -- "person" or a rail root's key -- and gets the focus back.


  async startEdit(opener = null) {
    if (!this.canEdit() || this.edit?.on) return;
    (0,_menu__WEBPACK_IMPORTED_MODULE_0__.closeMenu)(this);
    this.editOpener = opener; // The edit mode chooses a row's glyph with the grid dropdown, which the
    // menu fetches when it is first needed rather than with every page.

    globalThis.SF?.Loader?.ensure?.(["sf-dropdown", "sf-segmented"]);
    const rights = this.navigation.rights ?? {};

    if (rights.edit_personal) {
      let personal = this.personalProfile();

      if (!personal) {
        const made = await this.raise("view.create", {
          label: this.text("personalName"),
          shared: false,
          from: this.navigation.profiles.current
        });
        if (made.answer !== "applied") return this.editMessage(made.reason);
        personal = made.profiles?.list?.find(entry => entry.kind === "personal");
      }

      if (!personal) return false;
      if (personal.key !== this.navigation.profiles.current && !(await this.switchProfile(personal.key))) return false;
      this.level = {
        key: "personal",
        draft: null,
        dirty: false
      };
    } else {
      const everyone = this.everyoneProfile();
      if (!everyone) return false;
      if (everyone.key !== this.navigation.profiles.current && !(await this.switchProfile(everyone.key))) return false;
      this.level = {
        key: "everyone",
        draft: everyone.key,
        dirty: false
      };
    }

    this.edit = { ...this.edit,
      on: true,
      message: ""
    }; // The current section's column is open for its rows to be edited.

    if (!this.openRoot && this.wide) {
      this.openRoot = this.pageRoot()?.key ?? this.siteRoots().find(root => root.kind === "root")?.key ?? null;
    }

    this.update("edit");
    return true;
  } // A level chosen in the setting header. A shared draft with unsaved
  // changes asks once before it is left.


  async chooseLevel(level, profileKey = null) {
    if (!this.edit?.on) return false;
    const target = level === "personal" ? this.personalProfile()?.key : level === "everyone" ? this.everyoneProfile()?.key : profileKey ?? (this.level.key === "role" ? this.level.draft : null) ?? this.roleProfiles()[0]?.key;

    if (!target) {
      this.update("edit");
      return false;
    }

    if (target === this.navigation.profiles.current && level === this.level.key) return true;

    if (!(await this.leaveDraft())) {
      this.update("edit");
      return false;
    }

    if (!(await this.switchProfile(target))) return false;
    this.level = { ...this.level,
      key: level,
      draft: level === "personal" ? null : target,
      dirty: false
    };
    this.edit = { ...this.edit,
      message: ""
    };
    this.update("edit");
    return true;
  } // Whether an unsaved shared draft may be dropped: asked once, in the
  // Framework's confirm when the page has it.


  async leaveDraft() {
    if (!this.isDraft() || !this.level.dirty) return true;
    const question = this.text("draftLeave");
    const confirm = globalThis.SF?.confirm;
    const yes = typeof confirm === "function" ? await confirm({
      text: question,
      confirm: this.text("draftDrop"),
      cancel: this.text("cancel")
    }) : globalThis.confirm?.(question) ?? true;
    const agreed = yes === true || yes?.outcome === "applied" || yes?.confirmed === true;
    if (agreed) this.level = { ...this.level,
      dirty: false
    };
    return agreed;
  } // «Сохранить для всех»: the shared draft reaches its level.


  async saveDraft() {
    if (!this.isDraft() || !this.level.dirty) return false;
    const answer = await this.raise("view.save", {
      profile: this.navigation.profiles.current,
      revision: this.navigation.revision,
      layout: this.layoutOf(this.navigation.items ?? [])
    });

    if (answer.answer === "applied") {
      this.navigation = { ...this.navigation,
        revision: answer.revision ?? this.navigation.revision
      };
      this.level = { ...this.level,
        dirty: false
      };
      this.edit = { ...this.edit,
        message: this.text("savedForAll")
      };
      this.update("edit");
      return true;
    }

    this.editMessage(answer.answer === "conflict" ? this.text("conflict") : answer.reason);
    return false;
  } // «Готово», Escape and «Закончить настройку» do the same (AM-61):
  // «Лично» is already saved, so they close; an unsaved shared draft asks
  // once. The menu goes back to the person's own profile and the rail, and
  // the focus to what opened the mode.


  async exitEdit() {
    if (!this.edit?.on) return false;
    if (!(await this.leaveDraft())) return false;
    const back = this.isDraft() ? this.personalProfile()?.key ?? null : null;
    this.stopEdit();
    if (back) await this.switchProfile(back);
    this.level = {
      key: "personal",
      draft: null,
      dirty: false
    }; // The rail is drawn anew when the mode ends: the focus goes to the
    // opener after that draw (rendered), not to the node it replaces.

    this.pendingFocus = "opener";
    this.update("edit");
    return true;
  }

  focusOpener() {
    const opener = this.editOpener;
    this.editOpener = null;
    const root = this.element;
    const target = opener && opener !== "person" ? root.querySelector(`.sf-admin-nav-first a.sf-admin-nav-row--first[data-key="${CSS.escape(opener)}"]`) : null;
    (target ?? root.querySelector(".sf-admin-nav-person"))?.focus({
      preventScroll: true
    });
  } // Escape is someone else's while a menu, a window or the notifications
  // panel is open, or a name is being typed in the menu.


  escapeTaken(event) {
    if ([...document.querySelectorAll("sf-menu-context")].some(menu => menu.isOpen)) return true;
    if (document.querySelector("sf-search[open], sf-modal[open], sf-confirm[open]")) return true;
    if (this._notices?.hasAttribute?.("open") || this._setPanel?.hasAttribute?.("open")) return true;
    const target = event.composedPath?.()[0] ?? event.target;
    return Boolean(target?.closest?.("input, textarea, [contenteditable='true']") && this.element.contains(target));
  }

  stopEdit() {
    (0,_menu__WEBPACK_IMPORTED_MODULE_0__.closeMenu)(this);
    this.edit = {
      on: false,
      renaming: null,
      adding: null,
      rowMenu: null,
      profiles: false,
      naming: null,
      message: ""
    }; // The column goes back to the page once the edit is done.

    this.openRoot = null;
    this.update("edit");
  } // A refusal is said in words: the host's codes are for logs. One the menu
  // knows by name is translated, the rest is named as it came.


  reasonText(reason) {
    const code = String(reason ?? "");
    if (!code) return "";
    if (code === "admin_menu_layout_href_invalid") return this.text("hrefInvalid");
    if (/\s/u.test(code)) return code;
    return this.text("refused").replace("{reason}", code);
  }

  editMessage(text) {
    this.edit = { ...this.edit,
      message: this.reasonText(text)
    };
    this.update("edit");
    return false;
  }

  async switchProfile(key) {
    const answer = await this.raise("view.profile", {
      profile: key
    });
    if (answer.answer !== "applied" || !answer.navigation) return this.editMessage(answer.reason);
    this.accept({ ...answer.navigation,
      answer: "applied"
    }, this.sequence);
    return true;
  } // The whole layout, read off the menu as it is drawn: where every row sits,
  // its order, whether it is hidden, a name a person gave it, and their own
  // rows. A save is always the whole of it, against the revision it came from.


  layoutOf(items) {
    const layout = {
      schema_version: 1,
      items: {},
      own: []
    };

    const place = (row, parent, order) => {
      const named = row.label !== (row.package_label ?? row.label) ? row.label : null;

      if (row.own) {
        layout.own.push({
          key: row.key,
          kind: row.kind,
          parent,
          order,
          label: row.label ?? null,
          icon: row.icon ?? null,
          href: row.href ?? null
        });
      } else {
        // A glyph chosen for a package's row is saved with it: it was
        // written as null, so every choice was lost on the next read
        // (owner, 2026-10-14). Where the host says the package's own
        // glyph, only a different one is saved; where it does not, the
        // row's glyph is, so a chosen one is never dropped.
        const chosen = "package_icon" in row ? row.icon !== row.package_icon ? row.icon ?? null : null : row.icon ?? null;
        layout.items[row.key] = {
          parent,
          order,
          hidden: Boolean(row.hidden),
          label: named,
          icon: chosen
        }; // A section an administrator locked for everyone (AM-42): the
        // lock rides the shared profile's layout with its reason.

        if (row.locked) layout.items[row.key].locked = {
          reason: row.locked.reason ?? null
        };
      }
    };

    items.forEach((root, rootIndex) => {
      place(root, null, rootIndex);
      (root.children ?? []).forEach((row, index) => place(row, root.key, index));
    });
    return layout;
  } // Every change is drawn at once and saved at once (assignment, section 7).
  // A conflict reads the menu again, with the reason said; nothing is merged
  // behind the person's back.
  // A shared level is a draft (C326 = C298, AM-28): drawn at once, saved
  // only by «Сохранить для всех» (saveDraft).


  async change(mutate) {
    const items = JSON.parse(JSON.stringify(this.navigation.items ?? []));
    mutate(items);
    this.navigation = { ...this.navigation,
      items
    };
    this.edit = { ...this.edit,
      message: ""
    };

    if (this.isDraft()) {
      this.level = { ...this.level,
        dirty: true
      };
      this.update("edit-change");
      return true;
    }

    this.level = { ...this.level,
      personalChanged: true
    };
    this.update("edit-change");
    const answer = await this.raise("view.save", {
      profile: this.navigation.profiles.current,
      revision: this.navigation.revision,
      layout: this.layoutOf(items)
    });

    if (answer.answer === "applied") {
      this.navigation = { ...this.navigation,
        revision: answer.revision ?? this.navigation.revision
      };
      return true;
    }

    this.editMessage(answer.answer === "conflict" ? this.text("conflict") : answer.reason);
    await this.load("refresh-after-conflict");
    return false;
  } // The list a key lives in: the roots, or one root's rows.


  listOf(items, parent) {
    if (parent === null || parent === "roots") return items;
    return items.find(root => root.key === parent)?.children ?? null;
  }

  findIn(items, key) {
    for (const root of items) {
      if (root.key === key) return {
        row: root,
        list: items
      };
      const at = (root.children ?? []).find(row => row.key === key);
      if (at) return {
        row: at,
        list: root.children
      };
    }

    return null;
  } // «Закрепить для всех» / «Открепить» from a row's ⋯ in a shared level
  // (AM-42): a locked section is fixed in every person's menu, its reason
  // said on its lock.


  setLocked(key, on) {
    if (!this.isDraft()) return null;
    return this.change(items => {
      const found = this.findIn(items, key);
      if (found) found.row.locked = on ? {
        reason: this.text("lockedReason")
      } : null;
    });
  } // The rail's short menu (C325 В, AM-22): «Выше», «Ниже», «Скрыть из
  // меню» on a root, saved in the person's menu at once.


  async moveRoot(key, step) {
    const items = this.navigation?.items ?? [];
    const row = items.find(entry => entry.key === key);
    if (!row || row.locked) return false;
    const group = items.filter(entry => !entry.hidden && entry.level === "install" === (row.level === "install"));
    const at = group.indexOf(row);
    const swap = group[at + step];
    if (!swap) return false;
    return this.personalChange(list => {
      const a = list.findIndex(entry => entry.key === key);
      const b = list.findIndex(entry => entry.key === swap.key);
      if (a >= 0 && b >= 0) [list[a], list[b]] = [list[b], list[a]];
    });
  }

  async hideRoot(key) {
    const row = (this.navigation?.items ?? []).find(entry => entry.key === key);
    if (!row || row.locked) return false;
    return this.personalChange(list => {
      const found = list.find(entry => entry.key === key);
      if (found) found.hidden = true;
    });
  } // A change outside the setting mode is the person's own (their personal
  // profile): the menu moves to it first when another one is shown.


  async personalChange(mutate) {
    const personal = this.personalProfile();
    if (!this.navigation?.rights?.edit_personal || !personal) return false;
    if (personal.key !== this.navigation.profiles.current && !(await this.switchProfile(personal.key))) return false;
    return this.change(mutate);
  }

  toggleHidden(key) {
    return this.change(items => {
      const found = this.findIn(items, key);
      if (found) found.row.hidden = !found.row.hidden;
    });
  }

  renameRow(key, label) {
    this.edit = { ...this.edit,
      renaming: null,
      rowMenu: null
    };
    const text = String(label ?? "").trim();
    if (!text) return this.update("edit");
    return this.change(items => {
      const found = this.findIn(items, key);
      if (found) found.row.label = text;
    });
  } // A row's glyph, chosen in the edit mode from the same list as a record
  // section's (owner, 2026-10-13); saved in the profile with the row.


  setRowIcon(key, icon) {
    const next = String(icon ?? "").trim();
    if (!next) return this.update("edit");
    return this.change(items => {
      const found = this.findIn(items, key);
      if (found) found.row.icon = next;
    });
  }

  returnPackageName(key) {
    this.edit = { ...this.edit,
      rowMenu: null
    };
    return this.change(items => {
      const found = this.findIn(items, key);
      if (found && found.row.package_label) found.row.label = found.row.package_label;
    });
  }

  removeOwnRow(key) {
    this.edit = { ...this.edit,
      rowMenu: null
    };
    return this.change(items => {
      const found = this.findIn(items, key);
      if (found?.row.own) found.list.splice(found.list.indexOf(found.row), 1);
    });
  } // A link's address, as the host keeps it: a path on this site, or an
  // https:// address. A bare host name gets https://; http:// is refused
  // (owner, 2026-10-14). A wrong address refused the whole layout, and the
  // rows added with it vanished on the next read.


  static linkAddress(value) {
    const text = String(value ?? "").trim();
    if (!text) return {
      error: "hrefInvalid"
    };
    if (text.startsWith("/") && !text.startsWith("//")) return {
      href: text
    };
    if (/^http:\/\//iu.test(text)) return {
      error: "hrefInsecure"
    };
    const full = /^[a-z][a-z0-9+.-]*:/iu.test(text) ? text : `https://${text.replace(/^\/\//u, "")}`;

    try {
      const url = new URL(full);
      if (url.protocol !== "https:" || !url.hostname.includes(".")) return {
        error: "hrefInvalid"
      };
      return {
        href: url.href
      };
    } catch {
      return {
        error: "hrefInvalid"
      };
    }
  }

  addLink(parent, label, href) {
    const name = String(label ?? "").trim();
    const address = this.constructor.linkAddress(href);

    if (!name || address.error) {
      this.edit = { ...this.edit,
        linkError: name ? this.text(address.error) : this.text("linkNameEmpty")
      };
      return this.update("edit");
    }

    this.edit = { ...this.edit,
      draft: null,
      linkError: ""
    };
    return this.addOwnRow(parent, "link", {
      label: name,
      href: address.href
    });
  } // A person's own rows get keys the layout recognises as theirs; the host
  // keeps them as they are, inside the profile they were made in.


  addOwnRow(parent, kind, {
    label = null,
    href = null
  } = {}) {
    this.edit = { ...this.edit,
      adding: null
    };
    const key = `own.${Date.now().toString(36)}`;
    const row = {
      key,
      kind,
      level: "site",
      own: true,
      hidden: false,
      package_label: null,
      label: kind === "divider" ? null : label || this.text(kind === "root" ? "newSection" : "newHeading"),
      icon: kind === "link" ? "open_in_new" : kind === "root" ? "folder" : null,
      href: kind === "link" ? href : null,
      attention: null,
      badge: null,
      shortcut: null,
      action: null,
      ...(kind === "root" ? {
        children: []
      } : {})
    };
    return this.change(items => this.listOf(items, parent)?.push(row)).then(saved => {
      if (saved && kind === "root") {
        this.openRoot = key;
        this.edit = { ...this.edit,
          renaming: key
        };
        this.update("edit");
      } else if (saved && kind === "heading") {
        this.edit = { ...this.edit,
          renaming: key
        };
        this.update("edit");
      }

      return saved;
    });
  } // sf-sortable says what was moved and where to; this controller moves it in
  // the menu it holds and saves. A row moves within its list, or between the
  // top level and the open section's column (owner, 2026-10-14); a section
  // stays at the top level, as the menu is two levels deep.


  onSortableIntent(event) {
    if (!this.edit.on) return; // sf-sortable names a list by its id; the lists here are
    // `sf-admin-nav-list-roots` and `sf-admin-nav-list-<root key>`.

    const {
      item,
      from,
      to,
      index
    } = event.detail ?? {};

    const listKey = id => typeof id === "string" && id.startsWith(LIST_ID) ? id.slice(LIST_ID.length) : null;

    const source = listKey(from);
    const target = listKey(to);
    if (!source || !target) return;

    if (source === target) {
      this.moveRow(source, item, index);
      return;
    } // The common sections stay among themselves.


    if (source === "install" || target === "install") return;
    this.moveRowBetween(source, target, item, index);
  }

  moveRowBetween(source, target, key, index) {
    const from = this.listOf(this.navigation.items ?? [], source === "roots" ? null : source);
    const row = from?.find(entry => entry.key === key);
    if (!row || target !== "roots" && row.kind === "root") return null;
    return this.change(items => {
      const list = this.listOf(items, source === "roots" ? null : source);
      const into = this.listOf(items, target === "roots" ? null : target);
      const at = list?.findIndex(entry => entry.key === key) ?? -1;
      if (!into || at < 0) return;
      const [moved] = list.splice(at, 1);
      into.splice(Math.max(0, Math.min(index, into.length)), 0, moved);
    });
  }

  moveRow(listKey, key, index) {
    // The common sections move among themselves (AM-42: nothing silently
    // fixed): their list is the install's roots, in the order they stand.
    if (listKey === "install") {
      return this.change(items => {
        const install = items.filter(row => row.level === "install");
        const at = install.findIndex(row => row.key === key);
        if (at < 0) return;
        const [row] = install.splice(at, 1);
        install.splice(Math.max(0, Math.min(index, install.length)), 0, row);
        let next = 0;
        items.forEach((entry, position) => {
          if (entry.level === "install") items[position] = install[next++];
        });
      });
    }

    return this.change(items => {
      const list = this.listOf(items, listKey === "roots" ? null : listKey);
      if (!list) return;
      const at = list.findIndex(row => row.key === key);
      if (at < 0) return;
      const [row] = list.splice(at, 1);
      list.splice(Math.max(0, Math.min(index, list.length)), 0, row);
    });
  } // «Сбросить» (AM-61): a shared draft goes back to what its level holds;
  // «Лично» goes back to «Для всех» (the host's reset of the personal
  // profile). The mode stays; with nothing left to reset the button is off
  // and the focus moves on to «Готово».


  async resetProfile() {
    if (this.isDraft()) {
      if (!this.level.dirty) return;
      this.level = { ...this.level,
        dirty: false
      };
      await this.switchProfile(this.navigation.profiles.current);
      this.update("edit");
      await this.focusDone();
      return;
    }

    this.level = { ...this.level,
      personalChanged: false
    };
    const answer = await this.raise("view.reset", {
      profile: this.navigation.profiles.current,
      revision: this.navigation.revision
    });

    if (answer.answer === "applied" && answer.navigation) {
      this.accept({ ...answer.navigation,
        answer: "applied"
      }, this.sequence);
      this.editMessage("");
      await this.focusDone();
      return;
    }

    this.editMessage(answer.answer === "conflict" ? this.text("conflict") : answer.reason);
    await this.load("refresh-after-conflict");
  } // The pressed «Сбросить» turns itself off; the focus goes on to «Готово»,
  // not to the page (AM-61).


  async focusDone() {
    this.pendingFocus = "done";
    this.update("edit");
  }

  focusPending() {
    const what = this.pendingFocus;
    this.pendingFocus = null;
    if (what === "opener") return this.focusOpener();
    if (what !== "done") return; // sf-button draws its own button: a frame later when it has not yet.

    const focus = tries => {
      const button = this.element.querySelector(".sf-admin-nav-edit-title sf-button button");
      if (button) button.focus({
        preventScroll: true
      });else if (tries) requestAnimationFrame(() => focus(tries - 1));
    };

    focus(3);
  }

  toggleEditProfiles() {
    this.edit = { ...this.edit,
      profiles: !this.edit.profiles,
      naming: null
    };
    this.update("edit");
  }

  async editProfile(key) {
    this.edit = { ...this.edit,
      profiles: false
    };
    if (key !== this.navigation.profiles.current) await this.switchProfile(key);
    this.update("edit");
  }

  startNaming(mode) {
    this.edit = { ...this.edit,
      naming: mode,
      draft: null,
      message: ""
    };
    this.update("edit");
  }

  async createProfile(label, shared) {
    const text = String(label ?? "").trim();
    if (!text) return this.editMessage(this.text("profileNameEmpty"));
    const answer = await this.raise("view.create", {
      label: text,
      shared: Boolean(shared),
      from: this.navigation.profiles.current
    });
    if (answer.answer !== "applied") return this.editMessage(answer.reason);
    const made = answer.profiles?.list?.find(entry => entry.label === text && !this.navigation.profiles.list.some(known => known.key === entry.key));
    this.edit = { ...this.edit,
      profiles: false,
      naming: null,
      draft: null
    };
    if (made) await this.switchProfile(made.key);else await this.load("requested");
  }

  async renameProfile(label, profile = this.navigation.profiles.current) {
    const text = String(label ?? "").trim();
    if (!text) return this.editMessage(this.text("profileNameEmpty"));
    const answer = await this.raise("view.rename", {
      profile,
      label: text
    });
    if (answer.answer !== "applied") return this.editMessage(answer.reason);
    this.navigation = { ...this.navigation,
      profiles: answer.profiles ?? this.navigation.profiles
    };
    this.edit = { ...this.edit,
      profiles: false,
      naming: null
    };
    this.update("edit");
  }

  async deleteProfile(profile = this.navigation.profiles.current) {
    const answer = await this.raise("view.delete", {
      profile
    });
    if (answer.answer !== "applied") return this.editMessage(answer.reason);
    this.edit = { ...this.edit,
      profiles: false,
      naming: null
    };
    if (answer.navigation) this.accept({ ...answer.navigation,
      answer: "applied"
    }, this.sequence);else await this.load("requested");
    if (!this.mayEdit()) this.stopEdit();
  } // ─── the palette ─────────────────────────────────────────────────────────
  // The palette is SIMAI Framework's search window (sf-search, the admin
  // command palette recipe of C162 and C175): a modal dialog of the shared
  // layer stack with a combobox field, the host's groups as its rows and
  // filters, recent queries, key hints, Escape that closes it and gives the
  // focus back. The element is drawn with the menu (palette.js) and fetched
  // by the Loader when it first appears; the menu hands it the provider and
  // opens it.
  //
  // A closed menu draws no window (1.17.0): it is drawn when it is first
  // wanted, the Loader fetching sf-search and its parts at that moment, and
  // stays drawn. A pointer over the search row or the focus on it fetches
  // the code ahead (preparePalette), so the first open is not a wait.
  // The parts a control opens, by the control: the bell its panel, the
  // person, a rail root (its row menu) and the site switcher the standard
  // menu, the search row the window. The setting mode's parts are fetched
  // when the person menu opens with «Настроить меню» in it. Each is asked
  // of the Loader once; a tag already defined costs nothing.


  prefetchFor(target) {
    const control = target?.closest?.(".sf-admin-nav-bell, .sf-admin-nav-person, .sf-admin-nav-site-trigger, .sf-admin-nav-first .sf-admin-nav-row");
    if (!control) return;
    if (control.matches(".sf-admin-nav-bell")) return this.prefetch(["sf-drawer"]);
    if (control.matches("[aria-haspopup=\"dialog\"]")) return this.preparePalette();
    return this.prefetch(["sf-menu-context"]);
  }

  prefetch(tags) {
    const wanted = tags.filter(tag => !this._prefetched.has(tag) && !customElements.get(tag));
    if (!wanted.length) return null;
    wanted.forEach(tag => this._prefetched.add(tag));
    return globalThis.SF?.Loader?.ensure?.(wanted) ?? null;
  } // The setting mode draws text buttons, fields, the levels, the profile
  // picker, the glyph dropdown and the sortable rows.


  prefetchEdit() {
    if (this.canEdit()) this.prefetch(["sf-button", "sf-input", "sf-segmented", "sf-profile-picker", "sf-dropdown", "sf-sortable"]);
  }

  preparePalette() {
    if (!this.offers("search") || customElements.get("sf-search")) return null;
    this._paletteCode ??= globalThis.SF?.Loader?.ensure?.(["sf-search"], {
      timeout: _menu__WEBPACK_IMPORTED_MODULE_0__.PRESS_WAIT
    })?.then(answer => {
      // Not there in time: the next want asks again.
      if (!customElements.get("sf-search")) this._paletteCode = null;
      return answer;
    }) ?? null;
    return this._paletteCode;
  }

  async paletteElement() {
    if (!this.offers("search")) return null;
    const code = this.preparePalette();
    let search = this.element.querySelector("sf-search.sf-admin-nav-search");

    if (!search) {
      this.paletteWanted = true;
      const drawn = this.element.whenRendered?.(null, {
        next: true
      });
      this.update("palette");
      await Promise.race([drawn, new Promise(settle => setTimeout(settle, 1000))]);
      search = this.element.querySelector("sf-search.sf-admin-nav-search");
    }

    if (code) await code;
    if (!search || typeof search.open !== "function") return null;
    if (search.provider !== this.paletteProvider) search.provider = this.paletteProvider;
    return search;
  }

  async openPalette() {
    const search = await this.paletteElement();
    if (!search || search.isOpen) return;
    this.closeSites();
    search.open();
  }

  async togglePalette() {
    const search = await this.paletteElement();
    if (!search) return;
    if (search.isOpen) search.close({
      reason: "close"
    });else {
      this.closeSites();
      search.open();
    }
  }

  closePalette() {
    const search = this.element.querySelector("sf-search.sf-admin-nav-search");
    if (search?.isOpen) search.close({
      reason: "api"
    });
  } // sf-search's provider (its simple path, which wraps it in a host of
  // simai.search-port): the port's search.query answered in the provider's
  // shape. A group is a scope of the window, with its results page (more);
  // a result of kind action is a command. The empty query is asked when the
  // window opens: its commands are the quick actions. A host that cannot
  // answer is the window's error state with «Повторить»; a refusal is an
  // empty answer.


  async askPalette(query, {
    signal
  } = {}) {
    const sequence = ++this._paletteSequence;
    const answer = await this.raise("search.query", {
      query: String(query ?? ""),
      sequence
    });
    if (signal?.aborted || sequence !== this._paletteSequence) return {
      groups: [],
      items: []
    };
    if (answer.answer === "unavailable") throw new Error(answer.reason || "unavailable");
    if (answer.answer !== "applied") return {
      groups: [],
      items: []
    };
    const groups = [];
    const items = [];
    const choices = new Map();
    (answer.groups ?? []).forEach((group, at) => {
      const key = String(group.key ?? `group-${at}`);
      const list = group.items ?? [];
      if (!list.length && !group.more) return;
      const scope = {
        id: key,
        label: group.label ?? key
      };
      if (group.more?.href) scope.more = group.more.href;
      if (Number.isInteger(group.total)) scope.count = group.total;
      groups.push(scope);
      list.forEach((item, index) => {
        const action = item.kind === "action";
        const id = String(item.key ?? `${key}:${index}`);
        choices.set(id, {
          group: key,
          item
        });
        items.push({
          id,
          group: key,
          title: item.label ?? "",
          path: item.caption ?? "",
          icon: item.icon || (action ? "bolt" : "description"),
          ...(action ? {
            action: id
          } : {
            href: item.href ?? ""
          }),
          ...(item.shortcut ? {
            shortcut: item.shortcut
          } : {})
        });
      });
    });
    this._paletteChoices = choices;
    return {
      groups,
      items
    };
  } // A result chosen in the window: the port is told (search.choose), and an
  // applied answer is the menu's navigate, with the address the host gave;
  // the browser does not go there itself, as a row of the menu does not.
  // What the menu did not hand -- a group's results page, a page from the
  // recent list -- is an ordinary link the window follows.


  async onPaletteNavigate(event) {
    const chosen = this._paletteChoices.get(String(event.detail?.id ?? ""));

    if (!chosen) return;
    event.preventDefault();
    const answer = await this.raise("search.choose", {
      group: chosen.group,
      key: chosen.item.key
    });
    if (answer.answer !== "applied") return;
    const href = answer.href ?? chosen.item.href ?? null;
    if (!this.mayLeave({
      id: chosen.item.key,
      key: chosen.item.key,
      href
    })) return;

    if (chosen.item.kind !== "action" && this.navigation) {
      this.navigation = { ...this.navigation,
        current: chosen.item.key
      };
      this.update("open");
    }
  } // The palette's key: the port's search_shortcut, else the element's
  // search-shortcut setting, else mod+k (AM-3).


  paletteShortcut() {
    const own = String(this.element.getAttribute?.("search-shortcut") ?? "").trim();
    const named = paletteShortcut(this.navigation);
    if (named !== PALETTE_SHORTCUT) return named;
    return own && (0,_component_kbd_js_shortcut__WEBPACK_IMPORTED_MODULE_6__.parseShortcut)(own) ? own : PALETTE_SHORTCUT;
  } // ─── notifications (C340-C342, AM-19, AM-43, AM-44) ────────────────────
  // The bell opens the notifications panel on the right over the page.
  //
  // The set's panel first (1.15.1): a page that holds the set's list,
  // sf-admin-notifications in its panel look, inside an sf-drawer, has its
  // panel opened by the bell -- the list reads the same port, so the bell's
  // number and the list agree. A list in the page look (the history page)
  // is not a panel. Without such a list the menu draws its own: the
  // Framework's sf-drawer (size 2, 30rem, not modal), its list read from
  // the port (notifications.load) when it opens, «Прочитать все», «Вся
  // история» (notifications.href) and «Настройки уведомлений» (the answer's
  // settings_href). That panel lives beside the page, as the shared menu
  // does, so a draw of the menu does not take it away. Either way the bell
  // says aria-expanded, and the focus comes back to it when the panel closes.


  async toggleNotifications(anchor) {
    const set = setNoticesPanel();
    const drawer = set ? await this.setNoticesDrawer(set.drawer) : await this.noticesDrawer();
    if (!drawer) return;

    if (drawer.hasAttribute("open")) {
      drawer.close?.();
      return;
    }

    this._noticesAnchor = anchor ?? null;

    if (set) {
      // The bell is the panel's switch: the drawer stands its close on
      // the bell's axis and gives the focus back to it.
      const id = drawer.drawerId || drawer.id;
      if (id) anchor?.setAttribute?.("aria-controls", id);
      drawer._openerHint = anchor ?? null;
      set.list.refresh?.();
    } else {
      await this.loadNotices();
    }

    drawer.open?.();
    if (set) drawer._openerHint = null;
    this.update("notifications");
  } // The page's drawer that holds the set's list, watched once: its open
  // state is the bell's aria-expanded.


  async setNoticesDrawer(drawer) {
    if (!this.offers("notifications")) return null;
    if (!customElements.get("sf-drawer")) await globalThis.SF?.Loader?.ensure?.(["sf-drawer"], {
      timeout: _menu__WEBPACK_IMPORTED_MODULE_0__.PRESS_WAIT
    });
    if (!customElements.get("sf-drawer")) return null;

    if (this._setPanel !== drawer) {
      this._setPanel = drawer;
      this.watchNoticesDrawer(drawer);
    }

    return drawer;
  }

  watchNoticesDrawer(drawer) {
    let wasOpen = drawer.hasAttribute("open");
    new MutationObserver(() => {
      const open = drawer.hasAttribute("open");
      this._noticesAnchor?.setAttribute?.("aria-expanded", String(open));
      if (!open && wasOpen) this._noticesAnchor?.focus?.({
        preventScroll: true
      });
      wasOpen = open;
    }).observe(drawer, {
      attributes: true,
      attributeFilter: ["open"]
    });
  }

  async noticesDrawer() {
    if (!this.offers("notifications")) return null;
    if (!customElements.get("sf-drawer")) await globalThis.SF?.Loader?.ensure?.(["sf-drawer"], {
      timeout: _menu__WEBPACK_IMPORTED_MODULE_0__.PRESS_WAIT
    });
    if (!customElements.get("sf-drawer")) return null;
    let drawer = this._notices;

    if (!drawer?.isConnected) {
      drawer = document.createElement("sf-drawer");
      drawer.setAttribute("modal", "false");
      drawer.setAttribute("placement", "inline-end");
      drawer.setAttribute("size", "2");
      drawer.className = "sf-admin-nav-notices";
      drawer.dataset.sfAdminNavNotices = "";
      const body = document.createElement("div");
      body.className = "sf-admin-nav-notices-body";
      drawer.append(body); // On the body, not the drawer: sf-drawer carries its content into
      // its portal at the end of the body, where a click does not reach
      // the drawer element (up to 1.15.0 a notice opened here was never
      // read and the panel stayed open).

      body.addEventListener("click", event => this.onNoticesClick(event));
      this.watchNoticesDrawer(drawer);
      document.body.append(drawer);
      this._notices = drawer;
    }

    drawer.setAttribute("heading", this.text("notifications"));
    return drawer;
  }

  async loadNotices() {
    const body = this._notices?.querySelector(".sf-admin-nav-notices-body");
    if (!body) return;
    const answer = await this.raise("notifications.load", {});
    (0,_notices_js__WEBPACK_IMPORTED_MODULE_1__.renderNotices)(body, this, answer);

    if (Number.isInteger(answer?.unread) && this.navigation?.notifications) {
      this.navigation = { ...this.navigation,
        notifications: { ...this.navigation.notifications,
          unread: answer.unread
        }
      };
      this.update("notifications");
    }
  }

  async onNoticesClick(event) {
    const all = event.target.closest?.("[data-notices-read-all]");

    if (all) {
      event.preventDefault();
      await this.readNotices({
        all: true
      });
      return;
    }

    const link = event.target.closest?.("a[data-notice]");
    if (!link) return;
    await this.readNotices({
      keys: [link.dataset.notice],
      all: false
    }, {
      reload: false
    });
    this._notices?.close?.();
  }

  async readNotices(payload, {
    reload = true
  } = {}) {
    const answer = await this.raise("notifications.read", payload);
    if (answer.answer !== "applied") return;

    if (Number.isInteger(answer.unread) && this.navigation?.notifications) {
      this.navigation = { ...this.navigation,
        notifications: { ...this.navigation.notifications,
          unread: answer.unread
        }
      };
      this.update("notifications");
    }

    if (reload) await this.loadNotices();
  } // ─── the rail's «…» (AM-27) ────────────────────────────────────────────
  // The roots that do not fit the rail's height go under «…», the current
  // page's root never: measured on the drawn rail, from the end. Called
  // after each draw and when the window changes; draws again only when the
  // answer changes.


  fitRail() {
    const scroll = this.element.querySelector(".sf-admin-nav-first[data-compact='true'] .sf-admin-nav-scroll");

    if (!scroll || !this.wide || this.edit?.on) {
      if (this.overflowRoots.length) {
        this.overflowRoots = [];
        this.update("overflow");
      }

      return;
    }

    const rows = [...scroll.querySelectorAll("a.sf-admin-nav-row--first[data-key]")];
    const step = rows[0]?.getBoundingClientRect().height ?? 0;
    if (!step) return;
    const room = scroll.clientHeight;
    const style = getComputedStyle(scroll);
    const used = scroll.scrollHeight - (parseFloat(style.paddingBlockEnd) || 0);
    const hidden = new Set(this.overflowRoots);
    const order = this.roots().filter(row => row.kind !== "divider" && row.kind !== "heading").map(row => row.key); // Everything back first when there may be room again.

    if (used <= room && hidden.size) {
      const free = Math.floor((room - used) / step);
      if (free <= 0) return;
      const back = [...hidden].slice(0, free);
      back.forEach(key => hidden.delete(key));
    } else if (used > room) {
      let over = Math.ceil((used - room) / step) + (hidden.size ? 0 : 1);

      for (const key of [...order].reverse()) {
        if (over <= 0) break;
        if (hidden.has(key)) continue;
        const row = this.rootByKey(key);
        if (!row || row.key === FAVOURITES_ROOT || this.holdsCurrent(row) || this.isCurrent(row.key)) continue;
        hidden.add(key);
        over--;
      }
    } else return;

    const next = order.filter(key => hidden.has(key));
    if (next.join("\n") === this.overflowRoots.join("\n")) return;
    this.overflowRoots = next;
    this.update("overflow");
  }

  openOverflow(anchor) {
    const entries = this.overflowRoots.map(key => this.rootByKey(key)).filter(Boolean).map(row => ({
      id: `root:${row.key}`,
      text: row.label,
      icon: row.icon || undefined
    }));
    return (0,_menu__WEBPACK_IMPORTED_MODULE_0__.openMenu)(this, anchor, {
      label: this.text("moreSections"),
      entries,
      side: "inline-end",
      align: "start",
      select: id => {
        const key = String(id ?? "").replace(/^root:/u, "");
        const row = this.rootByKey(key);
        if (row) return this.openRow(row, null);
        return null;
      }
    });
  } // ─── the rail's short menu (C325 В, AM-22, AM-61) ──────────────────────
  // A right click on a rail root, or Shift+F10 and the menu key on it:
  // «Выше», «Ниже», «Скрыть из меню» and «Настроить меню…».


  openRootMenu(row, anchor) {
    if (this.edit?.on || !row || row.kind === "divider" || row.kind === "heading") return null;
    const mayChange = Boolean(this.navigation?.rights?.edit_personal) && this.offers("menu-profiles");
    const locked = Boolean(row.locked);
    const entries = [{
      type: "heading",
      text: row.label
    }];

    if (mayChange && row.key !== FAVOURITES_ROOT) {
      entries.push({
        id: "up",
        text: this.text("moveUp"),
        icon: "arrow_upward",
        disabled: locked
      }, {
        id: "down",
        text: this.text("moveDown"),
        icon: "arrow_downward",
        disabled: locked
      }, {
        id: "hide",
        text: locked ? this.text("lockedHide") : this.text("hideFromMenu"),
        icon: locked ? "lock" : "visibility_off",
        disabled: locked
      });
    }

    if (this.canEdit()) {
      entries.push({
        type: "separator"
      }, {
        id: "configure",
        text: `${this.text("configureMenu")}…`,
        icon: "tune"
      });
      this.prefetchEdit();
    }

    if (entries.length < 2) return null;
    return (0,_menu__WEBPACK_IMPORTED_MODULE_0__.openMenu)(this, anchor, {
      label: row.label,
      entries,
      side: "inline-end",
      align: "start",
      select: id => {
        if (id === "up") return this.moveRoot(row.key, -1);
        if (id === "down") return this.moveRoot(row.key, 1);
        if (id === "hide") return this.hideRoot(row.key);
        if (id === "configure") return this.startEdit(row.key);
        return null;
      }
    });
  } // After a draw: the rail's «…» is measured, and the host says whether
  // the section column is open (data-column open | hidden | none), so a
  // page frame reserves the rail alone when it is not (AM-49).


  rendered() {
    const state = this.edit?.on ? "open" : this.columnState();
    if (this.element.getAttribute("data-column") !== state) this.element.setAttribute("data-column", state);
    this.fitRail();
    if (this.pendingFocus) this.focusPending();
  }

  shownRoot() {
    const key = this.shownColumn();
    return key && key !== OBJECT_MENU ? this.rootByKey(key) : null;
  }

  context() {
    return {
      controller: this,
      text: key => this.text(key),
      status: this.status,
      message: this.message,
      navigation: this.navigation,
      wide: this.wide,
      compact: this.compact && this.wide,
      overflowRoots: this.overflowRoots,
      // The rail's tooltips, collected while the template draws (template.js).
      tips: [],
      tipPrefix: this.tipPrefix,
      level: this.level,
      screen: this.screen,
      openRoot: this.shownRoot(),
      objectMenu: this.shownColumn() === OBJECT_MENU ? this.objectMenu() : null,
      // The button that opens a closed column: drawn when the column is
      // closed on a wide screen and the page has something for it.
      columnClosed: this.columnState() === "hidden",
      filter: this.filter,
      sites: this.sites,
      shortcut: this.paletteShortcut(),
      columnShortcut: COLUMN_SHORTCUT,
      edit: this.edit,
      columns: skeletonColumns(this.element)
    };
  }

} // How many columns the skeleton draws (sf-admin-menu expected-columns): the
// columns the answered menu will take on a wide screen, which the server
// knows -- one where the page's row has no open root (the dashboard), two
// where it has. The shape of the first paint, never a limit.
// A person who hid the column has the rail alone from the first paint
// (AM-20, AM-49): the skeleton is the rail, not two columns.

function skeletonColumns(element) {
  if (element?.getAttribute?.("expected-columns") === "1") return 1;
  return preferences()?.read(MENU_PREFERENCE)?.second === false ? 1 : 2;
}
__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ },

/***/ "34a1547d1b56"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   counterOf: () => (/* binding */ counterOf),
/* harmony export */   dotPhrase: () => (/* binding */ dotPhrase),
/* harmony export */   nameWithCounter: () => (/* binding */ nameWithCounter)
/* harmony export */ });
/* harmony import */ var _words_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("188c7bc61b17");
 // A row's counter (simai/ui-source#12): a number capped at 99+, nothing at 0,
// the digits hidden from assistive technology and the phrase («8
// непрочитанных») in the row's name. A word that is not a number is a dot,
// the word in the name. The menu draws it itself, with no data-count for the
// Framework's badge runtime to keep: each bundle that names the badges unit
// boots its own copy of that runtime, and on a count whose phrase it joins to
// an aria-label the copies took each other's names for the author's and the
// page never settled (2026-10-21). Moved here from the items menu's template,
// which went with the items path (AM-7).

const COUNTER_CAP = 99;
const COUNTER_TEXT = (0,_words_js__WEBPACK_IMPORTED_MODULE_0__.wordsOf)({
  count: "count",
  dot: "dot"
});
const PLURAL_CATEGORIES = ["zero", "one", "two", "few", "many", "other"];

function pageLocale() {
  return String(document.documentElement?.lang || "en").toLowerCase().split("-")[0];
}

function countPhrase(count) {
  // The Framework's own phrase when its badge runtime is on the page (it knows
  // the languages registered with SF.language); the same words otherwise.
  try {
    const phrase = globalThis.SF?.AnchoredBadge?.state?.({
      count
    }, document.documentElement)?.phrase;
    if (phrase) return phrase;
  } catch {// The menu's own words below.
  }

  const locale = pageLocale();
  const forms = (COUNTER_TEXT[locale] || COUNTER_TEXT.en).count.split("|");
  let form = forms[forms.length - 1];

  try {
    const rules = new Intl.PluralRules(locale);
    const has = new Set(rules.resolvedOptions().pluralCategories);
    const index = PLURAL_CATEGORIES.filter(category => has.has(category)).indexOf(rules.select(count));
    form = forms[Math.min(Math.max(index, 0), forms.length - 1)];
  } catch {// The last form.
  }

  return form.replaceAll("{count}", String(count));
}
/**
 * What a counter shows and says: null when it shows nothing (empty, 0 or
 * less); else {dot, text, phrase} -- `text` the figures drawn (capped), empty
 * for a dot; `phrase` what joins the name.
 */


function counterOf(value, dotPhrase = "") {
  const source = String(value ?? "").trim();
  if (!source) return null;
  const number = Number(source);

  if (Number.isFinite(number)) {
    const count = Math.trunc(number);
    if (count <= 0) return null;
    return {
      dot: false,
      text: count > COUNTER_CAP ? `${COUNTER_CAP}+` : String(count),
      phrase: countPhrase(count)
    };
  }

  return {
    dot: true,
    text: "",
    phrase: dotPhrase || source
  };
}
/** A name with a counter's phrase after it: «Входящие, 8 непрочитанных». */

function nameWithCounter(name, counter) {
  const words = String(name ?? "").trim();
  if (!counter?.phrase) return words;
  return words ? `${words}, ${counter.phrase}` : counter.phrase;
}
/** The dot phrase of the page language, for a dot that names nothing. */

function dotPhrase() {
  return (COUNTER_TEXT[pageLocale()] || COUNTER_TEXT.en).dot;
}

/***/ },

/***/ "67699dc7dedc"
(module, __webpack_exports__, __webpack_require__) {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   newProfileKinds: () => (/* binding */ newProfileKinds),
/* harmony export */   renderEditHeader: () => (/* binding */ renderEditHeader),
/* harmony export */   renderEditRoots: () => (/* binding */ renderEditRoots),
/* harmony export */   renderEditRows: () => (/* binding */ renderEditRows)
/* harmony export */ });
/* harmony import */ var lit__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("2a080a730149");
/* harmony import */ var _core_js_icon_choices_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("1b42c5117087");
/* harmony import */ var _controller__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("ad305dc3f27b");
/* harmony import */ var _menu__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("fa118548e966");
/* harmony import */ var _component_kbd_js_shortcut__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__("151a293c8c90");
/* harmony import */ var _context_menu_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__("86bf08ce68be");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([lit__WEBPACK_IMPORTED_MODULE_0__, _core_js_icon_choices_js__WEBPACK_IMPORTED_MODULE_1__, _controller__WEBPACK_IMPORTED_MODULE_2__]);
([lit__WEBPACK_IMPORTED_MODULE_0__, _core_js_icon_choices_js__WEBPACK_IMPORTED_MODULE_1__, _controller__WEBPACK_IMPORTED_MODULE_2__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);
/* harmony import */ var lit__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lit__WEBPACK_IMPORTED_MODULE_0__);





 // The edit mode (assignment, section 7): both columns at once, a banner with
// the profile being edited and what that means, and on every row a handle, an
// eye and a ⋯. Rows are moved with sf-sortable -- a mouse, a finger on the
// handle, or the keyboard -- and only here: a drag outside the edit mode is
// not an edit (owner, 2026-10-11). Everything applies at once.

const icon = (name, rootClass = "sf-admin-nav-row-icon") => name ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<sf-icon root-class=${rootClass} aria-hidden="true" icon=${name}></sf-icon>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing; // What a new profile can be. A person has one personal profile, so with one
// already made a new profile is shared -- offered only to whoever may make
// shared ones; without one, it is theirs unless they may and choose otherwise.


function newProfileKinds(controller) {
  const navigation = controller.navigation;
  const hasPersonal = (navigation?.profiles?.list ?? []).some(entry => entry.kind === "personal");
  const mayShare = Boolean(navigation?.rights?.create_shared);
  return {
    personal: !hasPersonal && Boolean(navigation?.rights?.edit_personal),
    shared: mayShare
  };
} // The profile being edited is chosen, made, renamed, removed and reset in the
// Framework's profile picker (owner, 2026-10-14): one place for all of it,
// rather than a button opening a menu and a form opening under the banner.

function profilePickerEntries(controller) {
  return (controller.navigation?.profiles?.list ?? []).map(entry => ({
    id: entry.key,
    label: entry.label,
    shared: entry.kind === "shared",
    builtin: !entry.renamable && !entry.removable && entry.kind === "shared",
    editable: controller.mayEdit(entry) && (entry.renamable || entry.removable)
  }));
} // The setting header (owner decision C326 = C298; AM-41, AM-42, AM-61): one
// header inside the menu, nothing in the page's content -- the title with
// «Готово», the levels «Лично» / «Для всех» / «Профиль настроек» in the
// words of the views, a one-line note of who sees it and how it is saved,
// the lock line naming the sections an administrator fixed, and «Сбросить» /
// «Сохранить для всех». «Лично» applies at once; a shared level is a draft
// that reaches its people only by «Сохранить для всех». «Профиль настроек»
// names the role's profile in SIMAI Framework's profile picker, where one is
// made, renamed and removed.


const LEVEL_WORDS = {
  personal: "levelPersonal",
  everyone: "levelEveryone",
  role: "levelRole"
};
const LEVEL_NOTES = {
  personal: "notePersonal",
  everyone: "noteEveryone",
  role: "noteRole"
};

function renderRolePicker(context) {
  const {
    controller,
    text,
    edit
  } = context;
  const kinds = newProfileKinds(controller);
  const roles = new Set(controller.roleProfiles().map(entry => entry.key));
  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<sf-profile-picker class="sf-admin-nav-edit-role" label=${text("levelRole")}
        current=${controller.navigation?.profiles?.current ?? ""} message=${edit.message || ""}
        .profiles=${profilePickerEntries(controller).filter(entry => roles.has(entry.id))}
        .rights=${{
    create: {
      personal: false,
      shared: kinds.shared
    }
  }}
        @sf-profile-picker-select=${event => controller.chooseLevel("role", event.detail.id)}
        @sf-profile-picker-create=${event => controller.createProfile(event.detail.label, true)}
        @sf-profile-picker-rename=${event => controller.renameProfile(event.detail.label, event.detail.id)}
        @sf-profile-picker-delete=${event => controller.deleteProfile(event.detail.id)}></sf-profile-picker>`;
}

function renderEditHeader(context) {
  const {
    controller,
    text,
    edit,
    level
  } = context;
  const levels = controller.levels();
  const draft = controller.isDraft();
  const note = draft && level.dirty ? text("noteDirty") : text(LEVEL_NOTES[level.key] ?? "notePersonal");
  const locked = level.key === "personal" ? controller.lockedNames() : [];
  const items = levels.map(key => `${key}::${text(LEVEL_WORDS[key])}`).join("|");
  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class="sf-admin-nav-edit-head" role="region" aria-label=${text("settingTitle")}>
        <div class="sf-admin-nav-edit-title">
            <span class="sf-admin-nav-edit-name">${text("settingTitle")}</span>
            <sf-button size="1/2" @click=${() => controller.exitEdit()} text=${text("done")}></sf-button>
        </div>
        ${levels.length > 1 ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<sf-segmented class="sf-admin-nav-edit-levels" size="1/2" name="level"
            aria-label=${text("levelLabel")} value=${level.key} items=${items}
            @change=${event => controller.chooseLevel(event.detail?.value ?? event.target?.value)}></sf-segmented>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
        ${level.key === "role" ? renderRolePicker(context) : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
        <p class="sf-admin-nav-edit-note">${note}</p>
        ${locked.length ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<p class="sf-admin-nav-edit-why">${icon("lock", "")}<span>${text("lockedBy")} ${locked.map(name => `«${name}»`).join(", ")}.</span></p>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
        ${edit.message && level.key !== "role" ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<p class="sf-admin-nav-edit-message" role="status">${edit.message}</p>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
        <div class="sf-admin-nav-edit-actions">
            <sf-button size="1/2" appearance="outline" ?disabled=${!controller.canReset()} text=${text("reset")}
                @click=${() => controller.resetProfile()}></sf-button>
            ${draft ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<sf-button size="1/2" ?disabled=${!level.dirty} text=${text("saveForAll")}
                @click=${() => controller.saveDraft()}></sf-button>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
        </div>
    </div>`;
} // A row's menu from a right click or the context-menu key (decision C164
// (1)(2), defect TL-2): the same menu, with the same list, as the row's ⋯ --
// at the pointer (context-menu.js), or from the keyboard at the ⋯ itself.

function onRowContextMenu(context, row, event) {
  if (event.shiftKey || (0,_component_kbd_js_shortcut__WEBPACK_IMPORTED_MODULE_4__.isEditableTarget)(event.target)) return;
  event.preventDefault();
  const point = (0,_context_menu_js__WEBPACK_IMPORTED_MODULE_5__.pointAnchor)(event);
  Promise.resolve(openRowMenu(context, row, point, () => point.remove())).then(opened => {
    if (!opened) point.remove();
  });
}

function onRowKeydown(context, row, event) {
  if (!(0,_context_menu_js__WEBPACK_IMPORTED_MODULE_5__.isMenuKey)(event) || (0,_component_kbd_js_shortcut__WEBPACK_IMPORTED_MODULE_4__.isEditableTarget)(event.target)) return;
  const button = event.currentTarget.querySelector(":scope > .sf-admin-nav-edit-button");
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();
  openRowMenu(context, row, button);
}

function openRowMenu(context, row, anchor, onClose = null) {
  const {
    controller,
    text
  } = context;
  const renamed = row.package_label && row.label !== row.package_label; // Every row's menu says something: a divider's had nothing to offer that was
  // not its own (a package's line cannot be renamed or deleted), so its ⋯ did
  // nothing at all. Showing and hiding is in it for every row, and a line of
  // one's own can be deleted; it moves by its handle like any row.

  const entries = [row.kind !== "divider" ? {
    id: "rename",
    text: text("rename"),
    icon: "edit"
  } : null, renamed ? {
    id: "package-name",
    text: text("packageName"),
    icon: "undo"
  } : null, {
    id: "visibility",
    text: row.hidden ? text("show") : text("hide"),
    icon: row.hidden ? "visibility" : "visibility_off"
  }, row.own ? {
    id: "delete",
    text: text("deleteRow"),
    icon: "delete",
    danger: true
  } : null, // A section is fixed for everyone from a shared level only (AM-42).
  controller.isDraft() && row.kind !== "divider" ? {
    type: "separator"
  } : null, controller.isDraft() && row.kind !== "divider" ? {
    id: "lock",
    text: row.locked ? text("unlock") : text("lockForAll"),
    icon: row.locked ? "lock_open" : "lock"
  } : null].filter(Boolean);
  if (!entries.length) return null;
  return (0,_menu__WEBPACK_IMPORTED_MODULE_3__.openMenu)(controller, anchor, {
    label: `${text("more")}: ${row.label ?? ""}`,
    entries,
    onClose,
    select: id => {
      if (id === "rename") {
        controller.edit = { ...controller.edit,
          renaming: row.key
        };
        return controller.update("edit");
      }

      if (id === "package-name") return controller.returnPackageName(row.key);
      if (id === "visibility") return controller.toggleHidden(row.key);
      if (id === "delete") return controller.removeOwnRow(row.key);
      if (id === "lock") return controller.setLocked(row.key, !row.locked);
      return null;
    }
  });
}

function renderRenaming(context, row) {
  const {
    controller
  } = context;
  let value = row.label ?? "";
  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<form class="sf-admin-nav-edit-rename" @submit=${event => {
    event.preventDefault();
    controller.renameRow(row.key, value);
  }}
        @keydown=${event => {
    if (event.key === "Escape") {
      event.stopPropagation();
      controller.renameRow(row.key, "");
    }
  }}>
        <sf-input size="1/2" value=${value} autofocus
            @input=${event => {
    value = event.target?.value ?? event.detail?.value ?? "";
  }}></sf-input>
    </form>`;
} // The row's glyph as a chooser: the glyph itself opens a grid of the admin's
// icons with a search, the dropdown a record section's glyph is chosen with.


function renderIconChooser(context, row) {
  const {
    controller,
    text
  } = context;
  const current = row.icon ? String(row.icon) : "";
  const options = _core_js_icon_choices_js__WEBPACK_IMPORTED_MODULE_1__.ICON_CHOICES.map(name => ({
    kind: "icon",
    icon: name,
    text: name,
    value: name,
    ariaLabel: name,
    selected: name === current
  }));
  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<sf-dropdown class="sf-admin-nav-edit-icon" size="1/2" layout="grid" columns="6" search="true"
        search-placeholder=${text("chooseIcon")} aria-label=${`${text("chooseIcon")}: ${row.label ?? ""}`}
        value=${current} .options=${options}
        @change=${event => controller.setRowIcon(row.key, event.detail?.value ?? "")}>
        <sf-button-icon slot="trigger" size="1/2" appearance="ghost" scheme="on-surface" icon=${current || "add_photo_alternate"}
            aria-label=${`${text("chooseIcon")}: ${row.label ?? ""}`}></sf-button-icon>
    </sf-dropdown>`;
} // One editable row: the handle, what it is, and its eye and ⋯. A divider is a
// line with the same controls, so it can be moved and hidden like a row.


function renderEditRow(context, row, {
  draggable = true
} = {}) {
  const {
    controller,
    text,
    edit,
    openRoot
  } = context; // A section an administrator fixed for everyone keeps its place in the
  // person's menu: its handle is a lock, its reason in a tooltip on hover
  // and focus (AM-42). Nothing else is silently fixed.

  const locked = controller.isLocked(row);
  const movable = draggable && !locked;
  const name = row.kind === "divider" ? text("addDivider") : row.label; // A root still opens its column in the edit mode: its rows are edited there.

  const label = row.kind === "root" ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`${renderIconChooser(context, row)}<button type="button" class="sf-admin-nav-edit-open" aria-expanded=${String(openRoot?.key === row.key)}
            data-open=${openRoot?.key === row.key ? "true" : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
            @click=${() => controller.openRootColumn(row.key)}>
            <span class="sf-admin-nav-row-label">${row.label}</span>
            ${icon("chevron_right", "sf-admin-nav-row-chevron")}</button>` : (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`${row.kind === "heading" ? lit__WEBPACK_IMPORTED_MODULE_0__.nothing : renderIconChooser(context, row)}
            <span class="sf-admin-nav-row-label" data-heading=${row.kind === "heading" ? "true" : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}>${row.label}</span>`;
  const lockTip = locked ? `${context.tipPrefix}-lock-${row.key}` : null;
  const reason = row.locked?.reason || text("lockedReason");
  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class="sf-admin-nav-edit-row" data-sf-sortable-item=${movable ? row.key : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
        data-hidden=${row.hidden ? "true" : lit__WEBPACK_IMPORTED_MODULE_0__.nothing} data-kind=${row.kind} data-locked=${locked ? "true" : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
        @contextmenu=${event => onRowContextMenu(context, row, event)}
        @keydown=${event => onRowKeydown(context, row, event)}>
        ${locked ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<span class="sf-admin-nav-edit-handle sf-admin-nav-edit-lock" tabindex="0" role="img"
            aria-label=${reason} data-tooltip=${lockTip}>${icon("lock", "")}</span>
            <sf-tooltip id=${lockTip} appearance="dark" arrow="inline-start" text=${reason}></sf-tooltip>` : movable ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<span class="sf-admin-nav-edit-handle" data-sf-sortable-handle aria-hidden="true">${icon("drag_indicator", "")}</span>` : (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<span class="sf-admin-nav-edit-handle"></span>`}
        ${edit.renaming === row.key ? renderRenaming(context, row) : row.kind === "divider" ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<hr class="sf-admin-nav-divider sf-admin-nav-edit-line" aria-label=${name}>` : label}
        <!-- The eye on every row (AM-24): showing and hiding at one press, as
             in the views' settings; the ⋯ keeps the rest. A fixed section
             cannot be hidden in a personal menu. -->
        ${row.kind === "divider" || locked ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<span class="sf-admin-nav-edit-spacer"></span>` : (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<button type="button" class="sf-admin-nav-edit-button sf-admin-nav-edit-eye"
            aria-pressed=${row.hidden ? "false" : "true"} aria-label=${`${row.hidden ? text("show") : text("hide")}: ${name}`}
            @click=${() => controller.toggleHidden(row.key)}>${icon(row.hidden ? "visibility_off" : "visibility", "")}</button>`}
        <button type="button" class="sf-admin-nav-edit-button" aria-haspopup="menu" aria-expanded="false"
            aria-label=${`${text("more")}: ${name}`}
            @click=${event => openRowMenu(context, row, event.currentTarget)}>
            ${icon("more_horiz", "")}</button>
    </div>`;
} // The site's roots are one list to reorder; the install stays apart, as it is
// outside the edit mode, because it is not the site's.


function renderEditRoots(context, siteRoots, installRoots) {
  const {
    text
  } = context; // The top level takes a line, a heading or a link of one's own, as a
  // root's column does: it had no add, so its first line had no way back once
  // it was deleted (owner, 2026-10-13).
  // Rows move between the top level and the open section's column (owner,
  // 2026-10-14); a section stays at the top level -- the menu is two deep.

  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<sf-sortable id=${`${_controller__WEBPACK_IMPORTED_MODULE_2__.LIST_ID}roots`} group="admin-nav-roots" accepts="admin-nav-rows" label=${text("editMenu")}
        class="sf-admin-nav-edit-list">
        ${siteRoots.map(row => renderEditRow(context, row))}
    </sf-sortable>
    ${renderAdd(context, {
    key: "roots"
  })}
    ${installRoots.length ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<hr class="sf-admin-nav-divider">
        <sf-sortable id=${`${_controller__WEBPACK_IMPORTED_MODULE_2__.LIST_ID}install`} group="admin-nav-install" label=${text("editMenu")} class="sf-admin-nav-edit-list">
            ${installRoots.map(row => renderEditRow(context, row))}
        </sf-sortable>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}`;
}

function renderAdd(context, root) {
  const {
    controller,
    text,
    edit
  } = context; // The link form opens in the list it was asked for: one flag for both
  // columns showed it in the top level and in the open root at once.

  if (edit.adding === `link:${root.key}`) {
    // Kept by the controller, so a refusal or a render leaves the form as
    // it was typed; the address is checked before it is sent.
    const draft = edit.draft ?? {};

    const keep = patch => {
      controller.edit = { ...controller.edit,
        draft: { ...controller.edit.draft,
          ...patch
        }
      };
    };

    return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<form class="sf-admin-nav-edit-form" @submit=${event => {
      event.preventDefault();
      const [labelField, hrefField] = event.currentTarget.querySelectorAll("sf-input");
      controller.addLink(root.key, labelField?.value ?? draft.label ?? "", hrefField?.value ?? draft.href ?? "");
    }}>
            <sf-input size="1/2" placeholder=${text("linkLabel")} .value=${draft.label ?? ""}
                @input=${event => keep({
      label: event.target?.value ?? ""
    })}></sf-input>
            <sf-input size="1/2" placeholder=${text("linkHref")} .value=${draft.href ?? ""}
                @input=${event => keep({
      href: event.target?.value ?? ""
    })}></sf-input>
            ${edit.linkError ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<p class="sf-admin-nav-edit-message" role="alert">${edit.linkError}</p>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
            <div class="sf-admin-nav-edit-actions">
                <sf-button size="1/2" @click=${event => event.target.closest("form")?.requestSubmit()} text=${text("add")}></sf-button>
                <sf-button size="1/2" appearance="ghost" scheme="on-surface"
                    @click=${() => {
      controller.edit = { ...controller.edit,
        adding: null,
        draft: null,
        linkError: ""
      };
      controller.update("edit");
    }} text=${text("cancel")}></sf-button>
            </div>
        </form>`;
  }

  const choose = anchor => (0,_menu__WEBPACK_IMPORTED_MODULE_3__.openMenu)(controller, anchor, {
    label: text("add"),
    entries: [// A section of one's own, at the top level only: a row with its
    // own column, where links, headings and lines are added as in any
    // root's (owner, 2026-10-13).
    ...(root.key === "roots" ? [{
      id: "root",
      text: text("addSection"),
      icon: "folder"
    }] : []), {
      id: "divider",
      text: text("addDivider"),
      icon: "horizontal_rule"
    }, {
      id: "heading",
      text: text("addHeading"),
      icon: "title"
    }, {
      id: "link",
      text: text("addLink"),
      icon: "link"
    }],
    select: id => {
      if (id === "link") {
        controller.edit = { ...controller.edit,
          adding: `link:${root.key}`,
          draft: null,
          linkError: ""
        };
        return controller.update("edit");
      }

      return controller.addOwnRow(root.key, id);
    }
  });

  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<button type="button" class="sf-admin-nav-row sf-admin-nav-add" aria-haspopup="menu" aria-expanded="false"
        @click=${event => choose(event.currentTarget)}>
        ${icon("add")}<span class="sf-admin-nav-row-label">${text("add")}</span></button>`;
}

function renderEditRows(context, root) {
  const {
    text
  } = context;
  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<sf-sortable id=${`${_controller__WEBPACK_IMPORTED_MODULE_2__.LIST_ID}${root.key}`} group="admin-nav-rows" accepts="admin-nav-roots" label=${root.label ?? text("editMenu")}
        class="sf-admin-nav-edit-list">
        ${(root.children ?? []).map(row => renderEditRow(context, row))}
    </sf-sortable>
    ${renderAdd(context, root)}`;
}
__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ },

/***/ "fa118548e966"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PRESS_WAIT: () => (/* binding */ PRESS_WAIT),
/* harmony export */   closeMenu: () => (/* binding */ closeMenu),
/* harmony export */   menuOpenFor: () => (/* binding */ menuOpenFor),
/* harmony export */   menuOpened: () => (/* binding */ menuOpened),
/* harmony export */   openMenu: () => (/* binding */ openMenu),
/* harmony export */   removeMenu: () => (/* binding */ removeMenu),
/* harmony export */   updateMenu: () => (/* binding */ updateMenu)
/* harmony export */ });
// The navigation's menus are the Framework's standard menu (owner,
// 2026-10-12): one sf-menu-context beside the page, filled with the entries of
// whichever menu is asked for and opened for the control that asked. It lives
// outside the navigation's own rendering, so a re-render of the columns does
// not take an open menu away.
// The standard menu is a lazy relation: fetched after the page is ready, so a
// press that comes before it has arrived asks the Loader for it and waits.
// A press waits for the part it opens as long as a slow network needs (the
// Loader's ensure gives up after 3 s by default; on a slow 3G line the
// standard menu and its parts take longer, and the press then did nothing).
const PRESS_WAIT = 30000;

async function standardMenuDefined() {
  await globalThis.SF?.Loader?.ensure?.(["sf-menu-context"], {
    timeout: PRESS_WAIT
  });
  return Boolean(customElements.get("sf-menu-context"));
} // The navigation's widths, in the Framework's kinds (decision C32): "trigger"
// (the site switcher) is "list", at least the switcher, up to the list step;
// "panel" (the person menu) is the profile picker's panel, the panel step or
// the trigger, whichever is wider. Anything else is "content".


const OPEN_WIDTH = {
  trigger: "list",
  panel: "panel"
};
async function openMenu(controller, anchor, {
  label,
  entries,
  select,
  change = null,
  submenu = "flyout",
  side = "block-end",
  align = "start",
  width = "content",
  search = null,
  onSearch = null,
  onClose = null
}) {
  if (!(anchor instanceof Element)) return null;
  if (!(await standardMenuDefined())) return null;
  let menu = controller._menu;

  if (!menu?.isConnected) {
    menu = document.createElement("sf-menu-context");
    menu.setAttribute("popup", "");
    menu.dataset.sfAdminNavMenu = "";
    menu.addEventListener("sf-menu-context-select", event => controller._menuSelect?.(event.detail?.id, event));
    menu.addEventListener("sf-menu-context-search", event => controller._menuSearch?.(event.detail?.query ?? "")); // A value row's fact (a choice of the person menu, C176): the menu has
    // already shown it; the host applies and keeps it.

    menu.addEventListener("sf-menu-context-changed", event => {
      if (event.target === menu) controller._menuChange?.(event.detail?.id, event.detail?.value, event);
    }); // Closed, not asked to close: sf-menu-context-close is the cancelable
    // request sent before an owned menu closes (SIMAI Framework 1.3.8 §19.3).

    menu.addEventListener("sf-menu-context-closed", event => {
      if (event.target !== menu) return;
      const closed = controller._menuClose;
      controller._menuClose = null;
      closed?.();
    });
    (controller.element.closest("dialog[open]") || document.body).append(menu);
    controller._menu = menu;
  }

  if (menu.isOpen && controller._menuAnchor === anchor) {
    menu.close();
    return null;
  } // The menu that was open hears that it closed before another takes its place.


  if (menu.isOpen) menu.close({
    restoreFocus: false
  });
  menu.setAttribute("aria-label", label ?? ""); // The person menu drills (C176: one panel, a setting's options a level
  // deeper, the value under its name); the other menus open their submenus
  // beside the row, as before. One element serves them all, so each says.

  menu.setAttribute("submenu", submenu === "drill" ? "drill" : "flyout");
  menu.search = search;
  menu.entries = entries;
  controller._menuSelect = select;
  controller._menuChange = change;
  controller._menuSearch = onSearch;
  controller._menuClose = onClose;
  controller._menuAnchor = anchor; // "trigger" (the site switcher) is at least the button's width and wider when a line
  // needs it: exactly the button's width cut «Безопасность учётной записи»
  // and «Профиль меню» in the profile menu (Larena, 2026-10-14). That is the
  // Framework's "list" kind (decision C32, sf-menu-context 1.14.0): at least
  // the trigger, up to the list's step or the trigger, whichever is wider,
  // and both follow the page's density. The floor this menu used to write
  // itself (the trigger's px as --sf-context-menu--min-inline-size) is
  // removed, so a menu of the previous release's page does not keep it.

  menu.style.removeProperty("--sf-context-menu--min-inline-size");
  return menuOpened(await menu.openFor(anchor, {
    side,
    align,
    width: OPEN_WIDTH[width] ?? "content"
  }));
} // Whether the standard menu opened. sf-menu-context answered true or false
// before 1.12.2 and answers an outcome since ({outcome: "applied" | "refused"
// | "unavailable", ...}, SIMAI Framework fix/action-call-defects): a refused
// open is an object, truthy, and the site switcher read it as open and kept
// its list waiting for a menu that never showed. Both answers are read here,
// so the navigation works with the menu of either pair.

function menuOpened(answer) {
  return answer === true || answer?.outcome === "applied";
} // Whether the shared menu is open for this anchor now.

function menuOpenFor(controller, anchor) {
  return Boolean(controller._menu?.isOpen && controller._menuAnchor === anchor);
} // New entries for the menu -- a search answered, a page more. Set whether or
// not it has finished opening: the first answer can arrive before it has, and
// a menu that took it only when open stayed empty.

function updateMenu(controller, entries) {
  if (controller._menu) controller._menu.entries = entries;
}
function closeMenu(controller) {
  controller._menu?.close?.({
    restoreFocus: false
  });
}
function removeMenu(controller) {
  closeMenu(controller);
  controller._menu?.remove();
  controller._menu = null;
}

/***/ },

/***/ "ef6a2b4af2c6"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   renderNotices: () => (/* binding */ renderNotices)
/* harmony export */ });
// The notifications panel's list (owner decisions C340, C341; AM-44): what
// the port's notifications.load answers, in its groups -- each notice its
// words, when, a link to where it is about -- the unread ones marked, with
// «Прочитать все» at the top and «Вся история» and «Настройки уведомлений»
// at the foot. The panel is SIMAI Framework's sf-drawer beside the page
// (controller.noticesDrawer), so its body is written as markup, not drawn by
// the menu's template; every text goes in as text.
const element = (tag, className, text = null) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== null && text !== undefined) node.textContent = String(text);
  return node;
};

function renderNotices(body, controller, answer = {}) {
  const text = key => controller.text(key);

  body.replaceChildren();

  if (answer?.answer !== "applied") {
    const empty = element("sf-empty-state", "sf-admin-nav-notices-empty");
    empty.setAttribute("kind", "error");
    empty.setAttribute("size", "1/2");
    empty.setAttribute("text", text("unavailable"));
    body.append(empty);
    return;
  }

  const unread = Number.isInteger(answer.unread) ? answer.unread : 0;
  const head = element("div", "sf-admin-nav-notices-head");
  head.append(element("span", "sf-admin-nav-notices-count", unread ? `${text("noticesNew")} · ${unread}` : text("noticesNone")));

  if (unread) {
    const all = element("button", "sf-admin-nav-link-button", text("noticesReadAll"));
    all.type = "button";
    all.dataset.noticesReadAll = "";
    head.append(all);
  }

  body.append(head);

  for (const group of answer.groups ?? []) {
    const items = (group?.items ?? []).filter(item => item && item.key);
    if (!items.length) continue;
    if (group.label) body.append(element("p", "sf-admin-nav-notices-group", group.label));
    const list = element("ul", "sf-admin-nav-notices-list");

    for (const item of items) {
      const row = element("li", "sf-admin-nav-notice");
      if (item.unread) row.dataset.unread = "true";
      if (item.resolved) row.dataset.resolved = "true";
      row.append(element("span", "sf-admin-nav-notice-dot"));
      const what = element("div", "sf-admin-nav-notice-what");
      what.append(element("span", "sf-admin-nav-notice-title", item.title ?? item.label ?? ""));
      if (item.body) what.append(element("span", "sf-admin-nav-notice-meta", item.body));
      const meta = element("span", "sf-admin-nav-notice-meta");
      if (item.when) meta.append(element("span", null, item.when));

      if (item.href) {
        const link = element("a", null, text("noticeOpen"));
        link.href = item.href;
        link.dataset.notice = item.key;
        meta.append(link);
      }

      what.append(meta);
      row.append(what);
      list.append(row);
    }

    body.append(list);
  }

  const foot = element("p", "sf-admin-nav-notices-foot");
  const history = controller.navigation?.notifications?.href;

  if (typeof history === "string" && history) {
    const link = element("a", null, text("noticesHistory"));
    link.href = history;
    foot.append(link);
  }

  if (typeof answer.settings_href === "string" && answer.settings_href) {
    const link = element("a", null, text("noticesSettings"));
    link.href = answer.settings_href;
    foot.append(link);
  }

  if (foot.childElementCount) body.append(foot);
}

/***/ },

/***/ "8e0af7be6b33"
(module, __webpack_exports__, __webpack_require__) {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   renderKeys: () => (/* binding */ renderKeys),
/* harmony export */   renderPalette: () => (/* binding */ renderPalette),
/* harmony export */   renderSearchRow: () => (/* binding */ renderSearchRow)
/* harmony export */ });
/* harmony import */ var lit__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("2a080a730149");
/* harmony import */ var _tips_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("986f10cdd6ef");
/* harmony import */ var _component_kbd_js_shortcut__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("151a293c8c90");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([lit__WEBPACK_IMPORTED_MODULE_0__, _tips_js__WEBPACK_IMPORTED_MODULE_1__]);
([lit__WEBPACK_IMPORTED_MODULE_0__, _tips_js__WEBPACK_IMPORTED_MODULE_1__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);
/* harmony import */ var lit__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lit__WEBPACK_IMPORTED_MODULE_0__);


 // The ⌘K palette: a window over the page, so the same search is there in the
// two-column menu, on the rail and on a phone (assignment, section 4). The
// groups and their order are the host's; the window is SIMAI Framework's
// sf-search (renderPalette below).
// A key or a combination as SIMAI Framework's kbd unit writes it (C04, KB-2,
// K-05): one <kbd> per key, a group for a combination, the platform's caps
// (⌘K on a Mac, Ctrl+K elsewhere) and its + between words. The kbd sheet
// picks the look by the place -- plain glyphs in a list or a menu row. A menu row that is a link with role=button says
// appearance="plain" (the kbd sheet's own attribute): it is a row of a menu,
// not a button. The menu writes the keys and no look of its own.

function renderKeys(value, appearance = null) {
  const {
    keys,
    join
  } = (0,_component_kbd_js_shortcut__WEBPACK_IMPORTED_MODULE_2__.shortcutView)(value);
  if (!keys.length) return lit__WEBPACK_IMPORTED_MODULE_0__.nothing;

  const one = (key, said = null) => (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<kbd class=${key.square ? "sf-kbd--square" : lit__WEBPACK_IMPORTED_MODULE_0__.nothing} appearance=${said ?? lit__WEBPACK_IMPORTED_MODULE_0__.nothing}>${key.text}</kbd>`;

  if (keys.length === 1) return one(keys[0], appearance);
  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<kbd class="sf-kbd--group" appearance=${appearance ?? lit__WEBPACK_IMPORTED_MODULE_0__.nothing}>${keys.map((key, at) => (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`${at && join ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<span class="sf-kbd-join">+</span>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}${one(key)}`)}</kbd>`;
}

const icon = name => name ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<sf-icon root-class="sf-admin-nav-row-icon" aria-hidden="true" icon=${name}></sf-icon>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing; // The ⌘K palette is SIMAI Framework's search window, sf-search, in its admin
// command palette recipe (owner decisions C162, C175; K-04): one window for
// sections, records and commands, its dialog, combobox, rows, filters (the
// host's groups as scopes), recent queries, key hints, scrim, layer and focus
// return all the Framework's. The menu is its host: controller.paletteProvider
// asks the navigation port (search.query) and the choice goes back to it
// (search.choose, onPaletteNavigate). The element's own keys are off
// (shortcut=""): mod+k stays the menu's, heard through the kbd unit, so the
// rail and the phone open the same window and the key toggles it. Popular
// queries are not drawn: the navigation port has none.
// The window is drawn when it is first wanted (controller.paletteElement),
// not with the menu: a closed menu fetches no sf-search, nor the parts the
// window is drawn with; once drawn it stays, so it opens again at once.


function renderPalette(context) {
  const {
    controller,
    text
  } = context;
  if (!controller.offers("search") || !controller.paletteWanted) return lit__WEBPACK_IMPORTED_MODULE_0__.nothing;
  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<sf-search class="sf-admin-nav-search" shortcut="" recent-key="admin-menu" popular="false"
        label=${text("search")} placeholder=${text("paletteHint")}
        @sf-search-navigate=${event => controller.onPaletteNavigate(event)}></sf-search>`;
} // The row that opens it, under the site in the first column.

function renderSearchRow(context) {
  const {
    controller,
    text,
    compact,
    shortcut,
    wide
  } = context;
  if (!controller.offers("search")) return lit__WEBPACK_IMPORTED_MODULE_0__.nothing; // No key hints on a phone (AM-4): there is no keyboard to press them.

  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<a class="sf-admin-nav-row sf-admin-nav-row--first" href="#" role="button"
        aria-haspopup="dialog"
        aria-keyshortcuts=${(0,_component_kbd_js_shortcut__WEBPACK_IMPORTED_MODULE_2__.ariaKeyShortcuts)((0,_component_kbd_js_shortcut__WEBPACK_IMPORTED_MODULE_2__.parseShortcut)(shortcut)) || lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
        data-tooltip=${(0,_tips_js__WEBPACK_IMPORTED_MODULE_1__.tip)(context, "search", text("search"), shortcut)}
        aria-label=${compact ? text("search") : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
        @pointerenter=${() => controller.preparePalette()}
        @focus=${() => controller.preparePalette()}
        @click=${event => {
    event.preventDefault();
    controller.openPalette();
  }}>
        ${icon("search")}
        ${compact ? lit__WEBPACK_IMPORTED_MODULE_0__.nothing : (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<span class="sf-admin-nav-row-label">${text("search")}</span>
            ${wide ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<span class="sf-admin-nav-row-keys">${renderKeys(shortcut, "plain")}</span>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}`}
    </a>`;
}
__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ },

/***/ "535f6c0ba957"
(module, __webpack_exports__, __webpack_require__) {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SKELETON_ROWS: () => (/* binding */ SKELETON_ROWS),
/* harmony export */   renderNavigationSkeleton: () => (/* binding */ renderNavigationSkeleton),
/* harmony export */   renderNavigationTemplate: () => (/* binding */ renderNavigationTemplate)
/* harmony export */ });
/* harmony import */ var lit__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("2a080a730149");
/* harmony import */ var _navigation_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("ffb7641310c5");
/* harmony import */ var _avatar_js_picture__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("c69a3dc158df");
/* harmony import */ var _palette__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("8e0af7be6b33");
/* harmony import */ var _counter_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__("34a1547d1b56");
/* harmony import */ var _account__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__("4dd4db04f0f7");
/* harmony import */ var _edit__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__("67699dc7dedc");
/* harmony import */ var _context_menu_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__("86bf08ce68be");
/* harmony import */ var _component_kbd_js_shortcut__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__("151a293c8c90");
/* harmony import */ var _tips_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__("986f10cdd6ef");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([lit__WEBPACK_IMPORTED_MODULE_0__, _avatar_js_picture__WEBPACK_IMPORTED_MODULE_2__, _palette__WEBPACK_IMPORTED_MODULE_3__, _account__WEBPACK_IMPORTED_MODULE_5__, _edit__WEBPACK_IMPORTED_MODULE_6__, _tips_js__WEBPACK_IMPORTED_MODULE_9__]);
([lit__WEBPACK_IMPORTED_MODULE_0__, _avatar_js_picture__WEBPACK_IMPORTED_MODULE_2__, _palette__WEBPACK_IMPORTED_MODULE_3__, _account__WEBPACK_IMPORTED_MODULE_5__, _edit__WEBPACK_IMPORTED_MODULE_6__, _tips_js__WEBPACK_IMPORTED_MODULE_9__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);
/* harmony import */ var lit__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lit__WEBPACK_IMPORTED_MODULE_0__);









 // The rail and the section column, drawn in the element's own light DOM like
// every other Smart component, so the Framework's component stylesheets reach
// the icons, badges and fields inside it.
//
// The first level is always the rail (owner decision C320): a column of
// squares -- the place's mark, the search, the site's roots, the install's
// apart from them, and at the foot «Избранное», the bell and the person --
// each named by a tooltip on hover and focus. The section column beside it
// holds what is about where the person is: the menu of the object the page
// shows (navigation.context), else the rows of the root that holds the page,
// or a root the person clicked, until a page outside it is opened. The person
// hides and shows it (C321). The rail unfolds with its names only for the time
// of the setting mode (C325); on a phone the menu is one full screen with
// names (C322). Never more than two menus on screen (owner, 2026-11-05).

const icon = (name, rootClass = "flex-none", {
  filled = false
} = {}) => name ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<sf-icon root-class=${rootClass} aria-hidden="true" icon=${name} ?filled=${filled}></sf-icon>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing; // A count in a row of the column is SIMAI Framework's badge on a text line of
// rung 1 (line="1", sf-badge--line-1; AM-59): as tall as the line, its label a
// step down, inside the row at its end, on the middle of the first line
// (AM-53). The menu sets no size of its own on it.


const attention = row => {
  if (row.attention) {
    return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<span class="sf-admin-nav-row-end"><sf-badge appearance="tonal" size="1/3" line="1"
            status=${row.attention.tone} text=${row.attention.label}></sf-badge></span>`;
  }

  if (row.badge) {
    return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<span class="sf-admin-nav-row-end"><sf-badge size="1/3" status="error" line="1"
            text=${String(row.badge)}></sf-badge></span>`;
  } // The host writes a row's keys in the Framework's notation (mod+shift+p) or
  // as text; the kbd unit draws either (C04).


  if (row.shortcut) return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<span class="sf-admin-nav-row-keys">${(0,_palette__WEBPACK_IMPORTED_MODULE_3__.renderKeys)(row.shortcut, "plain")}</span>`;
  return lit__WEBPACK_IMPORTED_MODULE_0__.nothing;
}; // On the rail a row's counter sits on its icon, the way chat apps put one on
// an avatar (simai/ui-source#12): the icon is wrapped in the SIMAI Framework's
// badge anchor. At the anchor's 1/2 step the rule draws a dot, and the number
// and the attention words go to the row's name («Задачи, 3 непрочитанных»).
// The bell carries the number itself (C342, AM-43): its anchor is the 1 step,
// where the badge rule draws the count. Counters take the danger role (owner,
// 2026-10-21).


const railCounter = row => {
  if (row.attention) return {
    dot: true,
    text: "",
    phrase: row.attention.label || (0,_counter_js__WEBPACK_IMPORTED_MODULE_4__.dotPhrase)()
  };
  return (0,_counter_js__WEBPACK_IMPORTED_MODULE_4__.counterOf)(row.badge);
};

const railIcon = (name, counter, {
  count = false,
  filled = false
} = {}) => (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<span class=${`sf-badge-anchor sf-badge-anchor--size-${count ? "1" : "1/2"} sf-badge-anchor--square sf-admin-nav-rail-anchor`}>${icon(name, "sf-admin-nav-row-icon", {
  filled
})}${counter ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<span class=${`sf-badge sf-badge--anchored sf-badge--error${count && !counter.dot ? "" : " sf-badge--dot"}`} aria-hidden="true">${count && !counter.dot ? counter.text : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}</span>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}</span>`; // The place's mark (AM-5): SIMAI Framework's avatar picture as a square of
// the rail -- the place's own picture (site.logo) or its letters on the
// primary plate; a place with neither shows the product's mark
// (navigation.product.logo) in the same square.


function mark(context, site) {
  const product = context.navigation?.product;
  const imageUrl = site?.logo || !site?.mark && product?.logo || "";
  return (0,_avatar_js_picture__WEBPACK_IMPORTED_MODULE_2__.avatarPicture)({
    imageUrl,
    name: site?.label ?? "",
    text: site?.mark || "",
    shape: "square",
    size: "1",
    rootClass: "sf-admin-nav-mark"
  });
}

function renderSite(context) {
  const {
    controller,
    navigation,
    compact
  } = context;
  const site = navigation?.site?.current;
  if (!site) return lit__WEBPACK_IMPORTED_MODULE_0__.nothing;
  const switchable = controller.canSwitchSite();
  const tipId = (0,_tips_js__WEBPACK_IMPORTED_MODULE_9__.tip)(context, "site", site.label);
  const trigger = (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`
        <button type="button" class="sf-admin-nav-site-trigger"
            aria-haspopup=${switchable ? "menu" : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
            aria-expanded=${switchable ? "false" : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
            aria-label=${compact ? site.label : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
            data-tooltip=${tipId}
            ?disabled=${!switchable}
            @click=${event => controller.openSites(event.currentTarget)}>
            ${mark(context, site)}
            ${compact ? lit__WEBPACK_IMPORTED_MODULE_0__.nothing : (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`
                <span class="sf-admin-nav-site-text">
                    <span class="sf-admin-nav-site-label">${site.label}</span>
                    ${site.caption ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<span class="sf-admin-nav-site-caption">${site.caption}</span>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
                </span>
                ${switchable ? icon("unfold_more", "sf-admin-nav-site-chevron") : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}`}
        </button>`;
  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class="sf-admin-nav-site">${trigger}</div>`;
} // The short menu of a rail root (C325 В, AM-22, AM-61): a right click, or
// Shift+F10 and the menu key on it.


function onRootContextMenu(context, row, event) {
  if (!context.compact || event.shiftKey || (0,_component_kbd_js_shortcut__WEBPACK_IMPORTED_MODULE_8__.isEditableTarget)(event.target)) return;
  const opened = context.controller.openRootMenu(row, event.currentTarget);
  if (opened) event.preventDefault();
}

function onRootKeydown(context, row, event) {
  if (!context.compact || !(0,_context_menu_js__WEBPACK_IMPORTED_MODULE_7__.isMenuKey)(event)) return;
  const opened = context.controller.openRootMenu(row, event.currentTarget);

  if (opened) {
    event.preventDefault();
    event.stopPropagation();
  }
} // A row of the first level. A root with rows opens its column; a root with
// none is a page and opens it (assignment, section 1).


function renderFirstRow(context, row) {
  const {
    controller,
    compact,
    openRoot,
    text
  } = context; // A person's own rows at the top level: a line, a heading, a link, as in a
  // root's column. The rail has no headings.

  if (row.kind === "divider") return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<hr class="sf-admin-nav-divider">`;
  if (row.kind === "heading") return compact ? lit__WEBPACK_IMPORTED_MODULE_0__.nothing : (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class="sf-admin-nav-heading">${row.label}</div>`;
  if (compact && context.overflowRoots.includes(row.key)) return lit__WEBPACK_IMPORTED_MODULE_0__.nothing;

  if (row.kind === "link") {
    return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<a class="sf-admin-nav-row sf-admin-nav-row--first" href=${row.href ?? "#"} target="_blank" rel="noopener"
            data-key=${row.key} data-tooltip=${(0,_tips_js__WEBPACK_IMPORTED_MODULE_9__.tip)(context, row.key, row.label)} aria-label=${compact ? `${row.label}, ${text("external")}` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}>
            ${icon(row.icon, "sf-admin-nav-row-icon")}
            ${compact ? lit__WEBPACK_IMPORTED_MODULE_0__.nothing : (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<span class="sf-admin-nav-row-label">${row.label}</span>
                ${icon("north_east", "sf-admin-nav-row-chevron")}<span class="sr-only">, ${text("external")}</span>`}
        </a>`;
  }

  const opens = row.kind === "root";
  const open = opens && openRoot?.key === row.key; // One current mark (AM-26): the page's own row takes the plate; a root
  // whose rows hold the page is told as current to a screen reader
  // (aria-current="true", AM-37) and on the rail takes the filled square
  // (C354), unless another root's column holds the page. Its glyph is the
  // icon font's filled form (sf-icon filled, C354); the edge bar it stood
  // in for until then is gone (AM-60).

  const current = !opens && controller.isCurrent(row.key);
  const holds = opens && controller.holdsCurrent(row) && !(row.key === "sf:favourites" && controller.pageRoot());
  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<a class="sf-admin-nav-row sf-admin-nav-row--first"
        href=${row.href ?? "#"}
        role=${opens ? "button" : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
        aria-expanded=${opens ? String(open) : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
        aria-current=${current ? "page" : holds ? "true" : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
        data-key=${row.key}
        data-current=${current ? "true" : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
        data-holds-current=${holds ? "true" : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
        data-open=${open ? "true" : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
        data-tooltip=${(0,_tips_js__WEBPACK_IMPORTED_MODULE_9__.tip)(context, row.key, row.label)}
        aria-label=${compact ? (0,_counter_js__WEBPACK_IMPORTED_MODULE_4__.nameWithCounter)(row.label, railCounter(row)) : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
        @contextmenu=${event => onRootContextMenu(context, row, event)}
        @keydown=${event => onRootKeydown(context, row, event)}
        @click=${event => controller.openRow(row, event)}>
        ${compact ? railIcon(row.icon, railCounter(row), {
    filled: current || holds
  }) : (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`
            ${icon(row.icon, "sf-admin-nav-row-icon", {
    filled: current || holds
  })}
            <span class="sf-admin-nav-row-label">${row.label}</span>
            ${attention(row)}
            ${opens ? icon("chevron_right", "sf-admin-nav-row-chevron") : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}`}
    </a>`;
} // «…» (AM-27): the roots the rail has no room for, in a short menu; the
// current page's root always stays on the rail.


function renderOverflow(context) {
  const {
    controller,
    text,
    compact,
    overflowRoots
  } = context;
  if (!compact || !overflowRoots.length) return lit__WEBPACK_IMPORTED_MODULE_0__.nothing;
  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<button type="button" class="sf-admin-nav-row sf-admin-nav-row--first sf-admin-nav-more"
        aria-haspopup="menu" aria-expanded="false" aria-label=${text("moreSections")}
        data-tooltip=${(0,_tips_js__WEBPACK_IMPORTED_MODULE_9__.tip)(context, "more", text("moreSections"))}
        @click=${event => controller.openOverflow(event.currentTarget)}>
        ${railIcon("more_horiz", null)}</button>`;
} // «Уведомления» is a button with its panel (AM-19, C340): the bell opens the
// notifications on the right over the page, read from the port, whether or
// not the host names a page of their history (notifications.href is the
// panel's «Вся история»): the page's sf-admin-notifications panel when it
// holds one (1.15.1), else the menu's own list. On the rail the bell carries
// the number of unread (C342, AM-43).


function renderNotifications(context, notifications) {
  const {
    text,
    compact,
    controller
  } = context;
  const counter = (0,_counter_js__WEBPACK_IMPORTED_MODULE_4__.counterOf)(notifications.unread);
  const name = (0,_counter_js__WEBPACK_IMPORTED_MODULE_4__.nameWithCounter)(text("notifications"), counter);
  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<button type="button" class="sf-admin-nav-row sf-admin-nav-row--first sf-admin-nav-bell"
        aria-haspopup="dialog" aria-expanded="false" aria-label=${compact ? name : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
        data-key="sf:notifications" data-tooltip=${(0,_tips_js__WEBPACK_IMPORTED_MODULE_9__.tip)(context, "notifications", text("notifications"))}
        @click=${event => controller.toggleNotifications(event.currentTarget)}>
        ${compact ? railIcon("notifications", counter, {
    count: true
  }) : (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`${icon("notifications", "sf-admin-nav-row-icon")}
                <span class="sf-admin-nav-row-label">${text("notifications")}</span>
                ${counter ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<span class="sf-admin-nav-row-end"><sf-badge size="1/3" status="error" line="1"
                    text=${counter.text}></sf-badge></span>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}`}
    </button>`;
}

function renderBottom(context) {
  const {
    navigation,
    controller
  } = context;
  const notifications = controller.offers("notifications") ? navigation?.notifications : null;
  const favourites = controller.edit?.on ? null : controller.favouritesRoot();
  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class="sf-admin-nav-bottom">
        ${favourites ? renderFirstRow(context, favourites) : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
        ${notifications ? renderNotifications(context, notifications) : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
        <div class="sf-admin-nav-person-row">${(0,_account__WEBPACK_IMPORTED_MODULE_5__.renderPersonButton)(context)}</div>
    </div>`;
}

function renderFirstColumn(context) {
  const {
    controller,
    compact,
    edit
  } = context;
  const site = controller.siteRoots();
  const install = controller.installRoots();

  if (edit.on) {
    return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class="sf-admin-nav-first" data-editing="true">
            ${renderSite(context)}
            ${(0,_edit__WEBPACK_IMPORTED_MODULE_6__.renderEditHeader)(context)}
            <div class="sf-admin-nav-scroll">${(0,_edit__WEBPACK_IMPORTED_MODULE_6__.renderEditRoots)(context, site, install)}</div>
            ${renderBottom(context)}
        </div>`;
  }

  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class="sf-admin-nav-first" data-compact=${compact ? "true" : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}>
        ${renderSite(context)}
        <div class="sf-admin-nav-scroll">
            <div class="sf-admin-nav-rows">
                ${(0,_palette__WEBPACK_IMPORTED_MODULE_3__.renderSearchRow)(context)}
                ${site.map(row => renderFirstRow(context, row))}
            </div>
            ${install.length ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<hr class="sf-admin-nav-divider">
                <div class="sf-admin-nav-rows">${install.map(row => renderFirstRow(context, row))}</div>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
            ${renderOverflow(context)}
        </div>
        ${renderBottom(context)}
    </div>`;
} // A row's name, with its section under it where rows of several sections
// meet (a favourite, C368, AM-48). A name takes up to two lines (AM-15).


const rowLabel = row => row.caption ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<span class="sf-admin-nav-row-label" data-caption="true"><span class="sf-admin-nav-row-name">${row.label}</span><span class="sf-admin-nav-row-caption">${row.caption}</span></span>` : (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<span class="sf-admin-nav-row-label">${row.label}</span>`; // A row of the section column: a heading, a divider, a page, a section that
// unfolds in place, or an external link. Any depth: a row of the third level
// stands one row column further in (C109, AM-14).


function renderRow(context, row, depth = 0) {
  const {
    controller,
    text
  } = context;
  if (row.kind === "heading") return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class="sf-admin-nav-heading">${row.label}</div>`;
  if (row.kind === "divider") return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<hr class="sf-admin-nav-divider">`;
  const section = row.kind === "section";
  const unfolded = section && controller.unfolded.has(row.key);
  const external = row.kind === "link";
  const current = controller.isCurrent(row.key);
  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class="sf-admin-nav-item" data-depth=${depth}>
        <a class="sf-admin-nav-row"
            href=${row.href ?? "#"}
            target=${external ? "_blank" : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
            rel=${external ? "noopener" : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
            role=${section ? "button" : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
            aria-expanded=${section ? String(unfolded) : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
            aria-current=${current ? "page" : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
            data-current=${current ? "true" : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
            data-holds-current=${section && !unfolded && !current && controller.holdsCurrent(row) ? "true" : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
            @click=${event => controller.openRow(row, event)}>
            ${icon(row.icon, "sf-admin-nav-row-icon")}
            ${rowLabel(row)}
            ${attention(row)}
            ${external ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`${icon("north_east", "sf-admin-nav-row-chevron")}<span class="sr-only">, ${text("external")}</span>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
            ${section ? icon(unfolded ? "expand_less" : "expand_more", "sf-admin-nav-row-chevron") : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
        </a>
    </div>
    ${unfolded ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class="sf-admin-nav-children">${(row.children ?? []).filter(child => !child.hidden).map(child => renderRow(context, child, depth + 1))}</div>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}`;
} // A row of the object menu: an ordinary link with its glyph, its name and,
// when the host gives one, its badge at its end as a row's attention is.
// No star and no ⋯: the object menu is the page's, not the person's.


function renderObjectRow(context, item, current) {
  const {
    controller
  } = context;
  const badge = item.badge && typeof item.badge === "object" && item.badge.text ? {
    attention: {
      tone: item.badge.status || "",
      label: String(item.badge.text)
    }
  } : {};
  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class="sf-admin-nav-item" data-depth="0">
        <a class="sf-admin-nav-row" href=${item.href ?? "#"}
            aria-current=${item.key === current ? "page" : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
            data-current=${item.key === current ? "true" : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
            @click=${event => controller.openObjectRow(item, event)}>
            ${icon(item.icon, "sf-admin-nav-row-icon")}
            <span class="sf-admin-nav-row-label">${item.label}</span>
            ${attention(badge)}
        </a>
    </div>`;
} // The column's «hide» (C321, AM-51): the row's square with the row's glyph,
// its name and ⌘B in its tooltip. Not on a phone, where the column is a
// screen of its own with «←».


function renderHideColumn(context) {
  const {
    controller,
    text,
    wide,
    columnShortcut
  } = context;
  if (!wide || context.edit.on) return lit__WEBPACK_IMPORTED_MODULE_0__.nothing;
  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<button type="button" class="sf-admin-nav-hide" aria-label=${text("hideColumn")}
        data-tooltip=${(0,_tips_js__WEBPACK_IMPORTED_MODULE_9__.tip)(context, "hide", text("hideColumn"), columnShortcut, {
    always: true,
    arrow: "top-center"
  })}
        @click=${() => controller.hideColumn()}>${icon("left_panel_close", "sf-admin-nav-row-icon")}</button>`;
} // The object menu (navigation.context): «← back» to the list it came from,
// the object's title, under it its status and subtitle, then its groups of
// rows. On a phone it is the screen the menu opens on, with a button to the
// first screen beside the title.


function renderObjectColumn(context, menu) {
  const {
    controller,
    text,
    wide
  } = context;
  const status = menu.status ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<sf-badge class="sf-admin-nav-object-status" appearance="tonal" size="1/3"
            status=${menu.status.status || ""} text=${menu.status.text}></sf-badge>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing;
  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class="sf-admin-nav-second" data-object="true" aria-label=${menu.title || lit__WEBPACK_IMPORTED_MODULE_0__.nothing}>
        ${menu.back ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class="sf-admin-nav-back">
            <a class="sf-admin-nav-row" href=${menu.back.href}
                @click=${event => controller.openObjectRow(menu.back, event, {
    back: true
  })}>
                ${icon("arrow_back", "sf-admin-nav-row-icon")}
                <span class="sf-admin-nav-row-label">${menu.back.label || text("back")}</span>
            </a>
        </div>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
        <div class="sf-admin-nav-second-head">
            ${wide ? lit__WEBPACK_IMPORTED_MODULE_0__.nothing : (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<sf-button-icon size="1" appearance="ghost" scheme="on-surface"
                icon="menu" aria-label=${text("allSections")}
                @click=${() => controller.back()}></sf-button-icon>`}
            <div class="sf-admin-nav-second-title">
                <span class="sf-admin-nav-second-label">${menu.title}</span>
                ${menu.status || menu.subtitle ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<span class="sf-admin-nav-second-line">
                    ${status}
                    ${menu.subtitle ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<span class="sf-admin-nav-second-caption">${menu.subtitle}</span>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
                </span>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
            </div>
            ${renderHideColumn(context)}
        </div>
        <div class="sf-admin-nav-scroll">
            ${menu.groups.map((group, index) => (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`
                ${group.label ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class="sf-admin-nav-heading">${group.label}</div>` : index > 0 ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<hr class="sf-admin-nav-divider">` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
                ${group.items.map(item => renderObjectRow(context, item, menu.current))}`)}
        </div>
    </div>`;
} // The section column: one head line with the section's name (AM-50: no
// scope line -- the rail's divider already parts the install's roots from
// the site's), «Найти в разделе» above 12 pages (C364), the rows, nothing at
// its foot (C367: creating is not the column's). «Избранное» empty says how a
// page gets in (C368).


function renderSecondColumn(context) {
  const {
    controller,
    text,
    openRoot,
    filter,
    wide
  } = context;
  if (context.objectMenu) return renderObjectColumn(context, context.objectMenu);
  if (!openRoot) return lit__WEBPACK_IMPORTED_MODULE_0__.nothing;
  const rows = controller.rowsOf(openRoot);
  const favourites = openRoot.key === "sf:favourites";
  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class="sf-admin-nav-second" aria-label=${openRoot.label}>
        <div class="sf-admin-nav-second-head">
            ${wide ? lit__WEBPACK_IMPORTED_MODULE_0__.nothing : (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<sf-button-icon size="1" appearance="ghost" scheme="on-surface"
                icon="arrow_back" aria-label=${text("back")} @click=${() => controller.back()}></sf-button-icon>`}
            <div class="sf-admin-nav-second-title">
                <span class="sf-admin-nav-second-label">${openRoot.label}</span>
            </div>
            ${renderHideColumn(context)}
        </div>
        ${context.edit.on ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class="sf-admin-nav-scroll">${(0,_edit__WEBPACK_IMPORTED_MODULE_6__.renderEditRows)(context, openRoot)}</div>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
        ${!context.edit.on && controller.offersFind(openRoot) ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class="sf-admin-nav-find">
            <sf-input size="1" icon-start="search" placeholder=${text("findInSection")} value=${filter}
                @input=${event => controller.setFilter(event.target?.value ?? event.detail?.value ?? "")}></sf-input>
        </div>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
        ${context.edit.on ? lit__WEBPACK_IMPORTED_MODULE_0__.nothing : (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class="sf-admin-nav-scroll">
            ${rows.length ? rows.map(row => renderRow(context, row)) : (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<sf-empty-state class="sf-admin-nav-empty" layout="inline" kind=${favourites && !filter ? "empty" : "nothing-found"} size="1/2"
                    text=${favourites && !filter ? text("favouritesEmpty") : text("nothingFound")}></sf-empty-state>`}
        </div>`}
    </div>`;
} // The menu until the host answers (and before a host is connected, for a menu
// whose entries come from the port): its own rows with bars where the icon and
// the name go (simai.interaction-rules, loading-is-a-skeleton), in the boxes
// the answered menu takes -- on a wide screen the rail and, unless the person
// hid it, the section column; on a phone one column the whole width -- so the
// menu's box is the same before and after the answer. The two boxes carry
// their widths in their own style attribute from the Framework's tokens
// (AM-18), so the box is right before this sheet has arrived; the sheet makes
// the skeleton the whole width on a phone. The word is for a screen reader
// only.


const SKELETON_ROWS = 6;
function renderNavigationSkeleton({
  text,
  columns = 2
}) {
  const widths = ["w-3/4", "w-1/2", "w-2/3", "w-1/2", "w-3/4", "w-2/5"];

  const row = (width, rail) => (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class="sf-admin-nav-item"><div class="sf-admin-nav-row sf-admin-nav-row--first" aria-hidden="true">
        <div class="sf-skeleton sf-skeleton--animation-pulse"><div class="sf-skeleton-circle sf-skeleton-icon"></div></div>
        ${rail ? lit__WEBPACK_IMPORTED_MODULE_0__.nothing : (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class="sf-skeleton sf-skeleton--animation-pulse" style="flex:1"><div class="sf-skeleton-text sf-skeleton-text--size-1/2 ${width}"></div></div>`}</div></div>`;

  const column = name => {
    const rail = name === "first";
    return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class=${`sf-admin-nav-${name}`} data-compact=${rail ? "true" : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
            style=${rail ? "inline-size: var(--sf-admin-nav-skeleton-rail, var(--sf-d4)); flex: none" : "inline-size: var(--sf-admin-nav-skeleton-second, var(--sf-f6)); flex: none"}><div class="sf-admin-nav-scroll">
        <div class="sf-admin-nav-rows">${Array.from({
      length: SKELETON_ROWS
    }, (_, at) => row(widths[at % widths.length], rail))}</div></div></div>`;
  };

  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<nav class="sf-admin-nav sf-admin-nav--skeleton" aria-busy="true" aria-label=${text("menu")} data-columns=${String(columns)}
        style="display: flex">
        ${column("first")}${columns === 1 ? lit__WEBPACK_IMPORTED_MODULE_0__.nothing : column("second")}
        <span class="sr-only" role="status">${text("loading")}</span></nav>`;
}
function renderNavigationTemplate(context) {
  const {
    status,
    text,
    controller,
    wide,
    screen,
    compact
  } = context;
  if (status === "loading") return renderNavigationSkeleton(context);

  if (status !== "ready") {
    // A menu that could not load says so as every component does, with
    // «Повторить» asking again.
    return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<nav class="sf-admin-nav" aria-label=${text("menu")}><div class="sf-admin-nav-first">
            <sf-empty-state kind="error" size="1/2" text=${context.message || text("unavailable")}
                @sf-empty-state-action=${event => {
      if (event.detail?.id === "retry") controller.load("requested");
    }}></sf-empty-state>
        </div></nav>`;
  } // On a phone the two columns are two screens; the second has «←».


  const phoneSecond = !wide && screen === "second";
  const first = phoneSecond ? lit__WEBPACK_IMPORTED_MODULE_0__.nothing : renderFirstColumn(context);
  const second = wide || phoneSecond ? renderSecondColumn(context) : lit__WEBPACK_IMPORTED_MODULE_0__.nothing; // The nav is named «Меню» (AM-37); the rail's tooltips stand after the
  // columns, collected while they were drawn.

  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<nav class="sf-admin-nav" aria-label=${text("menu")} data-wide=${wide ? "true" : "false"} data-compact=${compact ? "true" : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}>
        ${first}
        ${second}
        ${(0,_palette__WEBPACK_IMPORTED_MODULE_3__.renderPalette)(context)}
        ${(0,_tips_js__WEBPACK_IMPORTED_MODULE_9__.renderTips)(context)}
    </nav>`;
}
__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ },

/***/ "986f10cdd6ef"
(module, __webpack_exports__, __webpack_require__) {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   renderTips: () => (/* binding */ renderTips),
/* harmony export */   tip: () => (/* binding */ tip)
/* harmony export */ });
/* harmony import */ var lit__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("2a080a730149");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([lit__WEBPACK_IMPORTED_MODULE_0__]);
var __webpack_async_dependencies_result__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);
lit__WEBPACK_IMPORTED_MODULE_0__ = __webpack_async_dependencies_result__[0];
/* harmony import */ var lit__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lit__WEBPACK_IMPORTED_MODULE_0__);
 // A rail control's name is a SIMAI Framework tooltip on hover and keyboard
// focus (C320, AM-25), not the browser's title: the Framework's data-tooltip
// controller links the control to its surface, keeps the timing of C59, says
// a shortcut on the control (aria-keyshortcuts) and closes it on Escape. The
// surfaces are collected while the menu draws and stand together at its end;
// they are placed fixed, so the rail's scroll box does not cut them. Off the
// rail nothing has a tooltip: the names are written.

function tip(context, key, text, shortcut = null, {
  always = false,
  arrow = "inline-start"
} = {}) {
  if (!context.compact && !always || !text || !Array.isArray(context.tips)) return lit__WEBPACK_IMPORTED_MODULE_0__.nothing;
  const id = `${context.tipPrefix}-${context.tips.length + 1}`;
  context.tips.push({
    id,
    key,
    text,
    shortcut,
    arrow
  });
  return id;
}
function renderTips(context) {
  if (!context.tips?.length) return lit__WEBPACK_IMPORTED_MODULE_0__.nothing;
  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class="sf-admin-nav-tips">${context.tips.map(entry => (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<sf-tooltip id=${entry.id}
        appearance="dark" arrow=${entry.arrow || "inline-start"} text=${entry.text} shortcut=${entry.shortcut || lit__WEBPACK_IMPORTED_MODULE_0__.nothing}></sf-tooltip>`)}</div>`;
}
__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ },

/***/ "188c7bc61b17"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   wordsOf: () => (/* binding */ wordsOf)
/* harmony export */ });
/* harmony import */ var _lang_en_json__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("d21db0cbf190");
/* harmony import */ var _lang_ru_json__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("38e4a43d47ec");
/* harmony import */ var _lang_zh_json__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("25668cc92df9");
/* harmony import */ var _lang_es_json__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("ae69c08f881b");
/* harmony import */ var _lang_pt_json__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__("ca58a096d112");
/* harmony import */ var _lang_de_json__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__("724f233c6209");
/* harmony import */ var _lang_fr_json__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__("e219c434ba68");
/* harmony import */ var _lang_it_json__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__("2c835db75150");
/* harmony import */ var _lang_ja_json__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__("16fc583fb0ee");
/* harmony import */ var _lang_ko_json__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__("4fe6b2964066");
/* harmony import */ var _lang_ar_json__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__("84d79a7cc4a2");
// The words of sf-admin-menu (standard simai.smart-component 1.3.8 §11): they
// live in lang/<locale>.json, the one source the Studio, the docs and a
// product's SF.language.register read. The menu's three dictionaries -- the
// navigation's, the settings menu's and the counter's -- are made from them
// here, by the key each one has always used, so every word is written once.










 // The registry's eleven languages (owner decision C278, AM-38): each one in
// full, so a page in Arabic or Japanese reads no English word of the menu.

const LANG = {
  en: _lang_en_json__WEBPACK_IMPORTED_MODULE_0__.runtime,
  ru: _lang_ru_json__WEBPACK_IMPORTED_MODULE_1__.runtime,
  zh: _lang_zh_json__WEBPACK_IMPORTED_MODULE_2__.runtime,
  es: _lang_es_json__WEBPACK_IMPORTED_MODULE_3__.runtime,
  pt: _lang_pt_json__WEBPACK_IMPORTED_MODULE_4__.runtime,
  de: _lang_de_json__WEBPACK_IMPORTED_MODULE_5__.runtime,
  fr: _lang_fr_json__WEBPACK_IMPORTED_MODULE_6__.runtime,
  it: _lang_it_json__WEBPACK_IMPORTED_MODULE_7__.runtime,
  ja: _lang_ja_json__WEBPACK_IMPORTED_MODULE_8__.runtime,
  ko: _lang_ko_json__WEBPACK_IMPORTED_MODULE_9__.runtime,
  ar: _lang_ar_json__WEBPACK_IMPORTED_MODULE_10__.runtime
};
/** {<dictionary key>: <lang key>} -> {en: {...}, ru: {...}, ...}, as pageText reads a dictionary. */

function wordsOf(map) {
  return Object.fromEntries(Object.entries(LANG).map(([locale, words]) => [locale, Object.fromEntries(Object.entries(map).filter(([, name]) => words[name] !== undefined).map(([key, name]) => [key, words[name]]))]));
}

/***/ },

/***/ "c69a3dc158df"
(module, __webpack_exports__, __webpack_require__) {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AVATAR_PLACEHOLDER_ICON: () => (/* binding */ AVATAR_PLACEHOLDER_ICON),
/* harmony export */   AVATAR_SIZES: () => (/* binding */ AVATAR_SIZES),
/* harmony export */   avatarClasses: () => (/* binding */ avatarClasses),
/* harmony export */   avatarContent: () => (/* binding */ avatarContent),
/* harmony export */   avatarPicture: () => (/* binding */ avatarPicture),
/* harmony export */   avatarPictureContext: () => (/* binding */ avatarPictureContext),
/* harmony export */   avatarPictureIcons: () => (/* binding */ avatarPictureIcons),
/* harmony export */   avatarStepText: () => (/* binding */ avatarStepText)
/* harmony export */ });
/* harmony import */ var lit__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("2a080a730149");
/* harmony import */ var lit_directives_keyed_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("9d9903b87148");
/* harmony import */ var _helpers_text__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("cbce4a5232a6");
/* harmony import */ var _tone_mjs__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("a6b3ed0c1589");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([lit__WEBPACK_IMPORTED_MODULE_0__, lit_directives_keyed_js__WEBPACK_IMPORTED_MODULE_1__]);
([lit__WEBPACK_IMPORTED_MODULE_0__, lit_directives_keyed_js__WEBPACK_IMPORTED_MODULE_1__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);
/* harmony import */ var lit__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lit__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var lit_directives_keyed_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(lit_directives_keyed_js__WEBPACK_IMPORTED_MODULE_1__);



 // One avatar drawing (avatar study AV-8, 2026-11-14). sf-avatar and every
// component that shows a person beside its own content -- sf-avatar-group,
// sf-tag, sf-list-item, sf-dropdown, sf-input-lookup, sf-menu-context, the
// signs of sf-list -- draw the picture with these functions and the avatars
// sheet's classes: a photo is an <img> filling the circle, initials stand on
// the neutral plate (or the hue the host names, C17), and with neither the
// placeholder is a glyph on the neutral plate -- person by default, the
// host's icon for a bot, a system or a service. Before, five copies drew it
// five ways: the photo as a background image in the tag, the list row and the
// dropdown, an empty transparent circle in a row with no photo, and the
// context menu's own classes on the secondary container.

/** The sizes of the avatar ladder. */

const AVATAR_SIZES = Object.freeze(["1/4", "1/3", "1/2", "1", "2", "3"]);
/** The glyph of a placeholder: a person, unless the host names another. */

const AVATAR_PLACEHOLDER_ICON = "person"; // The letters a step holds (owner decision C152 (3), 2026-11-14): two from
// 1/3 up, one at 1/4 (16 px holds one letter of a readable size, two were
// 10 px each). Only letters are cut: «+5» or a number stays whole.

function avatarStepText(text, size) {
  const value = String(text ?? "");
  if (String(size ?? "") !== "1/4") return value;
  const letters = value.match(/^(\p{L}\p{M}*)\p{L}/u);
  return letters ? letters[1] : value;
}
/**
 * The drawing context of one avatar picture, from what a host knows: the photo,
 * the initials or the name they are taken from, the hue, the placeholder's
 * glyph, the size (or the text line of a form size) and the shape.
 */

function avatarPictureContext(options = {}) {
  const imageUrl = String(options.imageUrl ?? "").trim();
  const name = String(options.name ?? "").trim();
  const explicitText = String(options.text ?? "").trim();
  const namedIcon = String(options.icon ?? "").trim();
  const size = AVATAR_SIZES.includes(String(options.size ?? "")) ? String(options.size) : ""; // The initials: the host's own, else those of the name -- unless the host
  // names a glyph (a bot, a system), which stands in for them. With a photo
  // they stand under it until it comes and when it fails (C152 (2)).

  const text = avatarStepText(namedIcon ? explicitText : explicitText || (0,_helpers_text__WEBPACK_IMPORTED_MODULE_2__.getInitials)(name), size);
  const isImage = Boolean(imageUrl); // isText: the initials are drawn (alone, or under the photo).

  const isText = Boolean(text);
  const icon = namedIcon || AVATAR_PLACEHOLDER_ICON;
  return {
    size,
    line: String(options.line ?? ""),
    shape: options.shape === "square" ? "square" : "circle",
    imageUrl,
    isImage,
    isText,
    text,
    icon,
    status: options.status || "none",
    expressive: Boolean(options.expressive),
    resolvedHue: isText && options.hue ? (0,_tone_mjs__WEBPACK_IMPORTED_MODULE_3__.resolveAvatarHue)(options.hue, name || text, "") : "",
    rootClass: options.rootClass || "",
    rootStyle: options.rootStyle || "",
    disabled: Boolean(options.disabled),
    // A long list's rows load their photos as they scroll in.
    lazy: Boolean(options.lazy),
    component: options.component
  };
}
/**
 * The classes of the avatar picture. The avatars sheet answers every class
 * this file writes. sf-avatar's own templates hand it their utility classes
 * for the box (options.layout, src/smart/avatar/js/templates/shared.js), as
 * they wrote them before; a host's picture writes none -- sf-avatar--picture
 * gives it the same box from the avatars sheet -- so a host asks the Loader
 * for no utility it did not ask for before (a menu, a tag, a list row).
 */

function avatarClasses(context, options = {}) {
  const includeRootClass = options.includeRootClass !== false;
  const layout = options.layout ?? null;
  const classes = ["sf-avatar", layout ? layout.box : "sf-avatar--picture", context.size ? `sf-avatar--size-${context.size}` : "", context.line ? `sf-avatar--line-${context.line}` : "", layout ? layout.inline : ""].filter(Boolean);

  if (context.isText) {
    classes.push("sf-avatar--text");
    if (layout) classes.push(layout.center); // The hue's role set (core .sf-hue-<name>, C17); the class sheet
    // draws the plate and the ink from it.

    if (context.resolvedHue) {
      classes.push(`sf-hue-${context.resolvedHue}`);
    }
  }

  if (!context.isText) {
    classes.push("sf-avatar--placeholder");
    if (layout) classes.push(layout.center);
  } // The decorative level (C91 level 2): the sheet turns the initials'
  // plate of the largest size into a cover of its hue.


  if (context.expressive) {
    classes.push("sf-avatar--expressive");
  }

  if (context.status && context.status !== "none" && layout) {
    classes.push(layout.anchor);
  }

  if (context.shape === "square") {
    classes.push("sf-avatar--square");
  }

  if (context.status === "online") {
    classes.push("sf-avatar--status-icon-online-indicator");
  }

  if (options.disabled) {
    classes.push("disabled");
  }

  if (includeRootClass && context.rootClass) {
    classes.push(context.rootClass);
  }

  if (options.extraClass) {
    classes.push(options.extraClass);
  }

  return classes.join(" ");
} // The photo says when it has come or failed (C152 (2)): the sheet fades it
// in over the initials when loaded and drops it on an error, so the avatar is
// never an empty circle or the browser's broken-image glyph. The state is
// the runtime mark data-sf-loaded ("true" or "error"), which the template
// does not bind, so a redraw keeps it, and which a first-paint snapshot
// leaves out (it depends on the network); a new address is a new element
// (keyed), which starts transparent again.

function onImageLoad(event) {
  event.currentTarget.dataset.sfLoaded = "true";
}

function onImageError(event) {
  event.currentTarget.dataset.sfLoaded = "error";
}
/**
 * What the circle holds: the initials, or the placeholder glyph as an sf-icon
 * element, so its name reaches the icon font request (a bare <i class="sf-icon">
 * drawn after the page's scan stayed blank: buttons review 2026-11-09); with a
 * photo, the photo over them (owner decision C152 (2)).
 */


function avatarContent(context) {
  const under = context.isText ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<span class="sf-avatar-text">${context.text}</span>` : (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<sf-icon icon=${context.icon || AVATAR_PLACEHOLDER_ICON} aria-hidden="true"></sf-icon>`;
  if (!context.isImage) return under;
  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`${under}${(0,lit_directives_keyed_js__WEBPACK_IMPORTED_MODULE_1__.keyed)(context.imageUrl, (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<img class="sf-avatar-image" src=${context.imageUrl} alt="" loading=${context.lazy ? "lazy" : lit__WEBPACK_IMPORTED_MODULE_0__.nothing} decoding=${context.lazy ? "async" : lit__WEBPACK_IMPORTED_MODULE_0__.nothing} @load=${onImageLoad} @error=${onImageError} />`)}`;
}
/** The icon names a picture draws (for a host's icon preload). */

function avatarPictureIcons(options = {}) {
  const context = avatarPictureContext(options);
  return context.isText ? [] : [context.icon];
}
/**
 * One avatar picture beside a host's own content: a span hidden from
 * assistive technology (the host's visible text names the person), drawn with
 * the avatars sheet. extraClass adds the host's own geometry class.
 */

function avatarPicture(options = {}) {
  const context = avatarPictureContext(options);
  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<span
        class=${avatarClasses(context, {
    extraClass: options.extraClass,
    disabled: context.disabled
  })}
        style=${context.rootStyle || lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
        aria-hidden="true"
    >${avatarContent(context)}</span>`;
}
__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ },

/***/ "cbce4a5232a6"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getInitials: () => (/* binding */ getInitials),
/* harmony export */   normalizeInitialsWords: () => (/* binding */ normalizeInitialsWords)
/* harmony export */ });
// c282-allow-start: input parsing (initials read from Russian names, C152)
const INITIALS_SKIP_WORDS = new Set(["а", "без", "в", "во", "для", "до", "за", "из", "из-за", "из-под", "и", "к", "ко", "между", "на", "над", "о", "об", "от", "по", "под", "при", "про", "с", "со", "у", "через", "the", "a", "an", "and", "for", "from", "in", "of", "on", "to"]); // Words a name carries that are not the person's or the organisation's own
// (owner decision C152 (3), 2026-11-14): legal forms (ООО «Ромашка» → Р),
// titles (Dr. John Smith → JS) and name particles (Мария фон Штейн → МШ) are
// skipped wherever they stand. Compared without case and without the dots
// around them (normalizeInitialsWords strips those).

const INITIALS_SERVICE_WORDS = new Set([// legal forms
"ооо", "оао", "зао", "пао", "ао", "нао", "ип", "нко", "ано", "гуп", "муп", "фгуп", "гбу", "мбу", "чоп", "llc", "inc", "ltd", "gmbh", "ag", "corp", "co", "llp", "plc", "lp", "bv", "oy", "ab", "srl", "sarl", // titles
"dr", "prof", "mr", "mrs", "ms", "mx", "miss", "sir", "jr", "sr", "phd", "д-р", "проф", "акад", "г-н", "г-жа", "доц", // particles
"фон", "ван", "дер", "де", "ди", "да", "дю", "ла", "ле", "ибн", "бен", "оглы", "кызы", "von", "van", "der", "den", "de", "di", "da", "du", "del", "della", "la", "le", "ten", "ter", "bin", "ibn"]); // c282-allow-end

function normalizeInitialsWords(value = "") {
  return String(value || "").trim().split(/[\s/|]+/).map(word => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "")).filter(Boolean);
} // The first character a reader sees: a whole grapheme, so a letter written
// with a combining accent («E» + U+0301) or outside the basic plane keeps all
// of its code points. Array.from alone splits surrogate pairs correctly but
// not combining marks; Intl.Segmenter does both where the platform has it.

function firstGrapheme(word) {
  const Segmenter = globalThis.Intl?.Segmenter;

  if (typeof Segmenter === "function") {
    for (const {
      segment
    } of new Segmenter(undefined, {
      granularity: "grapheme"
    }).segment(word)) {
      return segment;
    }

    return "";
  }

  return Array.from(word)[0] || "";
} // The one rule for initials (reuse audit 2026-11-02, finding 10): sf-avatar,
// the context menu, the admin menu and the chat drew them by five rules that
// disagreed on a hyphen, an empty name and a letter outside the basic plane.
//
//   «Анна Смирнова»        → «АС»   the first letters of the first two words
//   «Отдел по работе»      → «ОР»   a preposition after the first word is skipped
//   «Жан-Поль»             → «ЖП»   one hyphenated word reads as its parts
//   «Анна-Мария Смирнова»  → «АС»   ...but a name of several words by its words
//   «Анна»                 → «А»
//   «ООО «Ромашка»»        → «Р»    legal forms, titles, particles skipped (C152)
//   «Мария фон Штейн»      → «МШ»
//   «Dr. John Smith»       → «JS»
//   «anna@simai.ru»        → «A»    an address: the first letter before «@»
//   «»                     → ''     or `fallback`: '?' where text must stand
//
// `maxLetters` caps the letters (two), `skipWords` replaces the skipped words,
// `locale` capitalises by a locale's rule.


function getInitials(value = "", options = {}) {
  const {
    maxLetters = 2,
    skipWords = INITIALS_SKIP_WORDS,
    fallback = "",
    locale
  } = options;
  let source = String(value ?? "").trim(); // An address reads by the name before «@»: one letter (C152 (3)),
  // anna@simai.ru → A, not the letters of its parts.

  if (/^[^\s@]+@[^\s@]+$/u.test(source)) {
    const local = normalizeInitialsWords(source.slice(0, source.indexOf("@")).replace(/[._+-]+/gu, " "));
    if (!local.length) return String(fallback);
    const letter = firstGrapheme(local[0]);
    return (locale ? letter.toLocaleUpperCase(locale) : letter.toUpperCase()) || String(fallback);
  }

  const allWords = normalizeInitialsWords(source); // Legal forms, titles and particles go first; a name made of them alone
  // keeps them, so it still has initials.

  const ownWords = allWords.filter(word => !INITIALS_SERVICE_WORDS.has(String(word).toLowerCase()));
  const words = ownWords.length ? ownWords : allWords;
  let significantWords = words.filter((word, index) => index === 0 || !skipWords.has(String(word).toLowerCase())); // One word written with a hyphen or a dash is a compound name: its parts
  // are its words. Split before the skip list, «из-за» would be two words.

  if (significantWords.length === 1) {
    const parts = significantWords[0].split(/[-\u2010-\u2015]+/u).filter(Boolean);
    if (parts.length > 1) significantWords = parts;
  }

  if (!significantWords.length) {
    return String(fallback);
  }

  const letters = significantWords.length > 1 ? significantWords.slice(0, Math.max(1, maxLetters)).map(firstGrapheme).join("") : firstGrapheme(significantWords[0]);
  return (locale ? letters.toLocaleUpperCase(locale) : letters.toUpperCase()) || String(fallback);
}

/***/ },

/***/ "464bf30e7c23"
(module, __webpack_exports__, __webpack_require__) {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MODES: () => (/* binding */ MODES),
/* harmony export */   SIZES: () => (/* binding */ SIZES),
/* harmony export */   canonicalCode: () => (/* binding */ canonicalCode),
/* harmony export */   dirOf: () => (/* binding */ dirOf),
/* harmony export */   englishName: () => (/* binding */ englishName),
/* harmony export */   isVariant: () => (/* binding */ isVariant),
/* harmony export */   languageRows: () => (/* binding */ languageRows),
/* harmony export */   lookFor: () => (/* binding */ lookFor),
/* harmony export */   matchLanguage: () => (/* binding */ matchLanguage),
/* harmony export */   matchesQuery: () => (/* binding */ matchesQuery),
/* harmony export */   nameIn: () => (/* binding */ nameIn),
/* harmony export */   nativeName: () => (/* binding */ nativeName),
/* harmony export */   normalizeLanguages: () => (/* binding */ normalizeLanguages),
/* harmony export */   pageName: () => (/* binding */ pageName),
/* harmony export */   searchWords: () => (/* binding */ searchWords),
/* harmony export */   shortLabel: () => (/* binding */ shortLabel),
/* harmony export */   shortLabelIn: () => (/* binding */ shortLabelIn),
/* harmony export */   useNames: () => (/* binding */ useNames)
/* harmony export */ });
/* harmony import */ var _core_js_page_language_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("43090d1c8307");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_core_js_page_language_js__WEBPACK_IMPORTED_MODULE_0__]);
var __webpack_async_dependencies_result__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);
_core_js_page_language_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_async_dependencies_result__[0];
/* harmony import */ var _core_js_page_language_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_core_js_page_language_js__WEBPACK_IMPORTED_MODULE_0__);
// The languages of sf-language, without the element: codes made canonical,
// named in themselves and in English, the direction each is written in, the
// look a count of them takes, and what a search finds. The names of the
// languages the component supports ship with it (data/names.json, from CLDR:
// the browser's Intl.DisplayNames names fewer -- research LG-7); the browser
// names the rest, and what neither can name is shown as its code. The
// element gives this module the shipped names (useNames). Their names in
// Russian and any other language are words of sf-language, name-<code>, a
// language file's (owner decision C282), read through the page's language
// registry.

const MODES = ['auto', 'inline', 'menu', 'search', 'field'];
const SIZES = ['1/3', '1/2', '1', '2', '3']; // The languages written right to left, by their primary subtag, where the
// browser cannot say it itself (Intl.Locale textInfo); and the scripts that
// make any language right to left (ku-Arab, pa-Arab, ms-Arab).

const RTL_LANGUAGES = new Set(['ar', 'arc', 'ckb', 'dv', 'fa', 'he', 'iw', 'ks', 'lrc', 'mzn', 'nqo', 'ps', 'sd', 'syr', 'ug', 'ur', 'yi']);
const RTL_SCRIPTS = new Set(['adlm', 'arab', 'hebr', 'mand', 'nkoo', 'rohg', 'syrc', 'thaa']);

const text = value => value === undefined || value === null ? '' : String(value).trim();
/** A language code in its canonical BCP 47 spelling (pt-br -> pt-BR), or '' when it is none. */


function canonicalCode(value) {
  const code = text(value).replace(/_/gu, '-');
  if (!code || !/^[a-z]{2,8}(-[a-z0-9]{1,8})*$/iu.test(code)) return '';

  try {
    return Intl.getCanonicalLocales(code)[0] || '';
  } catch {
    return '';
  }
}
/** ltr or rtl: how a language is written. */

function dirOf(code) {
  const canonical = canonicalCode(code);
  if (!canonical) return 'ltr';

  try {
    const locale = new Intl.Locale(canonical);
    const info = typeof locale.getTextInfo === 'function' ? locale.getTextInfo() : locale.textInfo;
    if (info?.direction === 'rtl' || info?.direction === 'ltr') return info.direction;
  } catch {// Read below.
  }

  const [primary, ...rest] = canonical.toLowerCase().split('-');
  const script = rest.find(part => part.length === 4);
  if (script) return RTL_SCRIPTS.has(script) ? 'rtl' : 'ltr';
  return RTL_LANGUAGES.has(primary) ? 'rtl' : 'ltr';
} // The shipped names, by canonical code in lower case.

const SHIPPED = new Map(); // The code as the data writes it (zh-Hans), by its lower case: the key of its
// name words (name-zh-Hans).

const DATA_CODES = new Map();

const canonicalWordCode = code => DATA_CODES.get(String(code).toLowerCase()) ?? String(code);
/** Takes the shipped names (data/names.json): {names: {<code>: {native, en}}}. */


function useNames(data) {
  SHIPPED.clear();
  DATA_CODES.clear();

  for (const [code, names] of Object.entries(data?.names ?? {})) {
    if (!names || typeof names !== 'object') continue;
    SHIPPED.set(code.toLowerCase(), names);
    DATA_CODES.set(code.toLowerCase(), code);
  }
} // The name of a language in a language the data does not name it in (owner
// decision C282: the data names each in itself and in English; Russian and
// any other language's names are words of sf-language, name-<code>, its
// language file's). undefined when that language has none.

function nameWord(code, inLanguage) {
  const key = `name-${code}`;
  const word = (0,_core_js_page_language_js__WEBPACK_IMPORTED_MODULE_0__.localeText)(null, key, inLanguage, 'sf-language');
  return word === key ? undefined : word;
} // A shipped name of a language in a language: native (in itself), en, or the
// words of the language it is named in; '' when none.


function shippedName(code, inLanguage) {
  const names = SHIPPED.get(String(code).toLowerCase());
  if (!names) return '';
  const want = String(inLanguage).toLowerCase();
  if (want === String(code).toLowerCase()) return names.native || '';
  const own = names[want] || names[want.split('-')[0]];
  if (own) return own;
  const word = nameWord(canonicalWordCode(code), want);
  return typeof word === 'string' ? word : '';
} // A language's name in a language: the shipped one first, else the
// browser's; '' when neither has one.


function displayName(code, inLanguage) {
  const shipped = shippedName(code, inLanguage);
  if (shipped) return shipped;

  try {
    const name = new Intl.DisplayNames([inLanguage], {
      type: 'language',
      fallback: 'none'
    }).of(code);
    return name && name !== code ? name : '';
  } catch {
    return '';
  }
} // A name begins with a capital in a list, as a person writes it in a menu
// («Русский», «Español»); the capital is the language's own.
// A script whose upper case is a display style, not the capital of running
// text (U+10D0-U+10FF), keeps the name as it is written.


const UNCASED = /^[\u10D0-\u10FF]/u;

function capitalised(name, code) {
  if (!name) return '';
  if (UNCASED.test(name)) return name;

  try {
    return name.charAt(0).toLocaleUpperCase(code) + name.slice(1);
  } catch {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
} // A code's parts: the primary language, and the script and region subtags
// that make it a variant (pt-BR, zh-Hant), or '' when it has none.


function partsOf(code) {
  const [primary = '', ...rest] = String(code).split('-');
  const script = rest.find(part => /^[a-z]{4}$/iu.test(part)) || '';
  const region = rest.find(part => /^([a-z]{2}|\d{3})$/iu.test(part)) || '';
  return {
    primary: primary.toLowerCase(),
    script,
    region
  };
} // A name from the browser in its standard form: the language and, in
// brackets, what makes the variant («português (Brasil)», «中文（简体）»),
// not the dialect name («português europeu», «简体中文»).


function standardName(code, inLanguage) {
  try {
    const name = new Intl.DisplayNames([inLanguage], {
      type: 'language',
      languageDisplay: 'standard',
      fallback: 'none'
    }).of(code);
    return name && name !== code ? name : '';
  } catch {
    return '';
  }
}

function subtagName(type, subtag, inLanguage) {
  try {
    return new Intl.DisplayNames([inLanguage], {
      type,
      fallback: 'none'
    }).of(subtag) || '';
  } catch {
    return '';
  }
} // What makes a variant, in a language: the region («Бразилия») or the script.


function qualifierIn(code, inLanguage) {
  const {
    script,
    region
  } = partsOf(code);
  if (region) return subtagName('region', region.toUpperCase(), inLanguage);
  if (script) return subtagName('script', script.charAt(0).toUpperCase() + script.slice(1).toLowerCase(), inLanguage);
  return '';
}
/** Whether a code is a variant of a language: it names a script or a region (pt-BR, zh-Hant). */


function isVariant(code) {
  const {
    script,
    region
  } = partsOf(code);
  return Boolean(script || region);
}
/**
 * The name of a language in itself: «Deutsch» for de. A variant is the full
 * name with what makes it one, in its own words (owner decision C142 (9)):
 * «Português (Brasil)», «Português (Portugal)», «中文（简体）».
 */

function nativeName(code) {
  if (isVariant(code)) {
    const full = standardName(code, code);
    if (full) return capitalised(full, code);
    const base = displayName(partsOf(code).primary, partsOf(code).primary);
    const qualifier = qualifierIn(code, code);
    if (base && qualifier) return capitalised(`${base} (${qualifier})`, code);
  }

  return capitalised(displayName(code, code), code) || code.toUpperCase();
}
/** The name of a language in English: «German» for de. */

function englishName(code) {
  return capitalised(displayName(code, 'en'), 'en') || code.toUpperCase();
}
/** The name of a language in another, for the search: «немецкий» for de on a Russian page. */

function nameIn(code, language) {
  return displayName(code, language);
}
/**
 * The second name of a menu row: the language's name in the page's language
 * (owner decision C142 (3): «Deutsch немецкий» on a Russian page, W3C
 * language navigation), as it is written in running text. A variant says
 * what makes it one: «португальский, Бразилия»; a script variant the name
 * the component ships («китайский, упрощенное письмо»). '' when the page's
 * language has no name for it.
 */

function pageName(code, page) {
  const language = text(page) || 'en';

  if (isVariant(code)) {
    const {
      primary,
      region
    } = partsOf(code);

    if (region) {
      const base = displayName(primary, language);
      const qualifier = qualifierIn(code, language);
      if (base && qualifier) return `${base}, ${qualifier}`;
    }

    const shipped = shippedName(code, language);
    if (shipped) return shipped;
    const full = standardName(code, language);
    if (full) return full;
  }

  return displayName(code, language);
}
/** The code as a code label (labels="code") shows it: RU, EN, PT-BR. */

function shortLabel(code) {
  return code.toUpperCase();
} // Chinese is told apart by its script, not its country (C142 (9)): the
// labels Chinese sites themselves write.

const CHINESE_SCRIPT = {
  hans: '简体',
  hant: '繁體'
};
const CHINESE_REGION_SCRIPT = {
  cn: 'hans',
  sg: 'hans',
  my: 'hans',
  tw: 'hant',
  hk: 'hant',
  mo: 'hant'
};
/**
 * The code a list shows for a language (the trigger, labels="code"): the
 * language alone while the list holds one variant of it («PT» for pt-BR);
 * the region too when it holds two («PT-BR», «PT-PT»); Chinese by its script
 * («简体», «繁體»). Owner decision C142 (9).
 */

function shortLabelIn(code, list) {
  const {
    primary,
    script,
    region
  } = partsOf(code);
  const variants = list.filter(one => partsOf(one).primary === primary).length;
  if (variants < 2) return primary.toUpperCase();

  if (primary === 'zh') {
    const by = (script || CHINESE_REGION_SCRIPT[region.toLowerCase()] || '').toLowerCase();
    if (CHINESE_SCRIPT[by]) return CHINESE_SCRIPT[by];
  }

  return shortLabel(code);
}
/**
 * The languages as given: codes in a string («ru en de», commas allowed), or a
 * list of codes or of {code, label, short, href, missing}. `href` (a pattern
 * with {code}) gives each language without its own href one. A language this
 * page has no translation for -- written in `missing` («de fr») or an item's
 * missing: true -- stays in the list (C142 (6)); its address is `home` (a
 * pattern with {code}) when given, the site's main page in that language.
 * Unknown codes and repeats are left out.
 */

function normalizeLanguages(languages, items, href = '', {
  missing = '',
  home = ''
} = {}) {
  const source = Array.isArray(items) && items.length ? items : Array.isArray(languages) ? languages : text(languages).split(/[\s,;]+/u);
  const pattern = text(href);
  const homePattern = text(home);
  const absent = new Set(text(missing).split(/[\s,;]+/u).map(one => canonicalCode(one).toLowerCase()).filter(Boolean));
  const seen = new Set();
  const given = [];

  for (const entry of source) {
    const one = typeof entry === 'string' ? {
      code: entry
    } : entry && typeof entry === 'object' ? entry : null;
    if (!one) continue;
    const code = canonicalCode(one.code ?? one.value ?? one.lang);
    if (!code || seen.has(code.toLowerCase())) continue;
    seen.add(code.toLowerCase());
    given.push([code, one]);
  }

  const codes = given.map(([code]) => code);
  return given.map(([code, one]) => {
    const own = nativeName(code);
    const untranslated = one.missing === true || absent.has(code.toLowerCase());
    const address = untranslated && homePattern ? homePattern.replace(/\{(code|lang)\}/gu, code) : text(one.href) || (pattern ? pattern.replace(/\{(code|lang)\}/gu, code) : '');
    return {
      code,
      label: text(one.label) || own,
      native: own,
      english: englishName(code),
      short: text(one.short) || shortLabelIn(code, codes),
      href: address,
      missing: untranslated,
      dir: dirOf(code)
    };
  });
} // What a search compares: lower case in the root locale, without accents
// (é and ё compare as e and е), so a query matches whatever case and marks it
// is typed in.

const folded = value => String(value ?? '').normalize('NFD').replace(/\p{M}+/gu, '').toLocaleLowerCase('und'); // The words a name is made of: split at spaces, hyphens, brackets and the
// like, so «português (Brasil)» is «português» and «brasil», and pt-BR is pt
// and br as well as pt-br.


const WORD_BREAK = /[\s\-\u2010-\u2015()（）[\],.;:'"«»·/]+/u;
/** The word starts of a text, folded: what a search query must begin. */

function searchWords(...texts) {
  const words = new Set();

  for (const text of texts) {
    const whole = folded(text).trim();
    if (!whole) continue;
    words.add(whole);

    for (const word of whole.split(WORD_BREAK)) if (word) words.add(word);
  }

  return [...words];
}
/**
 * Whether a query finds a language by its words (searchWords): each word of
 * the query begins one of them. «ит» finds итальянский, not литовский,
 * where «ит» is inside the word (research LG-8).
 */

function matchesQuery(words, query) {
  const parts = folded(query).trim().split(WORD_BREAK).filter(Boolean);
  if (!parts.length) return true;
  return parts.every(part => words.some(word => word.startsWith(part)));
}
/**
 * The look for a number of languages: none, inline, menu, search or field. In auto
 * every count from two is the menu (owner decision C142: one button, no
 * jump of width from a track to a button when a language is added), from
 * searchFrom the menu with search; the track is mode="inline", for a
 * settings page. inlineMax (1 since 1.4.0) still lets auto draw the track up
 * to that count for a page that writes it.
 */

function lookFor(count, {
  mode = 'auto',
  inlineMax = 1,
  searchFrom = 8
} = {}) {
  if (count < 2) return 'none';
  if (mode === 'inline' || mode === 'menu' || mode === 'search' || mode === 'field') return mode;
  const inline = Number.isFinite(Number(inlineMax)) ? Number(inlineMax) : 1;
  const search = Number.isFinite(Number(searchFrom)) ? Number(searchFrom) : 8;
  if (count >= search) return 'search';
  return count <= inline ? 'inline' : 'menu';
}
/** The language of a list that a code names: the same code, else the same primary language. */

function matchLanguage(list, value) {
  const code = canonicalCode(value).toLowerCase();
  if (!code) return null;
  const exact = list.find(language => language.code.toLowerCase() === code);
  if (exact) return exact;
  const primary = code.split('-')[0];
  return list.find(language => language.code.toLowerCase() === primary) ?? list.find(language => language.code.toLowerCase().split('-')[0] === primary) ?? null;
}
/**
 * The menu rows of a list of languages (sf-menu-context entries): the name in
 * itself; beside it, as the row's value, its name in the page's language
 * (owner decision C142 (3)), left out when it is the same word; under it, for
 * a language this page has no translation of, the line `missing` (C142 (6));
 * the radio mark on the chosen one; each row in its own language. A query
 * keeps the rows whose words it begins (research LG-8). `prefix` goes before
 * each row's id (an app menu's «language:»).
 */

function languageRows(list, current, {
  page = 'en',
  query = '',
  missing = '',
  prefix = ''
} = {}) {
  const same = (a, b) => String(a).toLocaleLowerCase() === String(b).toLocaleLowerCase();

  return list.filter(language => !query || matchesQuery(searchWords(language.label, language.native, language.english, nameIn(language.code, page), pageName(language.code, page), language.code), query)).map(language => {
    const second = pageName(language.code, page);
    return {
      id: `${prefix}${language.code}`,
      text: language.label,
      value: second && !same(second, language.label) && !same(second, language.native) ? second : undefined,
      caption: language.missing && missing ? missing : undefined,
      kind: 'radio',
      checked: language.code === current?.code,
      lang: language.code
    };
  });
}
__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ },

/***/ "bb67a9697f33"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   APPLY: () => (/* binding */ APPLY),
/* harmony export */   COLOR_OPTIONS: () => (/* binding */ COLOR_OPTIONS),
/* harmony export */   DEFAULT_SIZE: () => (/* binding */ DEFAULT_SIZE),
/* harmony export */   FORMER_LOOKS: () => (/* binding */ FORMER_LOOKS),
/* harmony export */   HUES: () => (/* binding */ HUES),
/* harmony export */   LOOKS: () => (/* binding */ LOOKS),
/* harmony export */   OWN_COLOR: () => (/* binding */ OWN_COLOR),
/* harmony export */   SIZES: () => (/* binding */ SIZES),
/* harmony export */   TYPES: () => (/* binding */ TYPES),
/* harmony export */   applyCount: () => (/* binding */ applyCount),
/* harmony export */   choiceArranges: () => (/* binding */ choiceArranges),
/* harmony export */   choiceOptions: () => (/* binding */ choiceOptions),
/* harmony export */   choiceOrder: () => (/* binding */ choiceOrder),
/* harmony export */   colorCode: () => (/* binding */ colorCode),
/* harmony export */   colorFill: () => (/* binding */ colorFill),
/* harmony export */   entriesFor: () => (/* binding */ entriesFor),
/* harmony export */   fieldOptions: () => (/* binding */ fieldOptions),
/* harmony export */   findItem: () => (/* binding */ findItem),
/* harmony export */   folded: () => (/* binding */ folded),
/* harmony export */   holdsValue: () => (/* binding */ holdsValue),
/* harmony export */   itemValue: () => (/* binding */ itemValue),
/* harmony export */   lookOf: () => (/* binding */ lookOf),
/* harmony export */   matches: () => (/* binding */ matches),
/* harmony export */   movedField: () => (/* binding */ movedField),
/* harmony export */   optionMoves: () => (/* binding */ optionMoves),
/* harmony export */   optionPins: () => (/* binding */ optionPins),
/* harmony export */   orderMap: () => (/* binding */ orderMap),
/* harmony export */   orderPatch: () => (/* binding */ orderPatch),
/* harmony export */   panelGroups: () => (/* binding */ panelGroups),
/* harmony export */   panelLayout: () => (/* binding */ panelLayout),
/* harmony export */   placedField: () => (/* binding */ placedField),
/* harmony export */   rewriteValues: () => (/* binding */ rewriteValues),
/* harmony export */   sameValue: () => (/* binding */ sameValue),
/* harmony export */   toggledField: () => (/* binding */ toggledField),
/* harmony export */   valueMap: () => (/* binding */ valueMap),
/* harmony export */   valuePatch: () => (/* binding */ valuePatch)
/* harmony export */ });
// sf-settings' data: the items a page gives, their values, and the entries of
// sf-menu-context they become in each look. Pure functions, no DOM, so the
// contract test reads them without a browser.
//
// An item is a setting or what stands between settings:
//
//   {id, type: 'switch', text, value: true}                         a boolean
//   {id, type: 'choice', text, value: 'dark', options: [{id, text}]} one of a few
//   {id, type: 'range', text, value: 100, min, max, step, unit}      a number
//   {id, type: 'color', text, value: 'blue', options?, custom?}       a colour
//   {type: 'heading', text}, {type: 'separator'}
//   {type: 'group', text, items: [...]}                              a titled block
//   {id, type: 'fields', text, options: [{id, text, checked, pinned}],
//    sortable, pinnable}                                             a list of many
//
// The value lives in the item and nowhere else. A fields list (the panel look,
// owner decision C106) keeps its value in its options: their order, which are
// checked and which are pinned; its value reads them as [{id, checked, pinned}]
// in order, the pinned ones first.
const LOOKS = ['drill', 'rows', 'panel']; // The tiles look left (owner decision C176 (5), 2026-11-14): its switches are
// rows. tiles stays a dated former name of drill until 2027-01-01
// (component.json aliases); a page that still writes it gets the drill look.

const FORMER_LOOKS = Object.freeze({
  tiles: 'drill'
});
/** The look a written value draws: a look, a former name's look, else drill. */

const lookOf = value => LOOKS.includes(value) ? value : FORMER_LOOKS[value] ?? 'drill';
const SIZES = ['1/2', '1']; // The size a page that writes none gets (C176, defect SM-1; owner decision
// C22): the ordinary step; compactness is the density of the region.

const DEFAULT_SIZE = '1';
const APPLY = ['instant', 'button'];
const TYPES = ['switch', 'choice', 'range', 'color', 'heading', 'separator', 'group', 'fields'];
const VALUE_TYPES = new Set(['switch', 'choice', 'range', 'color', 'fields']); // ─── the colour row (owner decision C85) ─────────────────────────────────
//
// A colour setting -- a site's or a reader's colour in a settings menu, beside
// the theme -- is a row with the current colour as a circle in its lead; it
// opens a level of palette hues, each a circle and its word, and, unless
// custom is false, «Свой цвет…», which opens sf-input-color's window on «Своё».
// The value is what sf-input-color stores (C83): a palette hue by its name
// (blue), the same in every language, painted 50 light / 70 dark, or an own
// colour as its code (#rrggbb).
// The sixteen hues of the static palette (C17), the names a colour value may
// take (sf-input-color's PALETTE).

const HUES = Object.freeze(['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'pink', 'brown', 'gray']); // The level a colour row opens when its item names no options: the ten hues
// of the accepted menu (prototype theme-generator-study #practice-menu).

const COLOR_OPTIONS = Object.freeze(['red', 'orange', 'amber', 'green', 'teal', 'sky', 'blue', 'violet', 'pink', 'gray']); // The id of the «Свой цвет…» option in the menu's entries.

const OWN_COLOR = '#own';
const SHORT_HEX = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/iu;
const LONG_HEX = /^#?([0-9a-f]{6})$/iu;
/** An own colour's code, lowercase #rrggbb; '' for anything else. */

function colorCode(value) {
  const text = String(value ?? '').trim();
  const short = SHORT_HEX.exec(text);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toLowerCase();
  const long = LONG_HEX.exec(text);
  return long ? `#${long[1].toLowerCase()}` : '';
}
/** The CSS colour a colour value paints: a hue's tone for the theme (50 light, 70 dark), or the code. */

const colorFill = value => HUES.includes(value) ? `light-dark(var(--sf-${value}-50), var(--sf-${value}-70))` : colorCode(value); // The hues a colour row offers: its options (names, or {id, text}) that are
// palette hues, else the default ten.

function colorOptions(item) {
  const given = Array.isArray(item?.options) ? item.options : null;
  const list = (given ?? COLOR_OPTIONS).map(option => typeof option === 'string' ? {
    id: option
  } : option).filter(option => option && HUES.includes(option.id));
  return list;
}

const allowsOwn = item => item?.custom !== false;

const isItem = item => Boolean(item) && typeof item === 'object' && TYPES.includes(item.type);

const optionsOf = item => Array.isArray(item?.options) ? item.options.filter(option => option && typeof option === 'object' && option.id !== undefined && option.id !== null) : [];
/**
 * A fields list's options in the order they stand, the pinned ones first (a
 * pinned field stays on top, C106 (6)); the order among the pinned and among
 * the rest is the order given.
 */


function fieldOptions(item) {
  const options = optionsOf(item);
  return [...options.filter(option => option.pinned), ...options.filter(option => !option.pinned)];
} // What a fields list is given as its value: the ids to check, in the order
// they stand ([id, ...]), or the options themselves ([{id, checked, pinned}])
// in a new order -- the ones left out keep their state and follow. An id the
// list does not hold makes the value invalid.

function fieldsPatch(item, value) {
  if (!Array.isArray(value)) return null;
  const options = optionsOf(item);
  const byId = new Map(options.map(option => [option.id, option]));

  if (value.every(one => typeof one === 'string')) {
    if (!value.every(id => byId.has(id))) return null;
    const on = new Set(value);
    return {
      options: fieldOptions({
        options: options.map(option => ({ ...option,
          checked: on.has(option.id)
        }))
      })
    };
  }

  if (!value.every(one => one && typeof one === 'object' && byId.has(one.id))) return null;
  const listed = new Set(value.map(one => one.id));
  const ordered = value.map(one => {
    const option = { ...byId.get(one.id)
    };
    if (typeof one.checked === 'boolean') option.checked = one.checked;
    if (typeof one.pinned === 'boolean') option.pinned = one.pinned;
    return option;
  });
  return {
    options: fieldOptions({
      options: [...ordered, ...options.filter(option => !listed.has(option.id))]
    })
  };
}
/** Whether two values are the same: by identity, or for a fields list by what it holds. */


function sameValue(a, b) {
  if (a === b || Number.isNaN(a) && Number.isNaN(b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) return JSON.stringify(a) === JSON.stringify(b);
  return false;
}
/** Whether an item holds a value (a switch, a choice, a range or a fields list with an id). */

const holdsValue = item => isItem(item) && VALUE_TYPES.has(item.type) && typeof item.id === 'string' && item.id !== '';
/**
 * An item's value: a boolean for a switch, a number for a range, the chosen
 * option's id for a choice (its value, else the option marked checked, else
 * null).
 */

function itemValue(item) {
  if (item?.type === 'fields') return fieldOptions(item).map(option => ({
    id: option.id,
    checked: Boolean(option.checked),
    pinned: Boolean(option.pinned)
  }));
  if (item?.type === 'switch') return Boolean(item.value);

  if (item?.type === 'range') {
    const number = Number(item.value ?? item.min ?? 0);
    return Number.isFinite(number) ? number : 0;
  }

  if (item?.type === 'choice') {
    const options = optionsOf(item);
    if (item.value !== undefined && item.value !== null && options.some(option => option.id === item.value)) return item.value;
    return options.find(option => option.checked)?.id ?? null;
  }

  if (item?.type === 'color') return colorPatch(item, item.value)?.value ?? null;
  return null;
} // A colour row takes a hue it offers, or a code while it allows an own colour.

function colorPatch(item, value) {
  if (typeof value !== 'string') return null;
  if (colorOptions(item).some(option => option.id === value)) return {
    value
  };
  const code = allowsOwn(item) ? colorCode(value) : '';
  return code ? {
    value: code
  } : null;
}
/**
 * What to write into an item to give it a value; null when the item cannot
 * hold that value (a choice without such an option, a range given no number).
 */


function valuePatch(item, value) {
  if (item?.type === 'fields') return fieldsPatch(item, value);
  if (item?.type === 'switch') return typeof value === 'boolean' ? {
    value
  } : null;

  if (item?.type === 'range') {
    if (value === null || value === '' || typeof value === 'boolean') return null;
    const number = Number(value);
    return Number.isFinite(number) ? {
      value: number
    } : null;
  }

  if (item?.type === 'choice') return optionsOf(item).some(option => option.id === value) ? {
    value
  } : null;
  if (item?.type === 'color') return colorPatch(item, value);
  return null;
}
/** Every setting's value by its id, at the depth it sits. */

function valueMap(items, into = {}) {
  for (const item of Array.isArray(items) ? items : []) {
    if (holdsValue(item)) into[item.id] = itemValue(item);
    if (item?.type === 'group') valueMap(item.items, into);
  }

  return into;
}
/** The item carrying an id, at any depth; null when none does. */

function findItem(items, id) {
  for (const item of Array.isArray(items) ? items : []) {
    if (holdsValue(item) && item.id === id) return item;

    if (item?.type === 'group') {
      const found = findItem(item.items, id);
      if (found) return found;
    }
  }

  return null;
}
/**
 * The items with every setting a resolver answers for rewritten: a new list
 * (the lists above a rewritten item are copied), and how many were. A list
 * with nothing to change is given back as it was.
 */

function rewriteValues(items, resolve) {
  if (!Array.isArray(items)) return {
    list: items,
    count: 0
  };
  let count = 0;
  const list = items.map(item => {
    if (!item || typeof item !== 'object') return item;

    if (holdsValue(item)) {
      const patch = resolve(item);
      if (!patch) return item;
      count += 1;
      return { ...item,
        ...patch
      };
    }

    if (item.type === 'group') {
      const inner = rewriteValues(item.items, resolve);
      if (!inner.count) return item;
      count += inner.count;
      return { ...item,
        items: inner.list
      };
    }

    return item;
  });
  return {
    list: count ? list : items,
    count
  };
} // ─── entries of sf-menu-context ───────────────────────────────────────────

const own = (item, keys) => Object.fromEntries(keys.filter(key => item[key] !== undefined && item[key] !== null).map(key => [key, item[key]])); // A colour row as the menu's choice: the current colour as the row's circle,
// the hues as options with their circles and words, and «Свой цвет…» last
// (OWN_COLOR) -- checked, with its circle and code, while the value is one.


function colorEntry(item, base, look, word) {
  const value = itemValue(item);
  const options = colorOptions(item).map(option => ({
    id: option.id,
    text: option.text ?? word(`hue-${option.id}`),
    swatch: colorFill(option.id),
    checked: option.id === value
  }));
  const code = colorCode(value);

  if (allowsOwn(item)) {
    options.push(code ? {
      id: OWN_COLOR,
      text: word('own-color-value', {
        value: code
      }),
      swatch: code,
      checked: true
    } : {
      id: OWN_COLOR,
      text: word('own-color'),
      icon: 'colorize',
      checked: false
    });
  }

  return { ...base,
    type: 'choice',
    ...(look === 'drill' ? {
      view: 'drill'
    } : {}),
    ...(value ? {
      swatch: colorFill(value)
    } : {}),
    options
  };
} // The words a colour row needs when the element gives none (the contract
// test, a server printing entries): the hue's name and the own colour's.


const plainWord = (key, vars = {}) => {
  if (key === 'own-color') return 'Own colour…';
  if (key === 'own-color-value') return `Own: ${vars.value ?? ''}`;
  return key.replace(/^hue-/u, '');
}; // One setting as a menu entry. A choice's value becomes its options' checked
// marks, the way the menu reads it; drill opens its options in the panel, and
// so does a choice of the rows look whose options did not fit beside its name
// (owner decision C176 (3)): the row becomes a drill row by itself, the value
// under the name, the options a level deeper.


function settingEntry(item, look, word = plainWord, folded = NONE) {
  if (look === 'rows' && folded.has(item.id) && (item.type === 'choice' || item.type === 'color')) look = 'drill';
  const base = { ...own(item, ['id', 'text', 'caption', 'icon', 'keywords']),
    type: item.type
  };
  if (item.disabled) base.disabled = true;
  if (item.type === 'color') return colorEntry(item, base, look, word);
  if (item.type === 'switch') return { ...base,
    value: itemValue(item)
  };
  if (item.type === 'range') return { ...base,
    ...own(item, ['min', 'max', 'step', 'unit']),
    value: itemValue(item)
  };
  const value = itemValue(item);
  const options = optionsOf(item).map(option => ({ ...own(option, ['id', 'text', 'icon']),
    ...(option.disabled ? {
      disabled: true
    } : {}),
    checked: option.id === value
  }));
  return { ...base,
    ...(look === 'drill' ? {
      view: 'drill'
    } : {}),
    options
  };
}

const NONE = new Set(); // The entries of a list of items: a group is its title (a heading) and its
// rows; an item of no known type is left out.

function entriesOf(items, look, word, folded = NONE) {
  const out = [];

  for (const item of Array.isArray(items) ? items : []) {
    if (!isItem(item)) continue;

    if (item.type === 'heading') {
      out.push({
        type: 'heading',
        text: item.text ?? ''
      });
    } else if (item.type === 'separator') {
      out.push({
        type: 'separator'
      });
    } else if (item.type === 'group') {
      const rows = entriesOf(item.items, look, word, folded);
      if (!rows.length) continue;
      if (item.text) out.push({
        type: 'heading',
        text: item.text
      });
      out.push({
        type: 'group',
        ...own(item, ['text']),
        items: rows
      });
    } else if (holdsValue(item) && item.type !== 'fields') {
      // A fields list is the panel look's alone: a menu has no row for it.
      out.push(settingEntry(item, look, word, folded));
    }
  } // A separator does not open or close the list, and two do not stand together.


  return out.filter((entry, index, list) => entry.type !== 'separator' || index > 0 && index < list.length - 1 && list[index + 1].type !== 'separator');
}
/**
 * The menu's entries for a look:
 *   drill  every choice opens its options in the panel (view: drill), the
 *          value under the name; the menu is submenu="drill";
 *   rows   the name at the start, the control at the end: quiet options, a
 *          switch, a slider; a choice named in `folded` -- its options did
 *          not fit beside its name -- is a drill row instead (C176 (3)).
 * A former look (tiles) draws the look it became (lookOf). A switch is a row
 * in every look (C176 (5)); `tile` on an item is no longer read.
 */


function entriesFor(items, look = 'drill', {
  word = plainWord,
  folded = NONE
} = {}) {
  return entriesOf(items, lookOf(look), word, folded instanceof Set ? folded : new Set(folded ?? []));
} // ─── the panel look (owner decision C106) ─────────────────────────────────

/**
 * The panel's groups: each top-level group, and the settings between groups
 * gathered into an untitled one, in the order they stand. A heading or a
 * separator stays in the group it stands in.
 */

function panelGroups(items) {
  const groups = [];
  let loose = null;

  for (const item of Array.isArray(items) ? items : []) {
    if (!isItem(item)) continue;

    if (item.type === 'group') {
      loose = null;
      const inner = (Array.isArray(item.items) ? item.items : []).filter(isItem);
      if (inner.length) groups.push({
        text: item.text ?? '',
        items: inner
      });
      continue;
    }

    if (!loose) {
      loose = {
        text: '',
        items: []
      };
      groups.push(loose);
    }

    loose.items.push(item);
  }

  return groups.filter(group => group.items.some(item => holdsValue(item)));
}
/**
 * How the panel shows its groups (C106 (5)): sections in one scroll by
 * default; tabs when the panel has a search and a group holds its own long
 * list (a fields list) -- the list and its search take a tab of their own.
 * A single group is never a tab.
 */

function panelLayout(items, {
  search = false
} = {}) {
  const groups = panelGroups(items);
  if (!search || groups.length < 2) return 'sections';
  return groups.some(group => group.items.some(item => item.type === 'fields')) ? 'tabs' : 'sections';
} // A search's words: no case, ё as е.
// c282-allow: input parsing (ё is searched as е)

const folded = value => String(value ?? '').toLocaleLowerCase().replace(/ё/gu, 'е').trim();
/** Whether a row's words hold the query (no case, ё as е). An empty query holds every row. */

function matches(query, ...words) {
  const asked = folded(query);
  if (!asked) return true;
  return words.flat().some(word => folded(word).includes(asked));
}
/**
 * What «Применить (N)» counts in a panel applied by a button (a filter, C106
 * (4)): the conditions it will hold -- the checked fields of every list and
 * the switches that are on.
 */

function applyCount(items) {
  let count = 0;

  for (const item of Array.isArray(items) ? items : []) {
    if (item?.type === 'group') count += applyCount(item.items);else if (holdsValue(item) && item.type === 'fields') count += optionsOf(item).filter(option => option.checked).length;else if (holdsValue(item) && item.type === 'switch' && itemValue(item)) count += 1;
  }

  return count;
} // ─── order and pins: a fields list, and a choice that orders (C106 (3), (6))
//
// A choice of one -- a filter's saved templates -- may order and pin its
// options as a fields list does: {id, type: 'choice', sortable, pinnable,
// options: [{id, text, pinned}]}. Its value stays the chosen option's id; its
// order is its options' order, the pinned first, read as [{id, pinned}]
// (choiceOrder) and given back by orderPatch. An option may say sortable:
// false or pinnable: false -- a table's system column: it has no handle or no
// pin, and it keeps its place while the others move round it.

/** Whether a list's option moves: the list orders and the option does not refuse. */

const optionMoves = (item, option) => Boolean(item?.sortable) && option?.sortable !== false;
/** Whether a list's option pins: the list pins and the option does not refuse. */

const optionPins = (item, option) => Boolean(item?.pinnable) && option?.pinnable !== false;
/** Whether a choice orders or pins its options (then its order is reported). */

const choiceArranges = item => item?.type === 'choice' && Boolean(item.sortable || item.pinnable);
/** A choice's options in the order they stand, the pinned first (as a fields list's). */

const choiceOptions = item => fieldOptions(item);
/** A choice's order: [{id, pinned}] as its options stand, the pinned first. */

function choiceOrder(item) {
  return choiceOptions(item).map(option => ({
    id: option.id,
    pinned: Boolean(option.pinned)
  }));
}
/**
 * What to write into a choice to give it an order ([{id, pinned}] or ids):
 * the options listed come first in that order, the ones left out follow;
 * null when an id is not the choice's. The chosen option stays chosen.
 */

function orderPatch(item, order) {
  if (item?.type !== 'choice' || !Array.isArray(order)) return null;
  const options = optionsOf(item);
  const byId = new Map(options.map(option => [option.id, option]));
  const given = order.map(one => typeof one === 'string' ? {
    id: one
  } : one);
  if (!given.every(one => one && typeof one === 'object' && byId.has(one.id))) return null;
  const listed = new Set(given.map(one => one.id));
  const ordered = given.map(one => {
    const option = { ...byId.get(one.id)
    };
    if (typeof one.pinned === 'boolean') option.pinned = one.pinned;
    return option;
  });
  return {
    options: fieldOptions({
      options: [...ordered, ...options.filter(option => !listed.has(option.id))]
    })
  };
}
/** Every ordering choice's order by its id, at the depth it sits. */

function orderMap(items, into = {}) {
  for (const item of Array.isArray(items) ? items : []) {
    if (holdsValue(item) && choiceArranges(item)) into[item.id] = choiceOrder(item);
    if (item?.type === 'group') orderMap(item.items, into);
  }

  return into;
} // A list's arrangement for its options in a new order: a fields list's value
// ([{id, checked, pinned}]), a choice's order ([{id, pinned}]).

function arranged(item, options) {
  return item?.type === 'choice' ? options.map(option => ({
    id: option.id,
    pinned: Boolean(option.pinned)
  })) : options.map(option => ({
    id: option.id,
    checked: Boolean(option.checked),
    pinned: Boolean(option.pinned)
  }));
} // The options again with the ones that do not move back at the places they
// stood (`before`), the moving ones in the order `moved` gives them.


function keepFixed(item, before, moved) {
  const loose = moved.filter(option => optionMoves(item, option));
  let at = 0;
  return before.map(option => optionMoves(item, option) ? loose[at++] : option);
}
/**
 * A list with one option moved by `step` places within its own block (the
 * pinned or the rest: a pinned option stays above every other), passing the
 * options that do not move, which keep their places; null when it cannot
 * move that way. A fields list's value or a choice's order.
 */


function movedField(item, optionId, step) {
  const options = fieldOptions(item);
  const option = options.find(one => one.id === optionId);
  if (!option || !optionMoves(item, option)) return null;
  const loose = options.filter(one => optionMoves(item, one));
  const at = loose.indexOf(option);
  const to = at + step;
  if (to < 0 || to >= loose.length || Boolean(loose[to].pinned) !== Boolean(option.pinned)) return null;
  const list = [...loose];
  list.splice(at, 1);
  list.splice(to, 0, option);
  return arranged(item, keepFixed(item, options, list));
}
/** A list with one option put before another of the same block (a drag), or null. */

function placedField(item, optionId, beforeId) {
  const options = fieldOptions(item);
  const moving = options.find(option => option.id === optionId);
  if (!moving || optionId === beforeId || !optionMoves(item, moving)) return null;
  const rest = options.filter(option => option.id !== optionId);
  let at = beforeId === null ? rest.length : rest.findIndex(option => option.id === beforeId);
  if (at < 0) return null; // A pinned option stays among the pinned, the rest below them.

  const pinned = rest.filter(option => option.pinned).length;
  at = moving.pinned ? Math.min(at, pinned) : Math.max(at, pinned);
  rest.splice(at, 0, moving);
  const value = arranged(item, keepFixed(item, options, rest));
  return sameValue(value, arranged(item, options)) ? null : value;
}
/**
 * A list with one option checked or pinned the other way, or null: a fields
 * list's value, a choice's order (pinned only). An option that does not pin
 * is not pinned or unpinned.
 */

function toggledField(item, optionId, key = 'checked') {
  const options = fieldOptions(item);
  const option = options.find(one => one.id === optionId);
  if (!option || key === 'checked' && (option.disabled || item?.type !== 'fields')) return null;
  if (key === 'pinned' && !optionPins(item, option)) return null;
  return arranged(item, options.map(one => one.id === optionId ? { ...one,
    [key]: !one[key]
  } : one));
}

/***/ },

/***/ "ffb7641310c5"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ },

/***/ "5b7d7695b41b"
(module) {

module.exports = (globalThis.SF && globalThis.SF.runtimeModule ? globalThis.SF.runtimeModule("element-manifest", 1) : new Promise((resolve, reject) => globalThis.addEventListener("sf-runtime-ready", () => globalThis.SF.runtimeModule("element-manifest", 1).then(resolve, reject), { once: true })));

/***/ },

/***/ "9d9903b87148"
(module) {

module.exports = (globalThis.SF && globalThis.SF.runtimeModule ? globalThis.SF.runtimeModule("lit/directives/keyed.js", 1) : new Promise((resolve, reject) => globalThis.addEventListener("sf-runtime-ready", () => globalThis.SF.runtimeModule("lit/directives/keyed.js", 1).then(resolve, reject), { once: true })));

/***/ },

/***/ "2a080a730149"
(module) {

module.exports = (globalThis.SF && globalThis.SF.runtimeModule ? globalThis.SF.runtimeModule("lit", 1) : new Promise((resolve, reject) => globalThis.addEventListener("sf-runtime-ready", () => globalThis.SF.runtimeModule("lit", 1).then(resolve, reject), { once: true })));

/***/ },

/***/ "43090d1c8307"
(module) {

module.exports = (globalThis.SF && globalThis.SF.runtimeModule ? globalThis.SF.runtimeModule("page-language", 1) : new Promise((resolve, reject) => globalThis.addEventListener("sf-runtime-ready", () => globalThis.SF.runtimeModule("page-language", 1).then(resolve, reject), { once: true })));

/***/ },

/***/ "deb1a4d61565"
(module) {

module.exports = (globalThis.SF && globalThis.SF.runtimeModule ? globalThis.SF.runtimeModule("smart-base", 1) : new Promise((resolve, reject) => globalThis.addEventListener("sf-runtime-ready", () => globalThis.SF.runtimeModule("smart-base", 1).then(resolve, reject), { once: true })));

/***/ },

/***/ "4bd9c3b168e0"
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   files: () => (/* binding */ files)
/* harmony export */ });
/* harmony import */ var _en_json__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("4bc232cd5c70");
// Written by scripts/build-language-packs.mjs from src/core/lang/built-in.json
// (owner decision C282); do not edit. The words this bundle carries: the
// built-in languages' (en); every other language comes from
// a language file (core/lang/<code>.js or its parts).


const files = { en: { runtime: _en_json__WEBPACK_IMPORTED_MODULE_0__.runtime } };

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({ en: _en_json__WEBPACK_IMPORTED_MODULE_0__.runtime });


/***/ },

/***/ "a6b3ed0c1589"
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AVATAR_HUES: () => (/* binding */ AVATAR_HUES),
/* harmony export */   AVATAR_TONES: () => (/* binding */ AVATAR_TONES),
/* harmony export */   STATIC_HUES: () => (/* binding */ STATIC_HUES),
/* harmony export */   TONE_HUES: () => (/* binding */ TONE_HUES),
/* harmony export */   avatarHue: () => (/* binding */ avatarHue),
/* harmony export */   avatarTone: () => (/* binding */ avatarTone),
/* harmony export */   avatarToneHash: () => (/* binding */ avatarToneHash),
/* harmony export */   resolveAvatarHue: () => (/* binding */ resolveAvatarHue),
/* harmony export */   resolveAvatarTone: () => (/* binding */ resolveAvatarTone)
/* harmony export */ });
// sf-avatar's hue from a name, without a document: a plain function of its
// argument, so tests/avatar-tones.contract.test.mjs runs it in Node and a server
// can print the same class in the first paint. docs/docs.md gives the algorithm
// for a server in another language.
//
// Owner decision C17 (2026-11-08): avatars have no colours of their own. The
// initials take a hue of the static palette (the hue setting, the class
// sf-hue-<name>); the eight tones of initials are gone, and `auto` picks among
// eight static hues in the old order, so a name keeps its slot: rose is pink,
// the former violet (HCT hue 325) is purple, the other six keep their names.
// A former tone moves at most 15 degrees (dispatcher, 2026-11-09).
//
// FNV-1a, 32 bits, over the UTF-8 bytes of the string exactly as given (no
// trimming, no case folding, no normalisation), its high half folded onto the
// low one, because the low bits of FNV-1a alone follow the low bits of the
// input; the remainder by the length of the list picks the tone.
//
// The list and its order are part of the algorithm: a name keeps its tone only
// while they stay. A later named tone does not join `auto`.
const AVATAR_HUES = Object.freeze(['pink', 'amber', 'lime', 'green', 'teal', 'sky', 'indigo', 'purple']);

// Every hue a setting may name: the static palette (theme-palette.js
// STATIC_HUES, tests/avatar-tones.contract.test.mjs holds the two equal).
const STATIC_HUES = Object.freeze(['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'pink', 'brown', 'gray']);

// The former tone setting and its names, until 2027-01-01 (journal
// attribute-c17-avatar-tone-to-hue, value-c17-avatar-rose-to-pink, which
// also carries violet to purple).
const AVATAR_TONES = Object.freeze(['rose', 'amber', 'lime', 'green', 'teal', 'sky', 'indigo', 'violet']);
const TONE_HUES = Object.freeze({rose: 'pink', violet: 'purple'});

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

function avatarToneHash(name) {
  let hash = FNV_OFFSET;
  for (const byte of new TextEncoder().encode(String(name))) {
    hash = Math.imul(hash ^ byte, FNV_PRIME) >>> 0;
  }
  return (hash ^ (hash >>> 16)) >>> 0;
}

// No name, no hue: the neutral look.
function avatarHue(name) {
  const text = name === undefined || name === null ? '' : String(name);
  return text ? AVATAR_HUES[avatarToneHash(text) % AVATAR_HUES.length] : '';
}

// The hue a setting asks for: a named one as it is, auto the one of the name,
// empty (or a name the palette does not have) the neutral look. The former
// tone setting is read when hue is empty, its rose as pink and its violet as purple.
function resolveAvatarHue(hue, name, tone = '') {
  const setting = hue || TONE_HUES[tone] || tone || '';
  if (setting === 'auto') return avatarHue(name);
  return STATIC_HUES.includes(setting) ? setting : '';
}

// The former names (2027-01-01): the tone of a name in the old words.
function avatarTone(name) {
  const text = name === undefined || name === null ? '' : String(name);
  return text ? AVATAR_TONES[avatarToneHash(text) % AVATAR_TONES.length] : '';
}

function resolveAvatarTone(setting, name) {
  return setting === 'auto' ? avatarTone(name) : setting || '';
}


/***/ },

/***/ "4bc232cd5c70"
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"runtime":{"folder":"folder, directory","folder_open":"open, folder","topic":"topic, section","home":"home, main","dashboard":"dashboard, overview","apartment":"building, organisation","store":"store, shop","storefront":"storefront, shop","business_center":"business, briefcase","work":"work, briefcase","badge":"badge, pass, id","person":"person, user","group":"group, people","groups":"groups, community","account_circle":"account, profile","manage_accounts":"manage, accounts, users","supervisor_account":"supervisor, team","contacts":"contacts","school":"school, learning","menu_book":"book, manual","assignment":"assignment","task":"task","description":"document, description","article":"article","note_alt":"note","edit_note":"edit, note","draft":"draft","receipt":"receipt","receipt_long":"bill, receipt","request_quote":"quote, estimate","inventory_2":"archive, inventory","category":"category","label":"label, tag","sell":"price, sell","local_offer":"offer, discount","shopping_cart":"shopping, cart","shopping_bag":"shopping, bag","payments":"payments, money","savings":"savings","credit_card":"credit, card","account_balance":"bank, account","calculate":"calculator","percent":"percent","trending_up":"trend, growth","analytics":"analytics","insights":"insights","monitoring":"monitoring","bar_chart":"bar, chart","pie_chart":"pie, chart","table_chart":"table","schedule":"time, clock, schedule","event":"event","today":"today","calendar_month":"calendar","date_range":"date, range","history":"history","alarm":"alarm","timer":"timer","update":"update","hourglass_top":"hourglass, waiting","mail":"mail, email, letter","outgoing_mail":"outgoing, mail","chat":"chat, message","forum":"forum, discussion","sms":"sms, text","call":"call, phone","phone_in_talk":"phone, call, talk","contact_support":"support, help","campaign":"campaign, announcement","notifications":"notifications","language":"language, world","public":"public, web, world","place":"place","map":"map","location_on":"location, address","travel_explore":"travel, explore","flight":"flight, plane","local_shipping":"shipping, delivery","route":"route","directions":"directions","settings":"settings","tune":"tune, filter","build":"build, tools","construction":"construction","handyman":"handyman, repair","code":"code","terminal":"terminal, console","data_object":"data, object","api":"api","bug_report":"bug","database":"database","storage":"storage","cloud":"cloud","backup":"backup","sync":"sync","folder_zip":"zip, archive","upload_file":"upload, file","download":"download","attach_file":"attach, file","link":"link","lock":"lock","lock_open":"unlock, open","shield":"shield, protection","verified_user":"verified, user","key":"key","admin_panel_settings":"admin","policy":"policy","gavel":"law, gavel","fingerprint":"fingerprint","visibility":"visibility, view","palette":"palette, colour, color","format_paint":"format, paint","image":"image, picture","photo_library":"photos, gallery","collections":"collections","movie":"movie, video","play_circle":"play","mic":"microphone","headphones":"headphones, audio","brush":"brush"}}');

/***/ },

/***/ "b80c3b255e84"
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"$comment":"Dated aliases of sf-admin-menu for the shim (core/js/aliases.js, standard §16 item 20). sf-admin-menu-intent splits into one event per verb (vocabulary 1.1.5 §5.1): each row sends the old name after its new one, with the old detail {intent, payload} the element\'s adapter makes. navigate keeps its DOM name. The items path\'s names (sf-admin-menu-search, sf-admin-menu-settings-reset, setRecentResults) left with it in 1.15.0: the set was never released with them.","component":"sf-admin-menu","since":"2026-10-27","remove_after":"2026-12-01","aliases":[{"from":"sf-admin-menu-intent","to":"sf-admin-menu-refresh","kind":"event","component":"sf-admin-menu","since":"2026-10-27","remove_after":"2026-12-01","mode":"split","cancelable":false,"section":"§8, vocabulary 1.1.5 §5.1","note":"split by detail.intent: the element\'s adapter (sfAliasAdapters) makes {intent, payload}; a request the port did not raise has none and sends no old name"},{"from":"sf-admin-menu-intent","to":"sf-admin-menu-open","kind":"event","component":"sf-admin-menu","since":"2026-10-27","remove_after":"2026-12-01","mode":"split","cancelable":false,"section":"§8, vocabulary 1.1.5 §5.1","note":"split by detail.intent: the element\'s adapter (sfAliasAdapters) makes {intent, payload}; a request the port did not raise has none and sends no old name"},{"from":"sf-admin-menu-intent","to":"sf-admin-menu-toggle","kind":"event","component":"sf-admin-menu","since":"2026-10-27","remove_after":"2026-12-01","mode":"split","cancelable":false,"section":"§8, vocabulary 1.1.5 §5.1","note":"split by detail.intent: the element\'s adapter (sfAliasAdapters) makes {intent, payload}; a request the port did not raise has none and sends no old name"},{"from":"sf-admin-menu-intent","to":"sf-admin-menu-save","kind":"event","component":"sf-admin-menu","since":"2026-10-27","remove_after":"2026-12-01","mode":"split","cancelable":false,"section":"§8, vocabulary 1.1.5 §5.1","note":"split by detail.intent: the element\'s adapter (sfAliasAdapters) makes {intent, payload}; a request the port did not raise has none and sends no old name"},{"from":"sf-admin-menu-intent","to":"sf-admin-menu-query","kind":"event","component":"sf-admin-menu","since":"2026-10-27","remove_after":"2026-12-01","mode":"split","cancelable":false,"section":"§8, vocabulary 1.1.5 §5.1","note":"split by detail.intent: the element\'s adapter (sfAliasAdapters) makes {intent, payload}; a request the port did not raise has none and sends no old name"},{"from":"sf-admin-menu-intent","to":"sf-admin-menu-create","kind":"event","component":"sf-admin-menu","since":"2026-10-27","remove_after":"2026-12-01","mode":"split","cancelable":false,"section":"§8, vocabulary 1.1.5 §5.1","note":"split by detail.intent: the element\'s adapter (sfAliasAdapters) makes {intent, payload}; a request the port did not raise has none and sends no old name"},{"from":"sf-admin-menu-intent","to":"sf-admin-menu-rename","kind":"event","component":"sf-admin-menu","since":"2026-10-27","remove_after":"2026-12-01","mode":"split","cancelable":false,"section":"§8, vocabulary 1.1.5 §5.1","note":"split by detail.intent: the element\'s adapter (sfAliasAdapters) makes {intent, payload}; a request the port did not raise has none and sends no old name"},{"from":"sf-admin-menu-intent","to":"sf-admin-menu-delete","kind":"event","component":"sf-admin-menu","since":"2026-10-27","remove_after":"2026-12-01","mode":"split","cancelable":false,"section":"§8, vocabulary 1.1.5 §5.1","note":"split by detail.intent: the element\'s adapter (sfAliasAdapters) makes {intent, payload}; a request the port did not raise has none and sends no old name"},{"from":"sf-admin-menu-intent","to":"sf-admin-menu-read","kind":"event","component":"sf-admin-menu","since":"2026-10-27","remove_after":"2026-12-01","mode":"split","cancelable":false,"section":"§8, vocabulary 1.1.5 §5.1","note":"split by detail.intent: the element\'s adapter (sfAliasAdapters) makes {intent, payload}; a request the port did not raise has none and sends no old name"},{"from":"sf-admin-menu-intent","to":"sf-admin-menu-reset","kind":"event","component":"sf-admin-menu","since":"2026-10-27","remove_after":"2026-12-01","mode":"split","cancelable":false,"section":"§8, vocabulary 1.1.5 §5.1","note":"split by detail.intent: the element\'s adapter (sfAliasAdapters) makes {intent, payload}; a request the port did not raise has none and sends no old name"},{"from":"sf-admin-menu-intent","to":"sf-admin-menu-sign-out","kind":"event","component":"sf-admin-menu","since":"2026-10-27","remove_after":"2026-12-01","mode":"split","cancelable":false,"section":"§8, vocabulary 1.1.5 §5.1","note":"split by detail.intent: the element\'s adapter (sfAliasAdapters) makes {intent, payload}; a request the port did not raise has none and sends no old name"},{"from":"sf-host-port-request","to":null,"kind":"event","component":"sf-admin-menu","since":"2026-10-27","remove_after":"2026-12-01","mode":"retired","section":"§4.9 (1.3.7)","note":"the page or an assembly hands the port with connect-port {port}; the request is still sent until the date"},{"from":"aria-label","to":null,"kind":"attribute","component":"sf-admin-menu","since":"2026-10-27","remove_after":"2026-12-01","mode":"host-attribute","section":"§3.1","note":"stays a host attribute, read by the element (§3.1, §4.8); no shim"}]}');

/***/ },

/***/ "827a6156cb91"
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"id":"smart.admin-menu","tag":"sf-admin-menu","version":"1.17.1","kind":"leaf","settings":{"search-shortcut":{"type":"string","default":"mod+k"},"current":{"type":"string","default":""},"expected-columns":{"type":"number","default":2,"integer":true,"min":1,"max":2},"first-answer":{"type":"object","optional":true},"open":{"type":"boolean","optional":true}},"values":{"favourite":{"type":"boolean"}},"events":{"query":{"carries":{"kind":{"type":"enum","values":["site","search"]},"query":"string","request-id":{"type":"string","optional":true},"intent":{"type":"string","optional":true},"payload":{"type":"object","optional":true}}},"reset":{"carries":{"kind":{"type":"enum","values":["view"]},"id":{"type":"id","optional":true},"intent":{"type":"string","optional":true},"payload":{"type":"object","optional":true}}},"navigate":{"carries":{"id":"id","key":"string","href":{"type":"string","nullable":true},"region":{"type":"boolean","optional":true}},"cancelable":true},"refresh":{"carries":{"kind":"string","intent":"string","payload":"object","reason":{"type":"string","nullable":true,"optional":true},"site":{"type":"id","nullable":true,"optional":true}}},"open":{"carries":{"kind":"string","intent":"string","payload":"object","id":"id","href":{"type":"string","nullable":true,"optional":true},"group":{"type":"string","nullable":true,"optional":true}}},"toggle":{"carries":{"kind":"string","intent":"string","payload":"object","id":"id","on":"boolean"}},"save":{"carries":{"kind":"string","intent":"string","payload":"object","values":{"type":"object","optional":true},"id":{"type":"id","nullable":true,"optional":true},"revision":{"type":"number","nullable":true,"optional":true}}},"create":{"carries":{"kind":"string","intent":"string","payload":"object"}},"rename":{"carries":{"kind":"string","intent":"string","payload":"object","id":"id","title":"string"}},"delete":{"carries":{"kind":"string","intent":"string","payload":"object","ids":"list"}},"read":{"carries":{"kind":"string","intent":"string","payload":"object","ids":"list"}},"sign-out":{"carries":{"kind":"string","intent":"string","payload":"object"},"own-verb":true},"column-change":{"carries":{"open":"boolean"}}},"actions":{"refresh":{"concurrency":"latest"},"toggle":{"with":{"id":"id","on":"boolean"},"waits":true},"show-column":{},"hide-column":{},"toggle-column":{}},"port":{"id":"simai.admin-navigation-port","version":"1.1.0","contract":"src/core/contracts/ports/simai.admin-navigation-port/1.1.0/port.json"},"host-states":{},"css-variables":{"--sf-admin-menu-color":{"type":"color","state":"default"},"--sf-admin-menu-first-background-color":{"type":"color","state":"default"},"--sf-admin-menu-second-background-color":{"type":"color","state":"default"},"--sf-admin-menu-border-color":{"type":"color","state":"default"},"--sf-admin-menu-padding":{"type":"length","state":"default"},"--sf-admin-menu-one-column-inline-size":{"type":"length","state":"default"},"--sf-admin-menu-two-columns-inline-size":{"type":"length","state":"default"},"--sf-admin-menu-compact-one-column-inline-size":{"type":"length","state":"default"},"--sf-admin-menu-compact-two-columns-inline-size":{"type":"length","state":"default"}}}');

/***/ },

/***/ "84d79a7cc4a2"
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"title":"قائمة الإدارة","runtime":{"account":"الحساب","add":"إضافة","add-divider":"فاصل","add-heading":"عنوان فرعي","add-link":"رابط","add-section":"قسم","all-sections":"كل الأقسام","all-sites":"مشترك بين كل المواقع","back":"رجوع","cancel":"إلغاء","choose-icon":"اختيار أيقونة","choose-site":"اختيار موقع","collapse":"طي","column-width":"عرض العمود","configure-menu":"إعداد القائمة","conflict":"تغيّرت القائمة في مكان آخر. المعروض الآن هو المحفوظ حاليًا.","count":"لا شيء غير مقروء|{count} غير مقروء|{count} غير مقروءين|{count} غير مقروءة|{count} غير مقروء|{count} غير مقروء","create":"إنشاء","delete-profile":"حذف","delete-row":"حذف","done":"تم","dot":"جديد","draft-drop":"الخروج دون حفظ","draft-leave":"التغييرات للجميع غير محفوظة. هل تريد الخروج دونها؟","drag":"نقل","edit-menu":"تعديل القائمة","expand":"توسيع","external":"يُفتح في علامة تبويب جديدة","favourites":"المفضلة","favourites-empty":"اضغط النجمة بجانب عنوان الصفحة لإضافتها هنا.","find-in-section":"البحث في القسم","find-language":"البحث عن لغة","find-site":"البحث عن موقع","finish-configure":"إنهاء الإعداد","fold":"طي","hide":"إخفاء","hide-column":"إخفاء العمود","hide-from-menu":"إخفاء من القائمة","href-insecure":"عناوين https:// فقط: لا يُحفظ رابط http://.","href-invalid":"العنوان مسار في هذا الموقع (/admin/...) أو عنوان https:// كامل.","language":"اللغة","language-note":"لغة واجهة الإدارة. لغات الموقع في إعدادات الموقع.","level-everyone":"للجميع","level-label":"لمن","level-personal":"شخصي","level-role":"ملف الإعدادات","link-href":"العنوان","link-label":"الاسم","link-name-empty":"أعطِ الرابط اسمًا.","loading":"جارٍ تحميل القائمة…","lock-for-all":"تثبيت للجميع","locked-by":"ثبّته مسؤول للجميع:","locked-hide":"ثبّته مسؤول","locked-reason":"ثبّته مسؤول للجميع","manage-sites":"إدارة المواقع","menu":"القائمة","menu-profile":"ملف القائمة","menu-width":"عرض القائمة","more":"المزيد","more-sections":"أقسام أخرى","more-sites":"عرض المزيد","move-down":"إلى الأسفل","move-up":"إلى الأعلى","new-heading":"عنوان فرعي","new-profile":"ملف جديد…","new-section":"قسم جديد","note-dirty":"توجد تغييرات غير محفوظة","note-everyone":"كل من على الخادم، بالزر","note-personal":"أنت فقط، يُحفظ فورًا","note-role":"أصحاب هذا الملف، بالزر","note-shared":"ملف مشترك: يتغيّر لكل من في الموقع. يُطبَّق فورًا.","nothing-found":"لم يُعثر على شيء","notice-open":"فتح","notices-history":"كل السجل","notices-new":"جديدة","notices-none":"لا جديد","notices-read-all":"تعليم الكل كمقروء","notices-settings":"إعدادات الإشعارات","notifications":"الإشعارات","package-name":"استعادة اسم الحزمة","palette-hint":"أقسام، سجلات، إجراءات…","personal-name":"شخصي","profile-label":"الملف:","profile-name":"اسم الملف","profile-name-empty":"أعطِ الملف اسمًا.","refused":"لم يُحفظ: {reason}.","rename":"إعادة تسمية","rename-profile":"إعادة تسمية","reset":"إعادة الضبط","reset-to-packages":"العودة إلى الحزم","retry":"إعادة المحاولة","save":"حفظ","save-for-all":"حفظ للجميع","saved-for-all":"حُفظ للجميع.","search":"بحث","setting-title":"إعداد القائمة","shared-profile":"لكل من في الموقع","show":"إظهار","show-column":"إظهار العمود","sign-out":"تسجيل الخروج","star":"إضافة إلى المفضلة","theme":"المظهر","theme-dark":"داكن","theme-light":"فاتح","theme-system":"مثل النظام","unavailable":"القائمة غير متاحة الآن.","unfold":"عرض الكل","unlock":"إلغاء التثبيت","unstar":"إزالة من المفضلة"},"events":{"sign-out":{"label":"تسجيل الخروج"}}}');

/***/ },

/***/ "724f233c6209"
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"title":"Admin-Menü","runtime":{"account":"Konto","add":"Hinzufügen","add-divider":"Trennlinie","add-heading":"Zwischenüberschrift","add-link":"Link","add-section":"Bereich","all-sections":"Alle Bereiche","all-sites":"Für alle Websites","back":"Zurück","cancel":"Abbrechen","choose-icon":"Symbol wählen","choose-site":"Website wählen","collapse":"Einklappen","column-width":"Spaltenbreite","configure-menu":"Menü einrichten","conflict":"Das Menü wurde an anderer Stelle geändert. Angezeigt wird der aktuell gespeicherte Stand.","count":"{count} ungelesen|{count} ungelesen","create":"Erstellen","delete-profile":"Löschen","delete-row":"Löschen","done":"Fertig","dot":"neu","draft-drop":"Ohne Speichern verlassen","draft-leave":"Änderungen für alle sind nicht gespeichert. Ohne sie verlassen?","drag":"Verschieben","edit-menu":"Menü bearbeiten","expand":"Ausklappen","external":"öffnet in einem neuen Tab","favourites":"Favoriten","favourites-empty":"Klicken Sie auf den Stern neben dem Seitentitel, um die Seite hier hinzuzufügen.","find-in-section":"Im Bereich suchen","find-language":"Sprache suchen","find-site":"Website suchen","finish-configure":"Einrichtung beenden","fold":"einklappen","hide":"Ausblenden","hide-column":"Spalte ausblenden","hide-from-menu":"Aus dem Menü ausblenden","href-insecure":"Nur https://-Adressen: ein http://-Link wird nicht gespeichert.","href-invalid":"Eine Adresse ist ein Pfad auf dieser Website (/admin/...) oder eine vollständige https://-Adresse.","language":"Sprache","language-note":"Die Sprache der Verwaltung. Die Sprachen der Website stehen in den Website-Einstellungen.","level-everyone":"Für alle","level-label":"Für wen","level-personal":"Persönlich","level-role":"Einstellungsprofil","link-href":"Adresse","link-label":"Name","link-name-empty":"Geben Sie dem Link einen Namen.","loading":"Menü wird geladen…","lock-for-all":"Für alle fixieren","locked-by":"Von einem Administrator für alle fixiert:","locked-hide":"Von einem Administrator fixiert","locked-reason":"Von einem Administrator für alle fixiert","manage-sites":"Websites verwalten","menu":"Menü","menu-profile":"Menüprofil","menu-width":"Menübreite","more":"Mehr","more-sections":"Weitere Bereiche","more-sites":"Mehr anzeigen","move-down":"Nach unten","move-up":"Nach oben","new-heading":"Zwischenüberschrift","new-profile":"Neues Profil…","new-section":"Neuer Bereich","note-dirty":"Es gibt ungespeicherte Änderungen","note-everyone":"Alle auf dem Server, per Schaltfläche","note-personal":"Nur Sie, sofort gespeichert","note-role":"Personen dieses Profils, per Schaltfläche","note-shared":"Gemeinsames Profil: es ändert sich für alle auf der Website. Wird sofort angewendet.","nothing-found":"Nichts gefunden","notice-open":"Öffnen","notices-history":"Gesamter Verlauf","notices-new":"Neu","notices-none":"Nichts Neues","notices-read-all":"Alle als gelesen markieren","notices-settings":"Benachrichtigungseinstellungen","notifications":"Benachrichtigungen","package-name":"Paketnamen wiederherstellen","palette-hint":"Bereiche, Einträge, Aktionen…","personal-name":"Persönlich","profile-label":"Profil:","profile-name":"Profilname","profile-name-empty":"Geben Sie dem Profil einen Namen.","refused":"Nicht gespeichert: {reason}.","rename":"Umbenennen","rename-profile":"Umbenennen","reset":"Zurücksetzen","reset-to-packages":"Auf die Pakete zurücksetzen","retry":"Erneut versuchen","save":"Speichern","save-for-all":"Für alle speichern","saved-for-all":"Für alle gespeichert.","search":"Suche","setting-title":"Menü einrichten","shared-profile":"Für alle auf der Website","show":"Anzeigen","show-column":"Spalte anzeigen","sign-out":"Abmelden","star":"Zu Favoriten hinzufügen","theme":"Design","theme-dark":"Dunkel","theme-light":"Hell","theme-system":"Wie im System","unavailable":"Das Menü ist gerade nicht verfügbar.","unfold":"alle anzeigen","unlock":"Lösen","unstar":"Aus Favoriten entfernen"},"events":{"sign-out":{"label":"Abmelden"}}}');

/***/ },

/***/ "d21db0cbf190"
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"title":"Admin menu","runtime":{"account":"Account","add":"Add","add-divider":"Divider","add-heading":"Subheading","add-link":"Link","add-section":"Section","all-sections":"All sections","all-sites":"Shared by all sites","back":"Back","cancel":"Cancel","choose-icon":"Choose an icon","choose-site":"Choose a site","collapse":"Collapse","column-width":"Column width","configure-menu":"Configure the menu","conflict":"The menu was changed elsewhere. This is what is saved now.","count":"{count} unread","create":"Create","delete-profile":"Delete","delete-row":"Delete","done":"Done","dot":"new","draft-drop":"Leave without saving","draft-leave":"Changes for everyone are not saved. Leave without them?","drag":"Move","edit-menu":"Edit menu","expand":"Expand","external":"opens in a new tab","favourites":"Favourites","favourites-empty":"Press the star by a page\'s title to add it here.","find-in-section":"Find in section","find-language":"Find a language","find-site":"Find a site","finish-configure":"Finish setup","fold":"fold","hide":"Hide","hide-column":"Hide column","hide-from-menu":"Hide from menu","href-insecure":"Only https:// addresses: an http:// link is not saved.","href-invalid":"An address is a path on this site (/admin/...) or a full https:// address.","language":"Language","language-note":"The admin\'s own language. The site\'s languages are in the site settings.","level-everyone":"Everyone","level-label":"For whom","level-personal":"Personal","level-role":"Settings profile","link-href":"Address","link-label":"Name","link-name-empty":"Give the link a name.","loading":"Loading the menu…","lock-for-all":"Lock for everyone","locked-by":"Locked by an administrator for everyone:","locked-hide":"Locked by an administrator","locked-reason":"Locked by an administrator for everyone","manage-sites":"Manage sites","menu":"Menu","menu-profile":"Menu profile","menu-width":"Menu width","more":"More","more-sections":"More sections","more-sites":"Show more","move-down":"Move down","move-up":"Move up","new-heading":"Subheading","new-profile":"New profile…","new-section":"New section","note-dirty":"There are unsaved changes","note-everyone":"Everyone on the server, by the button","note-personal":"Only you, saved at once","note-role":"People of this profile, by the button","note-shared":"Shared profile: it changes for everyone on the site. Applied at once.","nothing-found":"Nothing found","notice-open":"Open","notices-history":"All history","notices-new":"New","notices-none":"Nothing new","notices-read-all":"Mark all as read","notices-settings":"Notification settings","notifications":"Notifications","package-name":"Return the package\'s name","palette-hint":"Sections, records, actions…","personal-name":"Personal","profile-label":"Profile:","profile-name":"Profile name","profile-name-empty":"Give the profile a name.","refused":"Not saved: {reason}.","rename":"Rename","rename-profile":"Rename","reset":"Reset","reset-to-packages":"Reset to the packages","retry":"Try again","save":"Save","save-for-all":"Save for everyone","saved-for-all":"Saved for everyone.","search":"Search","setting-title":"Menu setup","shared-profile":"For everyone on the site","show":"Show","show-column":"Show column","sign-out":"Sign out","star":"Add to favourites","theme":"Theme","theme-dark":"Dark","theme-light":"Light","theme-system":"As the system","unavailable":"The menu is not available right now.","unfold":"show all","unlock":"Unlock","unstar":"Remove from favourites"},"events":{"sign-out":{"label":"Sign out"}}}');

/***/ },

/***/ "ae69c08f881b"
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"title":"Menú de administración","runtime":{"account":"Cuenta","add":"Añadir","add-divider":"Separador","add-heading":"Subtítulo","add-link":"Enlace","add-section":"Sección","all-sections":"Todas las secciones","all-sites":"Común para todos los sitios","back":"Atrás","cancel":"Cancelar","choose-icon":"Elegir un icono","choose-site":"Elegir un sitio","collapse":"Contraer","column-width":"Ancho de columna","configure-menu":"Configurar el menú","conflict":"El menú se cambió en otro lugar. Esto es lo que está guardado ahora.","count":"{count} sin leer|{count} sin leer|{count} sin leer","create":"Crear","delete-profile":"Eliminar","delete-row":"Eliminar","done":"Listo","dot":"nuevo","draft-drop":"Salir sin guardar","draft-leave":"Los cambios para todos no están guardados. ¿Salir sin ellos?","drag":"Mover","edit-menu":"Editar el menú","expand":"Expandir","external":"se abre en una pestaña nueva","favourites":"Favoritos","favourites-empty":"Pulse la estrella junto al título de una página para añadirla aquí.","find-in-section":"Buscar en la sección","find-language":"Buscar un idioma","find-site":"Buscar un sitio","finish-configure":"Terminar la configuración","fold":"contraer","hide":"Ocultar","hide-column":"Ocultar columna","hide-from-menu":"Ocultar del menú","href-insecure":"Solo direcciones https://: un enlace http:// no se guarda.","href-invalid":"Una dirección es una ruta de este sitio (/admin/...) o una dirección https:// completa.","language":"Idioma","language-note":"El idioma de la administración. Los idiomas del sitio están en los ajustes del sitio.","level-everyone":"Para todos","level-label":"Para quién","level-personal":"Personal","level-role":"Perfil de ajustes","link-href":"Dirección","link-label":"Nombre","link-name-empty":"Dé un nombre al enlace.","loading":"Cargando el menú…","lock-for-all":"Fijar para todos","locked-by":"Fijado por un administrador para todos:","locked-hide":"Fijado por un administrador","locked-reason":"Fijado por un administrador para todos","manage-sites":"Gestionar sitios","menu":"Menú","menu-profile":"Perfil del menú","menu-width":"Ancho del menú","more":"Más","more-sections":"Más secciones","more-sites":"Mostrar más","move-down":"Bajar","move-up":"Subir","new-heading":"Subtítulo","new-profile":"Perfil nuevo…","new-section":"Sección nueva","note-dirty":"Hay cambios sin guardar","note-everyone":"Todo el servidor, con el botón","note-personal":"Solo usted, se guarda al instante","note-role":"Las personas de este perfil, con el botón","note-shared":"Perfil compartido: cambia para todo el sitio. Se aplica al instante.","nothing-found":"No se encontró nada","notice-open":"Abrir","notices-history":"Todo el historial","notices-new":"Nuevas","notices-none":"Nada nuevo","notices-read-all":"Marcar todo como leído","notices-settings":"Ajustes de notificaciones","notifications":"Notificaciones","package-name":"Recuperar el nombre del paquete","palette-hint":"Secciones, registros, acciones…","personal-name":"Personal","profile-label":"Perfil:","profile-name":"Nombre del perfil","profile-name-empty":"Dé un nombre al perfil.","refused":"No guardado: {reason}.","rename":"Renombrar","rename-profile":"Renombrar","reset":"Restablecer","reset-to-packages":"Volver a los paquetes","retry":"Reintentar","save":"Guardar","save-for-all":"Guardar para todos","saved-for-all":"Guardado para todos.","search":"Buscar","setting-title":"Configuración del menú","shared-profile":"Para todo el sitio","show":"Mostrar","show-column":"Mostrar columna","sign-out":"Cerrar sesión","star":"Añadir a favoritos","theme":"Tema","theme-dark":"Oscuro","theme-light":"Claro","theme-system":"Como el sistema","unavailable":"El menú no está disponible ahora.","unfold":"mostrar todo","unlock":"Desfijar","unstar":"Quitar de favoritos"},"events":{"sign-out":{"label":"Cerrar sesión"}}}');

/***/ },

/***/ "e219c434ba68"
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"title":"Menu d’administration","runtime":{"account":"Compte","add":"Ajouter","add-divider":"Séparateur","add-heading":"Sous-titre","add-link":"Lien","add-section":"Section","all-sections":"Toutes les sections","all-sites":"Commun à tous les sites","back":"Retour","cancel":"Annuler","choose-icon":"Choisir une icône","choose-site":"Choisir un site","collapse":"Réduire","column-width":"Largeur de colonne","configure-menu":"Configurer le menu","conflict":"Le menu a été modifié ailleurs. Voici ce qui est enregistré maintenant.","count":"{count} non lu|{count} non lus|{count} non lus","create":"Créer","delete-profile":"Supprimer","delete-row":"Supprimer","done":"Terminé","dot":"nouveau","draft-drop":"Quitter sans enregistrer","draft-leave":"Les modifications pour tous ne sont pas enregistrées. Quitter sans elles ?","drag":"Déplacer","edit-menu":"Modifier le menu","expand":"Développer","external":"s’ouvre dans un nouvel onglet","favourites":"Favoris","favourites-empty":"Cliquez sur l’étoile près du titre d’une page pour l’ajouter ici.","find-in-section":"Rechercher dans la section","find-language":"Rechercher une langue","find-site":"Rechercher un site","finish-configure":"Terminer la configuration","fold":"réduire","hide":"Masquer","hide-column":"Masquer la colonne","hide-from-menu":"Masquer du menu","href-insecure":"Adresses https:// uniquement : un lien http:// n’est pas enregistré.","href-invalid":"Une adresse est un chemin sur ce site (/admin/...) ou une adresse https:// complète.","language":"Langue","language-note":"La langue de l’administration. Les langues du site sont dans les paramètres du site.","level-everyone":"Pour tous","level-label":"Pour qui","level-personal":"Personnel","level-role":"Profil de paramètres","link-href":"Adresse","link-label":"Nom","link-name-empty":"Donnez un nom au lien.","loading":"Chargement du menu…","lock-for-all":"Verrouiller pour tous","locked-by":"Verrouillé par un administrateur pour tous :","locked-hide":"Verrouillé par un administrateur","locked-reason":"Verrouillé par un administrateur pour tous","manage-sites":"Gérer les sites","menu":"Menu","menu-profile":"Profil du menu","menu-width":"Largeur du menu","more":"Plus","more-sections":"Autres sections","more-sites":"Afficher plus","move-down":"Descendre","move-up":"Monter","new-heading":"Sous-titre","new-profile":"Nouveau profil…","new-section":"Nouvelle section","note-dirty":"Des modifications ne sont pas enregistrées","note-everyone":"Tout le serveur, par le bouton","note-personal":"Vous seul, enregistré aussitôt","note-role":"Les personnes de ce profil, par le bouton","note-shared":"Profil partagé : il change pour tout le site. Appliqué aussitôt.","nothing-found":"Aucun résultat","notice-open":"Ouvrir","notices-history":"Tout l’historique","notices-new":"Nouveau","notices-none":"Rien de nouveau","notices-read-all":"Tout marquer comme lu","notices-settings":"Paramètres des notifications","notifications":"Notifications","package-name":"Rétablir le nom du paquet","palette-hint":"Sections, fiches, actions…","personal-name":"Personnel","profile-label":"Profil :","profile-name":"Nom du profil","profile-name-empty":"Donnez un nom au profil.","refused":"Non enregistré : {reason}.","rename":"Renommer","rename-profile":"Renommer","reset":"Réinitialiser","reset-to-packages":"Revenir aux paquets","retry":"Réessayer","save":"Enregistrer","save-for-all":"Enregistrer pour tous","saved-for-all":"Enregistré pour tous.","search":"Recherche","setting-title":"Configuration du menu","shared-profile":"Pour tout le site","show":"Afficher","show-column":"Afficher la colonne","sign-out":"Se déconnecter","star":"Ajouter aux favoris","theme":"Thème","theme-dark":"Sombre","theme-light":"Clair","theme-system":"Comme le système","unavailable":"Le menu n’est pas disponible pour le moment.","unfold":"tout afficher","unlock":"Déverrouiller","unstar":"Retirer des favoris"},"events":{"sign-out":{"label":"Se déconnecter"}}}');

/***/ },

/***/ "2c835db75150"
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"title":"Menu di amministrazione","runtime":{"account":"Account","add":"Aggiungi","add-divider":"Separatore","add-heading":"Sottotitolo","add-link":"Link","add-section":"Sezione","all-sections":"Tutte le sezioni","all-sites":"Comune a tutti i siti","back":"Indietro","cancel":"Annulla","choose-icon":"Scegli un’icona","choose-site":"Scegli un sito","collapse":"Comprimi","column-width":"Larghezza colonna","configure-menu":"Configura il menu","conflict":"Il menu è stato modificato altrove. Questo è ciò che è salvato ora.","count":"{count} non letto|{count} non letti|{count} non letti","create":"Crea","delete-profile":"Elimina","delete-row":"Elimina","done":"Fatto","dot":"nuovo","draft-drop":"Esci senza salvare","draft-leave":"Le modifiche per tutti non sono salvate. Uscire senza di esse?","drag":"Sposta","edit-menu":"Modifica il menu","expand":"Espandi","external":"si apre in una nuova scheda","favourites":"Preferiti","favourites-empty":"Premi la stella accanto al titolo di una pagina per aggiungerla qui.","find-in-section":"Cerca nella sezione","find-language":"Cerca una lingua","find-site":"Cerca un sito","finish-configure":"Termina la configurazione","fold":"comprimi","hide":"Nascondi","hide-column":"Nascondi colonna","hide-from-menu":"Nascondi dal menu","href-insecure":"Solo indirizzi https://: un link http:// non viene salvato.","href-invalid":"Un indirizzo è un percorso di questo sito (/admin/...) o un indirizzo https:// completo.","language":"Lingua","language-note":"La lingua dell’amministrazione. Le lingue del sito sono nelle impostazioni del sito.","level-everyone":"Per tutti","level-label":"Per chi","level-personal":"Personale","level-role":"Profilo di impostazioni","link-href":"Indirizzo","link-label":"Nome","link-name-empty":"Dai un nome al link.","loading":"Caricamento del menu…","lock-for-all":"Blocca per tutti","locked-by":"Bloccato da un amministratore per tutti:","locked-hide":"Bloccato da un amministratore","locked-reason":"Bloccato da un amministratore per tutti","manage-sites":"Gestisci i siti","menu":"Menu","menu-profile":"Profilo del menu","menu-width":"Larghezza del menu","more":"Altro","more-sections":"Altre sezioni","more-sites":"Mostra altro","move-down":"Sposta giù","move-up":"Sposta su","new-heading":"Sottotitolo","new-profile":"Nuovo profilo…","new-section":"Nuova sezione","note-dirty":"Ci sono modifiche non salvate","note-everyone":"Tutto il server, con il pulsante","note-personal":"Solo tu, salvato subito","note-role":"Le persone di questo profilo, con il pulsante","note-shared":"Profilo condiviso: cambia per tutto il sito. Applicato subito.","nothing-found":"Nessun risultato","notice-open":"Apri","notices-history":"Tutta la cronologia","notices-new":"Nuove","notices-none":"Niente di nuovo","notices-read-all":"Segna tutto come letto","notices-settings":"Impostazioni delle notifiche","notifications":"Notifiche","package-name":"Ripristina il nome del pacchetto","palette-hint":"Sezioni, record, azioni…","personal-name":"Personale","profile-label":"Profilo:","profile-name":"Nome del profilo","profile-name-empty":"Dai un nome al profilo.","refused":"Non salvato: {reason}.","rename":"Rinomina","rename-profile":"Rinomina","reset":"Ripristina","reset-to-packages":"Torna ai pacchetti","retry":"Riprova","save":"Salva","save-for-all":"Salva per tutti","saved-for-all":"Salvato per tutti.","search":"Cerca","setting-title":"Configurazione del menu","shared-profile":"Per tutto il sito","show":"Mostra","show-column":"Mostra colonna","sign-out":"Esci","star":"Aggiungi ai preferiti","theme":"Tema","theme-dark":"Scuro","theme-light":"Chiaro","theme-system":"Come il sistema","unavailable":"Il menu non è disponibile al momento.","unfold":"mostra tutto","unlock":"Sblocca","unstar":"Rimuovi dai preferiti"},"events":{"sign-out":{"label":"Esci"}}}');

/***/ },

/***/ "16fc583fb0ee"
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"title":"管理メニュー","runtime":{"account":"アカウント","add":"追加","add-divider":"区切り線","add-heading":"小見出し","add-link":"リンク","add-section":"セクション","all-sections":"すべてのセクション","all-sites":"すべてのサイトで共通","back":"戻る","cancel":"キャンセル","choose-icon":"アイコンを選択","choose-site":"サイトを選択","collapse":"折りたたむ","column-width":"列の幅","configure-menu":"メニューを設定","conflict":"メニューは別の場所で変更されました。現在保存されている内容を表示しています。","count":"未読 {count} 件","create":"作成","delete-profile":"削除","delete-row":"削除","done":"完了","dot":"新着あり","draft-drop":"保存せずに終了","draft-leave":"全員向けの変更が保存されていません。保存せずに終了しますか？","drag":"移動","edit-menu":"メニューを編集","expand":"展開","external":"新しいタブで開きます","favourites":"お気に入り","favourites-empty":"ページ見出しの横の星を押すと、ここに追加されます。","find-in-section":"セクション内を検索","find-language":"言語を検索","find-site":"サイトを検索","finish-configure":"設定を終了","fold":"折りたたむ","hide":"非表示","hide-column":"列を隠す","hide-from-menu":"メニューから隠す","href-insecure":"https:// のアドレスのみ：http:// のリンクは保存されません。","href-invalid":"アドレスはこのサイトのパス（/admin/...）または完全な https:// アドレスです。","language":"言語","language-note":"管理画面の言語です。サイトの言語はサイト設定にあります。","level-everyone":"全員","level-label":"対象","level-personal":"個人","level-role":"設定プロファイル","link-href":"アドレス","link-label":"名前","link-name-empty":"リンクに名前を付けてください。","loading":"メニューを読み込み中…","lock-for-all":"全員に固定","locked-by":"管理者が全員に固定：","locked-hide":"管理者が固定","locked-reason":"管理者が全員に固定","manage-sites":"サイトを管理","menu":"メニュー","menu-profile":"メニューのプロファイル","menu-width":"メニューの幅","more":"その他","more-sections":"その他のセクション","more-sites":"さらに表示","move-down":"下へ","move-up":"上へ","new-heading":"小見出し","new-profile":"新しいプロファイル…","new-section":"新しいセクション","note-dirty":"保存されていない変更があります","note-everyone":"サーバーの全員、ボタンで保存","note-personal":"自分だけ、すぐに保存","note-role":"このプロファイルの人、ボタンで保存","note-shared":"共有プロファイル：サイトの全員に反映されます。すぐに適用されます。","nothing-found":"見つかりません","notice-open":"開く","notices-history":"すべての履歴","notices-new":"新着","notices-none":"新着はありません","notices-read-all":"すべて既読にする","notices-settings":"通知設定","notifications":"通知","package-name":"パッケージ名に戻す","palette-hint":"セクション、レコード、操作…","personal-name":"個人","profile-label":"プロファイル：","profile-name":"プロファイル名","profile-name-empty":"プロファイルに名前を付けてください。","refused":"保存されませんでした：{reason}。","rename":"名前を変更","rename-profile":"名前を変更","reset":"リセット","reset-to-packages":"パッケージの状態に戻す","retry":"再試行","save":"保存","save-for-all":"全員に保存","saved-for-all":"全員に保存しました。","search":"検索","setting-title":"メニューの設定","shared-profile":"サイトの全員向け","show":"表示","show-column":"列を表示","sign-out":"ログアウト","star":"お気に入りに追加","theme":"テーマ","theme-dark":"ダーク","theme-light":"ライト","theme-system":"システムに合わせる","unavailable":"メニューは現在利用できません。","unfold":"すべて表示","unlock":"固定を解除","unstar":"お気に入りから削除"},"events":{"sign-out":{"label":"ログアウト"}}}');

/***/ },

/***/ "4fe6b2964066"
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"title":"관리 메뉴","runtime":{"account":"계정","add":"추가","add-divider":"구분선","add-heading":"소제목","add-link":"링크","add-section":"섹션","all-sections":"모든 섹션","all-sites":"모든 사이트 공통","back":"뒤로","cancel":"취소","choose-icon":"아이콘 선택","choose-site":"사이트 선택","collapse":"접기","column-width":"열 너비","configure-menu":"메뉴 설정","conflict":"메뉴가 다른 곳에서 변경되었습니다. 지금 저장된 내용을 표시합니다.","count":"읽지 않음 {count}개","create":"만들기","delete-profile":"삭제","delete-row":"삭제","done":"완료","dot":"새 항목","draft-drop":"저장하지 않고 나가기","draft-leave":"모두를 위한 변경 사항이 저장되지 않았습니다. 저장하지 않고 나갈까요?","drag":"이동","edit-menu":"메뉴 편집","expand":"펼치기","external":"새 탭에서 열림","favourites":"즐겨찾기","favourites-empty":"페이지 제목 옆의 별을 누르면 여기에 추가됩니다.","find-in-section":"섹션에서 찾기","find-language":"언어 찾기","find-site":"사이트 찾기","finish-configure":"설정 마치기","fold":"접기","hide":"숨기기","hide-column":"열 숨기기","hide-from-menu":"메뉴에서 숨기기","href-insecure":"https:// 주소만 가능: http:// 링크는 저장되지 않습니다.","href-invalid":"주소는 이 사이트의 경로(/admin/...) 또는 전체 https:// 주소입니다.","language":"언어","language-note":"관리 화면의 언어입니다. 사이트 언어는 사이트 설정에 있습니다.","level-everyone":"모두","level-label":"대상","level-personal":"개인","level-role":"설정 프로필","link-href":"주소","link-label":"이름","link-name-empty":"링크 이름을 입력하세요.","loading":"메뉴를 불러오는 중…","lock-for-all":"모두에게 고정","locked-by":"관리자가 모두에게 고정함:","locked-hide":"관리자가 고정함","locked-reason":"관리자가 모두에게 고정함","manage-sites":"사이트 관리","menu":"메뉴","menu-profile":"메뉴 프로필","menu-width":"메뉴 너비","more":"더 보기","more-sections":"다른 섹션","more-sites":"더 보기","move-down":"아래로","move-up":"위로","new-heading":"소제목","new-profile":"새 프로필…","new-section":"새 섹션","note-dirty":"저장되지 않은 변경 사항이 있습니다","note-everyone":"서버의 모든 사람, 버튼으로 저장","note-personal":"나만, 바로 저장","note-role":"이 프로필의 사람들, 버튼으로 저장","note-shared":"공유 프로필: 사이트의 모든 사람에게 적용됩니다. 바로 적용됩니다.","nothing-found":"찾을 수 없음","notice-open":"열기","notices-history":"전체 기록","notices-new":"새 알림","notices-none":"새 알림 없음","notices-read-all":"모두 읽음으로 표시","notices-settings":"알림 설정","notifications":"알림","package-name":"패키지 이름으로 되돌리기","palette-hint":"섹션, 레코드, 작업…","personal-name":"개인","profile-label":"프로필:","profile-name":"프로필 이름","profile-name-empty":"프로필 이름을 입력하세요.","refused":"저장되지 않음: {reason}.","rename":"이름 바꾸기","rename-profile":"이름 바꾸기","reset":"재설정","reset-to-packages":"패키지 기본값으로","retry":"다시 시도","save":"저장","save-for-all":"모두에게 저장","saved-for-all":"모두에게 저장했습니다.","search":"검색","setting-title":"메뉴 설정","shared-profile":"사이트의 모든 사람","show":"표시","show-column":"열 표시","sign-out":"로그아웃","star":"즐겨찾기에 추가","theme":"테마","theme-dark":"어두운","theme-light":"밝은","theme-system":"시스템 설정","unavailable":"지금은 메뉴를 사용할 수 없습니다.","unfold":"모두 표시","unlock":"고정 해제","unstar":"즐겨찾기에서 삭제"},"events":{"sign-out":{"label":"로그아웃"}}}');

/***/ },

/***/ "ca58a096d112"
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"title":"Menu de administração","runtime":{"account":"Conta","add":"Adicionar","add-divider":"Separador","add-heading":"Subtítulo","add-link":"Link","add-section":"Seção","all-sections":"Todas as seções","all-sites":"Comum a todos os sites","back":"Voltar","cancel":"Cancelar","choose-icon":"Escolher um ícone","choose-site":"Escolher um site","collapse":"Recolher","column-width":"Largura da coluna","configure-menu":"Configurar o menu","conflict":"O menu foi alterado em outro lugar. Isto é o que está salvo agora.","count":"{count} não lida|{count} não lidas|{count} não lidas","create":"Criar","delete-profile":"Excluir","delete-row":"Excluir","done":"Concluído","dot":"novo","draft-drop":"Sair sem salvar","draft-leave":"As alterações para todos não estão salvas. Sair sem elas?","drag":"Mover","edit-menu":"Editar o menu","expand":"Expandir","external":"abre em uma nova aba","favourites":"Favoritos","favourites-empty":"Clique na estrela ao lado do título de uma página para adicioná-la aqui.","find-in-section":"Buscar na seção","find-language":"Buscar um idioma","find-site":"Buscar um site","finish-configure":"Concluir a configuração","fold":"recolher","hide":"Ocultar","hide-column":"Ocultar coluna","hide-from-menu":"Ocultar do menu","href-insecure":"Somente endereços https://: um link http:// não é salvo.","href-invalid":"Um endereço é um caminho deste site (/admin/...) ou um endereço https:// completo.","language":"Idioma","language-note":"O idioma da administração. Os idiomas do site ficam nas configurações do site.","level-everyone":"Para todos","level-label":"Para quem","level-personal":"Pessoal","level-role":"Perfil de configurações","link-href":"Endereço","link-label":"Nome","link-name-empty":"Dê um nome ao link.","loading":"Carregando o menu…","lock-for-all":"Fixar para todos","locked-by":"Fixado por um administrador para todos:","locked-hide":"Fixado por um administrador","locked-reason":"Fixado por um administrador para todos","manage-sites":"Gerenciar sites","menu":"Menu","menu-profile":"Perfil do menu","menu-width":"Largura do menu","more":"Mais","more-sections":"Mais seções","more-sites":"Mostrar mais","move-down":"Mover para baixo","move-up":"Mover para cima","new-heading":"Subtítulo","new-profile":"Novo perfil…","new-section":"Nova seção","note-dirty":"Há alterações não salvas","note-everyone":"Todo o servidor, pelo botão","note-personal":"Só você, salvo na hora","note-role":"Pessoas deste perfil, pelo botão","note-shared":"Perfil compartilhado: muda para todo o site. Aplicado na hora.","nothing-found":"Nada encontrado","notice-open":"Abrir","notices-history":"Todo o histórico","notices-new":"Novas","notices-none":"Nada de novo","notices-read-all":"Marcar tudo como lido","notices-settings":"Configurações de notificações","notifications":"Notificações","package-name":"Restaurar o nome do pacote","palette-hint":"Seções, registros, ações…","personal-name":"Pessoal","profile-label":"Perfil:","profile-name":"Nome do perfil","profile-name-empty":"Dê um nome ao perfil.","refused":"Não salvo: {reason}.","rename":"Renomear","rename-profile":"Renomear","reset":"Redefinir","reset-to-packages":"Voltar aos pacotes","retry":"Tentar novamente","save":"Salvar","save-for-all":"Salvar para todos","saved-for-all":"Salvo para todos.","search":"Buscar","setting-title":"Configuração do menu","shared-profile":"Para todo o site","show":"Mostrar","show-column":"Mostrar coluna","sign-out":"Sair","star":"Adicionar aos favoritos","theme":"Tema","theme-dark":"Escuro","theme-light":"Claro","theme-system":"Como o sistema","unavailable":"O menu não está disponível agora.","unfold":"mostrar tudo","unlock":"Desafixar","unstar":"Remover dos favoritos"},"events":{"sign-out":{"label":"Sair"}}}');

/***/ },

/***/ "38e4a43d47ec"
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"title":"Меню администратора","runtime":{"account":"Профиль пользователя","add":"Добавить","add-divider":"Разделитель","add-heading":"Подзаголовок","add-link":"Ссылка","add-section":"Раздел","all-sections":"Все разделы","all-sites":"Общее для всех сайтов","back":"Назад","cancel":"Отменить","choose-icon":"Выбрать иконку","choose-site":"Выбрать сайт","collapse":"Свернуть","column-width":"Ширина колонки","configure-menu":"Настроить меню","conflict":"Меню изменили в другом месте. Показано то, что сохранено сейчас.","count":"{count} непрочитанное|{count} непрочитанных|{count} непрочитанных|{count} непрочитанного","create":"Создать","delete-profile":"Удалить","delete-row":"Удалить","done":"Готово","dot":"есть новое","draft-drop":"Выйти без сохранения","draft-leave":"Изменения для всех не сохранены. Выйти без них?","drag":"Переместить","edit-menu":"Правка меню","expand":"Развернуть","external":"откроется в новой вкладке","favourites":"Избранное","favourites-empty":"Нажмите звезду у заголовка страницы, чтобы добавить её сюда.","find-in-section":"Найти в разделе","find-language":"Найти язык","find-site":"Найти сайт","finish-configure":"Закончить настройку","fold":"свернуть","hide":"Скрыть","hide-column":"Скрыть колонку","hide-from-menu":"Скрыть из меню","href-insecure":"Только адреса https://: ссылка http:// не сохраняется.","href-invalid":"Адрес — путь на этом сайте (/admin/...) или полный адрес https://.","language":"Язык","language-note":"Язык интерфейса админки. Языки сайта — в настройках сайта.","level-everyone":"Для всех","level-label":"Для кого","level-personal":"Лично","level-role":"Профиль настроек","link-href":"Адрес","link-label":"Название","link-name-empty":"Дайте ссылке название.","loading":"Загружаем меню…","lock-for-all":"Закрепить для всех","locked-by":"Закреплено администратором для всех:","locked-hide":"Закреплено администратором","locked-reason":"Закреплено администратором для всех","manage-sites":"Управлять сайтами","menu":"Меню","menu-profile":"Профиль меню","menu-width":"Ширина меню","more":"Ещё","more-sections":"Ещё разделы","more-sites":"Показать ещё","move-down":"Ниже","move-up":"Выше","new-heading":"Подзаголовок","new-profile":"Новый профиль…","new-section":"Новый раздел","note-dirty":"Есть несохранённые изменения","note-everyone":"Всем на сервере, по кнопке","note-personal":"Только вам, сохраняется сразу","note-role":"Людям этого профиля, по кнопке","note-shared":"Общий профиль: меняется у всех на сайте. Применяется сразу.","nothing-found":"Ничего не найдено","notice-open":"Открыть","notices-history":"Вся история","notices-new":"Новые","notices-none":"Новых нет","notices-read-all":"Прочитать все","notices-settings":"Настройки уведомлений","notifications":"Уведомления","package-name":"Вернуть название пакета","palette-hint":"Разделы, записи, действия…","personal-name":"Персональный","profile-label":"Профиль:","profile-name":"Название профиля","profile-name-empty":"Дайте профилю название.","refused":"Не сохранено: {reason}.","rename":"Переименовать","rename-profile":"Переименовать","reset":"Сбросить","reset-to-packages":"Сбросить к пакетам","retry":"Повторить","save":"Сохранить","save-for-all":"Сохранить для всех","saved-for-all":"Сохранено для всех.","search":"Поиск","setting-title":"Настройка меню","shared-profile":"Для всех на сайте","show":"Показать","show-column":"Показать колонку","sign-out":"Выйти","star":"В избранное","theme":"Тема","theme-dark":"Тёмная","theme-light":"Светлая","theme-system":"Как в системе","unavailable":"Меню сейчас недоступно.","unfold":"показать все","unlock":"Открепить","unstar":"Убрать из избранного"},"events":{"sign-out":{"label":"Выйти"}}}');

/***/ },

/***/ "25668cc92df9"
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"title":"管理菜单","runtime":{"account":"账户","add":"添加","add-divider":"分隔线","add-heading":"小标题","add-link":"链接","add-section":"分区","all-sections":"所有分区","all-sites":"所有站点共用","back":"返回","cancel":"取消","choose-icon":"选择图标","choose-site":"选择站点","collapse":"收起","column-width":"栏宽","configure-menu":"设置菜单","conflict":"菜单已在别处更改。现在显示的是当前保存的内容。","count":"{count} 条未读","create":"创建","delete-profile":"删除","delete-row":"删除","done":"完成","dot":"有新内容","draft-drop":"不保存并退出","draft-leave":"面向所有人的更改尚未保存。不保存就退出吗？","drag":"移动","edit-menu":"编辑菜单","expand":"展开","external":"在新标签页中打开","favourites":"收藏","favourites-empty":"点击页面标题旁的星标，即可将页面添加到这里。","find-in-section":"在分区中查找","find-language":"查找语言","find-site":"查找站点","finish-configure":"完成设置","fold":"收起","hide":"隐藏","hide-column":"隐藏栏","hide-from-menu":"从菜单中隐藏","href-insecure":"仅限 https:// 地址：http:// 链接不会被保存。","href-invalid":"地址应为本站路径（/admin/...）或完整的 https:// 地址。","language":"语言","language-note":"管理后台的语言。站点语言在站点设置中。","level-everyone":"所有人","level-label":"适用对象","level-personal":"个人","level-role":"设置配置","link-href":"地址","link-label":"名称","link-name-empty":"请为链接命名。","loading":"正在加载菜单…","lock-for-all":"为所有人固定","locked-by":"已由管理员为所有人固定：","locked-hide":"已由管理员固定","locked-reason":"已由管理员为所有人固定","manage-sites":"管理站点","menu":"菜单","menu-profile":"菜单配置","menu-width":"菜单宽度","more":"更多","more-sections":"更多分区","more-sites":"显示更多","move-down":"下移","move-up":"上移","new-heading":"小标题","new-profile":"新建配置…","new-section":"新分区","note-dirty":"有未保存的更改","note-everyone":"服务器上的所有人，点击按钮保存","note-personal":"仅您自己，立即保存","note-role":"此配置的成员，点击按钮保存","note-shared":"共享配置：对站点上的所有人生效。立即应用。","nothing-found":"未找到","notice-open":"打开","notices-history":"全部历史","notices-new":"新通知","notices-none":"没有新通知","notices-read-all":"全部标为已读","notices-settings":"通知设置","notifications":"通知","package-name":"恢复软件包名称","palette-hint":"分区、记录、操作…","personal-name":"个人","profile-label":"配置：","profile-name":"配置名称","profile-name-empty":"请为配置命名。","refused":"未保存：{reason}。","rename":"重命名","rename-profile":"重命名","reset":"重置","reset-to-packages":"恢复为软件包默认","retry":"重试","save":"保存","save-for-all":"为所有人保存","saved-for-all":"已为所有人保存。","search":"搜索","setting-title":"菜单设置","shared-profile":"面向站点所有人","show":"显示","show-column":"显示栏","sign-out":"退出登录","star":"加入收藏","theme":"主题","theme-dark":"深色","theme-light":"浅色","theme-system":"跟随系统","unavailable":"菜单暂时不可用。","unfold":"全部显示","unlock":"取消固定","unstar":"取消收藏"},"events":{"sign-out":{"label":"退出登录"}}}');

/***/ },

/***/ "9937e6b314d1"
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"$comment":"Names of the languages sf-language supports, from CLDR 48 (ICU 78 as Node.js ships it): each language in itself (native) and in English (en). Since owner decision C282 their names in Russian are the ru language file\'s words (src/core/js/lang/language-names, name-<code>, registered for sf-language), as any other language\'s names may be. The browser\'s Intl.DisplayNames carries fewer languages (headless Chromium names tt only in English and ba, sah not at all; research 2026-11-14-language LG-7), so these names come first and Intl names every other language and page language. Spelled as CLDR writes them; the element gives a name its capital in a list. Data, not code: add a language here with both names, and its Russian name to the language file. Owner decision C278 (2026-11-17): languages of CIS countries other than Russian are not named here (uk, be, uz, az, hy, ka, ky, tg and tk left on 2026-11-18, kk before; tt and ba, languages of regions of Russia, stay); the browser names such a code if a product lists one.","names":{"ru":{"native":"русский","en":"Russian"},"en":{"native":"English","en":"English"},"de":{"native":"Deutsch","en":"German"},"fr":{"native":"français","en":"French"},"es":{"native":"español","en":"Spanish"},"it":{"native":"italiano","en":"Italian"},"pt":{"native":"português","en":"Portuguese"},"pt-BR":{"native":"português (Brasil)","en":"Brazilian Portuguese"},"pt-PT":{"native":"português europeu","en":"European Portuguese"},"tr":{"native":"Türkçe","en":"Turkish"},"pl":{"native":"polski","en":"Polish"},"he":{"native":"עברית","en":"Hebrew"},"ar":{"native":"العربية","en":"Arabic"},"fa":{"native":"فارسی","en":"Persian"},"hi":{"native":"हिन्दी","en":"Hindi"},"bn":{"native":"বাংলা","en":"Bangla"},"ja":{"native":"日本語","en":"Japanese"},"ko":{"native":"한국어","en":"Korean"},"zh":{"native":"中文","en":"Chinese"},"zh-Hans":{"native":"简体中文","en":"Simplified Chinese"},"zh-Hant":{"native":"繁體中文","en":"Traditional Chinese"},"zh-TW":{"native":"中文（台灣）","en":"Chinese (Taiwan)"},"vi":{"native":"Tiếng Việt","en":"Vietnamese"},"th":{"native":"ไทย","en":"Thai"},"id":{"native":"Indonesia","en":"Indonesian"},"ms":{"native":"Melayu","en":"Malay"},"nl":{"native":"Nederlands","en":"Dutch"},"sv":{"native":"svenska","en":"Swedish"},"no":{"native":"norsk","en":"Norwegian"},"nb":{"native":"norsk bokmål","en":"Norwegian Bokmål"},"da":{"native":"dansk","en":"Danish"},"fi":{"native":"suomi","en":"Finnish"},"cs":{"native":"čeština","en":"Czech"},"sk":{"native":"slovenčina","en":"Slovak"},"hu":{"native":"magyar","en":"Hungarian"},"ro":{"native":"română","en":"Romanian"},"bg":{"native":"български","en":"Bulgarian"},"el":{"native":"Ελληνικά","en":"Greek"},"tt":{"native":"татар","en":"Tatar"},"ba":{"native":"башҡорт","en":"Bashkir"},"sah":{"native":"саха тыла","en":"Yakut"},"mn":{"native":"монгол","en":"Mongolian"},"cv":{"native":"чӑваш чӗлхи","en":"Chuvash"},"ce":{"native":"нохчийн","en":"Chechen"},"os":{"native":"ирон","en":"Ossetic"},"lv":{"native":"latviešu","en":"Latvian"},"lt":{"native":"lietuvių","en":"Lithuanian"},"et":{"native":"eesti","en":"Estonian"},"sr":{"native":"српски","en":"Serbian"},"hr":{"native":"hrvatski","en":"Croatian"},"sl":{"native":"slovenščina","en":"Slovenian"},"mk":{"native":"македонски","en":"Macedonian"},"sq":{"native":"shqip","en":"Albanian"},"bs":{"native":"bosanski","en":"Bosnian"},"ug":{"native":"ئۇيغۇرچە","en":"Uyghur"},"ur":{"native":"اردو","en":"Urdu"}}}');

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	const __webpack_module_cache__ = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		const cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		const module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			const e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/************************************************************************/
/******/ 	/* webpack/runtime/async module */
/******/ 	(() => {
/******/ 		const hasSymbol = typeof Symbol === "function";
/******/ 		const webpackQueues = hasSymbol ? Symbol("webpack queues") : "__webpack_queues__";
/******/ 		const webpackExports = hasSymbol ? Symbol("webpack exports") : "__webpack_exports__";
/******/ 		const webpackError = hasSymbol ? Symbol("webpack error") : "__webpack_error__";
/******/
/******/ 		const resolveQueue = (queue) => {
/******/ 			if(queue?.d < 1) {
/******/ 				queue.d = 1;
/******/ 				queue.forEach((fn) => (fn.r--));
/******/ 				queue.forEach((fn) => (fn.r-- ? fn.r++ : fn()));
/******/ 			}
/******/ 		}
/******/ 		const wrapDeps = (deps) => (deps.map((dep) => {
/******/ 			if(dep !== null && typeof dep === "object") {
/******/
/******/ 				if(dep[webpackQueues]) return dep;
/******/ 				if(dep.then) {
/******/ 					const queue = [];
/******/ 					queue.d = 0;
/******/ 					dep.then((r) => {
/******/ 						obj[webpackExports] = r;
/******/ 						resolveQueue(queue);
/******/ 					}, (e) => {
/******/ 						obj[webpackError] = e;
/******/ 						resolveQueue(queue);
/******/ 					});
/******/ 					const obj = {};
/******/
/******/ 					obj[webpackQueues] = (fn) => (fn(queue));
/******/ 					return obj;
/******/ 				}
/******/ 			}
/******/ 			const ret = {};
/******/ 			ret[webpackQueues] = x => {};
/******/ 			ret[webpackExports] = dep;
/******/ 			return ret;
/******/ 		}));
/******/ 		__webpack_require__.a = (module, body, hasAwait) => {
/******/ 			let queue;
/******/ 			hasAwait && ((queue = []).d = -1);
/******/ 			const depQueues = new Set();
/******/ 			const exports = module.exports;
/******/ 			let currentDeps;
/******/ 			let outerResolve;
/******/ 			let reject;
/******/ 			const promise = new Promise((resolve, rej) => {
/******/ 				reject = rej;
/******/ 				outerResolve = resolve;
/******/ 			});
/******/ 			promise[webpackExports] = exports;
/******/ 			promise[webpackQueues] = (fn) => (queue && fn(queue), depQueues.forEach(fn), promise["catch"](x => {}));
/******/ 			module.exports = promise;
/******/ 			const handle = (deps) => {
/******/ 				currentDeps = wrapDeps(deps);
/******/ 				let fn;
/******/ 				const getResult = () => (currentDeps.map((d) => {
/******/
/******/ 					if(d[webpackError]) throw d[webpackError];
/******/ 					return d[webpackExports];
/******/ 				}))
/******/ 				const promise = new Promise((resolve) => {
/******/ 					fn = () => (resolve(getResult));
/******/ 					fn.r = 0;
/******/ 					const fnQueue = (q) => (q !== queue && !depQueues.has(q) && (depQueues.add(q), q && !q.d && (fn.r++, q.push(fn))));
/******/ 					currentDeps.map((dep) => (dep[webpackQueues](fnQueue)));
/******/ 				});
/******/ 				return fn.r ? promise : getResult();
/******/ 			}
/******/ 			const done = (err) => ((err ? reject(promise[webpackError] = err) : outerResolve(exports)), resolveQueue(queue))
/******/ 			body(handle, done);
/******/ 			queue?.d < 0 && (queue.d = 0);
/******/ 		};
/******/ 	})();
/******/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			const getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter/value functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			if(Array.isArray(definition)) {
/******/ 				var i = 0;
/******/ 				while(i < definition.length) {
/******/ 					var key = definition[i++];
/******/ 					var binding = definition[i++];
/******/ 					if(!__webpack_require__.o(exports, key)) {
/******/ 						if(binding === 0) {
/******/ 							Object.defineProperty(exports, key, { enumerable: true, value: definition[i++] });
/******/ 						} else {
/******/ 							Object.defineProperty(exports, key, { enumerable: true, get: binding });
/******/ 						}
/******/ 					} else if(binding === 0) { i++; }
/******/ 				}
/******/ 			} else {
/******/ 				for(var key in definition) {
/******/ 					if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 						Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/
/************************************************************************/
/******/
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module used 'module' so it can't be inlined
/******/ 	let __webpack_exports__ = __webpack_require__("591a55b96a73");
/******/
/******/ })()
;