/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "71705e850b41"
(module, __webpack_exports__, __webpack_require__) {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _core_js_smart_base__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("deb1a4d61565");
/* harmony import */ var _core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("5b7d7695b41b");
/* harmony import */ var _core_js_layer_stack__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("18003344cff0");
/* harmony import */ var _helpers_late_children_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("769e1a2f7462");
/* harmony import */ var _js_nodes_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__("4f2635e5ee49");
/* harmony import */ var _js_templates_default_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__("c3b3229a2743");
/* harmony import */ var _component_json__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__("04a513cb1f29");
/* harmony import */ var _lang_en_json__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__("cf98b1f52540");
/* harmony import */ var _lang_ru_json__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__("905d4bb569c1");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_core_js_smart_base__WEBPACK_IMPORTED_MODULE_0__, _core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__, _core_js_layer_stack__WEBPACK_IMPORTED_MODULE_2__, _js_templates_default_js__WEBPACK_IMPORTED_MODULE_5__]);
([_core_js_smart_base__WEBPACK_IMPORTED_MODULE_0__, _core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__, _core_js_layer_stack__WEBPACK_IMPORTED_MODULE_2__, _js_templates_default_js__WEBPACK_IMPORTED_MODULE_5__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);
/* harmony import */ var _core_js_smart_base__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_core_js_smart_base__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _core_js_layer_stack__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_core_js_layer_stack__WEBPACK_IMPORTED_MODULE_2__);
// sf-admin-shell: the frame of every admin screen (owner decisions C416, C420;
// study ui-control control/research/2026-11-22-admin-shell-study, sample
// prototypes/admin-shell-study/shell.mjs). A product puts its ready parts into
// it -- the alert bar, the admin menu, the page head and the content -- and the
// shell places them and keeps the rules of the frame:
//
// - the document scrolls; the bar stands at the top, the menu under it, and
//   on a phone a slim top line (menu button, product, the top-end parts) under
//   the bar; --sf-admin-shell-stick is the height of what stands at the top,
//   so a data head below sticks under it (C328, C420);
// - the menu's room is held before the menu has drawn (menu-reserve, AM-18):
//   the rail, or the rail and the section column, unless the person hid the
//   column (the menu's own preference, SF.Preferences sf-admin-menu/main);
// - the skip link is the first stop of Tab (WCAG 2.4.1) and focuses the work
//   area, which is the main landmark named by the page head's heading;
// - width list | read: lists take the whole width, forms and text the reading
//   width at the start (C329);
// - on a phone the menu button swaps the work area for the menu (C322):
//   Escape, the button or a chosen page closes it, and focus comes back.
//
// The page's nodes are its own: the shell moves each into its place once,
// when it draws (and later ones when the page writes them), never copies them,
// and never puts back one the page has taken out (AS-5): it places only what
// is in it now.









const ShellElement = (0,_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__.elementFromManifest)(_component_json__WEBPACK_IMPORTED_MODULE_6__, {
  base: (_core_js_smart_base__WEBPACK_IMPORTED_MODULE_0___default()),
  lang: {
    en: _lang_en_json__WEBPACK_IMPORTED_MODULE_7__,
    ru: _lang_ru_json__WEBPACK_IMPORTED_MODULE_8__
  },
  source: "ru"
}); // The named places of the frame; everything else the page writes is content.

const AREAS = ["bar", "menu", "head", "top-end"]; // The menu folds away below 44rem (sf-admin-menu's own threshold): the shell's
// phone frame starts where the menu's phone screen does.

const NARROW = "(max-width: 43.99rem)";
const MENU_PREFERENCE = "sf-admin-menu/main";
const FOCUSABLE = "a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])";
const PART = "data-sf-admin-shell-part";
let shellCount = 0;

const own = node => node.nodeType === 1 && node.hasAttribute(PART);

const slotOf = node => node.nodeType === 1 ? node.getAttribute("slot") : null;

const narrow = () => globalThis.matchMedia?.(NARROW).matches === true;

const px = value => `${Math.round(value * 100) / 100}px`;

class SfAdminShell extends ShellElement {
  // The page's nodes stay where the page wrote them until the first drawing,
  // which takes them out and places them in the same task: a page that finds
  // its menu by id once the shell is defined finds it (as sf-drawer, sf-modal).
  static holdsSlotNodesUntilDrawn = true;

  constructor() {
    super();
    shellCount += 1;
    this._shellId = `sf-admin-shell-${shellCount}`;
    this._content = null;
    this._late = null;
    this._observers = [];
    this._heights = {
      bar: -1,
      top: -1
    }; // The nodes this shell has placed once (AS-5, js/nodes.js).

    this._placed = new WeakSet();
  } // ── the page's nodes ─────────────────────────────────────────────────────


  connectedCallback() {
    // Content is every child the page wrote that names no slot: not the
    // printed picture of the frame (§5.4), not a settings island, not white space.
    if (!this._content) {
      this._content = Array.from(this.childNodes).filter(node => (0,_helpers_late_children_js__WEBPACK_IMPORTED_MODULE_3__.isLateContent)(node) && !slotOf(node) && !own(node));
    }

    super.connectedCallback();
    if (!this.isConnected) return;
    if (!this._late) this._late = (0,_helpers_late_children_js__WEBPACK_IMPORTED_MODULE_3__.watchLateChildren)(this, nodes => this.takeLateChildren(nodes));
    const signal = this.sfScope;
    globalThis.addEventListener?.("keydown", event => this.onKeydown(event), {
      signal
    });
    const media = globalThis.matchMedia?.(NARROW);
    media?.addEventListener?.("change", event => {
      if (!event.matches && this.menuOpen) this.closeMenu({
        focus: false,
        reason: "resize"
      });
      this.measure();
    }, {
      signal
    });
    this.applyScrollPadding();
  }

  disconnectedCallback() {
    this._late?.disconnect();
    this._late = null;

    for (const observer of this._observers) observer.disconnect();

    this._observers = [];
    this._observed = false;

    if (this._padded) {
      document.documentElement.style.removeProperty("scroll-padding-block-start");
      this._padded = false;
    }

    super.disconnectedCallback();
  } // What the page writes into the host later goes to its place: a node that
  // names a slot to that area, any other to the content, after what is there.


  takeLateChildren(nodes) {
    const mine = nodes.filter(node => !own(node));
    if (!mine.length) return;

    for (const node of mine) {
      const slot = slotOf(node);

      if (slot && AREAS.includes(slot)) {
        if (!this._liveSlotNodes.has(slot)) this._liveSlotNodes.set(slot, []);

        this._liveSlotNodes.get(slot).push(node);
      } else {
        this._content.push(node);
      }
    }

    this.place();
    this.requestComponentUpdate("content");
  } // A node the page has taken out of the shell (removed, or moved elsewhere)
  // is the page's decision: it is forgotten, never put back (AS-5: a page
  // that swapped its body without a reload got the old form back on the next
  // placing, after the phone menu closed -- two forms at 390).
  // The rule itself is js/nodes.js.


  nodesOf(area) {
    const inside = node => this.contains(node);

    if (area === "content") {
      if (this._content) this._content = (0,_js_nodes_js__WEBPACK_IMPORTED_MODULE_4__.heldNodes)(this._content, inside, this._placed);
      return this._content ?? [];
    }

    const list = this._liveSlotNodes.get(area);

    const kept = (0,_js_nodes_js__WEBPACK_IMPORTED_MODULE_4__.heldNodes)(list, inside, this._placed);
    if (Array.isArray(list) && kept.length !== list.length) this._liveSlotNodes.set(area, kept);
    return kept;
  } // Each node into its area, once; a node already there is left alone, so a
  // drawn menu is never taken out and put back.


  place() {
    const frame = this.frame;
    if (!frame) return;

    for (const area of [...AREAS, "content"]) {
      const box = frame.querySelector(`[data-area="${area}"]`);
      if (!box) continue;

      for (const node of this.nodesOf(area)) {
        if (node.parentNode !== box) box.append(node);

        this._placed.add(node);
      }
    }

    this.toggleAttribute("data-bar", this.nodesOf("bar").length > 0);
  }

  get frame() {
    return this.querySelector(":scope > .sf-admin-shell");
  }

  get menuElement() {
    return this.frame?.querySelector('[data-area="menu"] > sf-admin-menu') ?? null;
  }

  get mainElement() {
    return this.frame?.querySelector(".sf-admin-shell__main") ?? null;
  }

  get menuButton() {
    return this.frame?.querySelector(".sf-admin-shell__menu-button") ?? null;
  } // ── the menu's room before it draws (AM-18) ─────────────────────────────
  // rail-column falls back to the rail when the person hid the section
  // column: the menu keeps that choice in SF.Preferences, and so the shell
  // reads it from the same place.


  get shownReserve() {
    const asked = this.getProp("menuReserve");
    if (asked !== "rail-column") return asked === "none" ? "none" : "rail"; // The menu's own word for its first paint: expected-columns="1" where
    // the page's row has no open root (a dashboard) -- the rail alone.

    if (this.nodesOf("menu")[0]?.getAttribute?.("expected-columns") === "1") return "rail";

    try {
      return globalThis.SF?.Preferences?.read?.(MENU_PREFERENCE)?.second === false ? "rail" : "rail-column";
    } catch {
      return "rail-column";
    }
  } // ── sticky offsets ───────────────────────────────────────────────────────
  // The bar can grow («ещё N», two lines on a phone), the top line shows only
  // on a phone: their real heights give the offsets, written on the frame
  // only when they change (a write that changes nothing is not a write).


  measure() {
    const frame = this.frame;
    if (!frame) return;
    const bar = frame.querySelector(".sf-admin-shell__bar")?.getBoundingClientRect().height ?? 0;
    const top = narrow() ? frame.querySelector(".sf-admin-shell__top")?.getBoundingClientRect().height ?? 0 : 0;
    if (bar === this._heights.bar && top === this._heights.top) return;
    this._heights = {
      bar,
      top
    };
    frame.style.setProperty("--sf-admin-shell--bar", px(bar));
    frame.style.setProperty("--sf-admin-shell-stick", px(bar + top));
    this.applyScrollPadding();
  } // The document scrolls under what stands at the top: an anchor, the skip
  // link's target and a focused field stop below it, not behind it.


  applyScrollPadding() {
    const frame = this.frame;
    if (!frame || !this.isConnected) return;
    const stick = (this._heights.bar > 0 ? this._heights.bar : 0) + (this._heights.top > 0 ? this._heights.top : 0);
    document.documentElement.style.setProperty("scroll-padding-block-start", `calc(${px(stick)} + var(--sf-space-1))`);
    this._padded = true;
  }

  observe() {
    if (this._observed || typeof ResizeObserver !== "function") return;
    const frame = this.frame;
    if (!frame) return;
    this._observed = true;
    const sizes = new ResizeObserver(() => this.measure());

    for (const part of frame.querySelectorAll(".sf-admin-shell__bar, .sf-admin-shell__top")) sizes.observe(part);

    this._observers.push(sizes); // The page head draws its heading later: it names the main landmark.


    const head = frame.querySelector('[data-area="head"]');

    if (head) {
      const heading = new MutationObserver(() => this.nameMain());
      heading.observe(head, {
        childList: true,
        subtree: true
      });

      this._observers.push(heading);
    }
  } // The main landmark is named by the page's h1 (the page head's heading);
  // only written when it changes, so the observer above does not loop.


  nameMain() {
    const main = this.mainElement;
    const heading = this.frame?.querySelector('[data-area="head"] h1, [data-area="head"] [role="heading"][aria-level="1"]');
    if (!main) return;

    if (!heading) {
      if (main.hasAttribute("aria-labelledby")) main.removeAttribute("aria-labelledby");
      return;
    }

    if (!heading.id) heading.id = `${this._shellId}-heading`;
    if (main.getAttribute("aria-labelledby") !== heading.id) main.setAttribute("aria-labelledby", heading.id);
  } // ── the phone menu (C322) ────────────────────────────────────────────────


  get menuOpen() {
    return this.hasAttribute("menu-open") && this.getAttribute("menu-open") !== "false";
  }

  set menuOpen(value) {
    if (value) this.openMenu();else this.closeMenu();
  }

  openMenu({
    focus = true,
    reason = "api"
  } = {}) {
    if (!this.isConnected) return (0,_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__.refused)("not-connected");
    if (!this.nodesOf("menu").length) return (0,_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__.refused)("no-menu");
    if (this.menuOpen) return (0,_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__.applied)();
    this.setAttribute("menu-open", "");
    this.syncMenuButton();
    globalThis.scrollTo?.(0, 0);
    this.sfEmit("menu-open", {
      reason
    });

    if (focus) {
      // The menu draws its phone screen first.
      setTimeout(() => this.frame?.querySelector(`[data-area="menu"] :is(${FOCUSABLE})`)?.focus?.(), 50);
    }

    return (0,_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__.applied)();
  }

  closeMenu({
    focus = true,
    reason = "api"
  } = {}) {
    if (!this.menuOpen) return (0,_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__.applied)();
    this.removeAttribute("menu-open");
    this.syncMenuButton();
    this.sfEmit("menu-close", {
      reason
    });
    if (focus) this.focusMenuButton();
    return (0,_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__.applied)();
  }

  focusMenuButton() {
    const button = this.menuButton;
    (button?.querySelector("button") ?? button)?.focus?.();
  } // The work area takes the focus: after the skip link, and after a product
  // moved to another page without a reload (the frame stays, the content changed).


  focusContent() {
    const main = this.mainElement;
    if (!main) return (0,_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__.refused)("not-drawn");
    if (this.menuOpen) this.closeMenu({
      focus: false,
      reason: "content"
    });
    main.focus({
      preventScroll: true
    });
    main.scrollIntoView?.({
      block: "start"
    });
    return (0,_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__.applied)();
  } // The button is sf-button-icon: its host attributes reach its <button>
  // when it draws; later changes are written on both, so the name and the
  // state a reader hears are the ones shown.


  syncMenuButton() {
    const host = this.menuButton;
    if (!host) return;
    const open = this.menuOpen;
    const label = this.sfWord(open ? "close-menu-label" : "menu-label");
    const icon = open ? "close" : "menu";
    if (host.getAttribute("icon") !== icon) host.setAttribute("icon", icon);
    if (host.getAttribute("aria-label") !== label) host.setAttribute("aria-label", label);
    const button = host.querySelector("button");

    for (const target of [host, button].filter(Boolean)) {
      if (target.getAttribute("aria-expanded") !== String(open)) target.setAttribute("aria-expanded", String(open));
      if (target.getAttribute("aria-controls") !== `${this._shellId}-menu`) target.setAttribute("aria-controls", `${this._shellId}-menu`);
    }
  }

  onKeydown(event) {
    if (event.key !== "Escape" || event.defaultPrevented || !this.menuOpen || !narrow()) return; // A window or a popup holding the focus takes its own Escape first. A
    // closed drawer stays in the document with its dialog role (even
    // shown, off screen), so what counts is where the key was pressed.

    const target = event.composedPath?.()[0] ?? event.target;
    if (target?.closest?.("dialog, [role='dialog'], [aria-modal='true'], [role='menu'], [role='listbox']")) return; // A layer of the document's layer stack opened over the menu takes it
    // too, wherever the focus is (1.0.1, LM-R1): the bell's panel is a
    // drawer that leaves the focus on the bell, so the first Escape closed
    // the menu under the open panel. The stack closes its top layer and
    // gives the focus back to its opener; the next Escape is the menu's.

    if ((0,_core_js_layer_stack__WEBPACK_IMPORTED_MODULE_2__.topLayer)()) return;
    event.preventDefault();
    this.closeMenu({
      reason: "escape"
    });
  }

  onMenuButton() {
    if (this.menuOpen) this.closeMenu({
      reason: "button"
    });else this.openMenu({
      reason: "button"
    });
  }

  onSkip(event) {
    event.preventDefault();
    this.focusContent();
  } // ── drawing ──────────────────────────────────────────────────────────────


  template() {
    return (0,_js_templates_default_js__WEBPACK_IMPORTED_MODULE_5__.renderAdminShellTemplate)({
      id: this._shellId,
      width: this.getProp("width") === "read" ? "read" : "list",
      reserve: this.shownReserve,
      product: this.getProp("product") || "",
      skipLabel: this.getProp("skipLabel") || this.sfWord("skip-label"),
      menuLabel: this.sfWord(this.menuOpen ? "close-menu-label" : "menu-label"),
      menuOpen: this.menuOpen,
      hasMenu: this.nodesOf("menu").length > 0,
      onSkip: event => this.onSkip(event),
      onMenuButton: () => this.onMenuButton()
    });
  }

  afterRender(changed) {
    super.afterRender?.(changed);
    this.place();
    this.observe();
    this.nameMain();
    this.syncMenuButton();
    this.measure();

    if (!this._menuBound) {
      this._menuBound = true; // A page chosen in the phone menu closes it; the page itself moves.
      // The event is cancelable (sf-admin-menu 1.16.1, AS-6) and the page
      // listens above the shell, so the shell decides once every listener
      // has had it: a page that refused to leave keeps the menu open.

      this.addEventListener("sf-admin-menu-navigate", event => {
        queueMicrotask(() => {
          if (!event.defaultPrevented && this.menuOpen) this.closeMenu({
            focus: false,
            reason: "navigate"
          });
        });
      }, {
        signal: this.sfScope
      });
    }
  }

}

SfAdminShell.define("sf-admin-shell");
__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ },

/***/ "4f2635e5ee49"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   heldNodes: () => (/* binding */ heldNodes),
/* harmony export */   holdsNode: () => (/* binding */ holdsNode)
/* harmony export */ });
// The shell's rule for the page's nodes (AS-5): a node the page has taken out
// of the shell -- removed, or moved somewhere else -- is the page's decision and
// is forgotten, never put back. A node not placed yet may be out of the
// document for a moment (the base releases the held slot nodes right before
// the drawing places them), so it is kept unless the page put it somewhere
// else; a placed node is kept only while it is still inside the shell.
//
// inside(node): the node is in the shell now; placed: the nodes the shell has
// placed once (a WeakSet or anything with has()).
function holdsNode(node, inside, placed) {
  if (!node || !node.nodeType) return false;
  if (inside(node)) return true;
  if (!placed.has(node)) return node.parentNode === null;
  return false;
} // The nodes of one area the shell still holds, in their order.

function heldNodes(list, inside, placed) {
  return [].concat(list ?? []).filter(node => holdsNode(node, inside, placed));
}

/***/ },

/***/ "c3b3229a2743"
(module, __webpack_exports__, __webpack_require__) {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   renderAdminShellTemplate: () => (/* binding */ renderAdminShellTemplate)
/* harmony export */ });
/* harmony import */ var lit__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("2a080a730149");
/* harmony import */ var _default_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("685693a124e5");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([lit__WEBPACK_IMPORTED_MODULE_0__]);
var __webpack_async_dependencies_result__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);
lit__WEBPACK_IMPORTED_MODULE_0__ = __webpack_async_dependencies_result__[0];
/* harmony import */ var lit__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lit__WEBPACK_IMPORTED_MODULE_0__);

 // The frame of an admin screen (sf-admin-shell). One root box, .sf-admin-shell,
// in the host's light DOM (the host is display: contents):
//
//   the skip link      first in the order of Tab, shown only while focused;
//   the bar            slot bar (sf-alert-bar), standing at the top;
//   the top line       on a phone only: the menu button, the product's name and
//                      slot top-end (the activity indicator, the bell);
//   the body           the menu's column (slot menu) and the work area: the
//                      main landmark with slot head (sf-header-page) and the
//                      content.
//
// The areas are empty boxes here: the element moves the page's own nodes
// into them (data-area), so the template never draws the page's parts and a
// drawing again leaves them where they are.

function renderAdminShellTemplate(context) {
  const {
    id,
    width,
    reserve,
    product,
    skipLabel,
    menuLabel,
    menuOpen,
    hasMenu
  } = context;
  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class="sf-admin-shell" data-sf-admin-shell-part data-width=${width} data-reserve=${reserve}>
        <a class="sf-admin-shell__skip" href=${`#${id}-main`} @click=${context.onSkip}>${skipLabel}</a>
        <div class="sf-admin-shell__bar" data-area="bar"></div>
        <div class="sf-admin-shell__top">
            ${hasMenu ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<sf-button-icon class="sf-admin-shell__menu-button" icon=${menuOpen ? "close" : "menu"} appearance="ghost"
                    aria-label=${menuLabel} aria-expanded=${String(menuOpen)} aria-controls=${`${id}-menu`}
                    @click=${context.onMenuButton}></sf-button-icon>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
            <span class="sf-admin-shell__product">${product}</span>
            <div class="sf-admin-shell__top-end" data-area="top-end"></div>
        </div>
        <div class="sf-admin-shell__body">
            <div class="sf-admin-shell__nav" id=${`${id}-menu`} data-area="menu"></div>
            <main class="sf-admin-shell__main" id=${`${id}-main`} tabindex="-1">
                <div class="sf-admin-shell__head" data-area="head"></div>
                <div class="sf-admin-shell__content" data-area="content"></div>
            </main>
        </div>
    </div>`;
}
__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ },

/***/ "769e1a2f7462"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   isLateContent: () => (/* binding */ isLateContent),
/* harmony export */   watchLateChildren: () => (/* binding */ watchLateChildren)
/* harmony export */ });
// Children a page writes into a panel's host after the panel connected
// (Larena LF-3, 2026-11-18): sf-modal and sf-drawer took their content once,
// when they connected, so a body fetched and written while the panel was
// open stayed in the host -- out of the panel, and on the page itself, as the
// host draws no box of its own. The panel watches its host instead: what the
// page writes there later is handed to `take`, in the order written, once per
// batch of changes (one task's writes arrive together).
//
// Not content: static markup (a picture of the element, §5.4), a settings
// island, a comment and white space.
function isLateContent(node) {
  if (node.nodeType === 3) return node.textContent.trim() !== '';
  if (node.nodeType !== 1) return false;
  if (node.hasAttribute('data-sf-static')) return false;
  return !(node.localName === 'script' && node.hasAttribute('data-sf-settings'));
}
function watchLateChildren(host, take) {
  const observer = new MutationObserver(records => {
    const added = [];

    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.parentNode === host && !added.includes(node) && isLateContent(node)) added.push(node);
      }
    }

    if (added.length) take(added);
  });
  observer.observe(host, {
    childList: true
  });
  return observer;
}

/***/ },

/***/ "685693a124e5"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ },

/***/ "5b7d7695b41b"
(module) {

module.exports = (globalThis.SF && globalThis.SF.runtimeModule ? globalThis.SF.runtimeModule("element-manifest", 1) : new Promise((resolve, reject) => globalThis.addEventListener("sf-runtime-ready", () => globalThis.SF.runtimeModule("element-manifest", 1).then(resolve, reject), { once: true })));

/***/ },

/***/ "18003344cff0"
(module) {

module.exports = (globalThis.SF && globalThis.SF.runtimeModule ? globalThis.SF.runtimeModule("layer-stack", 1) : new Promise((resolve, reject) => globalThis.addEventListener("sf-runtime-ready", () => globalThis.SF.runtimeModule("layer-stack", 1).then(resolve, reject), { once: true })));

/***/ },

/***/ "2a080a730149"
(module) {

module.exports = (globalThis.SF && globalThis.SF.runtimeModule ? globalThis.SF.runtimeModule("lit", 1) : new Promise((resolve, reject) => globalThis.addEventListener("sf-runtime-ready", () => globalThis.SF.runtimeModule("lit", 1).then(resolve, reject), { once: true })));

/***/ },

/***/ "deb1a4d61565"
(module) {

module.exports = (globalThis.SF && globalThis.SF.runtimeModule ? globalThis.SF.runtimeModule("smart-base", 1) : new Promise((resolve, reject) => globalThis.addEventListener("sf-runtime-ready", () => globalThis.SF.runtimeModule("smart-base", 1).then(resolve, reject), { once: true })));

/***/ },

/***/ "04a513cb1f29"
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"id":"smart.admin-shell","tag":"sf-admin-shell","version":"1.0.1","kind":"leaf","settings":{"width":{"type":"enum","values":["list","read"],"default":"list"},"menu-reserve":{"type":"enum","values":["rail","rail-column","none"],"default":"rail-column"},"product":{"type":"string","default":""},"skip-label":{"type":"string","default-from":"runtime.skip-label"},"menu-open":{"type":"boolean","default":false}},"values":{},"events":{"menu-open":{"carries":{"reason":{"type":"enum","values":["button","api"]}},"own-verb":true},"menu-close":{"carries":{"reason":{"type":"enum","values":["button","escape","navigate","resize","content","api"]}},"own-verb":true}},"actions":{"open-menu":{},"close-menu":{},"focus-content":{}},"layer":{"kind":"surface","locks-page":false,"traps-focus":false},"host-states":{"menu-open":"boolean","data-bar":"boolean"},"css-variables":{"--sf-admin-shell-background-color":{"type":"color","state":"default"},"--sf-admin-shell-content-padding-inline":{"type":"length","state":"default"},"--sf-admin-shell-content-padding-block":{"type":"length","state":"default"},"--sf-admin-shell-read-width":{"type":"length","state":"default"},"--sf-admin-shell-menu-reserve":{"type":"length","state":"default"},"--sf-admin-shell-top-padding":{"type":"length","state":"default"},"--sf-admin-shell-divider-color":{"type":"color","state":"default"},"--sf-admin-shell-z-index":{"type":"number","state":"default"},"--sf-admin-shell-stick":{"type":"length","state":"default","x-direction":"out"}}}');

/***/ },

/***/ "cf98b1f52540"
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"title":"Admin shell","runtime":{"skip-label":"Skip to content","menu-label":"Menu","close-menu-label":"Close the menu"},"events":{"menu-open":{"label":"Menu opened"},"menu-close":{"label":"Menu closed"}}}');

/***/ },

/***/ "905d4bb569c1"
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"title":"Каркас админки","runtime":{"skip-label":"Перейти к содержимому","menu-label":"Меню","close-menu-label":"Закрыть меню"},"events":{"menu-open":{"label":"Меню открыто"},"menu-close":{"label":"Меню закрыто"}}}');

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
/******/ 	let __webpack_exports__ = __webpack_require__("71705e850b41");
/******/
/******/ })()
;