import {html, nothing} from "lit";
import {repeat} from "lit/directives/repeat.js";
import "./default.css";

// The background-activity indicator (sf-admin-activity). Nothing to show
// draws nothing. Otherwise one sf-popover: the trigger a quiet button with
// sf-badge («Идёт N», the failure mark beside it until the list was opened,
// «Не удалось N» in words when nothing runs), the surface the runs as
// sf-progress-run rows in the notice look and «Все действия».
//
// The badges are pictures of the counts; the button's name says them in
// words, and a polite status beside it says them again only when they change.
function renderBadges(context) {
    const {counts, word, size} = context;
    const running = counts.running
        ? html`<sf-badge activity="running" appearance="tonal" size=${size} aria-hidden="true"
            text=${word("running", {count: counts.running, vars: {count: counts.running}})}></sf-badge>`
        : nothing;
    let failed = nothing;
    if (counts.failed && !counts.running) {
        failed = html`<sf-badge activity="failed" appearance="tonal" size=${size} aria-hidden="true"
            text=${word("failed", {count: counts.failed, vars: {count: counts.failed}})}></sf-badge>`;
    } else if (counts.unseen) {
        failed = html`<sf-badge class="sf-admin-activity__mark" activity="failed" appearance="tonal" size=${size} icon-only aria-hidden="true"
            text=${word("failed", {count: counts.failed, vars: {count: counts.failed}})}></sf-badge>`;
    }
    return html`${running}${failed}`;
}

// A failed row: the notice look, which draws «Повторить» before «Развернуть»
// on a retryable failed run (sf-progress-run 1.6.0, AS-4) and sends retry.
function renderRun(context, run) {
    if (run.state === "failed") {
        return html`<div class="sf-admin-activity__run" data-run=${run.id} data-state="failed">
            <sf-progress-run look="notice" size="1/2" label=${run.label} run-state="failed" result-text=${run.text}
                ?retryable=${run.retryable}
                @sf-progress-run-retry=${() => context.onRetry(run)}
                @sf-progress-run-expand=${() => context.onExpand(run)}></sf-progress-run>
        </div>`;
    }
    return html`<div class="sf-admin-activity__run" data-run=${run.id} data-state="running">
        <sf-progress-run look="notice" size="1/2" label=${run.label}
            value=${run.value ?? nothing} total=${run.total ?? nothing} unit=${run.unit || nothing}
            ?cancelable=${run.cancelable}
            @sf-progress-run-cancel=${() => context.onCancel(run)}
            @sf-progress-run-expand=${() => context.onExpand(run)}></sf-progress-run>
    </div>`;
}

export function renderAdminActivityTemplate(context) {
    const {counts, word} = context;
    if (!counts.running && !counts.failed) return nothing;
    return html`<span class="sf-admin-activity" data-size=${context.size}>
        <sf-popover class="sf-admin-activity__popover" placement=${context.placement} label=${word("list-label")}
            @sf-popover-opened=${context.onOpened} @sf-popover-closed=${context.onClosed}>
            <button type="button" slot="trigger" class="sf-admin-activity__trigger" data-size=${context.size}
                aria-label=${context.name}>${renderBadges(context)}</button>
            <div slot="content" class="sf-admin-activity__surface">
                <div class="sf-admin-activity__list">
                    ${repeat(context.runs, (run) => run.id, (run) => renderRun(context, run))}
                </div>
                ${context.historyHref
                    ? html`<div class="sf-admin-activity__foot"><a href=${context.historyHref}>${word("history")}</a></div>`
                    : nothing}
            </div>
        </sf-popover>
        <span class="sr-only" role="status">${context.said}</span>
    </span>`;
}
