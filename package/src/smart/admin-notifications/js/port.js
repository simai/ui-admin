// sf-admin-notifications and the edition of simai.admin-navigation-port its
// host declares. Pure: no element, no DOM (the unit tests import it).
//
// 1.2.0 adds three optional fields to a notification: object (what it is
// about), level (error, warning, info, success) and resolved (true, or the
// words of how it ended). A host of an earlier edition says none of them --
// its item schema is closed -- so its notifications are drawn exactly as in
// 1.1.0. The setting items (a page without a port) may say all of them.

/** The editions the list takes (component.json x-port.supports). */
export const SUPPORTED_NAVIGATION_VERSIONS = ["1.1.0", "1.2.0"];
export const FIELDS_SINCE = "1.2.0";

const EDITION = /^(\d+)\.(\d+)\.(\d+)$/u;
const LEVELS = new Set(["error", "warning", "info", "success"]);
const text = (value) => (value === null || value === undefined ? "" : String(value));

/** Whether an edition is at least another one, numerically (1.10.0 > 1.2.0). */
export function editionAtLeast(version, wanted) {
    const a = EDITION.exec(String(version ?? ""));
    const b = EDITION.exec(String(wanted ?? ""));
    if (!a || !b) return false;
    for (let i = 1; i <= 3; i += 1) {
        if (Number(a[i]) !== Number(b[i])) return Number(a[i]) > Number(b[i]);
    }
    return true;
}

/** Whether a host port's notifications may carry object, level and resolved. */
export function readsExtendedFields(port) {
    const version = typeof port?.version === "string" ? port.version : "";
    return version.startsWith("1.") && editionAtLeast(version, FIELDS_SINCE);
}

/**
 * One notification as the list draws it: the port's fields (key, title, body,
 * when, unread, icon, href) and, when `extended`, object, level and resolved.
 */
export function entryOf(item, extended = true) {
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
        resolvedText: extended && typeof item.resolved === "string" ? item.resolved : "",
    };
}
