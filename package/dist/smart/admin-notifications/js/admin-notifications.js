/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "1c3031e0d3c0"
(module, __webpack_exports__, __webpack_require__) {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _core_js_smart_base__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("deb1a4d61565");
/* harmony import */ var _core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("5b7d7695b41b");
/* harmony import */ var _js_templates_default_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("1c89e1e66579");
/* harmony import */ var _js_port_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("d407ad841b1e");
/* harmony import */ var _component_json__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__("c056121fdc24");
/* harmony import */ var _lang_en_json__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__("ceb029f6ed51");
/* harmony import */ var _lang_ru_json__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__("0d8bc8e03f30");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_core_js_smart_base__WEBPACK_IMPORTED_MODULE_0__, _core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__, _js_templates_default_js__WEBPACK_IMPORTED_MODULE_2__]);
([_core_js_smart_base__WEBPACK_IMPORTED_MODULE_0__, _core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__, _js_templates_default_js__WEBPACK_IMPORTED_MODULE_2__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);
/* harmony import */ var _core_js_smart_base__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_core_js_smart_base__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__);
// sf-admin-notifications: the admin's list of notifications (owner decisions
// C421 with C331, C340, C341, C342; study ui-control
// control/research/2026-11-22-admin-shell-study, sample
// prototypes/admin-shell-study/shell.mjs setupNotifications). One list in two
// looks: in the panel (sf-drawer on the right, the latest) and on the history
// page (the whole width, in parts with «Показать ещё»).
//
// - grouped by day as the host groups them (only the host knows the person's
//   day); within a day the repeats of one object fold under «Ещё N по …» after
//   the first, a quiet link row at the start of the entry's text (C421);
// - one problem is one entry that ends «→ решено» (C341);
// - «Прочитать все» marks every notification, not the page shown;
// - the data come over the admin menu's port (simai.admin-navigation-port:
//   notifications.load, notifications.read), so the bell's number and the
//   list never disagree; or as the setting items, for a host without a port.
//
// The list owns no data: a read is asked of the host, an open is an event and
// the browser follows the entry's link unless the page cancels it.







const NotificationsElement = (0,_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__.elementFromManifest)(_component_json__WEBPACK_IMPORTED_MODULE_4__, {
  base: (_core_js_smart_base__WEBPACK_IMPORTED_MODULE_0___default()),
  lang: {
    en: _lang_en_json__WEBPACK_IMPORTED_MODULE_5__,
    ru: _lang_ru_json__WEBPACK_IMPORTED_MODULE_6__
  },
  source: "ru"
});

const copy = value => JSON.parse(JSON.stringify(value ?? null));

const text = value => value === null || value === undefined ? "" : String(value); // One notification as the list draws it: js/port.js entryOf. The port's
// object, level and resolved are read from a host of port 1.2.0 or later; a
// 1.1.0 host's notifications are drawn as in 1.1.0 (see the port note in
// docs.md). The setting items may carry all three.
// The port's groups ({key, label, items}) or the setting's flat list (each
// item with group and group-label, in order) as one shape.


function groupsOf(value, flat = false, extended = true) {
  const groups = [];

  if (flat) {
    const byKey = new Map();

    for (const item of Array.isArray(value) ? value : []) {
      const entry = (0,_js_port_js__WEBPACK_IMPORTED_MODULE_3__.entryOf)(item);
      if (!entry) continue;
      const key = text(item.group ?? "all");

      if (!byKey.has(key)) {
        const group = {
          key,
          label: text(item["group-label"] ?? item.groupLabel ?? ""),
          items: []
        };
        byKey.set(key, group);
        groups.push(group);
      }

      byKey.get(key).items.push(entry);
    }

    return groups;
  }

  for (const group of Array.isArray(value) ? value : []) {
    if (!group || typeof group !== "object") continue;
    const items = (Array.isArray(group.items) ? group.items : []).map(item => (0,_js_port_js__WEBPACK_IMPORTED_MODULE_3__.entryOf)(item, extended)).filter(Boolean);
    groups.push({
      key: text(group.key),
      label: text(group.label),
      items
    });
  }

  return groups;
} // A later page of the history joins the groups it continues.


function mergeGroups(before, more) {
  const merged = before.map(group => ({ ...group,
    items: [...group.items]
  }));

  for (const group of more) {
    const same = merged.find(one => one.key === group.key);

    if (same) {
      const known = new Set(same.items.map(item => item.key));
      same.items.push(...group.items.filter(item => !known.has(item.key)));
    } else {
      merged.push(group);
    }
  }

  return merged;
}

class SfAdminNotifications extends NotificationsElement {
  constructor() {
    super();
    this._groups = [];
    this._unread = 0;
    this._status = "idle";
    this._reason = "";
    this._cursor = null;
    this._settingsHref = "";
    this._expanded = new Set();
    this._focusAfter = null;
    this._items = null;

    for (const name of ["items"]) {
      if (!Object.prototype.hasOwnProperty.call(this, name)) continue;
      const early = this[name];
      delete this[name];
      this[name] = early;
    }
  } // ── data ───────────────────────────────────────────────────────────────
  // A list given by the page: the host without a port (or a demo). A
  // property wins over the attribute's JSON.


  get items() {
    const value = this._items ?? this.getProp("items");
    return Array.isArray(value) ? value : [];
  }

  set items(value) {
    this._items = Array.isArray(value) ? copy(value) : null;
    if (this._items) this.takeItems();
    this.requestComponentUpdate("items");
  }

  get givenItems() {
    return this._items !== null || this.hasAttribute("items");
  }

  takeItems() {
    this._groups = groupsOf(this.items, true);
    this._unread = this._groups.reduce((sum, group) => sum + group.items.filter(item => item.unread).length, 0);
    this._status = "ready";
    this._cursor = null;
  }
  /** The number of unread notifications, as the host last said. */


  get unread() {
    return this._unread;
  }

  get port() {
    return this.sfPort ?? null;
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.isConnected) return;

    if (this.givenItems) {
      this.takeItems();
      this.requestComponentUpdate("items");
      return;
    }

    if (!this.port) this.askForPort();
  } // The port: handed by the page (connectPort), answered to a request, or
  // the admin menu's own -- the list and the bell read one port.


  askForPort() {
    this.dispatchEvent(new CustomEvent("sf-host-port-request", {
      bubbles: true,
      composed: true,
      detail: {
        component: this,
        context: {
          owner: "admin-notifications",
          record: null,
          group: null
        }
      }
    }));
    if (this.port || this.adoptMenuPort()) return;
    const signal = this.sfScope; // The menu asks its host for navigation when it has its port.

    document.addEventListener("sf-admin-menu-refresh", () => {
      if (!this.port && !this.givenItems) this.adoptMenuPort();
    }, {
      signal
    });
    globalThis.customElements?.whenDefined?.("sf-admin-menu").then(() => {
      if (!this.port && !this.givenItems && this.isConnected) this.adoptMenuPort();
    });
  }

  adoptMenuPort() {
    for (const menu of document.querySelectorAll("sf-admin-menu")) {
      const port = menu.sfPort ?? menu.hostPort ?? null;

      if (port && typeof port.raise === "function") {
        this.connectPort(port);
        return true;
      }
    }

    return false;
  }

  onPortConnected() {
    if (!this.givenItems) this.load();
  } // A printed skeleton stays until the list is there (§5.4, §7.3 phase 3):
  // the items given, or the host's answer -- or its failure, which is news
  // too. The data comes by the port, so the base's late-settings rule is
  // not enough.


  sfAwaitingData() {
    if (this.getAttribute("data-sf-first-paint") !== "skeleton") return false;
    if (this.givenItems) return false;
    return this._status !== "ready" && this._status !== "failed";
  }

  offers() {
    const capabilities = this.port?.capabilities;
    return !Array.isArray(capabilities) || capabilities.includes("notifications");
  }

  async raise(intent, payload) {
    const port = this.port;
    if (!port) return {
      answer: "unavailable",
      reason: "no-port"
    };

    try {
      const answer = await port.raise(intent, copy(payload), {});
      return answer && typeof answer === "object" ? answer : {
        answer: "unavailable"
      };
    } catch (error) {
      return {
        answer: "unavailable",
        reason: String(error?.message ?? error)
      };
    }
  } // One page of notifications; with more, the next page after the shown ones.


  async load({
    more = false
  } = {}) {
    if (this.givenItems) {
      this.takeItems();
      this.requestComponentUpdate("items");
      return (0,_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__.applied)();
    }

    if (!this.port) return (0,_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__.refused)("no-port");

    if (!this.offers()) {
      this.fail("no-notifications");
      return (0,_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__.refused)("no-notifications");
    }

    const cursor = more ? this._cursor : null;

    if (!more) {
      this._status = this._status === "ready" ? "ready" : "loading";
      this.requestComponentUpdate("loading");
    }

    const answer = await this.raise("notifications.load", cursor === null ? {} : {
      cursor
    });

    if (answer.answer !== "applied") {
      this.fail(answer.reason || answer.message || "");
      return (0,_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__.refused)(answer.answer === "refused" ? "refused" : "unavailable", answer.reason);
    }

    const groups = groupsOf(answer.groups, false, (0,_js_port_js__WEBPACK_IMPORTED_MODULE_3__.readsExtendedFields)(this.port));
    this._groups = more ? mergeGroups(this._groups, groups) : groups;
    this._unread = Number.isInteger(answer.unread) ? answer.unread : this.countUnread();
    this._cursor = answer.next_cursor ?? null;
    this._settingsHref = typeof answer.settings_href === "string" ? answer.settings_href : "";
    this._status = "ready";
    this._reason = "";
    this.requestComponentUpdate("loaded");
    return (0,_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__.applied)();
  }

  fail(reason) {
    this._status = "failed";
    this._reason = text(reason);
    this.sfEmit("failed", {
      reason: this._reason
    });
    this.requestComponentUpdate("failed");
  }

  countUnread() {
    return this._groups.reduce((sum, group) => sum + group.items.filter(item => item.unread).length, 0);
  } // ── actions ──────────────────────────────────────────────────────────────


  refresh() {
    return this.load();
  }

  async readAll() {
    if (!this._unread && !this.countUnread()) return (0,_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__.applied)();

    if (this.port && !this.givenItems) {
      const answer = await this.raise("notifications.read", {
        all: true
      });
      if (answer.answer !== "applied") return (0,_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__.refused)(answer.answer === "refused" ? "refused" : "unavailable", answer.reason);
      this._unread = Number.isInteger(answer.unread) ? answer.unread : 0;
    } else {
      this._unread = 0;
    }

    for (const group of this._groups) for (const item of group.items) item.unread = false;

    this.sfEmit("read-all", {});
    this._focusAfter = "status";
    this.followCount();
    this.requestComponentUpdate("read-all");
    return (0,_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__.applied)();
  }

  async read(keys) {
    // One object naming the parameter is the action's object form.
    if (keys && typeof keys === "object" && !Array.isArray(keys) && "keys" in keys) keys = keys.keys;
    const wanted = new Set([].concat(keys ?? []).map(text).filter(Boolean));
    const unreadOnes = [];

    for (const group of this._groups) {
      for (const item of group.items) {
        if (wanted.has(item.key) && item.unread) {
          item.unread = false;
          unreadOnes.push(item.key);
        }
      }
    }

    if (!unreadOnes.length) return (0,_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__.applied)();
    this._unread = Math.max(0, this._unread - unreadOnes.length);
    this.sfEmit("read", {
      keys: unreadOnes
    });
    this.requestComponentUpdate("read");

    if (this.port && !this.givenItems) {
      const answer = await this.raise("notifications.read", {
        keys: unreadOnes,
        all: false
      });

      if (answer.answer === "applied" && Number.isInteger(answer.unread)) {
        this._unread = answer.unread;
        this.requestComponentUpdate("read");
      }
    }

    this.followCount();
    return (0,_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__.applied)();
  } // A notification the page adds (a run that failed, sf-admin-activity): on
  // a list fed by the port the host already has it, so the list reads again.


  async add(item) {
    if (item && typeof item === "object" && item.item && typeof item.item === "object") item = item.item;
    if (this.port && !this.givenItems) return this.load();
    const entry = (0,_js_port_js__WEBPACK_IMPORTED_MODULE_3__.entryOf)(item);
    if (!entry) return (0,_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__.refused)("invalid");
    const list = [{ ...item
    }, ...this.items.filter(one => text(one?.key) !== entry.key)];
    this.items = list;
    return (0,_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__.applied)();
  } // The bell's number is the menu's: after a read the menu asks its host again.


  followCount() {
    if (!this.port || this.givenItems) return;

    for (const menu of document.querySelectorAll("sf-admin-menu")) menu.refresh?.();
  }

  async loadMore() {
    if (this._cursor === null || this._cursor === undefined) return (0,_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__.refused)("no-more");
    const cursor = this._cursor;
    this.sfEmit("load-more", {
      cursor
    });
    return this.load({
      more: true
    });
  } // ── the person ───────────────────────────────────────────────────────────


  onOpen(event, item) {
    const allowed = this.sfEmit("open", {
      key: item.key,
      href: item.href
    }, {
      cancelable: true
    });
    if (allowed === false) event.preventDefault();
    this.read([item.key]);
  }

  toggleFold(id) {
    if (this._expanded.has(id)) this._expanded.delete(id);else this._expanded.add(id);
    this._focusAfter = `fold:${id}`;
    this.requestComponentUpdate("fold");
  } // ── drawing ──────────────────────────────────────────────────────────────
  // The groups as shown: unread only when asked; by object when asked, else
  // the host's days with the repeats of one object folded after the first.


  shownGroups() {
    const unreadOnly = this.getProp("unreadOnly") === true;
    const fold = this.getProp("fold") !== false;

    let groups = this._groups.map(group => ({ ...group,
      items: unreadOnly ? group.items.filter(item => item.unread) : group.items
    })).filter(group => group.items.length);

    if (this.getProp("groupBy") === "object") {
      const byObject = new Map();

      for (const group of groups) {
        for (const item of group.items) {
          const key = item.object || "";
          if (!byObject.has(key)) byObject.set(key, {
            key: `object:${key}`,
            label: key || this.sfWord("other-object"),
            items: []
          });
          byObject.get(key).items.push(item);
        }
      }

      return [...byObject.values()].map(group => ({ ...group,
        rows: group.items.map(item => ({
          item,
          rest: []
        }))
      }));
    }

    groups = groups.map(group => {
      const rows = [];
      const first = new Map();

      for (const item of group.items) {
        const at = fold && item.object ? first.get(item.object) : undefined;

        if (at) {
          at.rest.push(item);
          continue;
        }

        const row = {
          item,
          rest: []
        };
        if (fold && item.object) first.set(item.object, row);
        rows.push(row);
      }

      return { ...group,
        rows
      };
    });
    return groups;
  } // The attribute items given or changed after the element connected (a
  // skeleton's late list arriving): the list takes it before it draws.


  beforeRender(changed) {
    super.beforeRender?.(changed);
    if (this._items !== null || !this.hasAttribute("items")) return;
    const given = this.getAttribute("items");
    if (given === this._itemsGiven && this._status === "ready") return;
    this._itemsGiven = given;
    this.takeItems();
  }

  template() {
    const look = this.getProp("look") === "page" ? "page" : "panel";
    return (0,_js_templates_default_js__WEBPACK_IMPORTED_MODULE_2__.renderAdminNotificationsTemplate)({
      component: this,
      look,
      status: this._status,
      reason: this._reason,
      unread: this._unread,
      groups: this._status === "ready" ? this.shownGroups() : [],
      expanded: this._expanded,
      headingLevel: this.getProp("headingLevel") || "3",
      historyHref: look === "panel" ? this.getProp("historyHref") || "" : "",
      settingsHref: this.getProp("settingsHref") || this._settingsHref || "",
      more: look === "page" && this._cursor !== null && this._cursor !== undefined,
      hasEmptySlot: this.hasSlotContent("empty"),
      emptySlot: this.getSlotContent("empty"),
      word: (key, options) => this.sfWord(key, options),
      onReadAll: () => this.readAll(),
      onRetry: () => this.load(),
      onMore: () => this.loadMore(),
      onOpen: (event, item) => this.onOpen(event, item),
      onFold: id => this.toggleFold(id)
    });
  }

  afterRender(changed) {
    super.afterRender?.(changed);
    const after = this._focusAfter;
    this._focusAfter = null;
    if (!after) return;
    if (after === "status") this.querySelector(".sf-admin-notifications__count")?.focus?.();else if (after.startsWith("fold:")) {
      const id = after.slice(5);
      [...this.querySelectorAll("[data-fold]")].find(node => node.dataset.fold === id)?.focus?.();
    }
  }

}

SfAdminNotifications.define("sf-admin-notifications");
__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ },

/***/ "d407ad841b1e"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   FIELDS_SINCE: () => (/* binding */ FIELDS_SINCE),
/* harmony export */   SUPPORTED_NAVIGATION_VERSIONS: () => (/* binding */ SUPPORTED_NAVIGATION_VERSIONS),
/* harmony export */   editionAtLeast: () => (/* binding */ editionAtLeast),
/* harmony export */   entryOf: () => (/* binding */ entryOf),
/* harmony export */   readsExtendedFields: () => (/* binding */ readsExtendedFields)
/* harmony export */ });
// sf-admin-notifications and the edition of simai.admin-navigation-port its
// host declares. Pure: no element, no DOM (the unit tests import it).
//
// 1.2.0 adds three optional fields to a notification: object (what it is
// about), level (error, warning, info, success) and resolved (true, or the
// words of how it ended). A host of an earlier edition says none of them --
// its item schema is closed -- so its notifications are drawn exactly as in
// 1.1.0. The setting items (a page without a port) may say all of them.

/** The editions the list takes (component.json x-port.supports). */
const SUPPORTED_NAVIGATION_VERSIONS = ["1.1.0", "1.2.0"];
const FIELDS_SINCE = "1.2.0";
const EDITION = /^(\d+)\.(\d+)\.(\d+)$/u;
const LEVELS = new Set(["error", "warning", "info", "success"]);

const text = value => value === null || value === undefined ? "" : String(value);
/** Whether an edition is at least another one, numerically (1.10.0 > 1.2.0). */


function editionAtLeast(version, wanted) {
  const a = EDITION.exec(String(version ?? ""));
  const b = EDITION.exec(String(wanted ?? ""));
  if (!a || !b) return false;

  for (let i = 1; i <= 3; i += 1) {
    if (Number(a[i]) !== Number(b[i])) return Number(a[i]) > Number(b[i]);
  }

  return true;
}
/** Whether a host port's notifications may carry object, level and resolved. */

function readsExtendedFields(port) {
  const version = typeof port?.version === "string" ? port.version : "";
  return version.startsWith("1.") && editionAtLeast(version, FIELDS_SINCE);
}
/**
 * One notification as the list draws it: the port's fields (key, title, body,
 * when, unread, icon, href) and, when `extended`, object, level and resolved.
 */

function entryOf(item, extended = true) {
  if (!item || typeof item !== "object" || item.key === undefined || item.key === null) return null;
  return {
    key: text(item.key),
    title: text(item.title ?? item.label),
    body: item.body ? text(item.body) : "",
    when: text(item.when),
    unread: item.unread === true,
    icon: item.icon ? text(item.icon) : "",
    href: item.href ? text(item.href) : "",
    object: extended && item.object ? text(item.object) : "",
    level: extended && LEVELS.has(item.level) ? item.level : "",
    // resolved: true (settled) or the words of how it was settled.
    resolved: extended && Boolean(item.resolved),
    resolvedText: extended && typeof item.resolved === "string" ? item.resolved : ""
  };
}

/***/ },

/***/ "1c89e1e66579"
(module, __webpack_exports__, __webpack_require__) {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   renderAdminNotificationsTemplate: () => (/* binding */ renderAdminNotificationsTemplate)
/* harmony export */ });
/* harmony import */ var lit__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("2a080a730149");
/* harmony import */ var lit_directives_repeat_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("efa66f8927d1");
/* harmony import */ var _default_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("06686206d701");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([lit__WEBPACK_IMPORTED_MODULE_0__, lit_directives_repeat_js__WEBPACK_IMPORTED_MODULE_1__]);
([lit__WEBPACK_IMPORTED_MODULE_0__, lit_directives_repeat_js__WEBPACK_IMPORTED_MODULE_1__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);
/* harmony import */ var lit__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lit__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var lit_directives_repeat_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(lit_directives_repeat_js__WEBPACK_IMPORTED_MODULE_1__);


 // The list of notifications (sf-admin-notifications): the head with the count
// and «Прочитать все», the groups (a day, or an object), the entries, the foot.
//
// An entry is three columns: the level's glyph, what happened (the title as a
// link to where it is about, «→ решено» when the host settled it, a line of
// object · when · how it was settled, and «Ещё N по …» under it when repeats of
// the same object are folded), and the unread dot. The level and «не
// прочитано» are said in words to a reader (the dot and the colour are not
// words). «Ещё N по …» is a quiet link row at the start of the entry's text,
// at the title's x (C421).

const LEVEL_ICON = {
  error: "error",
  warning: "warning",
  info: "info",
  success: "check_circle"
};

function renderItem(context, item, fold = null) {
  const {
    word
  } = context;
  const level = item.resolved ? "success" : item.level;
  const icon = level ? LEVEL_ICON[level] : item.icon || "notifications";
  const said = [item.level ? word(`level-${item.level}`) : "", item.unread ? word("unread") : ""].filter(Boolean).join(", ");
  const title = (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`${item.title}${item.resolved ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)` <span class="sf-admin-notifications__resolved">${word("resolved")}</span>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}`;
  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<li class="sf-admin-notifications__item" data-key=${item.key}
            data-unread=${item.unread ? "true" : lit__WEBPACK_IMPORTED_MODULE_0__.nothing} data-resolved=${item.resolved ? "true" : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}>
        <sf-icon class="sf-admin-notifications__glyph" data-level=${level || lit__WEBPACK_IMPORTED_MODULE_0__.nothing} icon=${icon} size="1/2" aria-hidden="true"></sf-icon>
        <div class="sf-admin-notifications__what">
            ${item.href ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<a class="sf-admin-notifications__title" href=${item.href} @click=${event => context.onOpen(event, item)}>${title}</a>` : (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<span class="sf-admin-notifications__title">${title}</span>`}
            ${item.body ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<span class="sf-admin-notifications__body">${item.body}</span>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
            <span class="sf-admin-notifications__meta">
                ${item.object ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<span>${item.object}</span>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
                ${item.when ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<span>${item.when}</span>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
                ${item.resolvedText ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<span>${item.resolvedText}</span>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
                ${said ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<span class="sr-only">${said}</span>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
            </span>
            ${fold}
        </div>
        <span class="sf-admin-notifications__dot" aria-hidden="true"></span>
    </li>`;
}

function renderRow(context, group, row) {
  if (!row.rest.length) return renderItem(context, row.item);
  const id = `${group.key}:${row.item.object}`;
  const open = context.expanded.has(id);
  const fold = (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<button type="button" class="sf-admin-notifications__fold" data-fold=${id} aria-expanded=${String(open)}
        @click=${() => context.onFold(id)}>${open ? context.word("fold") : context.word("more-by", {
    count: row.rest.length,
    vars: {
      count: row.rest.length,
      object: row.item.object
    }
  })}</button>`;
  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`${renderItem(context, row.item, fold)}${open ? row.rest.map(item => renderItem(context, item)) : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}`;
}

function renderGroups(context) {
  const level = context.headingLevel;
  return (0,lit_directives_repeat_js__WEBPACK_IMPORTED_MODULE_1__.repeat)(context.groups, group => group.key, group => (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`
        <div class="sf-admin-notifications__group">
            ${group.label ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class="sf-admin-notifications__day" role="heading" aria-level=${level}>${group.label}</div>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
            <ul class="sf-admin-notifications__list">
                ${(0,lit_directives_repeat_js__WEBPACK_IMPORTED_MODULE_1__.repeat)(group.rows, row => row.item.key, row => renderRow(context, group, row))}
            </ul>
        </div>`);
}

function renderFoot(context) {
  const {
    word
  } = context;
  const more = context.more ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<sf-button class="sf-admin-notifications__more" size="1/2" appearance="outline" text=${word("load-more")}
            @click=${context.onMore}></sf-button>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing;
  const links = [context.historyHref ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<a href=${context.historyHref}>${word("history")}</a>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing, context.settingsHref ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<a href=${context.settingsHref}>${word("settings")}</a>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing];
  if (!context.more && !context.historyHref && !context.settingsHref) return lit__WEBPACK_IMPORTED_MODULE_0__.nothing;
  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class="sf-admin-notifications__foot">${more}${links}</div>`;
}

function renderAdminNotificationsTemplate(context) {
  const {
    word,
    status,
    look
  } = context;

  if (status === "failed") {
    return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class="sf-admin-notifications" data-look=${look} data-status="failed">
            <sf-alert status="error" heading=${word("failed-heading")} supporting-text=${context.reason || word("failed-text")}></sf-alert>
            <div class="sf-admin-notifications__retry">
                <sf-button size="1/2" appearance="outline" text=${word("retry")} @click=${context.onRetry}></sf-button>
            </div>
        </div>`;
  }

  if (status !== "ready") {
    return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class="sf-admin-notifications" data-look=${look} data-status="loading" aria-busy="true">
            <p class="sf-admin-notifications__empty">${word("loading")}</p>
        </div>`;
  }

  const unread = context.unread;
  const empty = !context.groups.length;
  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class="sf-admin-notifications" data-look=${look} data-status="ready">
        <div class="sf-admin-notifications__head">
            <span class="sf-admin-notifications__count" role="status" tabindex="-1">${unread ? word("new-count", {
    count: unread,
    vars: {
      count: unread
    }
  }) : word("none-new")}</span>
            ${unread ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<sf-button class="sf-admin-notifications__read-all" size="1/2" appearance="ghost" text=${word("read-all")}
                    @click=${context.onReadAll}></sf-button>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
        </div>
        ${empty ? context.hasEmptySlot ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class="sf-admin-notifications__empty">${context.emptySlot}</div>` : (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<p class="sf-admin-notifications__empty">${word("empty-text")}</p>` : renderGroups(context)}
        ${renderFoot(context)}
    </div>`;
}
__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ },

/***/ "06686206d701"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ },

/***/ "5b7d7695b41b"
(module) {

module.exports = (globalThis.SF && globalThis.SF.runtimeModule ? globalThis.SF.runtimeModule("element-manifest", 1) : new Promise((resolve, reject) => globalThis.addEventListener("sf-runtime-ready", () => globalThis.SF.runtimeModule("element-manifest", 1).then(resolve, reject), { once: true })));

/***/ },

/***/ "efa66f8927d1"
(module) {

module.exports = (globalThis.SF && globalThis.SF.runtimeModule ? globalThis.SF.runtimeModule("lit/directives/repeat.js", 1) : new Promise((resolve, reject) => globalThis.addEventListener("sf-runtime-ready", () => globalThis.SF.runtimeModule("lit/directives/repeat.js", 1).then(resolve, reject), { once: true })));

/***/ },

/***/ "2a080a730149"
(module) {

module.exports = (globalThis.SF && globalThis.SF.runtimeModule ? globalThis.SF.runtimeModule("lit", 1) : new Promise((resolve, reject) => globalThis.addEventListener("sf-runtime-ready", () => globalThis.SF.runtimeModule("lit", 1).then(resolve, reject), { once: true })));

/***/ },

/***/ "deb1a4d61565"
(module) {

module.exports = (globalThis.SF && globalThis.SF.runtimeModule ? globalThis.SF.runtimeModule("smart-base", 1) : new Promise((resolve, reject) => globalThis.addEventListener("sf-runtime-ready", () => globalThis.SF.runtimeModule("smart-base", 1).then(resolve, reject), { once: true })));

/***/ },

/***/ "c056121fdc24"
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"id":"smart.admin-notifications","tag":"sf-admin-notifications","version":"1.0.0","kind":"leaf","settings":{"look":{"type":"enum","values":["panel","page"],"default":"panel"},"group-by":{"type":"enum","values":["day","object"],"default":"day"},"fold":{"type":"boolean","default":true},"unread-only":{"type":"boolean","default":false},"history-href":{"type":"string","default":""},"settings-href":{"type":"string","default":""},"heading-level":{"type":"enum","values":["2","3","4","5","6"],"default":"3"},"items":{"type":"list","default":[],"of":{"key":"string","title":"string","when":{"type":"string","optional":true},"unread":{"type":"boolean","optional":true},"href":{"type":"string","optional":true},"icon":{"type":"string","optional":true},"body":{"type":"string","optional":true},"object":{"type":"string","optional":true},"level":{"type":"string","optional":true},"resolved":{"type":"string","optional":true},"group":{"type":"string","optional":true},"group-label":{"type":"string","optional":true}}}},"values":{"unread":{"type":"number"}},"events":{"open":{"carries":{"key":"string","href":"string"},"cancelable":true},"read":{"carries":{"keys":"list"}},"read-all":{"carries":{},"own-verb":true},"load-more":{"carries":{"cursor":"string"},"own-verb":true},"failed":{"carries":{"reason":"string"},"own-verb":true}},"actions":{"refresh":{},"read-all":{},"read":{"with":{"keys":"list"}},"add":{"with":{"item":"object"}},"load-more":{}},"layer":{"kind":"surface","locks-page":false,"traps-focus":false},"port":{"id":"simai.admin-navigation-port","version":"1.2.0","contract":"src/core/contracts/ports/simai.admin-navigation-port/1.2.0/port.json"},"host-states":{},"css-variables":{"--sf-admin-notifications-unread-color":{"type":"color","state":"default"},"--sf-admin-notifications-resolved-color":{"type":"color","state":"default"},"--sf-admin-notifications-divider-color":{"type":"color","state":"default"},"--sf-admin-notifications-row-padding-block":{"type":"length","state":"default"},"--sf-admin-notifications-row-gap":{"type":"length","state":"default"},"--sf-admin-notifications-group-gap":{"type":"length","state":"default"}}}');

/***/ },

/***/ "ceb029f6ed51"
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"title":"Notifications","runtime":{"new-count":"New: {count}","none-new":"Nothing new","read-all":"Mark all read","more-by":"{count} more for {object}","fold":"Show less","resolved":"→ resolved","unread":"unread","level-error":"Error","level-warning":"Warning","level-info":"Information","level-success":"Done","history":"All history","settings":"Notification settings","load-more":"Show more","empty-text":"Messages that need your attention will appear here.","failed-heading":"The notifications did not load","failed-text":"The server did not answer.","retry":"Retry","loading":"Loading the notifications…","other-object":"Other"},"events":{"failed":{"label":"Did not load"},"read-all":{"label":"All read"},"load-more":{"label":"Load more"}}}');

/***/ },

/***/ "0d8bc8e03f30"
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"title":"Уведомления","runtime":{"new-count":"Новых: {count}","none-new":"Нового нет","read-all":"Прочитать все","more-by":"Ещё {count} по {object}","fold":"Свернуть","resolved":"→ решено","unread":"не прочитано","level-error":"Ошибка","level-warning":"Предупреждение","level-info":"Сведения","level-success":"Готово","history":"Вся история","settings":"Настройки уведомлений","load-more":"Показать ещё","empty-text":"Здесь появятся сообщения о том, что требует внимания.","failed-heading":"Уведомления не загрузились","failed-text":"Сервер не ответил.","retry":"Повторить","loading":"Загружаем уведомления…","other-object":"Прочее"},"events":{"failed":{"label":"Не загрузились"},"read-all":{"label":"Все прочитаны"},"load-more":{"label":"Ещё"}}}');

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
/******/ 	let __webpack_exports__ = __webpack_require__("1c3031e0d3c0");
/******/
/******/ })()
;