import {html, nothing} from "lit";
import "./default.css";

// The frame of an admin screen (sf-admin-shell). One root box, .sf-admin-shell,
// in the host's light DOM (the host is display: contents):
//
//   the skip link      first in the order of Tab, shown only while focused;
//   the bar            slot bar (sf-alert-bar), standing at the top;
//   the top line       on a phone only: the menu button, the product's name and
//                      slot top-end (the activity indicator, the bell);
//   the body           the menu's column (slot menu) and the work area: the
//                      main landmark with slot head (sf-header-page) and the
//                      content.
//
// The areas are empty boxes here: the element moves the page's own nodes
// into them (data-area), so the template never draws the page's parts and a
// drawing again leaves them where they are.
export function renderAdminShellTemplate(context) {
    const {id, width, reserve, product, skipLabel, menuLabel, menuOpen, hasMenu} = context;
    return html`<div class="sf-admin-shell" data-sf-admin-shell-part data-width=${width} data-reserve=${reserve}>
        <a class="sf-admin-shell__skip" href=${`#${id}-main`} @click=${context.onSkip}>${skipLabel}</a>
        <div class="sf-admin-shell__bar" data-area="bar"></div>
        <div class="sf-admin-shell__top">
            ${hasMenu
                ? html`<sf-button-icon class="sf-admin-shell__menu-button" icon=${menuOpen ? "close" : "menu"} appearance="ghost"
                    aria-label=${menuLabel} aria-expanded=${String(menuOpen)} aria-controls=${`${id}-menu`}
                    @click=${context.onMenuButton}></sf-button-icon>`
                : nothing}
            <span class="sf-admin-shell__product">${product}</span>
            <div class="sf-admin-shell__top-end" data-area="top-end"></div>
        </div>
        <div class="sf-admin-shell__body">
            <div class="sf-admin-shell__nav" id=${`${id}-menu`} data-area="menu"></div>
            <main class="sf-admin-shell__main" id=${`${id}-main`} tabindex="-1">
                <div class="sf-admin-shell__head" data-area="head"></div>
                <div class="sf-admin-shell__content" data-area="content"></div>
            </main>
        </div>
    </div>`;
}
