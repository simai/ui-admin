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
import SfBaseElement from "../../core/js/smart-base";
import {applied, elementFromManifest, refused} from "../../core/js/element-manifest";
import {topLayer} from "../../core/js/layer-stack";
import {isLateContent, watchLateChildren} from "../helpers/late-children.js";
import {heldNodes} from "./js/nodes.js";
import {renderAdminShellTemplate} from "./js/templates/default.js";
import manifest from "./component.json";
import en from "./lang/en.json";
import ru from "./lang/ru.json";

const ShellElement = elementFromManifest(manifest, {
    base: SfBaseElement,
    lang: {en, ru},
    source: "ru",
});

// The named places of the frame; everything else the page writes is content.
const AREAS = ["bar", "menu", "head", "top-end"];
// The menu folds away below 44rem (sf-admin-menu's own threshold): the shell's
// phone frame starts where the menu's phone screen does.
const NARROW = "(max-width: 43.99rem)";
const MENU_PREFERENCE = "sf-admin-menu/main";
const FOCUSABLE = "a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])";
const PART = "data-sf-admin-shell-part";

let shellCount = 0;
const own = (node) => node.nodeType === 1 && node.hasAttribute(PART);
const slotOf = (node) => (node.nodeType === 1 ? node.getAttribute("slot") : null);
const narrow = () => globalThis.matchMedia?.(NARROW).matches === true;
const px = (value) => `${Math.round(value * 100) / 100}px`;

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
        this._heights = {bar: -1, top: -1};
        // The nodes this shell has placed once (AS-5, js/nodes.js).
        this._placed = new WeakSet();
    }

    // ── the page's nodes ─────────────────────────────────────────────────────

    connectedCallback() {
        // Content is every child the page wrote that names no slot: not the
        // printed picture of the frame (§5.4), not a settings island, not white space.
        if (!this._content) {
            this._content = Array.from(this.childNodes).filter((node) => isLateContent(node) && !slotOf(node) && !own(node));
        }
        super.connectedCallback();
        if (!this.isConnected) return;
        if (!this._late) this._late = watchLateChildren(this, (nodes) => this.takeLateChildren(nodes));
        const signal = this.sfScope;
        globalThis.addEventListener?.("keydown", (event) => this.onKeydown(event), {signal});
        const media = globalThis.matchMedia?.(NARROW);
        media?.addEventListener?.("change", (event) => {
            if (!event.matches && this.menuOpen) this.closeMenu({focus: false, reason: "resize"});
            this.measure();
        }, {signal});
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
    }

    // What the page writes into the host later goes to its place: a node that
    // names a slot to that area, any other to the content, after what is there.
    takeLateChildren(nodes) {
        const mine = nodes.filter((node) => !own(node));
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
    }

    // A node the page has taken out of the shell (removed, or moved elsewhere)
    // is the page's decision: it is forgotten, never put back (AS-5: a page
    // that swapped its body without a reload got the old form back on the next
    // placing, after the phone menu closed -- two forms at 390).
    // The rule itself is js/nodes.js.
    nodesOf(area) {
        const inside = (node) => this.contains(node);
        if (area === "content") {
            if (this._content) this._content = heldNodes(this._content, inside, this._placed);
            return this._content ?? [];
        }
        const list = this._liveSlotNodes.get(area);
        const kept = heldNodes(list, inside, this._placed);
        if (Array.isArray(list) && kept.length !== list.length) this._liveSlotNodes.set(area, kept);
        return kept;
    }

    // Each node into its area, once; a node already there is left alone, so a
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
    }

    // ── the menu's room before it draws (AM-18) ─────────────────────────────

    // rail-column falls back to the rail when the person hid the section
    // column: the menu keeps that choice in SF.Preferences, and so the shell
    // reads it from the same place.
    get shownReserve() {
        const asked = this.getProp("menuReserve");
        if (asked !== "rail-column") return asked === "none" ? "none" : "rail";
        // The menu's own word for its first paint: expected-columns="1" where
        // the page's row has no open root (a dashboard) -- the rail alone.
        if (this.nodesOf("menu")[0]?.getAttribute?.("expected-columns") === "1") return "rail";
        try {
            return globalThis.SF?.Preferences?.read?.(MENU_PREFERENCE)?.second === false ? "rail" : "rail-column";
        } catch {
            return "rail-column";
        }
    }

    // ── sticky offsets ───────────────────────────────────────────────────────

    // The bar can grow («ещё N», two lines on a phone), the top line shows only
    // on a phone: their real heights give the offsets, written on the frame
    // only when they change (a write that changes nothing is not a write).
    measure() {
        const frame = this.frame;
        if (!frame) return;
        const bar = frame.querySelector(".sf-admin-shell__bar")?.getBoundingClientRect().height ?? 0;
        const top = narrow() ? (frame.querySelector(".sf-admin-shell__top")?.getBoundingClientRect().height ?? 0) : 0;
        if (bar === this._heights.bar && top === this._heights.top) return;
        this._heights = {bar, top};
        frame.style.setProperty("--sf-admin-shell--bar", px(bar));
        frame.style.setProperty("--sf-admin-shell-stick", px(bar + top));
        this.applyScrollPadding();
    }

    // The document scrolls under what stands at the top: an anchor, the skip
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
        this._observers.push(sizes);
        // The page head draws its heading later: it names the main landmark.
        const head = frame.querySelector('[data-area="head"]');
        if (head) {
            const heading = new MutationObserver(() => this.nameMain());
            heading.observe(head, {childList: true, subtree: true});
            this._observers.push(heading);
        }
    }

    // The main landmark is named by the page's h1 (the page head's heading);
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
    }

    // ── the phone menu (C322) ────────────────────────────────────────────────

    get menuOpen() {
        return this.hasAttribute("menu-open") && this.getAttribute("menu-open") !== "false";
    }

    set menuOpen(value) {
        if (value) this.openMenu();
        else this.closeMenu();
    }

    openMenu({focus = true, reason = "api"} = {}) {
        if (!this.isConnected) return refused("not-connected");
        if (!this.nodesOf("menu").length) return refused("no-menu");
        if (this.menuOpen) return applied();
        this.setAttribute("menu-open", "");
        this.syncMenuButton();
        globalThis.scrollTo?.(0, 0);
        this.sfEmit("menu-open", {reason});
        if (focus) {
            // The menu draws its phone screen first.
            setTimeout(() => this.frame?.querySelector(`[data-area="menu"] :is(${FOCUSABLE})`)?.focus?.(), 50);
        }
        return applied();
    }

    closeMenu({focus = true, reason = "api"} = {}) {
        if (!this.menuOpen) return applied();
        this.removeAttribute("menu-open");
        this.syncMenuButton();
        this.sfEmit("menu-close", {reason});
        if (focus) this.focusMenuButton();
        return applied();
    }

    focusMenuButton() {
        const button = this.menuButton;
        (button?.querySelector("button") ?? button)?.focus?.();
    }

    // The work area takes the focus: after the skip link, and after a product
    // moved to another page without a reload (the frame stays, the content changed).
    focusContent() {
        const main = this.mainElement;
        if (!main) return refused("not-drawn");
        if (this.menuOpen) this.closeMenu({focus: false, reason: "content"});
        main.focus({preventScroll: true});
        main.scrollIntoView?.({block: "start"});
        return applied();
    }

    // The button is sf-button-icon: its host attributes reach its <button>
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
        if (event.key !== "Escape" || event.defaultPrevented || !this.menuOpen || !narrow()) return;
        // A window or a popup holding the focus takes its own Escape first. A
        // closed drawer stays in the document with its dialog role (even
        // shown, off screen), so what counts is where the key was pressed.
        const target = event.composedPath?.()[0] ?? event.target;
        if (target?.closest?.("dialog, [role='dialog'], [aria-modal='true'], [role='menu'], [role='listbox']")) return;
        // A layer of the document's layer stack opened over the menu takes it
        // too, wherever the focus is (1.0.1, LM-R1): the bell's panel is a
        // drawer that leaves the focus on the bell, so the first Escape closed
        // the menu under the open panel. The stack closes its top layer and
        // gives the focus back to its opener; the next Escape is the menu's.
        if (topLayer()) return;
        event.preventDefault();
        this.closeMenu({reason: "escape"});
    }

    onMenuButton() {
        if (this.menuOpen) this.closeMenu({reason: "button"});
        else this.openMenu({reason: "button"});
    }

    onSkip(event) {
        event.preventDefault();
        this.focusContent();
    }

    // ── drawing ──────────────────────────────────────────────────────────────

    template() {
        return renderAdminShellTemplate({
            id: this._shellId,
            width: this.getProp("width") === "read" ? "read" : "list",
            reserve: this.shownReserve,
            product: this.getProp("product") || "",
            skipLabel: this.getProp("skipLabel") || this.sfWord("skip-label"),
            menuLabel: this.sfWord(this.menuOpen ? "close-menu-label" : "menu-label"),
            menuOpen: this.menuOpen,
            hasMenu: this.nodesOf("menu").length > 0,
            onSkip: (event) => this.onSkip(event),
            onMenuButton: () => this.onMenuButton(),
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
            this._menuBound = true;
            // A page chosen in the phone menu closes it; the page itself moves.
            // The event is cancelable (sf-admin-menu 1.16.1, AS-6) and the page
            // listens above the shell, so the shell decides once every listener
            // has had it: a page that refused to leave keeps the menu open.
            this.addEventListener("sf-admin-menu-navigate", (event) => {
                queueMicrotask(() => {
                    if (!event.defaultPrevented && this.menuOpen) this.closeMenu({focus: false, reason: "navigate"});
                });
            }, {signal: this.sfScope});
        }
    }
}

SfAdminShell.define("sf-admin-shell");
