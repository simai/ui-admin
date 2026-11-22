import {html, nothing} from "lit";
import {repeat} from "lit/directives/repeat.js";
import "./default.css";

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
const LEVEL_ICON = {error: "error", warning: "warning", info: "info", success: "check_circle"};

function renderItem(context, item, fold = null) {
    const {word} = context;
    const level = item.resolved ? "success" : item.level;
    const icon = level ? LEVEL_ICON[level] : (item.icon || "notifications");
    const said = [item.level ? word(`level-${item.level}`) : "", item.unread ? word("unread") : ""].filter(Boolean).join(", ");
    const title = html`${item.title}${item.resolved ? html` <span class="sf-admin-notifications__resolved">${word("resolved")}</span>` : nothing}`;
    return html`<li class="sf-admin-notifications__item" data-key=${item.key}
            data-unread=${item.unread ? "true" : nothing} data-resolved=${item.resolved ? "true" : nothing}>
        <sf-icon class="sf-admin-notifications__glyph" data-level=${level || nothing} icon=${icon} size="1/2" aria-hidden="true"></sf-icon>
        <div class="sf-admin-notifications__what">
            ${item.href
                ? html`<a class="sf-admin-notifications__title" href=${item.href} @click=${(event) => context.onOpen(event, item)}>${title}</a>`
                : html`<span class="sf-admin-notifications__title">${title}</span>`}
            ${item.body ? html`<span class="sf-admin-notifications__body">${item.body}</span>` : nothing}
            <span class="sf-admin-notifications__meta">
                ${item.object ? html`<span>${item.object}</span>` : nothing}
                ${item.when ? html`<span>${item.when}</span>` : nothing}
                ${item.resolved ? html`<span>${item.resolved}</span>` : nothing}
                ${said ? html`<span class="sr-only">${said}</span>` : nothing}
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
    const fold = html`<button type="button" class="sf-admin-notifications__fold" data-fold=${id} aria-expanded=${String(open)}
        @click=${() => context.onFold(id)}>${open
            ? context.word("fold")
            : context.word("more-by", {count: row.rest.length, vars: {count: row.rest.length, object: row.item.object}})}</button>`;
    return html`${renderItem(context, row.item, fold)}${open ? row.rest.map((item) => renderItem(context, item)) : nothing}`;
}

function renderGroups(context) {
    const level = context.headingLevel;
    return repeat(context.groups, (group) => group.key, (group) => html`
        <div class="sf-admin-notifications__group">
            ${group.label ? html`<div class="sf-admin-notifications__day" role="heading" aria-level=${level}>${group.label}</div>` : nothing}
            <ul class="sf-admin-notifications__list">
                ${repeat(group.rows, (row) => row.item.key, (row) => renderRow(context, group, row))}
            </ul>
        </div>`);
}

function renderFoot(context) {
    const {word} = context;
    const more = context.more
        ? html`<sf-button class="sf-admin-notifications__more" size="1/2" appearance="outline" text=${word("load-more")}
            @click=${context.onMore}></sf-button>`
        : nothing;
    const links = [
        context.historyHref ? html`<a href=${context.historyHref}>${word("history")}</a>` : nothing,
        context.settingsHref ? html`<a href=${context.settingsHref}>${word("settings")}</a>` : nothing,
    ];
    if (!context.more && !context.historyHref && !context.settingsHref) return nothing;
    return html`<div class="sf-admin-notifications__foot">${more}${links}</div>`;
}

export function renderAdminNotificationsTemplate(context) {
    const {word, status, look} = context;
    if (status === "failed") {
        return html`<div class="sf-admin-notifications" data-look=${look} data-status="failed">
            <sf-alert status="error" heading=${word("failed-heading")} supporting-text=${context.reason || word("failed-text")}></sf-alert>
            <div class="sf-admin-notifications__retry">
                <sf-button size="1/2" appearance="outline" text=${word("retry")} @click=${context.onRetry}></sf-button>
            </div>
        </div>`;
    }
    if (status !== "ready") {
        return html`<div class="sf-admin-notifications" data-look=${look} data-status="loading" aria-busy="true">
            <p class="sf-admin-notifications__empty">${word("loading")}</p>
        </div>`;
    }
    const unread = context.unread;
    const empty = !context.groups.length;
    return html`<div class="sf-admin-notifications" data-look=${look} data-status="ready">
        <div class="sf-admin-notifications__head">
            <span class="sf-admin-notifications__count" role="status" tabindex="-1">${unread
                ? word("new-count", {count: unread, vars: {count: unread}})
                : word("none-new")}</span>
            ${unread
                ? html`<sf-button class="sf-admin-notifications__read-all" size="1/2" appearance="ghost" text=${word("read-all")}
                    @click=${context.onReadAll}></sf-button>`
                : nothing}
        </div>
        ${empty
            ? (context.hasEmptySlot
                ? html`<div class="sf-admin-notifications__empty">${context.emptySlot}</div>`
                : html`<p class="sf-admin-notifications__empty">${word("empty-text")}</p>`)
            : renderGroups(context)}
        ${renderFoot(context)}
    </div>`;
}
