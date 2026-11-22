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
import SfBaseElement from "../../core/js/smart-base";
import {applied, elementFromManifest, refused} from "../../core/js/element-manifest";
import {renderAdminNotificationsTemplate} from "./js/templates/default.js";
import manifest from "./component.json";
import en from "./lang/en.json";
import ru from "./lang/ru.json";

const NotificationsElement = elementFromManifest(manifest, {
    base: SfBaseElement,
    lang: {en, ru},
    source: "ru",
});

const LEVELS = new Set(["error", "warning", "info", "success"]);
const copy = (value) => JSON.parse(JSON.stringify(value ?? null));
const text = (value) => (value === null || value === undefined ? "" : String(value));

// One notification as the list draws it. The port's fields (key, title, body,
// when, unread, icon, href) and three the list reads when a host sends them:
// object (what it is about: a server, a site), level and resolved («снова
// отвечает с 09:11») -- see the port note in docs.md.
function entryOf(item) {
    if (!item || typeof item !== "object" || item.key === undefined || item.key === null) return null;
    return {
        key: text(item.key),
        title: text(item.title ?? item.label),
        body: item.body ? text(item.body) : "",
        when: text(item.when),
        unread: item.unread === true,
        icon: item.icon ? text(item.icon) : "",
        href: item.href ? text(item.href) : "",
        object: item.object ? text(item.object) : "",
        level: LEVELS.has(item.level) ? item.level : "",
        resolved: item.resolved ? text(item.resolved) : "",
    };
}

// The port's groups ({key, label, items}) or the setting's flat list (each
// item with group and group-label, in order) as one shape.
function groupsOf(value, flat = false) {
    const groups = [];
    if (flat) {
        const byKey = new Map();
        for (const item of Array.isArray(value) ? value : []) {
            const entry = entryOf(item);
            if (!entry) continue;
            const key = text(item.group ?? "all");
            if (!byKey.has(key)) {
                const group = {key, label: text(item["group-label"] ?? item.groupLabel ?? ""), items: []};
                byKey.set(key, group);
                groups.push(group);
            }
            byKey.get(key).items.push(entry);
        }
        return groups;
    }
    for (const group of Array.isArray(value) ? value : []) {
        if (!group || typeof group !== "object") continue;
        const items = (Array.isArray(group.items) ? group.items : []).map(entryOf).filter(Boolean);
        groups.push({key: text(group.key), label: text(group.label), items});
    }
    return groups;
}

// A later page of the history joins the groups it continues.
function mergeGroups(before, more) {
    const merged = before.map((group) => ({...group, items: [...group.items]}));
    for (const group of more) {
        const same = merged.find((one) => one.key === group.key);
        if (same) {
            const known = new Set(same.items.map((item) => item.key));
            same.items.push(...group.items.filter((item) => !known.has(item.key)));
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
    }

    // ── data ───────────────────────────────────────────────────────────────

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
        this._unread = this._groups.reduce((sum, group) => sum + group.items.filter((item) => item.unread).length, 0);
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
    }

    // The port: handed by the page (connectPort), answered to a request, or
    // the admin menu's own -- the list and the bell read one port.
    askForPort() {
        this.dispatchEvent(new CustomEvent("sf-host-port-request", {
            bubbles: true,
            composed: true,
            detail: {component: this, context: {owner: "admin-notifications", record: null, group: null}},
        }));
        if (this.port || this.adoptMenuPort()) return;
        const signal = this.sfScope;
        // The menu asks its host for navigation when it has its port.
        document.addEventListener("sf-admin-menu-refresh", () => {
            if (!this.port && !this.givenItems) this.adoptMenuPort();
        }, {signal});
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
    }

    offers() {
        const capabilities = this.port?.capabilities;
        return !Array.isArray(capabilities) || capabilities.includes("notifications");
    }

    async raise(intent, payload) {
        const port = this.port;
        if (!port) return {answer: "unavailable", reason: "no-port"};
        try {
            const answer = await port.raise(intent, copy(payload), {});
            return answer && typeof answer === "object" ? answer : {answer: "unavailable"};
        } catch (error) {
            return {answer: "unavailable", reason: String(error?.message ?? error)};
        }
    }

    // One page of notifications; with more, the next page after the shown ones.
    async load({more = false} = {}) {
        if (this.givenItems) {
            this.takeItems();
            this.requestComponentUpdate("items");
            return applied();
        }
        if (!this.port) return refused("no-port");
        if (!this.offers()) {
            this.fail("no-notifications");
            return refused("no-notifications");
        }
        const cursor = more ? this._cursor : null;
        if (!more) {
            this._status = this._status === "ready" ? "ready" : "loading";
            this.requestComponentUpdate("loading");
        }
        const answer = await this.raise("notifications.load", cursor === null ? {} : {cursor});
        if (answer.answer !== "applied") {
            this.fail(answer.reason || answer.message || "");
            return refused(answer.answer === "refused" ? "refused" : "unavailable", answer.reason);
        }
        const groups = groupsOf(answer.groups);
        this._groups = more ? mergeGroups(this._groups, groups) : groups;
        this._unread = Number.isInteger(answer.unread) ? answer.unread : this.countUnread();
        this._cursor = answer.next_cursor ?? null;
        this._settingsHref = typeof answer.settings_href === "string" ? answer.settings_href : "";
        this._status = "ready";
        this._reason = "";
        this.requestComponentUpdate("loaded");
        return applied();
    }

    fail(reason) {
        this._status = "failed";
        this._reason = text(reason);
        this.sfEmit("failed", {reason: this._reason});
        this.requestComponentUpdate("failed");
    }

    countUnread() {
        return this._groups.reduce((sum, group) => sum + group.items.filter((item) => item.unread).length, 0);
    }

    // ── actions ──────────────────────────────────────────────────────────────

    refresh() {
        return this.load();
    }

    async readAll() {
        if (!this._unread && !this.countUnread()) return applied();
        if (this.port && !this.givenItems) {
            const answer = await this.raise("notifications.read", {all: true});
            if (answer.answer !== "applied") return refused(answer.answer === "refused" ? "refused" : "unavailable", answer.reason);
            this._unread = Number.isInteger(answer.unread) ? answer.unread : 0;
        } else {
            this._unread = 0;
        }
        for (const group of this._groups) for (const item of group.items) item.unread = false;
        this.sfEmit("read-all", {});
        this._focusAfter = "status";
        this.followCount();
        this.requestComponentUpdate("read-all");
        return applied();
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
        if (!unreadOnes.length) return applied();
        this._unread = Math.max(0, this._unread - unreadOnes.length);
        this.sfEmit("read", {keys: unreadOnes});
        this.requestComponentUpdate("read");
        if (this.port && !this.givenItems) {
            const answer = await this.raise("notifications.read", {keys: unreadOnes, all: false});
            if (answer.answer === "applied" && Number.isInteger(answer.unread)) {
                this._unread = answer.unread;
                this.requestComponentUpdate("read");
            }
        }
        this.followCount();
        return applied();
    }

    // A notification the page adds (a run that failed, sf-admin-activity): on
    // a list fed by the port the host already has it, so the list reads again.
    async add(item) {
        if (item && typeof item === "object" && item.item && typeof item.item === "object") item = item.item;
        if (this.port && !this.givenItems) return this.load();
        const entry = entryOf(item);
        if (!entry) return refused("invalid");
        const list = [{...item}, ...this.items.filter((one) => text(one?.key) !== entry.key)];
        this.items = list;
        return applied();
    }

    // The bell's number is the menu's: after a read the menu asks its host again.
    followCount() {
        if (!this.port || this.givenItems) return;
        for (const menu of document.querySelectorAll("sf-admin-menu")) menu.refresh?.();
    }

    async loadMore() {
        if (this._cursor === null || this._cursor === undefined) return refused("no-more");
        const cursor = this._cursor;
        this.sfEmit("load-more", {cursor});
        return this.load({more: true});
    }

    // ── the person ───────────────────────────────────────────────────────────

    onOpen(event, item) {
        const allowed = this.sfEmit("open", {key: item.key, href: item.href}, {cancelable: true});
        if (allowed === false) event.preventDefault();
        this.read([item.key]);
    }

    toggleFold(id) {
        if (this._expanded.has(id)) this._expanded.delete(id);
        else this._expanded.add(id);
        this._focusAfter = `fold:${id}`;
        this.requestComponentUpdate("fold");
    }

    // ── drawing ──────────────────────────────────────────────────────────────

    // The groups as shown: unread only when asked; by object when asked, else
    // the host's days with the repeats of one object folded after the first.
    shownGroups() {
        const unreadOnly = this.getProp("unreadOnly") === true;
        const fold = this.getProp("fold") !== false;
        let groups = this._groups.map((group) => ({...group, items: unreadOnly ? group.items.filter((item) => item.unread) : group.items}))
            .filter((group) => group.items.length);
        if (this.getProp("groupBy") === "object") {
            const byObject = new Map();
            for (const group of groups) {
                for (const item of group.items) {
                    const key = item.object || "";
                    if (!byObject.has(key)) byObject.set(key, {key: `object:${key}`, label: key || this.sfWord("other-object"), items: []});
                    byObject.get(key).items.push(item);
                }
            }
            return [...byObject.values()].map((group) => ({...group, rows: group.items.map((item) => ({item, rest: []}))}));
        }
        groups = groups.map((group) => {
            const rows = [];
            const first = new Map();
            for (const item of group.items) {
                const at = fold && item.object ? first.get(item.object) : undefined;
                if (at) {
                    at.rest.push(item);
                    continue;
                }
                const row = {item, rest: []};
                if (fold && item.object) first.set(item.object, row);
                rows.push(row);
            }
            return {...group, rows};
        });
        return groups;
    }

    template() {
        const look = this.getProp("look") === "page" ? "page" : "panel";
        return renderAdminNotificationsTemplate({
            component: this,
            look,
            status: this._status,
            reason: this._reason,
            unread: this._unread,
            groups: this._status === "ready" ? this.shownGroups() : [],
            expanded: this._expanded,
            headingLevel: this.getProp("headingLevel") || "3",
            historyHref: look === "panel" ? (this.getProp("historyHref") || "") : "",
            settingsHref: this.getProp("settingsHref") || this._settingsHref || "",
            more: look === "page" && this._cursor !== null && this._cursor !== undefined,
            hasEmptySlot: this.hasSlotContent("empty"),
            emptySlot: this.getSlotContent("empty"),
            word: (key, options) => this.sfWord(key, options),
            onReadAll: () => this.readAll(),
            onRetry: () => this.load(),
            onMore: () => this.loadMore(),
            onOpen: (event, item) => this.onOpen(event, item),
            onFold: (id) => this.toggleFold(id),
        });
    }

    afterRender(changed) {
        super.afterRender?.(changed);
        const after = this._focusAfter;
        this._focusAfter = null;
        if (!after) return;
        if (after === "status") this.querySelector(".sf-admin-notifications__count")?.focus?.();
        else if (after.startsWith("fold:")) {
            const id = after.slice(5);
            [...this.querySelectorAll("[data-fold]")].find((node) => node.dataset.fold === id)?.focus?.();
        }
    }
}

SfAdminNotifications.define("sf-admin-notifications");
