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
import {PRESS_WAIT, closeMenu, openMenu, removeMenu, updateMenu} from "./menu";
import {renderNotices} from "./notices.js";
import {getInitials} from "../../../helpers/text";
import {pageText} from "../../../../core/js/page-language";
import BundledPreferences from "../../../../core/js/preferences.js";
import {wordsOf} from "../words.js";
import {isEditableTarget, matchesShortcut, parseShortcut} from "../../../../component/kbd/js/shortcut";
import {breakpointMedia} from "../../../../core/js/breakpoints.js";

export const NAVIGATION_PORT = "simai.admin-navigation-port";

// Every port version this shell accepts, in one place, the way sf-view and
// sf-view-properties keep theirs.
export const SUPPORTED_NAVIGATION_VERSIONS = ["1.0.0", "1.1.0", "1.2.0"];

// The width at which the rail and its column become one full screen menu
// (C322): the SIMAI Framework ladder's md step, 44rem (core/js/breakpoints.js,
// AM-6). The menu switched at 48rem, a width of no step of the ladder; the
// sheet (navigation.css) switches at the same step.
export const WIDE_STEP = "md";
let TIP_INSTANCES = 0;

// «Найти в разделе» is offered only above 12 pages (owner decision C364,
// AM-45): twelve rows fit without scrolling on every screen measured (a
// 375x667 phone holds 12), and below that ⌘K covers search.
const FIND_IN_SECTION_ABOVE = 12;


// The palette's keys in SIMAI Framework's shortcut notation (component kbd):
// mod is Cmd on an Apple platform and Ctrl elsewhere. The Framework says which
// platform this is, draws the keys (⌘K, Ctrl+K) and hears them (KB-2, C04):
// the menu keeps no platform test and no key look of its own.
export const PALETTE_SHORTCUT = "mod+k";

// The port may name another key for the palette (navigation `search_shortcut`,
// AM-3), in the same notation; an empty or unreadable one keeps mod+k.
export function paletteShortcut(navigation) {
    const named = typeof navigation?.search_shortcut === "string" ? navigation.search_shortcut.trim() : "";
    return named && parseShortcut(named) ? named : PALETTE_SHORTCUT;
}

// Hiding and showing the section column (owner decision C321, AM-36): the
// key of Linear, Notion and VS Code, owned by the menu, said on its button.
export const COLUMN_SHORTCUT = "mod+b";
const COLUMN_KEYS = parseShortcut(COLUMN_SHORTCUT);

// The id prefix of the lists sf-sortable reorders in the edit mode.
export const LIST_ID = "sf-admin-nav-list-";

export const NAVIGATION_TEXT = wordsOf({
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
    unlock: "unlock",
});

const copy = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));

// What a person asks of the host, told on the element by the vocabulary's verb
// (vocabulary 1.1.5 §5.1: sf-admin-menu-intent splits into
// sf-admin-menu-<verb>). Each port intent of simai.admin-navigation-port is a
// verb with a kind; the detail carries the vocabulary's fields, and the port's
// own intent and payload beside them, which is all the 1.0 name carried.
const INTENT_VERBS = {
    "navigation.load": ["refresh", "navigation", (p) => ({reason: p.reason ?? null, site: p.site ?? null})],
    "item.open": ["open", "item", (p) => ({id: p.key, href: p.href ?? null})],
    "favourite.toggle": ["toggle", "favourite", (p) => ({id: p.key, on: Boolean(p.on)})],
    "preference.widths": ["save", "preference", (p) => ({values: {widths: p.widths}})],
    "preference.theme": ["save", "preference", (p) => ({values: {theme: p.theme}})],
    "preference.language": ["save", "preference", (p) => ({values: {language: p.language}})],
    "sites.search": ["query", "site", (p) => ({query: p.query ?? ""})],
    "site.switch": ["open", "site", (p) => ({id: p.site})],
    "view.profile": ["open", "view", (p) => ({id: p.profile})],
    "view.create": ["create", "view", () => ({})],
    "view.save": ["save", "view", (p) => ({id: p.profile ?? null, revision: p.revision ?? null})],
    "view.reset": ["reset", "view", (p) => ({id: p.profile ?? null})],
    "view.rename": ["rename", "view", (p) => ({id: p.profile, title: p.label ?? ""})],
    "view.delete": ["delete", "view", (p) => ({ids: [p.profile]})],
    "search.query": ["query", "search", (p) => ({query: p.query ?? ""})],
    "search.choose": ["open", "search", (p) => ({id: p.key, group: p.group ?? null})],
    "session.sign-out": ["sign-out", "session", () => ({})],
    "notifications.load": ["refresh", "notifications", () => ({})],
    // The port's payload is {keys, all} (simai.admin-navigation-port 1.1.0);
    // the vocabulary's event names them ids.
    "notifications.read": ["read", "notifications", (p) => ({ids: p.all ? [] : [].concat(p.keys ?? [])})],
};


// SF.Preferences, the Framework's one store of view preferences (core
// publishes it; this bundle's copy is the fallback).
const preferences = () => globalThis.SF?.Preferences || BundledPreferences;
const MENU_PREFERENCE = "sf-admin-menu/main";
const FAVOURITES_ROOT = "sf:favourites";

// The key the second column is shown under when it holds the page's object
// menu (navigation.context) rather than a root of the tree.
export const OBJECT_MENU = "sf:context";

// The set's notifications panel on the page: an sf-admin-notifications in
// its panel look (not the history page's look="page") inside an sf-drawer,
// or null. Found by markup, so it holds before the list's code has arrived.
// sf-drawer carries its content into a portal at the end of the body
// ([data-sf-drawer-portal] named by the drawer's id) once it is defined, so
// the list is the drawer's either inside the element or inside its portal.
export function setNoticesPanel(root = globalThis.document) {
    for (const list of root?.querySelectorAll?.("sf-admin-notifications") ?? []) {
        if (list.getAttribute("look") === "page") continue;
        const drawer = drawerHolding(list, root);
        if (drawer) return {list, drawer};
    }
    return null;
}

function drawerHolding(list, root) {
    const inside = list.closest?.("sf-drawer");
    if (inside) return inside;
    const id = list.closest?.("[data-sf-drawer-portal]")?.getAttribute?.("data-sf-drawer-portal");
    if (!id) return null;
    return [...(root?.querySelectorAll?.("sf-drawer") ?? [])].find((drawer) => drawer.id === id || drawer.drawerId === id) ?? null;
}

// The page's address as the host is told it (navigation.load `page`): the
// path and the query, without the origin.
function pageAddress(url = globalThis.location?.href) {
    try {
        const address = new URL(url, globalThis.location?.href);
        return `${address.pathname}${address.search}`;
    } catch {
        return null;
    }
}

// The menu of the object a page shows (navigation.context), or null: a title
// and groups of rows, each row a link. Anything else the host sent is not a
// menu and is not drawn.
export function objectMenuOf(navigation) {
    const context = navigation?.context;
    if (!context || typeof context !== "object" || Array.isArray(context) || !Array.isArray(context.groups)) return null;
    const groups = context.groups
        .filter((group) => group && typeof group === "object" && Array.isArray(group.items))
        .map((group) => ({
            label: typeof group.label === "string" && group.label ? group.label : null,
            items: group.items.filter((item) => item && typeof item === "object" && item.key && item.label),
        }))
        .filter((group) => group.items.length);
    const back = context.back && typeof context.back === "object" && context.back.href
        ? {label: String(context.back.label ?? ""), href: String(context.back.href)}
        : null;
    const status = typeof context.status === "string" && context.status
        ? {text: context.status, status: null}
        : context.status && typeof context.status === "object" && context.status.text
            ? {text: String(context.status.text), status: context.status.status ? String(context.status.status) : null}
            : null;
    return {
        title: String(context.title ?? ""),
        subtitle: typeof context.subtitle === "string" && context.subtitle ? context.subtitle : null,
        status,
        back,
        groups,
        current: typeof context.current === "string" && context.current ? context.current : null,
    };
}

// Larena's region contract (larena/admin, 2026-10-15): the shell's revision in
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
        scope: "/admin",
    });
}

export class NavigationController {
    constructor(element, port) {
        this.element = element;
        this.port = port;
        this.navigation = null;
        this.status = "loading";
        this.message = "";
        // A root the person clicked in the first column, shown in the second
        // until they open a page (and the root being edited in the edit mode).
        this.openRoot = null;
        // Whether the second column is open: the person's one choice, on
        // every page and every site (SF.Preferences, `second`).
        this.columnOpen = this.keptColumnOpen();
        this.unfolded = new Set();
        this.filter = "";
        this.screen = "first";
        // The roots the rail has no room for, under «…» (AM-27): measured
        // after a draw (fitRail), never the current page's root.
        this.overflowRoots = [];
        this.tipPrefix = `sf-admin-nav-tip-${++TIP_INSTANCES}`;
        this.pendingFocus = null;
        this.sequence = 0;
        this.sites = {open: false, query: "", items: [], next: null, loading: false, sequence: 0};
        // The ⌘K palette is SIMAI Framework's sf-search (palette.js, K-04): the
        // window, its keys, scrim, layer and focus are the element's. The menu
        // answers its provider from the port, numbering its questions so a late
        // answer is not taken, and remembers what each result it handed stands
        // for, to choose it through the port (search.choose).
        this._paletteSequence = 0;
        this._paletteChoices = new Map();
        this.paletteProvider = (query, options) => this.askPalette(query, options);
        // Not drawn until it is first wanted (paletteElement).
        this.paletteWanted = false;
        this._paletteCode = null;
        // The edit mode: on or off, what is being renamed or added, the row whose
        // ⋯ is open, the profile list in the banner, and what the last save said.
        this.edit = {on: false, renaming: null, adding: null, rowMenu: null, profiles: false, naming: null, message: ""};
        // The setting mode's level (C326 = C298): «Лично» (the personal
        // profile, saved at once), «Для всех» and «Профиль настроек» (shared
        // profiles: a draft here, saved only by «Сохранить для всех»), and
        // what opened the mode, which gets the focus back when it closes.
        this.level = {key: "personal", draft: null, dirty: false};
        this.editOpener = null;
        this._onSortableIntent = (event) => this.onSortableIntent(event);
        element.addEventListener("sf-sortable-intent", this._onSortableIntent);
        // What a control opens is fetched when a pointer comes over it or the
        // focus reaches it (1.17.0): a closed menu fetches none of it, and the
        // first press finds the code there (prefetchFor).
        this._prefetched = new Set();
        this._onPrefetch = (event) => this.prefetchFor(event.target);
        element.addEventListener("pointerover", this._onPrefetch);
        element.addEventListener("focusin", this._onPrefetch);
        // The rail's «…» follows the window's height (AM-27): measured again
        // after every draw and when the window changes size.
        this._onWindowResize = () => {
            cancelAnimationFrame(this._fitFrame);
            this._fitFrame = requestAnimationFrame(() => this.fitRail());
        };
        globalThis.addEventListener?.("resize", this._onWindowResize);

        this.wideMedia = breakpointMedia(WIDE_STEP);
        this.wide = this.wideMedia ? this.wideMedia.matches : true;
        this._onWideChange = (event) => {
            this.wide = event.matches;
            // Screens are a phone idea; a desktop shows both columns at once.
            if (this.wide) this.screen = "first";
            this.update("viewport");
        };
        this.wideMedia?.addEventListener?.("change", this._onWideChange);

        this._onKeyDown = (event) => {
            // Ctrl or ⌘ alone is most often the first half of ⌘K: the window's
            // code is fetched now, so the key finds it there (1.17.0).
            if ((event.key === "Control" || event.key === "Meta") && this.offers("search")) this.preparePalette();
            // ⌘K / Ctrl+K opens the palette from anywhere on the page, in every
            // arrangement of the menu -- the rail and the phone included, which
            // is the reason it is a palette over the page rather than a column.
            // The menu is the key's one owner on the page (AM-1): its own
            // sf-search hears no key of its own (palette.js shortcut="").
            if (matchesShortcut(event, parseShortcut(this.paletteShortcut())) && this.offers("search")) {
                // The key is the menu's: the open window's field does not hear
                // it after the window has closed under it.
                event.preventDefault();
                event.stopPropagation();
                this.togglePalette();
                return;
            }
            // ⌘B / Ctrl+B hides and shows the section column (C321, AM-36);
            // in a text field it is the field's (bold in an editor).
            if (matchesShortcut(event, COLUMN_KEYS) && this.wide && !this.edit?.on && !isEditableTarget(event.target)) {
                event.preventDefault();
                this.toggleColumn();
                return;
            }
            // Escape leaves the setting mode (AM-61), once what is open inside
            // it -- a menu, a window, a name being typed -- has had it.
            if (event.key === "Escape" && this.edit?.on && !event.defaultPrevented && !this.escapeTaken(event)) {
                event.preventDefault();
                this.exitEdit();
            }
        };
        // Escape, Tab and a press on the scrim are sf-search's while its
        // window is open (openPalette).
        document.addEventListener("keydown", this._onKeyDown, true);
        // The admin's pages without full reloads (interface fragments,
        // 2026-10-15), piloted here: the menu turns region navigation on when
        // the page is Larena's shell -- its revision in the head, its content
        // region in the body -- and keeps its current row on the address the
        // region went to, since the shell around it is not drawn again.
        // The new page may show another object, or none: the host is asked for
        // the menu again with its address, and its answer brings the page's
        // object menu or takes it away.
        this._onRegionLoad = (event) => {
            this.followAddress(event.detail?.url);
            if (this.port) this.load("requested", null, pageAddress(event.detail?.url));
        };
        document.addEventListener("sf-region-load", this._onRegionLoad);
        enableRegionNavigation();
    }

    // The row whose address is this one becomes current: the deepest match on
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
        const visit = (rows) => {
            for (const row of rows ?? []) {
                if (row.href && !["link", "heading", "divider"].includes(row.kind)) {
                    let target = null;
                    try {
                        target = new URL(row.href, globalThis.location.href).pathname;
                    } catch {
                        target = null;
                    }
                    if (target && (path === target || path.startsWith(`${target.replace(/\/$/u, "")}/`))
                        && (!best || target.length > best.length)) best = {key: row.key, length: target.length};
                }
                visit(row.children);
            }
        };
        visit(this.navigation?.items);
        // Drawn again whichever row it is: «Уведомления» reads its own mark
        // from the address, not from a row of the tree.
        // The row the page names (setting current) is not moved by the address.
        if (!this.element.pageCurrent && best && best.key !== this.navigation?.current) this.navigation = {...this.navigation, current: best.key};
        // A row of the object menu at this address is current at once; the
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
                    if (target && (path === target || path.startsWith(`${target.replace(/\/$/u, "")}/`))
                        && (!found || target.length > found.length)) found = {key: item.key, length: target.length};
                }
            }
            if (found && found.key !== context.current) this.navigation = {...this.navigation, context: {...context, current: found.key}};
        }
        this.pageOpened();
        this.update("address");
    }

    // The page named the row it is on (setting current, stand 24 A1): it is
    // current, and the second column follows it as it follows the address.
    followPageCurrent() {
        const key = this.element.pageCurrent;
        if (!this.navigation || !key || key === this.navigation.current) return;
        this.navigation = {...this.navigation, current: key};
        this.pageOpened();
        this.update("current");
    }

    // The first level is always the rail (owner decision C320): there is no
    // «Развернуть» and no preference for it (AM-29). The rail unfolds with
    // its names only for the time of the setting mode (C325, AM-24).
    get compact() {
        return !this.edit?.on;
    }

    // A page was opened. The column the person has open stays when it holds
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
    }

    // The root that holds the page's row and has rows of its own: the one the
    // second column shows on this page when the page has no object menu.
    // A root that is itself the page (no rows) has no column: the column is
    // closed there, never another root's (owner, 2026-11-05).
    pageRoot() {
        const current = this.navigation?.current;
        return this.roots().find((root) => root.kind === "root" && this.holdsCurrent(root)
            && root.key !== current && (root.children ?? []).length > 0) ?? null;
    }

    // The page's object menu (navigation.context), drawn as it came; not in
    // the edit mode, which edits the tree.
    objectMenu() {
        return this.edit?.on ? null : objectMenuOf(this.navigation);
    }

    // What the second column holds: the root the person clicked (or edits),
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
    }

    // What the host element says of its column (AM-49), for a page that
    // draws «Показать колонку» in its own head line and holds the menu's
    // width before the menu has drawn: open, hidden by the person, or none
    // (a page with nothing for the column, or a phone).
    columnState() {
        if (!this.wide) return "none";
        if (this.shownColumn()) return "open";
        return this.pageColumn() || this.openRoot ? "hidden" : "none";
    }

    // What the second column would hold if it were open: the button that
    // opens it is drawn only when there is something to open.
    pageColumn() {
        if (this.objectMenu()) return OBJECT_MENU;
        return this.pageRoot()?.key ?? null;
    }

    dispose() {
        removeMenu(this);
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
        return pageText(NAVIGATION_TEXT, key, this.element, "sf-admin-menu");
    }

    update(reason) {
        this.element.requestComponentUpdate(`navigation-${reason}`);
    }

    // The port's capabilities; before the port, the ones the page printed
    // with its first answer (first-answer.capabilities), so the first draw is
    // the final one.
    offers(capability) {
        const capabilities = this.port?.capabilities ?? this.printedCapabilities;
        return Boolean(capabilities?.includes?.(capability));
    }

    // The host's first answer printed with the page (setting first-answer):
    // drawn at once, as if the host had answered, with no skeleton; the port's
    // answer to navigation.load replaces it. Taken only before any answer.
    acceptFirstAnswer(data) {
        if (this.navigation || !data || typeof data !== "object" || !Array.isArray(data.items)) return false;
        if (Array.isArray(data.capabilities)) this.printedCapabilities = data.capabilities.map(String);
        this.accept({...data, answer: "applied"}, this.sequence);
        return true;
    }

    // A host that throws is a host that did not answer; a person sees the same
    // «unavailable» as for a host that said so.
    // Every intent is also told on the element by its verb (INTENT_VERBS), so
    // a page can watch what a person asked of the host without standing
    // between the two; sf-admin-menu-intent, the 1.0 name for all of them,
    // follows each until 2026-12-01 (aliases.json, split).
    async raise(intent, payload = {}) {
        // An intent a later port adds is told as a refresh of its own kind
        // until it has a verb here.
        const [verb, kind, fields] = INTENT_VERBS[intent] ?? ["refresh", String(intent).split(".")[0], () => ({})];
        this.element.sfEmit(verb, {kind, ...fields(payload ?? {}), intent, payload: copy(payload)});
        // Drawn from the page's first answer before the host connected its
        // port: there is no one to ask yet.
        if (!this.port) return {answer: "unavailable", reason: "no-port"};
        try {
            const answer = await this.port.raise(intent, copy(payload), {});
            return answer && typeof answer === "object" ? answer : {answer: "unavailable"};
        } catch (error) {
            return {answer: "unavailable", reason: String(error?.message ?? error)};
        }
    }

    // The menu as the host sees it. An answer to an older request than the last
    // one sent is dropped by its echoed sequence: switching sites twice quickly
    // must not end on the first site's rows.
    // `page` is the page's address (path and query): the host answers the
    // menu of the object that page shows (navigation.context) or none.
    async load(reason = "connected", site = null, page = pageAddress()) {
        const sequence = ++this.sequence;
        if (!this.navigation) this.status = "loading";
        this.update("loading");
        const answer = await this.raise("navigation.load", {reason, site, sequence, page});
        this.accept(answer, sequence);
    }

    accept(answer, sequence) {
        if (answer.answer === "applied") {
            const echoed = answer.echo?.sequence ?? sequence;
            if (echoed !== null && echoed < this.sequence) return;
            const first = !this.navigation;
            const before = this.navigation?.current ?? null;
            // The row the page says it is on wins over the host's (stand 24 A1).
            const pageCurrent = this.element.pageCurrent;
            // An answer without `context` takes the object menu away: the page
            // the menu was read for shows no object (a soft swap's answer).
            const {answer: _outcome, ...data} = answer;
            this.navigation = pageCurrent ? {...data, current: pageCurrent} : data;
            if (first) this.applyPersonPreferences(answer.person);
            this.preloadFilledIcons();
            // The second column follows the page (owner, 2026-11-05): nothing
            // to choose here but what the page is. A root the person was
            // looking at stays only while the page is the same one.
            if (!first && this.navigation.current !== before) this.pageOpened();
            // On a phone the menu opens on the page's object menu when it has one.
            if (first && !this.wide) this.screen = this.objectMenu() ? "second" : "first";
            this.status = "ready";
            this.message = "";
            // An open root the new menu does not hold closes rather than showing
            // an empty column under a heading that no longer exists.
            if (this.openRoot && this.openRoot !== FAVOURITES_ROOT && !this.roots().some((root) => root.key === this.openRoot)) {
                this.openRoot = null;
                this.screen = "first";
            }
            // A phone on the second screen with nothing left to show there
            // goes back to the first.
            if (!this.wide && this.screen === "second" && !this.shownColumn()) this.screen = "first";
        } else if (!this.navigation) {
            this.status = answer.answer === "refused" ? "refused" : "unavailable";
            this.message = answer.reason || "";
        }
        this.update("state");
    }

    // The current section's glyph is drawn filled (C354): the icon subset has
    // the FILL axis only for glyphs the page marks filled, so every section of
    // the first column is asked for in its filled form at once -- a section
    // that becomes current later does not wait for another subset.
    preloadFilledIcons() {
        const preload = globalThis.SF?.Loader?.preloadIcons;
        if (typeof preload !== "function") return;
        const icons = new Set();
        const walk = (rows) => {
            for (const row of rows ?? []) if (row?.icon && row.kind !== "divider" && row.kind !== "heading") icons.add(row.icon);
        };
        walk(this.navigation?.items);
        icons.add("star");
        const fresh = [...icons].filter((name) => !this.filledIcons?.has(name));
        if (!fresh.length) return;
        this.filledIcons = new Set([...(this.filledIcons ?? []), ...fresh]);
        try {
            preload.call(globalThis.SF.Loader, fresh.map((name) => ({icon: name, filled: true})));
        } catch {
            // A Loader without the icon subset draws the glyphs as they are.
        }
    }

    // The person's theme and language are the host's to keep, so the page follows
    // them when the menu first reads them. Without this a page could open dark
    // from the Framework's own cookie while the host -- and the profile menu --
    // said «as the system», two answers to one question.
    applyPersonPreferences(person) {
        if (!person || !this.offers("preferences")) return;
        const loader = globalThis.SF?.Loader;
        if (person.theme && loader?.themePreference !== person.theme) loader?.setTheme?.(person.theme);
        const language = globalThis.SF?.language;
        if (person.language && language?.current?.() !== person.language) language?.use?.(person.language);
    }

    // ─── what the template reads ─────────────────────────────────────────────

    // Hidden rows are drawn in the edit mode, struck through, so they can be
    // brought back; outside it they are not drawn at all.
    roots() {
        return (this.navigation?.items ?? []).filter((row) => this.edit?.on || !row.hidden);
    }

    siteRoots() {
        return this.roots().filter((row) => row.level !== "install");
    }

    installRoots() {
        return this.roots().filter((row) => row.level === "install");
    }

    rootByKey(key) {
        if (key === FAVOURITES_ROOT) return this.favouritesRoot();
        return (this.navigation?.items ?? []).find((row) => row.key === key) ?? null;
    }

    // Favourites are a section of their own (owner, 2026-10-15): a star at the
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
            key: FAVOURITES_ROOT, kind: "root", level: "site", label: this.text("favourites"), icon: "star",
            children: favourites.map((entry) => ({
                ...entry,
                kind: entry.kind === "divider" || entry.kind === "heading" ? entry.kind : "page",
                caption: entry.caption ?? this.sectionOf(entry.key)?.label ?? null,
            })),
        };
    }

    // The root a row is in, at any depth.
    sectionOf(key) {
        const holds = (rows) => (rows ?? []).some((row) => row.key === key || holds(row.children));
        return (this.navigation?.items ?? []).find((root) => root.key !== key && holds(root.children)) ?? null;
    }

    // The rows of the open root as they are drawn: hidden ones gone, headings
    // without a visible row after them gone too (assignment v5, item 9), and the
    // filter applied to pages when one is typed.
    rowsOf(root) {
        if (this.edit?.on) return [...(root?.children ?? [])];
        const rows = (root?.children ?? []).filter((row) => !row.hidden);
        const needle = this.filter.trim().toLowerCase();
        const matched = needle
            ? rows.filter((row) => row.kind === "heading" || (row.label ?? "").toLowerCase().includes(needle)
                || (row.children ?? []).some((child) => (child.label ?? "").toLowerCase().includes(needle)))
            : rows;
        const drawn = [];
        matched.forEach((row, index) => {
            if (row.kind === "heading") {
                const next = matched.slice(index + 1).find((candidate) => candidate.kind !== "divider");
                if (!next || next.kind === "heading") return;
            }
            if (row.kind === "divider" && (needle || drawn.length === 0 || drawn[drawn.length - 1].kind === "divider")) return;
            drawn.push(row);
        });
        while (drawn.length && drawn[drawn.length - 1].kind === "divider") drawn.pop();
        return drawn;
    }

    pageCount(root) {
        return (root?.children ?? []).filter((row) => !row.hidden && !["heading", "divider"].includes(row.kind)).length;
    }

    offersFind(root) {
        return this.pageCount(root) > FIND_IN_SECTION_ABOVE;
    }

    favourites() {
        return this.offers("favourites") ? (this.navigation?.favourites ?? []) : [];
    }

    isFavourite(key) {
        return this.favourites().some((entry) => entry.key === key);
    }

    isCurrent(key) {
        return this.navigation?.current === key;
    }

    // A root is shown as current when the page belongs to one of its rows.
    holdsCurrent(root) {
        const current = this.navigation?.current;
        if (!current) return false;
        if (root.key === current) return true;
        // At any depth (AM-13): a page three levels down keeps its root lit.
        const holds = (rows) => (rows ?? []).some((row) => row.key === current || holds(row.children));
        return holds(root.children);
    }

    // ─── what a person does ──────────────────────────────────────────────────

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
        }
        // A click on a root is «show me this section» (AM-49): its column
        // opens, also when the person had hidden the column; a click on the
        // root whose column is open hides it, which is hiding the column.
        const shown = this.shownColumn();
        const pageRoot = this.pageRoot()?.key ?? null;
        if (shown === key || (shown === OBJECT_MENU && this.holdsCurrent(this.rootByKey(key) ?? {}) && !this.openRoot)) {
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
    }

    // The column's «hide» on a wide screen: closed on every page from now on,
    // until the person opens it again.
    hideColumn() {
        this.openRoot = null;
        this.screen = "first";
        if (this.wide) this.setColumnOpen(false);
        this.update("root");
    }

    // «Показать колонку» (the page's head line, ⌘B, the element's
    // showColumn): the column again, on what the page has -- its object menu
    // or its root. With nothing for it nothing opens.
    showColumn() {
        if (!this.pageColumn() && !this.openRoot) return false;
        this.setColumnOpen(true);
        this.update("root");
        return true;
    }

    // ⌘B / Ctrl+B and the element's toggleColumn: hide the column that is
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
        this.keepPreference({second: this.columnOpen});
        if (changed) this.element.sfEmit("column-change", {open: this.columnOpen});
    }

    // The menu's view preference (SF.Preferences, owner 2026-10-14): whether
    // the section column is open, kept for the person with every other view
    // preference (C321: remembered per person). The rail is not a choice.
    get preference() {
        return preferences()?.read(MENU_PREFERENCE) ?? {};
    }

    keepPreference(patch) {
        preferences()?.write(MENU_PREFERENCE, {...this.preference, v: 1, ...patch});
    }

    // Open unless the person closed it. Before 1.7.0 the menu kept the root
    // left open per site (openRoots), "" for a closed column: a person who
    // had closed it everywhere they went finds it closed.
    keptColumnOpen() {
        const kept = this.preference;
        if (typeof kept.second === "boolean") return kept.second;
        const former = kept.openRoots && typeof kept.openRoots === "object" ? Object.values(kept.openRoots) : [];
        return !(former.length && former.every((value) => value === ""));
    }

    back() {
        this.screen = "first";
        if (!this.edit?.on) this.openRoot = null;
        this.update("screen");
    }

    toggleSection(key) {
        if (this.unfolded.has(key)) this.unfolded.delete(key);
        else this.unfolded.add(key);
        this.update("section");
    }

    setFilter(value) {
        this.filter = String(value ?? "");
        this.update("filter");
    }

    // A row is a link the browser understands -- a middle click or a modified
    // click opens it in a tab as any link would -- and a plain click is the
    // host's to answer, because what opening a row means is the host's.
    async openRow(row, event) {
        if (event && (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
        if (row.kind === "link") return;
        // Drawn from the page's first answer, before the port: a page row is
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
        const answer = await this.raise("item.open", {key: row.key, href: row.href ?? null});
        if (answer.answer === "applied") {
            const href = answer.href ?? row.href ?? null;
            // With region navigation on, the menu goes there itself and says so:
            // `region: true` tells a host listener the page is already on its
            // way, so it does not load it a second time.
            const region = Boolean(href && globalThis.SF?.RegionNavigation?.enabled);
            // The page may refuse to leave (AS-6: unsaved changes): navigate is
            // cancelable and asked first; refused, the current row, the screen
            // and the focus stay as they are and the menu goes nowhere. The page
            // that later agrees goes there itself and names the row (current).
            if (!this.mayLeave({id: row.key, key: row.key, href, region})) return;
            this.navigation = {...this.navigation, current: row.key};
            this.pageOpened();
            if (!this.wide) this.screen = "first";
            this.update("open");
            if (region) globalThis.SF.RegionNavigation.navigate(new URL(href, globalThis.location.href).href);
        }
    }

    // sf-admin-menu-navigate, cancelable (AS-6): false when a listener refused.
    mayLeave(detail) {
        return this.element.sfEmit("navigate", detail, {cancelable: true}) !== false;
    }

    // A row of the object menu, or its «back»: an ordinary link, the page's
    // and not the tree's -- no port intent, no favourite, nothing to edit. A
    // middle or modified click opens a tab as any link does; a plain click
    // goes by region when the shell has it, else the browser follows the
    // link. `navigate` tells a host listener either way.
    openObjectRow(item, event, {back = false} = {}) {
        if (event && (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
        const href = item?.href ?? null;
        if (!href) return;
        const region = Boolean(globalThis.SF?.RegionNavigation?.enabled);
        const key = back ? "sf:context-back" : item.key;
        // Refused (AS-6): the link is not followed and nothing is marked.
        if (!this.mayLeave({id: key, key, href, region})) {
            event?.preventDefault?.();
            return;
        }
        if (!back && this.navigation?.context) {
            this.navigation = {...this.navigation, context: {...this.navigation.context, current: item.key}};
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
    }

    // The row into the person's favourites or out of them, as the menu's star
    // and the element's action toggle {id, on} ask (favourite.toggle).
    async setFavourite(key, on) {
        const answer = await this.raise("favourite.toggle", {key, on});
        if (answer.answer === "applied" && Array.isArray(answer.favourites)) {
            this.navigation = {...this.navigation, favourites: answer.favourites};
            this.update("favourite");
        }
        return answer;
    }

    // ─── the site switcher ───────────────────────────────────────────────────

    // Whenever the host switches sites, however many there are now: with one
    // site the switcher was a dead button, and read as broken (owner,
    // 2026-10-14). Its list says which site this is and finds the others.
    canSwitchSite() {
        return this.offers("site-switch");
    }

    // The sites are the Framework's standard menu (owner, 2026-10-12): the
    // same list with a search as the languages in the profile menu, searched by
    // the host because an agency may have hundreds of sites.
    async openSites(anchor) {
        if (!this.canSwitchSite()) return;
        this.sites = {...this.sites, open: true, query: "", items: [], next: null};
        const opened = await openMenu(this, anchor, {
            label: this.text("chooseSite"),
            // As wide as the switcher it opens from (owner, 2026-10-14), but in
            // the narrow rail, where the switcher is a picture.
            width: this.compact ? "content" : "trigger",
            entries: this.siteEntries(),
            search: {placeholder: this.text("findSite"), empty: this.text("nothingFound"), remote: true},
            onSearch: (query) => this.searchSites(query),
            onClose: () => { this.sites = {...this.sites, open: false}; },
            select: (id) => {
                const [kind, key] = String(id ?? "").split(/:(.*)/su);
                if (kind === "site") return this.switchSite(key);
                if (kind === "more") return this.searchSites(this.sites.query, {more: true});
                return null;
            },
        });
        // openMenu answers whether the menu opened (true), for the boolean
        // menu and the outcome menu alike; a refused or unavailable open
        // leaves the switcher closed.
        if (opened !== true) {
            this.sites = {...this.sites, open: false};
            return;
        }
        await this.searchSites("");
    }

    siteEntries() {
        const current = this.navigation?.site?.current?.key;
        const entries = this.sites.items.map((site) => ({
            id: `site:${site.key}`, text: site.label, caption: site.caption,
            initials: site.mark || getInitials(site.label ?? ""),
            kind: "radio", checked: site.key === current,
        }));
        if (this.sites.next !== null && this.sites.next !== undefined) {
            entries.push({id: "more", text: this.text("moreSites"), icon: "expand_more", keepOpen: true, disabled: this.sites.loading});
        }
        const manage = this.navigation?.site?.manage_href;
        if (manage) entries.push({type: "separator"}, {id: "manage", text: this.text("manageSites"), icon: "settings", href: manage});
        return entries;
    }

    closeSites() {
        if (this.sites.open) closeMenu(this);
        this.sites = {...this.sites, open: false};
    }

    // Asked of the host, a page at a time; never filtered here, because an
    // agency may have hundreds of sites.
    async searchSites(query, {more = false} = {}) {
        const sequence = ++this.sites.sequence;
        this.sites = {...this.sites, query, loading: true};
        const answer = await this.raise("sites.search", {query, cursor: more ? this.sites.next : null});
        if (sequence !== this.sites.sequence) return;
        if (answer.answer === "applied") {
            this.sites = {
                ...this.sites,
                loading: false,
                items: more ? [...this.sites.items, ...(answer.items ?? [])] : (answer.items ?? []),
                next: answer.next_cursor ?? null,
            };
        } else {
            this.sites = {...this.sites, loading: false};
        }
        if (this.sites.open) updateMenu(this, this.siteEntries());
    }

    async switchSite(key) {
        this.closeSites();
        if (key === this.navigation?.site?.current?.key) return;
        const sequence = ++this.sequence;
        const answer = await this.raise("site.switch", {site: key, sequence});
        this.accept(answer, sequence);
    }

    // ─── the profile menu ────────────────────────────────────────────────────

    currentLanguage() {
        const code = this.navigation?.person?.language;
        return (this.navigation?.person?.languages ?? []).find((entry) => entry.code === code) ?? null;
    }

    // Applied at once through the Framework's own theme switch, which every page
    // on the Framework already answers; the host keeps it for the next page.
    async chooseTheme(theme) {
        globalThis.SF?.Loader?.setTheme?.(theme);
        this.navigation = {...this.navigation, person: {...this.navigation.person, theme}};
        this.update("theme");
        if (this.offers("preferences")) await this.raise("preference.theme", {theme});
    }

    // Framework components change language without a reload; whether the host's
    // own page needs one is the host's answer, not this component's guess.
    async chooseLanguage(code) {
        globalThis.SF?.language?.use?.(code);
        this.navigation = {...this.navigation, person: {...this.navigation.person, language: code}};
        if (!this.offers("preferences")) return;
        const answer = await this.raise("preference.language", {language: code});
        if (answer.answer === "applied" && answer.reload === true) globalThis.location?.reload?.();
    }

    async chooseProfile(key) {
        if (key === this.navigation?.profiles?.current) return;
        const answer = await this.raise("view.profile", {profile: key});
        if (answer.answer === "applied" && answer.navigation) {
            this.accept({...answer.navigation, answer: "applied"}, this.sequence);
        }
    }

    async signOut() {
        const answer = await this.raise("session.sign-out", {});
        if (answer.answer !== "applied") return;
        this.mayLeave({id: "session.sign-out", key: "session.sign-out", href: answer.href ?? null});
    }

    // ─── the edit mode ───────────────────────────────────────────────────────

    currentProfile() {
        const profiles = this.navigation?.profiles;
        return profiles?.list?.find((entry) => entry.key === profiles.current) ?? null;
    }

    mayEdit(profile = this.currentProfile()) {
        const rights = this.navigation?.rights ?? {};
        if (!profile) return false;
        return profile.kind === "shared" ? Boolean(rights.edit_shared) : Boolean(rights.edit_personal);
    }

    // The pencil is there when something can be edited at all: the current
    // profile, or a personal one the edit mode can move to.
    canEdit() {
        if (!this.offers("menu-profiles") || !this.navigation) return false;
        return this.mayEdit() || Boolean(this.navigation.rights?.edit_personal);
    }

    // ─── the setting mode's levels (C326 = C298, AM-28) ────────────────────

    // The profiles a level stands for: «Лично» is the person's personal
    // profile; «Для всех» the shared profile everyone starts from (the port's
    // profiles.default, else the first shared one); «Профиль настроек» every
    // other shared profile, one at a time (a role's, as «Операторы»).
    personalProfile() {
        return (this.navigation?.profiles?.list ?? []).find((entry) => entry.kind === "personal") ?? null;
    }

    everyoneProfile() {
        const profiles = this.navigation?.profiles;
        const shared = (profiles?.list ?? []).filter((entry) => entry.kind === "shared");
        return shared.find((entry) => entry.key === profiles?.default) ?? shared[0] ?? null;
    }

    roleProfiles() {
        const everyone = this.everyoneProfile()?.key;
        return (this.navigation?.profiles?.list ?? []).filter((entry) => entry.kind === "shared" && entry.key !== everyone);
    }

    // The levels this person has: «Лично» with the right to a personal menu,
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
        const entry = (this.navigation?.profiles?.list ?? []).find((one) => one.key === profileKey);
        if (!entry) return null;
        if (entry.kind === "personal") return "personal";
        return entry.key === this.everyoneProfile()?.key ? "everyone" : "role";
    }

    // A shared level is a draft until «Сохранить для всех».
    isDraft() {
        return this.edit?.on && this.level.key !== "personal";
    }

    // Whether «Сбросить» has anything to bring back (AM-61: off when nothing
    // differs). A shared draft: its unsaved changes. «Лично»: the personal
    // profile differs from «Для всех» -- the port says so on the profile
    // (changed), else the menu knows it from its own saves and resets.
    canReset() {
        if (this.isDraft()) return this.level.dirty;
        const personal = this.personalProfile();
        if (typeof this.level.personalChanged === "boolean") return this.level.personalChanged;
        return personal?.changed !== false;
    }

    // The sections an administrator locked for everyone, by name, for the
    // lock line of the setting header (AM-42).
    lockedNames() {
        return (this.navigation?.items ?? []).filter((row) => row.locked).map((row) => row.label).filter(Boolean);
    }

    isLocked(row) {
        return Boolean(row?.locked) && !this.isDraft();
    }

    // ─── the setting mode (C325, AM-22, AM-24, AM-41, AM-61) ────────────────

    // A shared profile this person may not change is not edited by stealth:
    // the mode opens on «Лично», their personal profile, made from the one
    // they were looking at when they have none. `opener` is what opened the
    // mode -- "person" or a rail root's key -- and gets the focus back.
    async startEdit(opener = null) {
        if (!this.canEdit() || this.edit?.on) return;
        closeMenu(this);
        this.editOpener = opener;
        // The edit mode chooses a row's glyph with the grid dropdown, which the
        // menu fetches when it is first needed rather than with every page.
        globalThis.SF?.Loader?.ensure?.(["sf-dropdown", "sf-segmented"]);
        const rights = this.navigation.rights ?? {};
        if (rights.edit_personal) {
            let personal = this.personalProfile();
            if (!personal) {
                const made = await this.raise("view.create", {
                    label: this.text("personalName"), shared: false, from: this.navigation.profiles.current,
                });
                if (made.answer !== "applied") return this.editMessage(made.reason);
                personal = made.profiles?.list?.find((entry) => entry.kind === "personal");
            }
            if (!personal) return false;
            if (personal.key !== this.navigation.profiles.current && !(await this.switchProfile(personal.key))) return false;
            this.level = {key: "personal", draft: null, dirty: false};
        } else {
            const everyone = this.everyoneProfile();
            if (!everyone) return false;
            if (everyone.key !== this.navigation.profiles.current && !(await this.switchProfile(everyone.key))) return false;
            this.level = {key: "everyone", draft: everyone.key, dirty: false};
        }
        this.edit = {...this.edit, on: true, message: ""};
        // The current section's column is open for its rows to be edited.
        if (!this.openRoot && this.wide) {
            this.openRoot = this.pageRoot()?.key ?? this.siteRoots().find((root) => root.kind === "root")?.key ?? null;
        }
        this.update("edit");
        return true;
    }

    // A level chosen in the setting header. A shared draft with unsaved
    // changes asks once before it is left.
    async chooseLevel(level, profileKey = null) {
        if (!this.edit?.on) return false;
        const target = level === "personal" ? this.personalProfile()?.key
            : level === "everyone" ? this.everyoneProfile()?.key
                : profileKey ?? (this.level.key === "role" ? this.level.draft : null) ?? this.roleProfiles()[0]?.key;
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
        this.level = {...this.level, key: level, draft: level === "personal" ? null : target, dirty: false};
        this.edit = {...this.edit, message: ""};
        this.update("edit");
        return true;
    }

    // Whether an unsaved shared draft may be dropped: asked once, in the
    // Framework's confirm when the page has it.
    async leaveDraft() {
        if (!this.isDraft() || !this.level.dirty) return true;
        const question = this.text("draftLeave");
        const confirm = globalThis.SF?.confirm;
        const yes = typeof confirm === "function"
            ? await confirm({text: question, confirm: this.text("draftDrop"), cancel: this.text("cancel")})
            : globalThis.confirm?.(question) ?? true;
        const agreed = yes === true || yes?.outcome === "applied" || yes?.confirmed === true;
        if (agreed) this.level = {...this.level, dirty: false};
        return agreed;
    }

    // «Сохранить для всех»: the shared draft reaches its level.
    async saveDraft() {
        if (!this.isDraft() || !this.level.dirty) return false;
        const answer = await this.raise("view.save", {
            profile: this.navigation.profiles.current,
            revision: this.navigation.revision,
            layout: this.layoutOf(this.navigation.items ?? []),
        });
        if (answer.answer === "applied") {
            this.navigation = {...this.navigation, revision: answer.revision ?? this.navigation.revision};
            this.level = {...this.level, dirty: false};
            this.edit = {...this.edit, message: this.text("savedForAll")};
            this.update("edit");
            return true;
        }
        this.editMessage(answer.answer === "conflict" ? this.text("conflict") : answer.reason);
        return false;
    }

    // «Готово», Escape and «Закончить настройку» do the same (AM-61):
    // «Лично» is already saved, so they close; an unsaved shared draft asks
    // once. The menu goes back to the person's own profile and the rail, and
    // the focus to what opened the mode.
    async exitEdit() {
        if (!this.edit?.on) return false;
        if (!(await this.leaveDraft())) return false;
        const back = this.isDraft() ? this.personalProfile()?.key ?? null : null;
        this.stopEdit();
        if (back) await this.switchProfile(back);
        this.level = {key: "personal", draft: null, dirty: false};
        // The rail is drawn anew when the mode ends: the focus goes to the
        // opener after that draw (rendered), not to the node it replaces.
        this.pendingFocus = "opener";
        this.update("edit");
        return true;
    }

    focusOpener() {
        const opener = this.editOpener;
        this.editOpener = null;
        const root = this.element;
        const target = opener && opener !== "person"
            ? root.querySelector(`.sf-admin-nav-first a.sf-admin-nav-row--first[data-key="${CSS.escape(opener)}"]`)
            : null;
        (target ?? root.querySelector(".sf-admin-nav-person"))?.focus({preventScroll: true});
    }

    // Escape is someone else's while a menu, a window or the notifications
    // panel is open, or a name is being typed in the menu. sf-search marks its
    // open window with the host state data-open, not open (1.17.2).
    escapeTaken(event) {
        if ([...document.querySelectorAll("sf-menu-context")].some((menu) => menu.isOpen)) return true;
        if (document.querySelector("sf-search[data-open], sf-modal[open], sf-confirm[open]")) return true;
        if (this._notices?.hasAttribute?.("open") || this._setPanel?.hasAttribute?.("open")) return true;
        const target = event.composedPath?.()[0] ?? event.target;
        return Boolean(target?.closest?.("input, textarea, [contenteditable='true']") && this.element.contains(target));
    }

    stopEdit() {
        closeMenu(this);
        this.edit = {on: false, renaming: null, adding: null, rowMenu: null, profiles: false, naming: null, message: ""};
        // The column goes back to the page once the edit is done.
        this.openRoot = null;
        this.update("edit");
    }

    // A refusal is said in words: the host's codes are for logs. One the menu
    // knows by name is translated, the rest is named as it came.
    reasonText(reason) {
        const code = String(reason ?? "");
        if (!code) return "";
        if (code === "admin_menu_layout_href_invalid") return this.text("hrefInvalid");
        if (/\s/u.test(code)) return code;
        return this.text("refused").replace("{reason}", code);
    }

    editMessage(text) {
        this.edit = {...this.edit, message: this.reasonText(text)};
        this.update("edit");
        return false;
    }

    async switchProfile(key) {
        const answer = await this.raise("view.profile", {profile: key});
        if (answer.answer !== "applied" || !answer.navigation) return this.editMessage(answer.reason);
        this.accept({...answer.navigation, answer: "applied"}, this.sequence);
        return true;
    }

    // The whole layout, read off the menu as it is drawn: where every row sits,
    // its order, whether it is hidden, a name a person gave it, and their own
    // rows. A save is always the whole of it, against the revision it came from.
    layoutOf(items) {
        const layout = {schema_version: 1, items: {}, own: []};
        const place = (row, parent, order) => {
            const named = row.label !== (row.package_label ?? row.label) ? row.label : null;
            if (row.own) {
                layout.own.push({
                    key: row.key, kind: row.kind, parent, order,
                    label: row.label ?? null, icon: row.icon ?? null, href: row.href ?? null,
                });
            } else {
                // A glyph chosen for a package's row is saved with it: it was
                // written as null, so every choice was lost on the next read
                // (owner, 2026-10-14). Where the host says the package's own
                // glyph, only a different one is saved; where it does not, the
                // row's glyph is, so a chosen one is never dropped.
                const chosen = "package_icon" in row ? (row.icon !== row.package_icon ? row.icon ?? null : null) : row.icon ?? null;
                layout.items[row.key] = {parent, order, hidden: Boolean(row.hidden), label: named, icon: chosen};
                // A section an administrator locked for everyone (AM-42): the
                // lock rides the shared profile's layout with its reason.
                if (row.locked) layout.items[row.key].locked = {reason: row.locked.reason ?? null};
            }
        };
        items.forEach((root, rootIndex) => {
            place(root, null, rootIndex);
            (root.children ?? []).forEach((row, index) => place(row, root.key, index));
        });
        return layout;
    }

    // Every change is drawn at once and saved at once (assignment, section 7).
    // A conflict reads the menu again, with the reason said; nothing is merged
    // behind the person's back.
    // A shared level is a draft (C326 = C298, AM-28): drawn at once, saved
    // only by «Сохранить для всех» (saveDraft).
    async change(mutate) {
        const items = JSON.parse(JSON.stringify(this.navigation.items ?? []));
        mutate(items);
        this.navigation = {...this.navigation, items};
        this.edit = {...this.edit, message: ""};
        if (this.isDraft()) {
            this.level = {...this.level, dirty: true};
            this.update("edit-change");
            return true;
        }
        this.level = {...this.level, personalChanged: true};
        this.update("edit-change");
        const answer = await this.raise("view.save", {
            profile: this.navigation.profiles.current,
            revision: this.navigation.revision,
            layout: this.layoutOf(items),
        });
        if (answer.answer === "applied") {
            this.navigation = {...this.navigation, revision: answer.revision ?? this.navigation.revision};
            return true;
        }
        this.editMessage(answer.answer === "conflict" ? this.text("conflict") : answer.reason);
        await this.load("refresh-after-conflict");
        return false;
    }

    // The list a key lives in: the roots, or one root's rows.
    listOf(items, parent) {
        if (parent === null || parent === "roots") return items;
        return items.find((root) => root.key === parent)?.children ?? null;
    }

    findIn(items, key) {
        for (const root of items) {
            if (root.key === key) return {row: root, list: items};
            const at = (root.children ?? []).find((row) => row.key === key);
            if (at) return {row: at, list: root.children};
        }
        return null;
    }

    // «Закрепить для всех» / «Открепить» from a row's ⋯ in a shared level
    // (AM-42): a locked section is fixed in every person's menu, its reason
    // said on its lock.
    setLocked(key, on) {
        if (!this.isDraft()) return null;
        return this.change((items) => {
            const found = this.findIn(items, key);
            if (found) found.row.locked = on ? {reason: this.text("lockedReason")} : null;
        });
    }

    // The rail's short menu (C325 В, AM-22): «Выше», «Ниже», «Скрыть из
    // меню» on a root, saved in the person's menu at once.
    async moveRoot(key, step) {
        const items = this.navigation?.items ?? [];
        const row = items.find((entry) => entry.key === key);
        if (!row || row.locked) return false;
        const group = items.filter((entry) => !entry.hidden && (entry.level === "install") === (row.level === "install"));
        const at = group.indexOf(row);
        const swap = group[at + step];
        if (!swap) return false;
        return this.personalChange((list) => {
            const a = list.findIndex((entry) => entry.key === key);
            const b = list.findIndex((entry) => entry.key === swap.key);
            if (a >= 0 && b >= 0) [list[a], list[b]] = [list[b], list[a]];
        });
    }

    async hideRoot(key) {
        const row = (this.navigation?.items ?? []).find((entry) => entry.key === key);
        if (!row || row.locked) return false;
        return this.personalChange((list) => {
            const found = list.find((entry) => entry.key === key);
            if (found) found.hidden = true;
        });
    }

    // A change outside the setting mode is the person's own (their personal
    // profile): the menu moves to it first when another one is shown.
    async personalChange(mutate) {
        const personal = this.personalProfile();
        if (!this.navigation?.rights?.edit_personal || !personal) return false;
        if (personal.key !== this.navigation.profiles.current && !(await this.switchProfile(personal.key))) return false;
        return this.change(mutate);
    }

    toggleHidden(key) {
        return this.change((items) => {
            const found = this.findIn(items, key);
            if (found) found.row.hidden = !found.row.hidden;
        });
    }

    renameRow(key, label) {
        this.edit = {...this.edit, renaming: null, rowMenu: null};
        const text = String(label ?? "").trim();
        if (!text) return this.update("edit");
        return this.change((items) => {
            const found = this.findIn(items, key);
            if (found) found.row.label = text;
        });
    }

    // A row's glyph, chosen in the edit mode from the same list as a record
    // section's (owner, 2026-10-13); saved in the profile with the row.
    setRowIcon(key, icon) {
        const next = String(icon ?? "").trim();
        if (!next) return this.update("edit");
        return this.change((items) => {
            const found = this.findIn(items, key);
            if (found) found.row.icon = next;
        });
    }

    returnPackageName(key) {
        this.edit = {...this.edit, rowMenu: null};
        return this.change((items) => {
            const found = this.findIn(items, key);
            if (found && found.row.package_label) found.row.label = found.row.package_label;
        });
    }

    removeOwnRow(key) {
        this.edit = {...this.edit, rowMenu: null};
        return this.change((items) => {
            const found = this.findIn(items, key);
            if (found?.row.own) found.list.splice(found.list.indexOf(found.row), 1);
        });
    }

    // A link's address, as the host keeps it: a path on this site, or an
    // https:// address. A bare host name gets https://; http:// is refused
    // (owner, 2026-10-14). A wrong address refused the whole layout, and the
    // rows added with it vanished on the next read.
    static linkAddress(value) {
        const text = String(value ?? "").trim();
        if (!text) return {error: "hrefInvalid"};
        if (text.startsWith("/") && !text.startsWith("//")) return {href: text};
        if (/^http:\/\//iu.test(text)) return {error: "hrefInsecure"};
        const full = /^[a-z][a-z0-9+.-]*:/iu.test(text) ? text : `https://${text.replace(/^\/\//u, "")}`;
        try {
            const url = new URL(full);
            if (url.protocol !== "https:" || !url.hostname.includes(".")) return {error: "hrefInvalid"};
            return {href: url.href};
        } catch {
            return {error: "hrefInvalid"};
        }
    }

    addLink(parent, label, href) {
        const name = String(label ?? "").trim();
        const address = this.constructor.linkAddress(href);
        if (!name || address.error) {
            this.edit = {...this.edit, linkError: name ? this.text(address.error) : this.text("linkNameEmpty")};
            return this.update("edit");
        }
        this.edit = {...this.edit, draft: null, linkError: ""};
        return this.addOwnRow(parent, "link", {label: name, href: address.href});
    }

    // A person's own rows get keys the layout recognises as theirs; the host
    // keeps them as they are, inside the profile they were made in.
    addOwnRow(parent, kind, {label = null, href = null} = {}) {
        this.edit = {...this.edit, adding: null};
        const key = `own.${Date.now().toString(36)}`;
        const row = {
            key, kind, level: "site", own: true, hidden: false, package_label: null,
            label: kind === "divider" ? null : (label || this.text(kind === "root" ? "newSection" : "newHeading")),
            icon: kind === "link" ? "open_in_new" : kind === "root" ? "folder" : null,
            href: kind === "link" ? href : null,
            attention: null, badge: null, shortcut: null, action: null,
            ...(kind === "root" ? {children: []} : {}),
        };
        return this.change((items) => this.listOf(items, parent)?.push(row)).then((saved) => {
            if (saved && kind === "root") {
                this.openRoot = key;
                this.edit = {...this.edit, renaming: key};
                this.update("edit");
            } else if (saved && kind === "heading") {
                this.edit = {...this.edit, renaming: key};
                this.update("edit");
            }
            return saved;
        });
    }

    // sf-sortable says what was moved and where to; this controller moves it in
    // the menu it holds and saves. A row moves within its list, or between the
    // top level and the open section's column (owner, 2026-10-14); a section
    // stays at the top level, as the menu is two levels deep.
    onSortableIntent(event) {
        if (!this.edit.on) return;
        // sf-sortable names a list by its id; the lists here are
        // `sf-admin-nav-list-roots` and `sf-admin-nav-list-<root key>`.
        const {item, from, to, index} = event.detail ?? {};
        const listKey = (id) => (typeof id === "string" && id.startsWith(LIST_ID) ? id.slice(LIST_ID.length) : null);
        const source = listKey(from);
        const target = listKey(to);
        if (!source || !target) return;
        if (source === target) {
            this.moveRow(source, item, index);
            return;
        }
        // The common sections stay among themselves.
        if (source === "install" || target === "install") return;
        this.moveRowBetween(source, target, item, index);
    }

    moveRowBetween(source, target, key, index) {
        const from = this.listOf(this.navigation.items ?? [], source === "roots" ? null : source);
        const row = from?.find((entry) => entry.key === key);
        if (!row || (target !== "roots" && row.kind === "root")) return null;
        return this.change((items) => {
            const list = this.listOf(items, source === "roots" ? null : source);
            const into = this.listOf(items, target === "roots" ? null : target);
            const at = list?.findIndex((entry) => entry.key === key) ?? -1;
            if (!into || at < 0) return;
            const [moved] = list.splice(at, 1);
            into.splice(Math.max(0, Math.min(index, into.length)), 0, moved);
        });
    }

    moveRow(listKey, key, index) {
        // The common sections move among themselves (AM-42: nothing silently
        // fixed): their list is the install's roots, in the order they stand.
        if (listKey === "install") {
            return this.change((items) => {
                const install = items.filter((row) => row.level === "install");
                const at = install.findIndex((row) => row.key === key);
                if (at < 0) return;
                const [row] = install.splice(at, 1);
                install.splice(Math.max(0, Math.min(index, install.length)), 0, row);
                let next = 0;
                items.forEach((entry, position) => {
                    if (entry.level === "install") items[position] = install[next++];
                });
            });
        }
        return this.change((items) => {
            const list = this.listOf(items, listKey === "roots" ? null : listKey);
            if (!list) return;
            const at = list.findIndex((row) => row.key === key);
            if (at < 0) return;
            const [row] = list.splice(at, 1);
            list.splice(Math.max(0, Math.min(index, list.length)), 0, row);
        });
    }

    // «Сбросить» (AM-61): a shared draft goes back to what its level holds;
    // «Лично» goes back to «Для всех» (the host's reset of the personal
    // profile). The mode stays; with nothing left to reset the button is off
    // and the focus moves on to «Готово».
    async resetProfile() {
        if (this.isDraft()) {
            if (!this.level.dirty) return;
            this.level = {...this.level, dirty: false};
            await this.switchProfile(this.navigation.profiles.current);
            this.update("edit");
            await this.focusDone();
            return;
        }
        this.level = {...this.level, personalChanged: false};
        const answer = await this.raise("view.reset", {
            profile: this.navigation.profiles.current, revision: this.navigation.revision,
        });
        if (answer.answer === "applied" && answer.navigation) {
            this.accept({...answer.navigation, answer: "applied"}, this.sequence);
            this.editMessage("");
            await this.focusDone();
            return;
        }
        this.editMessage(answer.answer === "conflict" ? this.text("conflict") : answer.reason);
        await this.load("refresh-after-conflict");
    }

    // The pressed «Сбросить» turns itself off; the focus goes on to «Готово»,
    // not to the page (AM-61).
    async focusDone() {
        this.pendingFocus = "done";
        this.update("edit");
    }

    focusPending() {
        const what = this.pendingFocus;
        this.pendingFocus = null;
        if (what === "opener") return this.focusOpener();
        if (what !== "done") return;
        // sf-button draws its own button: a frame later when it has not yet.
        const focus = (tries) => {
            const button = this.element.querySelector(".sf-admin-nav-edit-title sf-button button");
            if (button) button.focus({preventScroll: true});
            else if (tries) requestAnimationFrame(() => focus(tries - 1));
        };
        focus(3);
    }

    toggleEditProfiles() {
        this.edit = {...this.edit, profiles: !this.edit.profiles, naming: null};
        this.update("edit");
    }

    async editProfile(key) {
        this.edit = {...this.edit, profiles: false};
        if (key !== this.navigation.profiles.current) await this.switchProfile(key);
        this.update("edit");
    }

    startNaming(mode) {
        this.edit = {...this.edit, naming: mode, draft: null, message: ""};
        this.update("edit");
    }

    async createProfile(label, shared) {
        const text = String(label ?? "").trim();
        if (!text) return this.editMessage(this.text("profileNameEmpty"));
        const answer = await this.raise("view.create", {label: text, shared: Boolean(shared), from: this.navigation.profiles.current});
        if (answer.answer !== "applied") return this.editMessage(answer.reason);
        const made = answer.profiles?.list?.find((entry) => entry.label === text
            && !this.navigation.profiles.list.some((known) => known.key === entry.key));
        this.edit = {...this.edit, profiles: false, naming: null, draft: null};
        if (made) await this.switchProfile(made.key);
        else await this.load("requested");
    }

    async renameProfile(label, profile = this.navigation.profiles.current) {
        const text = String(label ?? "").trim();
        if (!text) return this.editMessage(this.text("profileNameEmpty"));
        const answer = await this.raise("view.rename", {profile, label: text});
        if (answer.answer !== "applied") return this.editMessage(answer.reason);
        this.navigation = {...this.navigation, profiles: answer.profiles ?? this.navigation.profiles};
        this.edit = {...this.edit, profiles: false, naming: null};
        this.update("edit");
    }

    async deleteProfile(profile = this.navigation.profiles.current) {
        const answer = await this.raise("view.delete", {profile});
        if (answer.answer !== "applied") return this.editMessage(answer.reason);
        this.edit = {...this.edit, profiles: false, naming: null};
        if (answer.navigation) this.accept({...answer.navigation, answer: "applied"}, this.sequence);
        else await this.load("requested");
        if (!this.mayEdit()) this.stopEdit();
    }

    // ─── the palette ─────────────────────────────────────────────────────────

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
        const wanted = tags.filter((tag) => !this._prefetched.has(tag) && !customElements.get(tag));
        if (!wanted.length) return null;
        wanted.forEach((tag) => this._prefetched.add(tag));
        return globalThis.SF?.Loader?.ensure?.(wanted) ?? null;
    }

    // The setting mode draws text buttons, fields, the levels, the profile
    // picker, the glyph dropdown and the sortable rows.
    prefetchEdit() {
        if (this.canEdit()) this.prefetch(["sf-button", "sf-input", "sf-segmented", "sf-profile-picker", "sf-dropdown", "sf-sortable"]);
    }

    preparePalette() {
        if (!this.offers("search") || customElements.get("sf-search")) return null;
        this._paletteCode ??= globalThis.SF?.Loader?.ensure?.(["sf-search"], {timeout: PRESS_WAIT})
            ?.then((answer) => {
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
            const drawn = this.element.whenRendered?.(null, {next: true});
            this.update("palette");
            await Promise.race([drawn, new Promise((settle) => setTimeout(settle, 1000))]);
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
        if (search.isOpen) search.close({reason: "close"});
        else {
            this.closeSites();
            search.open();
        }
    }

    closePalette() {
        const search = this.element.querySelector("sf-search.sf-admin-nav-search");
        if (search?.isOpen) search.close({reason: "api"});
    }

    // sf-search's provider (its simple path, which wraps it in a host of
    // simai.search-port): the port's search.query answered in the provider's
    // shape. A group is a scope of the window, with its results page (more);
    // a result of kind action is a command. The empty query is asked when the
    // window opens: its commands are the quick actions. A host that cannot
    // answer is the window's error state with «Повторить»; a refusal is an
    // empty answer.
    async askPalette(query, {signal} = {}) {
        const sequence = ++this._paletteSequence;
        const answer = await this.raise("search.query", {query: String(query ?? ""), sequence});
        if (signal?.aborted || sequence !== this._paletteSequence) return {groups: [], items: []};
        if (answer.answer === "unavailable") throw new Error(answer.reason || "unavailable");
        if (answer.answer !== "applied") return {groups: [], items: []};
        const groups = [];
        const items = [];
        const choices = new Map();
        (answer.groups ?? []).forEach((group, at) => {
            const key = String(group.key ?? `group-${at}`);
            const list = group.items ?? [];
            if (!list.length && !group.more) return;
            const scope = {id: key, label: group.label ?? key};
            if (group.more?.href) scope.more = group.more.href;
            if (Number.isInteger(group.total)) scope.count = group.total;
            groups.push(scope);
            list.forEach((item, index) => {
                const action = item.kind === "action";
                const id = String(item.key ?? `${key}:${index}`);
                choices.set(id, {group: key, item});
                items.push({
                    id, group: key, title: item.label ?? "", path: item.caption ?? "",
                    icon: item.icon || (action ? "bolt" : "description"),
                    ...(action ? {action: id} : {href: item.href ?? ""}),
                    ...(item.shortcut ? {shortcut: item.shortcut} : {}),
                });
            });
        });
        this._paletteChoices = choices;
        return {groups, items};
    }

    // A result chosen in the window: the port is told (search.choose), and an
    // applied answer is the menu's navigate, with the address the host gave;
    // the browser does not go there itself, as a row of the menu does not.
    // What the menu did not hand -- a group's results page, a page from the
    // recent list -- is an ordinary link the window follows.
    async onPaletteNavigate(event) {
        const chosen = this._paletteChoices.get(String(event.detail?.id ?? ""));
        if (!chosen) return;
        event.preventDefault();
        const answer = await this.raise("search.choose", {group: chosen.group, key: chosen.item.key});
        if (answer.answer !== "applied") return;
        const href = answer.href ?? chosen.item.href ?? null;
        if (!this.mayLeave({id: chosen.item.key, key: chosen.item.key, href})) return;
        if (chosen.item.kind !== "action" && this.navigation) {
            this.navigation = {...this.navigation, current: chosen.item.key};
            this.update("open");
        }
    }

    // The palette's key: the port's search_shortcut, else the element's
    // search-shortcut setting, else mod+k (AM-3).
    paletteShortcut() {
        const own = String(this.element.getAttribute?.("search-shortcut") ?? "").trim();
        const named = paletteShortcut(this.navigation);
        if (named !== PALETTE_SHORTCUT) return named;
        return own && parseShortcut(own) ? own : PALETTE_SHORTCUT;
    }

    // ─── notifications (C340-C342, AM-19, AM-43, AM-44) ────────────────────

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
    }

    // The page's drawer that holds the set's list, watched once: its open
    // state is the bell's aria-expanded.
    async setNoticesDrawer(drawer) {
        if (!this.offers("notifications")) return null;
        if (!customElements.get("sf-drawer")) await globalThis.SF?.Loader?.ensure?.(["sf-drawer"], {timeout: PRESS_WAIT});
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
            if (!open && wasOpen) this._noticesAnchor?.focus?.({preventScroll: true});
            wasOpen = open;
        }).observe(drawer, {attributes: true, attributeFilter: ["open"]});
    }

    async noticesDrawer() {
        if (!this.offers("notifications")) return null;
        if (!customElements.get("sf-drawer")) await globalThis.SF?.Loader?.ensure?.(["sf-drawer"], {timeout: PRESS_WAIT});
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
            drawer.append(body);
            // On the body, not the drawer: sf-drawer carries its content into
            // its portal at the end of the body, where a click does not reach
            // the drawer element (up to 1.15.0 a notice opened here was never
            // read and the panel stayed open).
            body.addEventListener("click", (event) => this.onNoticesClick(event));
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
        renderNotices(body, this, answer);
        if (Number.isInteger(answer?.unread) && this.navigation?.notifications) {
            this.navigation = {...this.navigation, notifications: {...this.navigation.notifications, unread: answer.unread}};
            this.update("notifications");
        }
    }

    async onNoticesClick(event) {
        const all = event.target.closest?.("[data-notices-read-all]");
        if (all) {
            event.preventDefault();
            await this.readNotices({all: true});
            return;
        }
        const link = event.target.closest?.("a[data-notice]");
        if (!link) return;
        await this.readNotices({keys: [link.dataset.notice], all: false}, {reload: false});
        this._notices?.close?.();
    }

    async readNotices(payload, {reload = true} = {}) {
        const answer = await this.raise("notifications.read", payload);
        if (answer.answer !== "applied") return;
        if (Number.isInteger(answer.unread) && this.navigation?.notifications) {
            this.navigation = {...this.navigation, notifications: {...this.navigation.notifications, unread: answer.unread}};
            this.update("notifications");
        }
        if (reload) await this.loadNotices();
    }

    // ─── the rail's «…» (AM-27) ────────────────────────────────────────────

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
        const order = this.roots().filter((row) => row.kind !== "divider" && row.kind !== "heading").map((row) => row.key);
        // Everything back first when there may be room again.
        if (used <= room && hidden.size) {
            const free = Math.floor((room - used) / step);
            if (free <= 0) return;
            const back = [...hidden].slice(0, free);
            back.forEach((key) => hidden.delete(key));
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
        const next = order.filter((key) => hidden.has(key));
        if (next.join("\n") === this.overflowRoots.join("\n")) return;
        this.overflowRoots = next;
        this.update("overflow");
    }

    openOverflow(anchor) {
        const entries = this.overflowRoots.map((key) => this.rootByKey(key)).filter(Boolean)
            .map((row) => ({id: `root:${row.key}`, text: row.label, icon: row.icon || undefined}));
        return openMenu(this, anchor, {
            label: this.text("moreSections"), entries, side: "inline-end", align: "start",
            select: (id) => {
                const key = String(id ?? "").replace(/^root:/u, "");
                const row = this.rootByKey(key);
                if (row) return this.openRow(row, null);
                return null;
            },
        });
    }

    // ─── the rail's short menu (C325 В, AM-22, AM-61) ──────────────────────

    // A right click on a rail root, or Shift+F10 and the menu key on it:
    // «Выше», «Ниже», «Скрыть из меню» and «Настроить меню…».
    openRootMenu(row, anchor) {
        if (this.edit?.on || !row || row.kind === "divider" || row.kind === "heading") return null;
        const mayChange = Boolean(this.navigation?.rights?.edit_personal) && this.offers("menu-profiles");
        const locked = Boolean(row.locked);
        const entries = [{type: "heading", text: row.label}];
        if (mayChange && row.key !== FAVOURITES_ROOT) {
            entries.push(
                {id: "up", text: this.text("moveUp"), icon: "arrow_upward", disabled: locked},
                {id: "down", text: this.text("moveDown"), icon: "arrow_downward", disabled: locked},
                {id: "hide", text: locked ? this.text("lockedHide") : this.text("hideFromMenu"), icon: locked ? "lock" : "visibility_off", disabled: locked},
            );
        }
        if (this.canEdit()) {
            entries.push({type: "separator"}, {id: "configure", text: `${this.text("configureMenu")}…`, icon: "tune"});
            this.prefetchEdit();
        }
        if (entries.length < 2) return null;
        return openMenu(this, anchor, {
            label: row.label, entries, side: "inline-end", align: "start",
            select: (id) => {
                if (id === "up") return this.moveRoot(row.key, -1);
                if (id === "down") return this.moveRoot(row.key, 1);
                if (id === "hide") return this.hideRoot(row.key);
                if (id === "configure") return this.startEdit(row.key);
                return null;
            },
        });
    }

    // After a draw: the rail's «…» is measured, and the host says whether
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
            text: (key) => this.text(key),
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
            columns: skeletonColumns(this.element),
        };
    }
}

// How many columns the skeleton draws (sf-admin-menu expected-columns): the
// columns the answered menu will take on a wide screen, which the server
// knows -- one where the page's row has no open root (the dashboard), two
// where it has. The shape of the first paint, never a limit.
// A person who hid the column has the rail alone from the first paint
// (AM-20, AM-49): the skeleton is the rail, not two columns.
export function skeletonColumns(element) {
    if (element?.getAttribute?.("expected-columns") === "1") return 1;
    return preferences()?.read(MENU_PREFERENCE)?.second === false ? 1 : 2;
}
