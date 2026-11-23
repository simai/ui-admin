/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "68b3cfaf0fc1"
(module, __webpack_exports__, __webpack_require__) {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _core_js_smart_base__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("deb1a4d61565");
/* harmony import */ var _core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("5b7d7695b41b");
/* harmony import */ var _js_templates_default_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("9c8d58d45126");
/* harmony import */ var _js_port_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("945d3eeba880");
/* harmony import */ var _component_json__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__("d5fc586601db");
/* harmony import */ var _lang_en_json__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__("a0a401b0c64e");
/* harmony import */ var _lang_ru_json__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__("d909577875d7");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_core_js_smart_base__WEBPACK_IMPORTED_MODULE_0__, _core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__, _js_templates_default_js__WEBPACK_IMPORTED_MODULE_2__]);
([_core_js_smart_base__WEBPACK_IMPORTED_MODULE_0__, _core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__, _js_templates_default_js__WEBPACK_IMPORTED_MODULE_2__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);
/* harmony import */ var _core_js_smart_base__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_core_js_smart_base__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__);
// sf-admin-activity: what runs in the background of an admin, at the end of
// the crumbs row and, on a phone, in the shell's top line (owner decisions
// C421 with C332, C339, C342; study ui-control
// control/research/2026-11-22-admin-shell-study, sample
// prototypes/admin-shell-study/shell.mjs setupActivity). It looks like a
// recipe -- a quiet button with sf-badge, a list in sf-popover of
// sf-progress-run rows -- and holds the rules a recipe would not:
//
// - «Идёт N» while something runs; a failure meanwhile is a red mark beside it
//   until the person opened the list; when nothing runs, «Не удалось N» in
//   words; nothing to show, no element (C421);
// - a run that ends: SF.notify success, gone by itself; a run that fails:
//   SF.notify error, which stays until closed (C339), and a notification in
//   the admin's list (C332);
// - a reader hears one sentence per change of the counts, not each percent.
//
// The runs are the host's: the setting runs (a property the host sets anew),
// or the port's activity.load when the host declares simai.admin-navigation-port
// 1.2.0 and offers the capability activity (js/port.js); a 1.1.0 host is asked
// nothing.







const ActivityElement = (0,_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__.elementFromManifest)(_component_json__WEBPACK_IMPORTED_MODULE_4__, {
  base: (_core_js_smart_base__WEBPACK_IMPORTED_MODULE_0___default()),
  lang: {
    en: _lang_en_json__WEBPACK_IMPORTED_MODULE_5__,
    ru: _lang_ru_json__WEBPACK_IMPORTED_MODULE_6__
  },
  source: "ru"
});

const copy = value => JSON.parse(JSON.stringify(value ?? null)); // What has been told, shared by every indicator of the page (the crumbs row's
// and the phone top line's are two elements over the same runs): one toast and
// one notification per run's end, whichever element saw it first. On a global,
// not in this module: every bundle carries its own copy of a module.


const TOLD = Symbol.for("sf-admin-activity.told");

function toldOnce(key) {
  const told = globalThis[TOLD] ??= new Map();
  const now = Date.now();

  for (const [name, at] of told) if (now - at > 60000) told.delete(name);

  if (told.has(key)) return false;
  told.set(key, now);
  return true;
} // The failures the person has seen (the list opened), for every indicator of
// the page: the mark goes in both when the list was opened in one.


const SEEN = Symbol.for("sf-admin-activity.seen");

const seen = () => globalThis[SEEN] ??= new Set();

class SfAdminActivity extends ActivityElement {
  constructor() {
    super();
    this._runs = null;
    this._known = new Map();
    this._open = false;

    for (const name of ["runs"]) {
      if (!Object.prototype.hasOwnProperty.call(this, name)) continue;
      const early = this[name];
      delete this[name];
      this[name] = early;
    }
  } // ── the runs ─────────────────────────────────────────────────────────────


  get runs() {
    const value = this._runs ?? this.getProp("runs");
    return Array.isArray(value) ? value : [];
  } // The host sets the whole list again on every change; the element
  // compares it with the last one and tells what ended.


  set runs(value) {
    this._runs = Array.isArray(value) ? copy(value) : null;
    this.takeRuns();
    this.requestComponentUpdate("runs");
  }

  get shownRuns() {
    return this.runs.map(_js_port_js__WEBPACK_IMPORTED_MODULE_3__.runOf).filter(Boolean).filter(run => run.state === "running" || run.state === "failed");
  }

  get counts() {
    const runs = this.shownRuns;
    const failed = runs.filter(run => run.state === "failed");
    return {
      running: runs.filter(run => run.state === "running").length,
      failed: failed.length,
      unseen: failed.filter(run => !seen().has(run.id)).length
    };
  }

  takeRuns() {
    const next = new Map(this.runs.map(_js_port_js__WEBPACK_IMPORTED_MODULE_3__.runOf).filter(Boolean).map(run => [run.id, run]));
    const first = !this._taken;
    this._taken = true;

    for (const [id, run] of next) {
      const before = this._known.get(id); // A run that fails again after a retry is news again.


      if (run.state === "failed" && before && before.state !== "failed") seen().delete(id);
      if (first) continue; // A run that left running ended; a run first seen already ended
      // (it started and ended between two lists of the host) ended too.

      if ((!before || before.state === "running") && (run.state === "done" || run.state === "failed")) this.ended(run);
    } // A running run the host dropped ended: it is done.


    if (!first) {
      for (const [id, before] of this._known) {
        if (!next.has(id) && before.state === "running") this.ended({ ...before,
          state: "done"
        });
      }
    }

    this._known = next;
  } // The end of a run (C339, C332): a toast, a notification for a failure,
  // the event finished. Told once for the page.


  ended(run) {
    if (!toldOnce(`${run.id}:${run.state}`)) {
      return;
    }

    const allowed = this.sfEmit("finished", {
      id: run.id,
      state: run.state
    }, {
      cancelable: true
    });
    if (allowed === false || !this.getProp("notify")) return;
    const notify = globalThis.SF?.notify;

    if (run.state === "done") {
      notify?.({
        status: "success",
        title: this.sfWord("done-title", {
          vars: {
            label: run.label
          }
        }),
        text: run.text || this.sfWord("done-text"),
        key: `sf-admin-activity:${run.id}:done`
      });
    } else if (run.state === "failed") {
      notify?.({
        status: "error",
        title: this.sfWord("failed-title", {
          vars: {
            label: run.label
          }
        }),
        text: run.text || this.sfWord("failed-text"),
        key: `sf-admin-activity:${run.id}:failed`
      });
      this.notifyList(run);
    }
  } // A failure goes to the admin's notifications too: a list given items
  // takes it at the top; a list over the port reads again (the host has it).


  notifyList(run) {
    const item = {
      key: `activity:${run.id}:failed`,
      title: this.sfWord("failed-title", {
        vars: {
          label: run.label
        }
      }),
      body: run.text || null,
      when: this.sfWord("now"),
      unread: true,
      level: "error",
      object: run.object || "",
      href: run.href || this.getProp("historyHref") || "",
      group: "today",
      "group-label": this.sfWord("today")
    };

    for (const list of document.querySelectorAll("sf-admin-notifications")) list.add?.({
      item
    });
  }

  get port() {
    return this.sfPort ?? null;
  }

  offers() {
    return (0,_js_port_js__WEBPACK_IMPORTED_MODULE_3__.offersActivity)(this.port);
  }

  onPortConnected() {
    if (this.offers()) this.refresh();
  }

  async raise(intent, payload) {
    try {
      const answer = await this.port?.raise?.(intent, copy(payload), {});
      return answer && typeof answer === "object" ? answer : {
        answer: "unavailable"
      };
    } catch (error) {
      return {
        answer: "unavailable",
        reason: String(error?.message ?? error)
      };
    }
  } // ── actions ──────────────────────────────────────────────────────────────


  async refresh() {
    if (!this.port || !this.offers()) return (0,_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__.refused)("no-port");
    const answer = await this.raise("activity.load", {});
    if (answer.answer !== "applied") return (0,_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__.refused)(answer.answer === "refused" ? "refused" : "unavailable", answer.reason);
    this.runs = (0,_js_port_js__WEBPACK_IMPORTED_MODULE_3__.runsOfAnswer)(answer) ?? [];
    return (0,_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__.applied)();
  }

  show() {
    const popover = this.querySelector("sf-popover");
    if (!popover) return (0,_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__.refused)("nothing-to-show");
    popover.show?.();
    return (0,_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__.applied)();
  }

  close() {
    this.querySelector("sf-popover")?.close?.();
    return (0,_core_js_element_manifest__WEBPACK_IMPORTED_MODULE_1__.applied)();
  } // ── the person ───────────────────────────────────────────────────────────
  // Opening the list is having seen the failures: the mark goes (C332, C421).


  onOpened() {
    this._open = true;

    for (const run of this.shownRuns) if (run.state === "failed") seen().add(run.id);

    this.sfEmit("open", {});

    for (const other of document.querySelectorAll("sf-admin-activity")) other.requestComponentUpdate?.("seen");
  }

  onClosed() {
    this._open = false;
    this.sfEmit("close", {});
    this.requestComponentUpdate("closed");
  } // A person's request about one run: the host answers with the runs as
  // they are after it (activity_page); an answer without runs reads again.


  async ask(intent, run) {
    const answer = await this.raise(intent, {
      id: run.id
    });
    const runs = answer.answer === "applied" ? (0,_js_port_js__WEBPACK_IMPORTED_MODULE_3__.runsOfAnswer)(answer) : null;
    if (runs) this.runs = runs;else await this.refresh();
    return answer;
  }

  onRetry(run) {
    this.sfEmit("retry", {
      id: run.id
    });
    if (this.offers()) this.ask("activity.retry", run);
  }

  onCancel(run) {
    this.sfEmit("cancel", {
      id: run.id
    });
    if (this.offers()) this.ask("activity.cancel", run);
  } // «Развернуть» of a row: the run's own page.


  onExpand(run) {
    this.close();
    if (run.href) globalThis.location?.assign?.(run.href);
  } // ── drawing ──────────────────────────────────────────────────────────────
  // The first list given -- the attribute, the property or the port's first
  // answer -- tells nothing (the state as the page found it). An element
  // connected with no list has not been given one: a port's first answer is
  // still the first list.


  get givenRuns() {
    return this._runs !== null || this.hasAttribute("runs");
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.isConnected && !this._taken && this.givenRuns) this.takeRuns();
  }

  template() {
    const counts = this.counts;
    const words = [counts.running ? this.sfWord("running-words", {
      count: counts.running,
      vars: {
        count: counts.running
      }
    }) : "", counts.failed ? this.sfWord("failed-words", {
      count: counts.failed,
      vars: {
        count: counts.failed
      }
    }) : ""].filter(Boolean).join(", ");
    return (0,_js_templates_default_js__WEBPACK_IMPORTED_MODULE_2__.renderAdminActivityTemplate)({
      component: this,
      counts,
      runs: this.shownRuns,
      size: this.getProp("size") === "1" ? "1" : "1/2",
      placement: this.getProp("placement") || "bottom-end",
      historyHref: this.getProp("historyHref") || "",
      name: this.sfWord("name", {
        vars: {
          what: words || this.sfWord("nothing")
        }
      }),
      said: words,
      word: (key, options) => this.sfWord(key, options),
      onOpened: () => this.onOpened(),
      onClosed: () => this.onClosed(),
      onRetry: run => this.onRetry(run),
      onCancel: run => this.onCancel(run),
      onExpand: run => this.onExpand(run)
    });
  }

}

SfAdminActivity.define("sf-admin-activity");
__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ },

/***/ "945d3eeba880"
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ACTIVITY_INTENTS: () => (/* binding */ ACTIVITY_INTENTS),
/* harmony export */   ACTIVITY_SINCE: () => (/* binding */ ACTIVITY_SINCE),
/* harmony export */   SUPPORTED_NAVIGATION_VERSIONS: () => (/* binding */ SUPPORTED_NAVIGATION_VERSIONS),
/* harmony export */   editionAtLeast: () => (/* binding */ editionAtLeast),
/* harmony export */   offersActivity: () => (/* binding */ offersActivity),
/* harmony export */   runOf: () => (/* binding */ runOf),
/* harmony export */   runsOfAnswer: () => (/* binding */ runsOfAnswer)
/* harmony export */ });
// sf-admin-activity and the edition of simai.admin-navigation-port its host
// declares. Pure: no element, no DOM (the unit tests import it).
//
// 1.2.0 adds the optional capability activity: activity.load answers the runs
// (activity_page), activity.retry {id} and activity.cancel {id} are a person's
// requests about one run. A host of an earlier edition has no activity, so the
// element asks it nothing and reads the setting runs the page gives it.

/** The editions the indicator takes (component.json x-port.supports). */
const SUPPORTED_NAVIGATION_VERSIONS = ["1.1.0", "1.2.0"];
const ACTIVITY_SINCE = "1.2.0";
const ACTIVITY_INTENTS = ["activity.load", "activity.retry", "activity.cancel"];
const EDITION = /^(\d+)\.(\d+)\.(\d+)$/u;
const STATES = new Set(["running", "failed", "done", "cancelled"]);

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
/** Whether a host port offers activity: edition 1.2.0 or later (major 1) and the capability listed. */

function offersActivity(port) {
  const version = typeof port?.version === "string" ? port.version : "";
  if (!version.startsWith("1.") || !editionAtLeast(version, ACTIVITY_SINCE)) return false;
  return Array.isArray(port.capabilities) && port.capabilities.includes("activity");
}
/**
 * One run as the indicator draws it, from the setting runs or the port's
 * activity_page.runs: {id, label, state, value, total, unit, text, href,
 * object, cancelable, retryable}. retryable is offered unless the host says
 * false (port 1.2.0, or the setting).
 */

function runOf(item) {
  if (!item || typeof item !== "object" || item.id === undefined || item.id === null) return null;
  const state = STATES.has(item.state) ? item.state : "running";

  const number = value => Number.isFinite(Number(value)) && value !== null && value !== "" ? Number(value) : undefined;

  return {
    id: text(item.id),
    label: text(item.label),
    state,
    value: number(item.value),
    total: number(item.total),
    unit: item.unit ? text(item.unit) : "",
    text: item.text ? text(item.text) : "",
    href: item.href ? text(item.href) : "",
    object: item.object ? text(item.object) : "",
    cancelable: item.cancelable === true,
    retryable: item.retryable !== false
  };
}
/** The runs of an activity.load / retry / cancel answer, or null when it carries none. */

function runsOfAnswer(answer) {
  if (!answer || typeof answer !== "object" || !Array.isArray(answer.runs)) return null;
  return answer.runs;
}

/***/ },

/***/ "9c8d58d45126"
(module, __webpack_exports__, __webpack_require__) {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   renderAdminActivityTemplate: () => (/* binding */ renderAdminActivityTemplate)
/* harmony export */ });
/* harmony import */ var lit__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("2a080a730149");
/* harmony import */ var lit_directives_repeat_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("efa66f8927d1");
/* harmony import */ var _default_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("a99bde17e22a");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([lit__WEBPACK_IMPORTED_MODULE_0__, lit_directives_repeat_js__WEBPACK_IMPORTED_MODULE_1__]);
([lit__WEBPACK_IMPORTED_MODULE_0__, lit_directives_repeat_js__WEBPACK_IMPORTED_MODULE_1__] = __webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__);
/* harmony import */ var lit__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lit__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var lit_directives_repeat_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(lit_directives_repeat_js__WEBPACK_IMPORTED_MODULE_1__);


 // The background-activity indicator (sf-admin-activity). Nothing to show
// draws nothing. Otherwise one sf-popover: the trigger a quiet button with
// sf-badge («Идёт N», the failure mark beside it until the list was opened,
// «Не удалось N» in words when nothing runs), the surface the runs as
// sf-progress-run rows in the notice look and «Все действия».
//
// The badges are pictures of the counts; the button's name says them in
// words, and a polite status beside it says them again only when they change.

function renderBadges(context) {
  const {
    counts,
    word,
    size
  } = context;
  const running = counts.running ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<sf-badge activity="running" appearance="tonal" size=${size} aria-hidden="true"
            text=${word("running", {
    count: counts.running,
    vars: {
      count: counts.running
    }
  })}></sf-badge>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing;
  let failed = lit__WEBPACK_IMPORTED_MODULE_0__.nothing;

  if (counts.failed && !counts.running) {
    failed = (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<sf-badge activity="failed" appearance="tonal" size=${size} aria-hidden="true"
            text=${word("failed", {
      count: counts.failed,
      vars: {
        count: counts.failed
      }
    })}></sf-badge>`;
  } else if (counts.unseen) {
    failed = (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<sf-badge class="sf-admin-activity__mark" activity="failed" appearance="tonal" size=${size} icon-only aria-hidden="true"
            text=${word("failed", {
      count: counts.failed,
      vars: {
        count: counts.failed
      }
    })}></sf-badge>`;
  }

  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`${running}${failed}`;
} // A failed row: the notice look, which draws «Повторить» before «Развернуть»
// on a retryable failed run (sf-progress-run 1.6.0, AS-4) and sends retry.


function renderRun(context, run) {
  if (run.state === "failed") {
    return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class="sf-admin-activity__run" data-run=${run.id} data-state="failed">
            <sf-progress-run look="notice" size="1/2" label=${run.label} run-state="failed" result-text=${run.text}
                ?retryable=${run.retryable}
                @sf-progress-run-retry=${() => context.onRetry(run)}
                @sf-progress-run-expand=${() => context.onExpand(run)}></sf-progress-run>
        </div>`;
  }

  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class="sf-admin-activity__run" data-run=${run.id} data-state="running">
        <sf-progress-run look="notice" size="1/2" label=${run.label}
            value=${run.value ?? lit__WEBPACK_IMPORTED_MODULE_0__.nothing} total=${run.total ?? lit__WEBPACK_IMPORTED_MODULE_0__.nothing} unit=${run.unit || lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
            ?cancelable=${run.cancelable}
            @sf-progress-run-cancel=${() => context.onCancel(run)}
            @sf-progress-run-expand=${() => context.onExpand(run)}></sf-progress-run>
    </div>`;
}

function renderAdminActivityTemplate(context) {
  const {
    counts,
    word
  } = context;
  if (!counts.running && !counts.failed) return lit__WEBPACK_IMPORTED_MODULE_0__.nothing;
  return (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<span class="sf-admin-activity" data-size=${context.size}>
        <sf-popover class="sf-admin-activity__popover" placement=${context.placement} label=${word("list-label")}
            @sf-popover-opened=${context.onOpened} @sf-popover-closed=${context.onClosed}>
            <button type="button" slot="trigger" class="sf-admin-activity__trigger" data-size=${context.size}
                aria-label=${context.name}>${renderBadges(context)}</button>
            <div slot="content" class="sf-admin-activity__surface">
                <div class="sf-admin-activity__list">
                    ${(0,lit_directives_repeat_js__WEBPACK_IMPORTED_MODULE_1__.repeat)(context.runs, run => run.id, run => renderRun(context, run))}
                </div>
                ${context.historyHref ? (0,lit__WEBPACK_IMPORTED_MODULE_0__.html)`<div class="sf-admin-activity__foot"><a href=${context.historyHref}>${word("history")}</a></div>` : lit__WEBPACK_IMPORTED_MODULE_0__.nothing}
            </div>
        </sf-popover>
        <span class="sr-only" role="status">${context.said}</span>
    </span>`;
}
__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ },

/***/ "a99bde17e22a"
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

/***/ "d5fc586601db"
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"id":"smart.admin-activity","tag":"sf-admin-activity","version":"1.0.0","kind":"leaf","settings":{"runs":{"type":"list","default":[],"of":{"id":"string","label":"string","state":{"type":"string","optional":true},"value":{"type":"number","optional":true},"total":{"type":"number","optional":true},"unit":{"type":"string","optional":true},"text":{"type":"string","optional":true},"href":{"type":"string","optional":true},"object":{"type":"string","optional":true},"cancelable":{"type":"boolean","optional":true},"retryable":{"type":"boolean","optional":true}}},"history-href":{"type":"string","default":""},"size":{"type":"enum","values":["1/2","1"],"default":"1/2"},"placement":{"type":"enum","values":["bottom-end","bottom-start","bottom"],"default":"bottom-end"},"notify":{"type":"boolean","default":true}},"values":{},"events":{"open":{"carries":{}},"close":{"carries":{}},"retry":{"carries":{"id":"string"},"own-verb":true},"cancel":{"carries":{"id":"string"},"own-verb":true},"finished":{"carries":{"id":"string","state":"string"},"cancelable":true,"own-verb":true}},"actions":{"refresh":{},"show":{},"close":{}},"port":{"id":"simai.admin-navigation-port","version":"1.2.0","contract":"src/core/contracts/ports/simai.admin-navigation-port/1.2.0/port.json"},"presentation":{"skeleton":{"late":[]}},"host-states":{},"css-variables":{"--sf-admin-activity-gap":{"type":"length","state":"default"},"--sf-admin-activity-list-width":{"type":"length","state":"default"},"--sf-admin-activity-list-max-height":{"type":"length","state":"default"},"--sf-admin-activity-failed-color":{"type":"color","state":"default"},"--sf-admin-activity-trigger-padding-inline":{"type":"length","state":"default"}}}');

/***/ },

/***/ "a0a401b0c64e"
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"title":"Background activity","runtime":{"running":"{count} running","failed":"{count} failed","running-words":"{count} running","failed-words":"{count} failed","name":"Background activity: {what}","nothing":"none","list-label":"Background activity","history":"All activity","done-title":"{label}: done","done-text":"The action finished.","failed-title":"{label}: failed","failed-text":"Details are in Notifications.","now":"now","today":"Today"},"events":{"retry":{"label":"Retry"},"cancel":{"label":"Cancel"},"finished":{"label":"Finished"}}}');

/***/ },

/***/ "d909577875d7"
(module) {

module.exports = /*#__PURE__*/JSON.parse('{"title":"Действия в фоне","runtime":{"running":"Идёт {count}","failed":"Не удалось {count}","running-words":"идёт {count}","failed-words":"не удалось {count}","name":"Действия в фоне: {what}","nothing":"нет","list-label":"Действия в фоне","history":"Все действия","done-title":"{label}: готово","done-text":"Действие закончилось.","failed-title":"{label}: не удалось","failed-text":"Подробности — в «Уведомлениях».","now":"сейчас","today":"Сегодня"},"events":{"retry":{"label":"Повторить"},"cancel":{"label":"Отменить"},"finished":{"label":"Закончилось"}}}');

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
/******/ 	let __webpack_exports__ = __webpack_require__("68b3cfaf0fc1");
/******/
/******/ })()
;