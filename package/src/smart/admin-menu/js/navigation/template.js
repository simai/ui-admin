import {html, nothing} from "lit";
import "./navigation.css";
import {avatarPicture} from "../../../avatar/js/picture";
import {renderKeys, renderPalette, renderSearchRow} from "./palette";
import {counterOf, dotPhrase, nameWithCounter} from "./counter.js";
import {renderPersonButton} from "./account";
import {renderEditHeader, renderEditRoots, renderEditRows} from "./edit";
import {isMenuKey} from "./context-menu.js";
import {isEditableTarget} from "../../../../component/kbd/js/shortcut";
import {renderTips, tip} from "./tips.js";

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

const icon = (name, rootClass = "flex-none") => (name
    ? html`<sf-icon root-class=${rootClass} aria-hidden="true" icon=${name}></sf-icon>`
    : nothing);

// A count in a row of the column is SIMAI Framework's badge on a text line of
// rung 1 (line="1", sf-badge--line-1; AM-59): as tall as the line, its label a
// step down, inside the row at its end, on the middle of the first line
// (AM-53). The menu sets no size of its own on it.
const attention = (row) => {
    if (row.attention) {
        return html`<span class="sf-admin-nav-row-end"><sf-badge appearance="tonal" size="1/3" line="1"
            status=${row.attention.tone} text=${row.attention.label}></sf-badge></span>`;
    }
    if (row.badge) {
        return html`<span class="sf-admin-nav-row-end"><sf-badge size="1/3" status="error" line="1"
            text=${String(row.badge)}></sf-badge></span>`;
    }
    // The host writes a row's keys in the Framework's notation (mod+shift+p) or
    // as text; the kbd unit draws either (C04).
    if (row.shortcut) return html`<span class="sf-admin-nav-row-keys">${renderKeys(row.shortcut, "plain")}</span>`;
    return nothing;
};

// On the rail a row's counter sits on its icon, the way chat apps put one on
// an avatar (simai/ui-source#12): the icon is wrapped in the SIMAI Framework's
// badge anchor. At the anchor's 1/2 step the rule draws a dot, and the number
// and the attention words go to the row's name («Задачи, 3 непрочитанных»).
// The bell carries the number itself (C342, AM-43): its anchor is the 1 step,
// where the badge rule draws the count. Counters take the danger role (owner,
// 2026-10-21).
const railCounter = (row) => {
    if (row.attention) return {dot: true, text: "", phrase: row.attention.label || dotPhrase()};
    return counterOf(row.badge);
};

const railIcon = (name, counter, {count = false} = {}) => html`<span class=${`sf-badge-anchor sf-badge-anchor--size-${count ? "1" : "1/2"} sf-badge-anchor--square sf-admin-nav-rail-anchor`}>${icon(name, "sf-admin-nav-row-icon")}${counter
    ? html`<span class=${`sf-badge sf-badge--anchored sf-badge--error${count && !counter.dot ? "" : " sf-badge--dot"}`} aria-hidden="true">${count && !counter.dot ? counter.text : nothing}</span>`
    : nothing}</span>`;

// The place's mark (AM-5): SIMAI Framework's avatar picture as a square of
// the rail -- the place's own picture (site.logo) or its letters on the
// primary plate; a place with neither shows the product's mark
// (navigation.product.logo) in the same square.
function mark(context, site) {
    const product = context.navigation?.product;
    const imageUrl = site?.logo || (!site?.mark && product?.logo) || "";
    return avatarPicture({
        imageUrl, name: site?.label ?? "", text: site?.mark || "", shape: "square", size: "1",
        rootClass: "sf-admin-nav-mark",
    });
}

function renderSite(context) {
    const {controller, navigation, compact} = context;
    const site = navigation?.site?.current;
    if (!site) return nothing;
    const switchable = controller.canSwitchSite();
    const tipId = tip(context, "site", site.label);
    const trigger = html`
        <button type="button" class="sf-admin-nav-site-trigger"
            aria-haspopup=${switchable ? "menu" : nothing}
            aria-expanded=${switchable ? "false" : nothing}
            aria-label=${compact ? site.label : nothing}
            data-tooltip=${tipId}
            ?disabled=${!switchable}
            @click=${(event) => controller.openSites(event.currentTarget)}>
            ${mark(context, site)}
            ${compact ? nothing : html`
                <span class="sf-admin-nav-site-text">
                    <span class="sf-admin-nav-site-label">${site.label}</span>
                    ${site.caption ? html`<span class="sf-admin-nav-site-caption">${site.caption}</span>` : nothing}
                </span>
                ${switchable ? icon("unfold_more", "sf-admin-nav-site-chevron") : nothing}`}
        </button>`;
    return html`<div class="sf-admin-nav-site">${trigger}</div>`;
}

// The short menu of a rail root (C325 В, AM-22, AM-61): a right click, or
// Shift+F10 and the menu key on it.
function onRootContextMenu(context, row, event) {
    if (!context.compact || event.shiftKey || isEditableTarget(event.target)) return;
    const opened = context.controller.openRootMenu(row, event.currentTarget);
    if (opened) event.preventDefault();
}

function onRootKeydown(context, row, event) {
    if (!context.compact || !isMenuKey(event)) return;
    const opened = context.controller.openRootMenu(row, event.currentTarget);
    if (opened) {
        event.preventDefault();
        event.stopPropagation();
    }
}

// A row of the first level. A root with rows opens its column; a root with
// none is a page and opens it (assignment, section 1).
function renderFirstRow(context, row) {
    const {controller, compact, openRoot, text} = context;
    // A person's own rows at the top level: a line, a heading, a link, as in a
    // root's column. The rail has no headings.
    if (row.kind === "divider") return html`<hr class="sf-admin-nav-divider">`;
    if (row.kind === "heading") return compact ? nothing : html`<div class="sf-admin-nav-heading">${row.label}</div>`;
    if (compact && context.overflowRoots.includes(row.key)) return nothing;
    if (row.kind === "link") {
        return html`<a class="sf-admin-nav-row sf-admin-nav-row--first" href=${row.href ?? "#"} target="_blank" rel="noopener"
            data-key=${row.key} data-tooltip=${tip(context, row.key, row.label)} aria-label=${compact ? `${row.label}, ${text("external")}` : nothing}>
            ${icon(row.icon, "sf-admin-nav-row-icon")}
            ${compact ? nothing : html`<span class="sf-admin-nav-row-label">${row.label}</span>
                ${icon("north_east", "sf-admin-nav-row-chevron")}<span class="sr-only">, ${text("external")}</span>`}
        </a>`;
    }
    const opens = row.kind === "root";
    const open = opens && openRoot?.key === row.key;
    // One current mark (AM-26): the page's own row takes the plate; a root
    // whose rows hold the page is told as current to a screen reader
    // (aria-current="true", AM-37) and on the rail takes the filled square
    // (C354), unless another root's column holds the page.
    const current = !opens && controller.isCurrent(row.key);
    const holds = opens && controller.holdsCurrent(row) && !(row.key === "sf:favourites" && controller.pageRoot());
    return html`<a class="sf-admin-nav-row sf-admin-nav-row--first"
        href=${row.href ?? "#"}
        role=${opens ? "button" : nothing}
        aria-expanded=${opens ? String(open) : nothing}
        aria-current=${current ? "page" : holds ? "true" : nothing}
        data-key=${row.key}
        data-current=${current ? "true" : nothing}
        data-holds-current=${holds ? "true" : nothing}
        data-open=${open ? "true" : nothing}
        data-tooltip=${tip(context, row.key, row.label)}
        aria-label=${compact ? nameWithCounter(row.label, railCounter(row)) : nothing}
        @contextmenu=${(event) => onRootContextMenu(context, row, event)}
        @keydown=${(event) => onRootKeydown(context, row, event)}
        @click=${(event) => controller.openRow(row, event)}>
        ${compact ? railIcon(row.icon, railCounter(row)) : html`
            ${icon(row.icon, "sf-admin-nav-row-icon")}
            <span class="sf-admin-nav-row-label">${row.label}</span>
            ${attention(row)}
            ${opens ? icon("chevron_right", "sf-admin-nav-row-chevron") : nothing}`}
    </a>`;
}

// «…» (AM-27): the roots the rail has no room for, in a short menu; the
// current page's root always stays on the rail.
function renderOverflow(context) {
    const {controller, text, compact, overflowRoots} = context;
    if (!compact || !overflowRoots.length) return nothing;
    return html`<button type="button" class="sf-admin-nav-row sf-admin-nav-row--first sf-admin-nav-more"
        aria-haspopup="menu" aria-expanded="false" aria-label=${text("moreSections")}
        data-tooltip=${tip(context, "more", text("moreSections"))}
        @click=${(event) => controller.openOverflow(event.currentTarget)}>
        ${railIcon("more_horiz", null)}</button>`;
}

// «Уведомления» is a button with its panel (AM-19, C340): the bell opens the
// notifications on the right over the page, read from the port, whether or
// not the host names a page of their history (notifications.href is the
// panel's «Вся история»). On the rail the bell carries the number of unread
// (C342, AM-43).
function renderNotifications(context, notifications) {
    const {text, compact, controller} = context;
    const counter = counterOf(notifications.unread);
    const name = nameWithCounter(text("notifications"), counter);
    return html`<button type="button" class="sf-admin-nav-row sf-admin-nav-row--first sf-admin-nav-bell"
        aria-haspopup="dialog" aria-expanded="false" aria-label=${compact ? name : nothing}
        data-key="sf:notifications" data-tooltip=${tip(context, "notifications", text("notifications"))}
        @click=${(event) => controller.toggleNotifications(event.currentTarget)}>
        ${compact
            ? railIcon("notifications", counter, {count: true})
            : html`${icon("notifications", "sf-admin-nav-row-icon")}
                <span class="sf-admin-nav-row-label">${text("notifications")}</span>
                ${counter ? html`<span class="sf-admin-nav-row-end"><sf-badge size="1/3" status="error" line="1"
                    text=${counter.text}></sf-badge></span>` : nothing}`}
    </button>`;
}

function renderBottom(context) {
    const {navigation, controller} = context;
    const notifications = controller.offers("notifications") ? navigation?.notifications : null;
    const favourites = controller.edit?.on ? null : controller.favouritesRoot();
    return html`<div class="sf-admin-nav-bottom">
        ${favourites ? renderFirstRow(context, favourites) : nothing}
        ${notifications ? renderNotifications(context, notifications) : nothing}
        <div class="sf-admin-nav-person-row">${renderPersonButton(context)}</div>
    </div>`;
}

function renderFirstColumn(context) {
    const {controller, compact, edit} = context;
    const site = controller.siteRoots();
    const install = controller.installRoots();
    if (edit.on) {
        return html`<div class="sf-admin-nav-first" data-editing="true">
            ${renderSite(context)}
            ${renderEditHeader(context)}
            <div class="sf-admin-nav-scroll">${renderEditRoots(context, site, install)}</div>
            ${renderBottom(context)}
        </div>`;
    }
    return html`<div class="sf-admin-nav-first" data-compact=${compact ? "true" : nothing}>
        ${renderSite(context)}
        <div class="sf-admin-nav-scroll">
            <div class="sf-admin-nav-rows">
                ${renderSearchRow(context)}
                ${site.map((row) => renderFirstRow(context, row))}
            </div>
            ${install.length ? html`<hr class="sf-admin-nav-divider">
                <div class="sf-admin-nav-rows">${install.map((row) => renderFirstRow(context, row))}</div>` : nothing}
            ${renderOverflow(context)}
        </div>
        ${renderBottom(context)}
    </div>`;
}

// A row's name, with its section under it where rows of several sections
// meet (a favourite, C368, AM-48). A name takes up to two lines (AM-15).
const rowLabel = (row) => (row.caption
    ? html`<span class="sf-admin-nav-row-label" data-caption="true"><span class="sf-admin-nav-row-name">${row.label}</span><span class="sf-admin-nav-row-caption">${row.caption}</span></span>`
    : html`<span class="sf-admin-nav-row-label">${row.label}</span>`);

// A row of the section column: a heading, a divider, a page, a section that
// unfolds in place, or an external link. Any depth: a row of the third level
// stands one row column further in (C109, AM-14).
function renderRow(context, row, depth = 0) {
    const {controller, text} = context;
    if (row.kind === "heading") return html`<div class="sf-admin-nav-heading">${row.label}</div>`;
    if (row.kind === "divider") return html`<hr class="sf-admin-nav-divider">`;
    const section = row.kind === "section";
    const unfolded = section && controller.unfolded.has(row.key);
    const external = row.kind === "link";
    const current = controller.isCurrent(row.key);
    return html`<div class="sf-admin-nav-item" data-depth=${depth}>
        <a class="sf-admin-nav-row"
            href=${row.href ?? "#"}
            target=${external ? "_blank" : nothing}
            rel=${external ? "noopener" : nothing}
            role=${section ? "button" : nothing}
            aria-expanded=${section ? String(unfolded) : nothing}
            aria-current=${current ? "page" : nothing}
            data-current=${current ? "true" : nothing}
            data-holds-current=${section && !unfolded && !current && controller.holdsCurrent(row) ? "true" : nothing}
            @click=${(event) => controller.openRow(row, event)}>
            ${icon(row.icon, "sf-admin-nav-row-icon")}
            ${rowLabel(row)}
            ${attention(row)}
            ${external ? html`${icon("north_east", "sf-admin-nav-row-chevron")}<span class="sr-only">, ${text("external")}</span>` : nothing}
            ${section ? icon(unfolded ? "expand_less" : "expand_more", "sf-admin-nav-row-chevron") : nothing}
        </a>
    </div>
    ${unfolded ? html`<div class="sf-admin-nav-children">${(row.children ?? []).filter((child) => !child.hidden)
        .map((child) => renderRow(context, child, depth + 1))}</div>` : nothing}`;
}

// A row of the object menu: an ordinary link with its glyph, its name and,
// when the host gives one, its badge at its end as a row's attention is.
// No star and no ⋯: the object menu is the page's, not the person's.
function renderObjectRow(context, item, current) {
    const {controller} = context;
    const badge = item.badge && typeof item.badge === "object" && item.badge.text
        ? {attention: {tone: item.badge.status || "", label: String(item.badge.text)}}
        : {};
    return html`<div class="sf-admin-nav-item" data-depth="0">
        <a class="sf-admin-nav-row" href=${item.href ?? "#"}
            aria-current=${item.key === current ? "page" : nothing}
            data-current=${item.key === current ? "true" : nothing}
            @click=${(event) => controller.openObjectRow(item, event)}>
            ${icon(item.icon, "sf-admin-nav-row-icon")}
            <span class="sf-admin-nav-row-label">${item.label}</span>
            ${attention(badge)}
        </a>
    </div>`;
}

// The column's «hide» (C321, AM-51): the row's square with the row's glyph,
// its name and ⌘B in its tooltip. Not on a phone, where the column is a
// screen of its own with «←».
function renderHideColumn(context) {
    const {controller, text, wide, columnShortcut} = context;
    if (!wide || context.edit.on) return nothing;
    return html`<button type="button" class="sf-admin-nav-hide" aria-label=${text("hideColumn")}
        data-tooltip=${tip(context, "hide", text("hideColumn"), columnShortcut, {always: true, arrow: "top-center"})}
        @click=${() => controller.hideColumn()}>${icon("left_panel_close", "sf-admin-nav-row-icon")}</button>`;
}

// The object menu (navigation.context): «← back» to the list it came from,
// the object's title, under it its status and subtitle, then its groups of
// rows. On a phone it is the screen the menu opens on, with a button to the
// first screen beside the title.
function renderObjectColumn(context, menu) {
    const {controller, text, wide} = context;
    const status = menu.status
        ? html`<sf-badge class="sf-admin-nav-object-status" appearance="tonal" size="1/3"
            status=${menu.status.status || ""} text=${menu.status.text}></sf-badge>`
        : nothing;
    return html`<div class="sf-admin-nav-second" data-object="true" aria-label=${menu.title || nothing}>
        ${menu.back ? html`<div class="sf-admin-nav-back">
            <a class="sf-admin-nav-row" href=${menu.back.href}
                @click=${(event) => controller.openObjectRow(menu.back, event, {back: true})}>
                ${icon("arrow_back", "sf-admin-nav-row-icon")}
                <span class="sf-admin-nav-row-label">${menu.back.label || text("back")}</span>
            </a>
        </div>` : nothing}
        <div class="sf-admin-nav-second-head">
            ${wide ? nothing : html`<sf-button-icon size="1" appearance="ghost" scheme="on-surface"
                icon="menu" aria-label=${text("allSections")}
                @click=${() => controller.back()}></sf-button-icon>`}
            <div class="sf-admin-nav-second-title">
                <span class="sf-admin-nav-second-label">${menu.title}</span>
                ${menu.status || menu.subtitle ? html`<span class="sf-admin-nav-second-line">
                    ${status}
                    ${menu.subtitle ? html`<span class="sf-admin-nav-second-caption">${menu.subtitle}</span>` : nothing}
                </span>` : nothing}
            </div>
            ${renderHideColumn(context)}
        </div>
        <div class="sf-admin-nav-scroll">
            ${menu.groups.map((group, index) => html`
                ${group.label
                    ? html`<div class="sf-admin-nav-heading">${group.label}</div>`
                    : index > 0 ? html`<hr class="sf-admin-nav-divider">` : nothing}
                ${group.items.map((item) => renderObjectRow(context, item, menu.current))}`)}
        </div>
    </div>`;
}

// The section column: one head line with the section's name (AM-50: no
// scope line -- the rail's divider already parts the install's roots from
// the site's), «Найти в разделе» above 12 pages (C364), the rows, nothing at
// its foot (C367: creating is not the column's). «Избранное» empty says how a
// page gets in (C368).
function renderSecondColumn(context) {
    const {controller, text, openRoot, filter, wide} = context;
    if (context.objectMenu) return renderObjectColumn(context, context.objectMenu);
    if (!openRoot) return nothing;
    const rows = controller.rowsOf(openRoot);
    const favourites = openRoot.key === "sf:favourites";
    return html`<div class="sf-admin-nav-second" aria-label=${openRoot.label}>
        <div class="sf-admin-nav-second-head">
            ${wide ? nothing : html`<sf-button-icon size="1" appearance="ghost" scheme="on-surface"
                icon="arrow_back" aria-label=${text("back")} @click=${() => controller.back()}></sf-button-icon>`}
            <div class="sf-admin-nav-second-title">
                <span class="sf-admin-nav-second-label">${openRoot.label}</span>
            </div>
            ${renderHideColumn(context)}
        </div>
        ${context.edit.on ? html`<div class="sf-admin-nav-scroll">${renderEditRows(context, openRoot)}</div>` : nothing}
        ${!context.edit.on && controller.offersFind(openRoot) ? html`<div class="sf-admin-nav-find">
            <sf-input size="1" icon-start="search" placeholder=${text("findInSection")} value=${filter}
                @input=${(event) => controller.setFilter(event.target?.value ?? event.detail?.value ?? "")}></sf-input>
        </div>` : nothing}
        ${context.edit.on ? nothing : html`<div class="sf-admin-nav-scroll">
            ${rows.length
                ? rows.map((row) => renderRow(context, row))
                : html`<sf-empty-state class="sf-admin-nav-empty" layout="inline" kind=${favourites && !filter ? "empty" : "nothing-found"} size="1/2"
                    text=${favourites && !filter ? text("favouritesEmpty") : text("nothingFound")}></sf-empty-state>`}
        </div>`}
    </div>`;
}

// The menu until the host answers (and before a host is connected, for a menu
// whose entries come from the port): its own rows with bars where the icon and
// the name go (simai.interaction-rules, loading-is-a-skeleton), in the boxes
// the answered menu takes -- on a wide screen the rail and, unless the person
// hid it, the section column; on a phone one column the whole width -- so the
// menu's box is the same before and after the answer. The two boxes carry
// their widths in their own style attribute from the Framework's tokens
// (AM-18), so the box is right before this sheet has arrived; the sheet makes
// the skeleton the whole width on a phone. The word is for a screen reader
// only.
export const SKELETON_ROWS = 6;
export function renderNavigationSkeleton({text, columns = 2}) {
    const widths = ["w-3/4", "w-1/2", "w-2/3", "w-1/2", "w-3/4", "w-2/5"];
    const row = (width, rail) => html`<div class="sf-admin-nav-item"><div class="sf-admin-nav-row sf-admin-nav-row--first" aria-hidden="true">
        <div class="sf-skeleton sf-skeleton--animation-pulse"><div class="sf-skeleton-circle sf-skeleton-icon"></div></div>
        ${rail ? nothing : html`<div class="sf-skeleton sf-skeleton--animation-pulse" style="flex:1"><div class="sf-skeleton-text sf-skeleton-text--size-1/2 ${width}"></div></div>`}</div></div>`;
    const column = (name) => {
        const rail = name === "first";
        return html`<div class=${`sf-admin-nav-${name}`} data-compact=${rail ? "true" : nothing}
            style=${rail ? "inline-size: var(--sf-admin-nav-skeleton-rail, var(--sf-d4)); flex: none" : "inline-size: var(--sf-admin-nav-skeleton-second, var(--sf-f6)); flex: none"}><div class="sf-admin-nav-scroll">
        <div class="sf-admin-nav-rows">${Array.from({length: SKELETON_ROWS}, (_, at) => row(widths[at % widths.length], rail))}</div></div></div>`;
    };
    return html`<nav class="sf-admin-nav sf-admin-nav--skeleton" aria-busy="true" aria-label=${text("menu")} data-columns=${String(columns)}
        style="display: flex">
        ${column("first")}${columns === 1 ? nothing : column("second")}
        <span class="sr-only" role="status">${text("loading")}</span></nav>`;
}

export function renderNavigationTemplate(context) {
    const {status, text, controller, wide, screen, compact} = context;
    if (status === "loading") return renderNavigationSkeleton(context);
    if (status !== "ready") {
        // A menu that could not load says so as every component does, with
        // «Повторить» asking again.
        return html`<nav class="sf-admin-nav" aria-label=${text("menu")}><div class="sf-admin-nav-first">
            <sf-empty-state kind="error" size="1/2" text=${context.message || text("unavailable")}
                @sf-empty-state-action=${(event) => { if (event.detail?.id === "retry") controller.load("requested"); }}></sf-empty-state>
        </div></nav>`;
    }
    // On a phone the two columns are two screens; the second has «←».
    const phoneSecond = !wide && screen === "second";
    const first = phoneSecond ? nothing : renderFirstColumn(context);
    const second = wide || phoneSecond ? renderSecondColumn(context) : nothing;
    // The nav is named «Меню» (AM-37); the rail's tooltips stand after the
    // columns, collected while they were drawn.
    return html`<nav class="sf-admin-nav" aria-label=${text("menu")} data-wide=${wide ? "true" : "false"} data-compact=${compact ? "true" : nothing}>
        ${first}
        ${second}
        ${renderPalette(context)}
        ${renderTips(context)}
    </nav>`;
}
