// sf-admin-activity and the edition of simai.admin-navigation-port its host
// declares. Pure: no element, no DOM (the unit tests import it).
//
// 1.2.0 adds the optional capability activity: activity.load answers the runs
// (activity_page), activity.retry {id} and activity.cancel {id} are a person's
// requests about one run. A host of an earlier edition has no activity, so the
// element asks it nothing and reads the setting runs the page gives it.

/** The editions the indicator takes (component.json x-port.supports). */
export const SUPPORTED_NAVIGATION_VERSIONS = ["1.1.0", "1.2.0"];
export const ACTIVITY_SINCE = "1.2.0";
export const ACTIVITY_INTENTS = ["activity.load", "activity.retry", "activity.cancel"];

const EDITION = /^(\d+)\.(\d+)\.(\d+)$/u;
const STATES = new Set(["running", "failed", "done", "cancelled"]);
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

/** Whether a host port offers activity: edition 1.2.0 or later (major 1) and the capability listed. */
export function offersActivity(port) {
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
export function runOf(item) {
    if (!item || typeof item !== "object" || item.id === undefined || item.id === null) return null;
    const state = STATES.has(item.state) ? item.state : "running";
    const number = (value) => (Number.isFinite(Number(value)) && value !== null && value !== "" ? Number(value) : undefined);
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
        retryable: item.retryable !== false,
    };
}

/** The runs of an activity.load / retry / cancel answer, or null when it carries none. */
export function runsOfAnswer(answer) {
    if (!answer || typeof answer !== "object" || !Array.isArray(answer.runs)) return null;
    return answer.runs;
}
