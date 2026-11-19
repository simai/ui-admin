import {html, nothing} from "lit";

// A rail control's name is a SIMAI Framework tooltip on hover and keyboard
// focus (C320, AM-25), not the browser's title: the Framework's data-tooltip
// controller links the control to its surface, keeps the timing of C59, says
// a shortcut on the control (aria-keyshortcuts) and closes it on Escape. The
// surfaces are collected while the menu draws and stand together at its end;
// they are placed fixed, so the rail's scroll box does not cut them. Off the
// rail nothing has a tooltip: the names are written.
export function tip(context, key, text, shortcut = null, {always = false, arrow = "inline-start"} = {}) {
    if ((!context.compact && !always) || !text || !Array.isArray(context.tips)) return nothing;
    const id = `${context.tipPrefix}-${context.tips.length + 1}`;
    context.tips.push({id, key, text, shortcut, arrow});
    return id;
}

export function renderTips(context) {
    if (!context.tips?.length) return nothing;
    return html`<div class="sf-admin-nav-tips">${context.tips.map((entry) => html`<sf-tooltip id=${entry.id}
        appearance="dark" arrow=${entry.arrow || "inline-start"} text=${entry.text} shortcut=${entry.shortcut || nothing}></sf-tooltip>`)}</div>`;
}
