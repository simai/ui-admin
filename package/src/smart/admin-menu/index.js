import SfBaseElement from "../../core/js/smart-base";
import {elementFromManifest} from "../../core/js/element-manifest";
import manifest from "./component.json";
import aliases from "./aliases.json";
import en from "./lang/en.json";
import ru from "./lang/ru.json";
import zh from "./lang/zh.json";
import es from "./lang/es.json";
import pt from "./lang/pt.json";
import de from "./lang/de.json";
import fr from "./lang/fr.json";
import it from "./lang/it.json";
import ja from "./lang/ja.json";
import ko from "./lang/ko.json";
import ar from "./lang/ar.json";
import {pageText} from "../../core/js/page-language";
import {
    NavigationController,
    NAVIGATION_PORT,
    NAVIGATION_TEXT,
    SUPPORTED_NAVIGATION_VERSIONS,
    skeletonColumns,
} from "./js/navigation/controller";
import {renderNavigationSkeleton, renderNavigationTemplate} from "./js/navigation/template";

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
const AdminMenuElement = elementFromManifest(manifest, {
    base: SfBaseElement,
    lang: {en, ru, zh, es, pt, de, fr, it, ja, ko, ar},
    source: "ru",
    aliases,
});

class SfAdminMenu extends AdminMenuElement {
    static get props() {
        return {
            ...super.props,
            ariaLabel: {attribute: "aria-label", default: "Admin menu"},
            rootClass: {default: ""},
        };
    }

    connectedCallback() {
        // A printed JSON island first (standard 1.3.8 §5.4): first-answer may
        // be in it.
        this.sfReadIsland();
        this._reflectOpen();
        // Ask the page for the port before anything else: a host usually
        // answers inside the request, and the menu loads from it at once.
        this._requestHostPort();
        // Reconnected after a move: the port is kept, the controller that
        // listened on the document is not.
        if (this.hostPort && !this._navigation) this._navigation = new NavigationController(this, this.hostPort);
        // The host's first answer printed with the page (first-answer): the
        // menu is drawn from it at once, with no skeleton, before any port;
        // the port, when it comes, answers behind it.
        if (!this._navigation && this._firstAnswer) this._navigation = new NavigationController(this, null);
        if (this._navigation) this._takeFirstAnswer();
        super.connectedCallback();
        if (this._navigation?.port) this._navigation.load("connected");
    }

    disconnectedCallback() {
        // Once per connection, so an element moved in the DOM asks again.
        this._portRequested = false;
        // The port stays with the element: moved in the DOM, it reconnects to
        // the same host rather than asking a second time.
        this._navigation?.dispose();
        this._navigation = null;
        super.disconnectedCallback();
    }

    // sf-admin-menu-intent, the 1.0 name of every request to the host, is
    // made from the request it follows: {intent, payload}.
    sfAliasAdapters() {
        return {
            "sf-admin-menu-intent": (detail) => (detail && detail.intent ? {intent: detail.intent, payload: detail.payload} : undefined),
        };
    }

    // The host's first answer printed with the page (setting first-answer, in
    // the element's data-sf-settings island): navigation.load's applied data,
    // optionally with `capabilities` (the port's, known before the port) and
    // `context` (the object menu of this page). Drawn at once, as if the host
    // had answered; the port's answer to navigation.load replaces it. Taken
    // once: a later answer is the port's.
    get firstAnswer() { return this._firstAnswer ?? null; }

    set firstAnswer(data) {
        this._firstAnswer = data && typeof data === "object" && !Array.isArray(data) && Array.isArray(data.items)
            ? JSON.parse(JSON.stringify(data))
            : null;
        // Set after the menu connected: drawn now, if nothing has answered.
        if (!this.isConnected || !this._firstAnswer) return;
        if (!this._navigation) this._navigation = new NavigationController(this, this.hostPort ?? null);
        if (this._takeFirstAnswer()) this.requestComponentUpdate("navigation-first-answer");
    }

    _takeFirstAnswer() {
        const data = this._firstAnswer;
        if (!data || !this._navigation) return false;
        this._firstAnswer = null;
        return this._navigation.acceptFirstAnswer(data);
    }

    // Without a controller the menu waits for its port: its skeleton.
    get awaitsNavigationPort() {
        return !this._navigation;
    }

    // The navigation skeleton before a port; its columns follow the viewport
    // in the stylesheet, as the answered menu's do (controller.js WIDE_MEDIA_QUERY).
    navigationSkeletonContext() {
        return {text: (key) => pageText(NAVIGATION_TEXT, key, this, "sf-admin-menu"), columns: skeletonColumns(this)};
    }

    template() {
        if (this._navigation) return renderNavigationTemplate(this._navigation.context());
        return renderNavigationSkeleton(this.navigationSkeletonContext());
    }

    // The shared convention for a component that takes a host port: ask for one
    // rather than wait to be given it. A page that answers nothing keeps the
    // skeleton until it connects a port (connectPort).
    _requestHostPort() {
        if (this.hostPort || this._portRequested) return false;
        this._portRequested = true;
        // A host usually answers inside the dispatch. While it does, the
        // connection that asked is still setting up and loads the menu itself.
        this._answeringRequest = true;
        try {
            this.dispatchEvent(new CustomEvent("sf-host-port-request", {
                bubbles: true,
                composed: true,
                detail: {component: this, context: {owner: "admin-menu", record: null, group: null}},
            }));
        } finally {
            this._answeringRequest = false;
        }
        return true;
    }

    // Read the menu again from the host: something outside the menu changed what
    // it shows -- a star pressed in the page header, a storage created on the
    // page. The port has no way for a host to push, so the page asks the menu
    // to ask.
    refresh() {
        return this._navigation?.load("requested") ?? Promise.resolve();
    }

    // ---------- the screen's interface (stand 24 A1) ----------

    // The row the page says it is on. Empty: the row whose address the page
    // is at, as before (the navigation controller follows the address).
    get pageCurrent() {
        return String(this.getAttribute("current") ?? "").trim();
    }

    // Whether the current row is among the person's favourites, as the host
    // last answered (values.favourite). A component update tells a binding
    // to read it again (sf-props-change).
    get favourite() {
        const navigation = this._navigation;
        const key = this.pageCurrent || navigation?.navigation?.current || "";
        return Boolean(key && navigation?.isFavourite?.(key));
    }

    // The action toggle {id, on}: the row goes into the person's favourites
    // or out of them through the port (favourite.toggle). The event toggle
    // still tells the page it was asked, as for the menu's own star.
    async toggle(id, on) {
        const params = id && typeof id === "object" ? id : {id, on};
        const key = String(params.id ?? "").trim();
        if (!key) return {outcome: "refused", reason: "no-id"};
        if (!this._navigation) return {outcome: "refused", reason: "no-port"};
        const answer = await this._navigation.setFavourite(key, Boolean(params.on));
        if (answer?.answer === "applied") return {outcome: "applied"};
        if (answer?.answer === "refused") return {outcome: "refused", reason: answer.reason ?? "refused"};
        return {outcome: "unavailable", reason: answer?.reason ?? "unavailable"};
    }

    // open, written by a page that opens the menu from a button of its own:
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
        if (value === true) this.setAttribute("open", "");
        else this.setAttribute("open", "false");
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
    }

    // The port arrives by the base action connect-port {port} (§4.1, §4.9;
    // the Framework's connectPort, with setHostPort its alias), which keeps it
    // as sfPort and runs this hook. A host adapter exposes {port, version,
    // capabilities, raise(intent, payload)}; only the navigation port is taken.
    // Throwing refuses it
    // (port-unsupported) and the base does not keep it.
    onPortConnected(host) {
        if (!host || typeof host.raise !== "function" || host.port !== NAVIGATION_PORT
            || !SUPPORTED_NAVIGATION_VERSIONS.includes(host.version)) {
            throw new TypeError(
                `sf-admin-menu requires a ${NAVIGATION_PORT} host port: ${SUPPORTED_NAVIGATION_VERSIONS.join(", ")}`,
            );
        }
        const wasConnected = this.isConnected;
        this.hostPort = host;
        // Drawn from the page's first answer and waiting for its port: the
        // same menu takes it and asks the host, keeping where the person is.
        if (this._navigation && !this._navigation.port) {
            this._navigation.port = host;
            if (wasConnected && !this._answeringRequest) this._navigation.load("host-connected");
            this.requestComponentUpdate("navigation-port");
            return;
        }
        this._navigation?.dispose();
        this._navigation = new NavigationController(this, host);
        // A port given after connecting replaces the skeleton drawn meanwhile.
        if (wasConnected && !this._answeringRequest) this._navigation.load("host-connected");
        this.requestComponentUpdate("navigation-port");
    }

    // The navigation shell's interface (C321, AM-36, AM-49): the page's own
    // «Показать колонку» calls showColumn; hideColumn and toggleColumn are
    // the column's button and Ctrl/Cmd+B. Each answers whether the column
    // is open after it.
    showColumn() {
        if (!this._navigation) return {outcome: "refused", reason: "no-port"};
        this._navigation.showColumn();
        return {outcome: "applied", open: this._navigation.columnState() === "open"};
    }

    hideColumn() {
        if (!this._navigation) return {outcome: "refused", reason: "no-port"};
        this._navigation.hideColumn();
        return {outcome: "applied", open: this._navigation.columnState() === "open"};
    }

    toggleColumn() {
        if (!this._navigation) return {outcome: "refused", reason: "no-port"};
        this._navigation.toggleColumn();
        return {outcome: "applied", open: this._navigation.columnState() === "open"};
    }

    afterRender() {
        this._navigation?.rendered();
    }
}

SfAdminMenu.define("sf-admin-menu");
