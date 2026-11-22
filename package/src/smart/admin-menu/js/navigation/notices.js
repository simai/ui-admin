// The notifications panel's list (owner decisions C340, C341; AM-44): what
// the port's notifications.load answers, in its groups -- each notice its
// words, when, a link to where it is about -- the unread ones marked, with
// «Прочитать все» at the top and «Вся история» and «Настройки уведомлений»
// at the foot. The panel is SIMAI Framework's sf-drawer beside the page
// (controller.noticesDrawer), so its body is written as markup, not drawn by
// the menu's template; every text goes in as text.

const element = (tag, className, text = null) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== null && text !== undefined) node.textContent = String(text);
    return node;
};

export function renderNotices(body, controller, answer = {}) {
    const text = (key) => controller.text(key);
    body.replaceChildren();
    if (answer?.answer !== "applied") {
        const empty = element("sf-empty-state", "sf-admin-nav-notices-empty");
        empty.setAttribute("kind", "error");
        empty.setAttribute("size", "1/2");
        empty.setAttribute("text", text("unavailable"));
        body.append(empty);
        return;
    }
    const unread = Number.isInteger(answer.unread) ? answer.unread : 0;
    const head = element("div", "sf-admin-nav-notices-head");
    head.append(element("span", "sf-admin-nav-notices-count", unread ? `${text("noticesNew")} · ${unread}` : text("noticesNone")));
    if (unread) {
        const all = element("button", "sf-admin-nav-link-button", text("noticesReadAll"));
        all.type = "button";
        all.dataset.noticesReadAll = "";
        head.append(all);
    }
    body.append(head);
    for (const group of answer.groups ?? []) {
        const items = (group?.items ?? []).filter((item) => item && item.key);
        if (!items.length) continue;
        if (group.label) body.append(element("p", "sf-admin-nav-notices-group", group.label));
        const list = element("ul", "sf-admin-nav-notices-list");
        for (const item of items) {
            const row = element("li", "sf-admin-nav-notice");
            if (item.unread) row.dataset.unread = "true";
            if (item.resolved) row.dataset.resolved = "true";
            row.append(element("span", "sf-admin-nav-notice-dot"));
            const what = element("div", "sf-admin-nav-notice-what");
            what.append(element("span", "sf-admin-nav-notice-title", item.title ?? item.label ?? ""));
            if (item.body) what.append(element("span", "sf-admin-nav-notice-meta", item.body));
            const meta = element("span", "sf-admin-nav-notice-meta");
            if (item.when) meta.append(element("span", null, item.when));
            if (item.href) {
                const link = element("a", null, text("noticeOpen"));
                link.href = item.href;
                link.dataset.notice = item.key;
                meta.append(link);
            }
            what.append(meta);
            row.append(what);
            list.append(row);
        }
        body.append(list);
    }
    const foot = element("p", "sf-admin-nav-notices-foot");
    const history = controller.navigation?.notifications?.href;
    if (typeof history === "string" && history) {
        const link = element("a", null, text("noticesHistory"));
        link.href = history;
        foot.append(link);
    }
    if (typeof answer.settings_href === "string" && answer.settings_href) {
        const link = element("a", null, text("noticesSettings"));
        link.href = answer.settings_href;
        foot.append(link);
    }
    if (foot.childElementCount) body.append(foot);
}
