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
import SfBaseElement from "../../core/js/smart-base";
import {applied, elementFromManifest, refused} from "../../core/js/element-manifest";
import {renderAdminActivityTemplate} from "./js/templates/default.js";
import {offersActivity, runOf, runsOfAnswer} from "./js/port.js";
import manifest from "./component.json";
import en from "./lang/en.json";
import ru from "./lang/ru.json";

const ActivityElement = elementFromManifest(manifest, {
    base: SfBaseElement,
    lang: {en, ru},
    source: "ru",
});

const copy = (value) => JSON.parse(JSON.stringify(value ?? null));

// What has been told, shared by every indicator of the page (the crumbs row's
// and the phone top line's are two elements over the same runs): one toast and
// one notification per run's end, whichever element saw it first. On a global,
// not in this module: every bundle carries its own copy of a module.
const TOLD = Symbol.for("sf-admin-activity.told");
function toldOnce(key) {
    const told = (globalThis[TOLD] ??= new Map());
    const now = Date.now();
    for (const [name, at] of told) if (now - at > 60000) told.delete(name);
    if (told.has(key)) return false;
    told.set(key, now);
    return true;
}

// The failures the person has seen (the list opened), for every indicator of
// the page: the mark goes in both when the list was opened in one.
const SEEN = Symbol.for("sf-admin-activity.seen");
const seen = () => (globalThis[SEEN] ??= new Set());

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
    }

    // ── the runs ─────────────────────────────────────────────────────────────

    get runs() {
        const value = this._runs ?? this.getProp("runs");
        return Array.isArray(value) ? value : [];
    }

    // The host sets the whole list again on every change; the element
    // compares it with the last one and tells what ended.
    set runs(value) {
        this._runs = Array.isArray(value) ? copy(value) : null;
        this.takeRuns();
        this.requestComponentUpdate("runs");
    }

    get shownRuns() {
        return this.runs.map(runOf).filter(Boolean).filter((run) => run.state === "running" || run.state === "failed");
    }

    get counts() {
        const runs = this.shownRuns;
        const failed = runs.filter((run) => run.state === "failed");
        return {
            running: runs.filter((run) => run.state === "running").length,
            failed: failed.length,
            unseen: failed.filter((run) => !seen().has(run.id)).length,
        };
    }

    takeRuns() {
        const next = new Map(this.runs.map(runOf).filter(Boolean).map((run) => [run.id, run]));
        const first = !this._taken;
        this._taken = true;
        for (const [id, run] of next) {
            const before = this._known.get(id);
            // A run that fails again after a retry is news again.
            if (run.state === "failed" && before && before.state !== "failed") seen().delete(id);
            if (first) continue;
            // A run that left running ended; a run first seen already ended
            // (it started and ended between two lists of the host) ended too.
            if ((!before || before.state === "running") && (run.state === "done" || run.state === "failed")) this.ended(run);
        }
        // A running run the host dropped ended: it is done.
        if (!first) {
            for (const [id, before] of this._known) {
                if (!next.has(id) && before.state === "running") this.ended({...before, state: "done"});
            }
        }
        this._known = next;
    }

    // The end of a run (C339, C332): a toast, a notification for a failure,
    // the event finished. Told once for the page.
    ended(run) {
        if (!toldOnce(`${run.id}:${run.state}`)) {
            return;
        }
        const allowed = this.sfEmit("finished", {id: run.id, state: run.state}, {cancelable: true});
        if (allowed === false || !this.getProp("notify")) return;
        const notify = globalThis.SF?.notify;
        if (run.state === "done") {
            notify?.({status: "success", title: this.sfWord("done-title", {vars: {label: run.label}}), text: run.text || this.sfWord("done-text"), key: `sf-admin-activity:${run.id}:done`});
        } else if (run.state === "failed") {
            notify?.({status: "error", title: this.sfWord("failed-title", {vars: {label: run.label}}), text: run.text || this.sfWord("failed-text"), key: `sf-admin-activity:${run.id}:failed`});
            this.notifyList(run);
        }
    }

    // A failure goes to the admin's notifications too: a list given items
    // takes it at the top; a list over the port reads again (the host has it).
    notifyList(run) {
        const item = {
            key: `activity:${run.id}:failed`,
            title: this.sfWord("failed-title", {vars: {label: run.label}}),
            body: run.text || null,
            when: this.sfWord("now"),
            unread: true,
            level: "error",
            object: run.object || "",
            href: run.href || this.getProp("historyHref") || "",
            group: "today",
            "group-label": this.sfWord("today"),
        };
        for (const list of document.querySelectorAll("sf-admin-notifications")) list.add?.({item});
    }

    get port() {
        return this.sfPort ?? null;
    }

    offers() {
        return offersActivity(this.port);
    }

    onPortConnected() {
        if (this.offers()) this.refresh();
    }

    async raise(intent, payload) {
        try {
            const answer = await this.port?.raise?.(intent, copy(payload), {});
            return answer && typeof answer === "object" ? answer : {answer: "unavailable"};
        } catch (error) {
            return {answer: "unavailable", reason: String(error?.message ?? error)};
        }
    }

    // ── actions ──────────────────────────────────────────────────────────────

    async refresh() {
        if (!this.port || !this.offers()) return refused("no-port");
        const answer = await this.raise("activity.load", {});
        if (answer.answer !== "applied") return refused(answer.answer === "refused" ? "refused" : "unavailable", answer.reason);
        this.runs = runsOfAnswer(answer) ?? [];
        return applied();
    }

    show() {
        const popover = this.querySelector("sf-popover");
        if (!popover) return refused("nothing-to-show");
        popover.show?.();
        return applied();
    }

    close() {
        this.querySelector("sf-popover")?.close?.();
        return applied();
    }

    // ── the person ───────────────────────────────────────────────────────────

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
    }

    // A person's request about one run: the host answers with the runs as
    // they are after it (activity_page); an answer without runs reads again.
    async ask(intent, run) {
        const answer = await this.raise(intent, {id: run.id});
        const runs = answer.answer === "applied" ? runsOfAnswer(answer) : null;
        if (runs) this.runs = runs;
        else await this.refresh();
        return answer;
    }

    onRetry(run) {
        this.sfEmit("retry", {id: run.id});
        if (this.offers()) this.ask("activity.retry", run);
    }

    onCancel(run) {
        this.sfEmit("cancel", {id: run.id});
        if (this.offers()) this.ask("activity.cancel", run);
    }

    // «Развернуть» of a row: the run's own page.
    onExpand(run) {
        this.close();
        if (run.href) globalThis.location?.assign?.(run.href);
    }

    // ── drawing ──────────────────────────────────────────────────────────────

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
        const words = [
            counts.running ? this.sfWord("running-words", {count: counts.running, vars: {count: counts.running}}) : "",
            counts.failed ? this.sfWord("failed-words", {count: counts.failed, vars: {count: counts.failed}}) : "",
        ].filter(Boolean).join(", ");
        return renderAdminActivityTemplate({
            component: this,
            counts,
            runs: this.shownRuns,
            size: this.getProp("size") === "1" ? "1" : "1/2",
            placement: this.getProp("placement") || "bottom-end",
            historyHref: this.getProp("historyHref") || "",
            name: this.sfWord("name", {vars: {what: words || this.sfWord("nothing")}}),
            said: words,
            word: (key, options) => this.sfWord(key, options),
            onOpened: () => this.onOpened(),
            onClosed: () => this.onClosed(),
            onRetry: (run) => this.onRetry(run),
            onCancel: (run) => this.onCancel(run),
            onExpand: (run) => this.onExpand(run),
        });
    }
}

SfAdminActivity.define("sf-admin-activity");
