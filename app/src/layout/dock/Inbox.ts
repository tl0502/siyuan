/// #if !MOBILE
import {Tab} from "../Tab";
import {setPanelFocus} from "../util";
import {getDockByType} from "../tabUtil";
/// #endif
import {updateHotkeyAfterTip} from "../../protyle/util/compatibility";
import {Model} from "../Model";
import {MenuItem} from "../../menus/Menu";
import {App} from "../../index";
import {hasClosestByClassName} from "../../protyle/util/hasClosest";
import {emitOpenMenu} from "../../plugin/EventBus";

export class Inbox extends Model {
    private element: Element;
    private selectIds: string[] = [];
    private currentPage = 1;
    private pageCount = 1;
    private data: { [key: string]: IInbox } = {};

    constructor(app: App, tab: Tab | Element) {
        super({app, id: tab.id});
        if (tab instanceof Element) {
            this.element = tab;
        } else {
            this.element = tab.panelElement;
        }
        /// #if MOBILE
        this.element.innerHTML = `<div class="toolbar toolbar--border toolbar--dark">
    <div class="fn__space"></div>
    <div class="toolbar__text">
        ${window.siyuan.languages.inbox}
        <span class="fn__space"></span>
        <span class="inboxSelectCount ft__smaller ft__on-surface"></span>
    </div>
    <span class="fn__flex-1"></span>
    <span class="fn__space"></span>
    <svg data-type="selectall" class="toolbar__icon"><use xlink:href="#iconUncheck"></use></svg>
    <svg data-type="previous" disabled="disabled" class="toolbar__icon"><use xlink:href='#iconLeft'></use></svg>
    <svg data-type="next" disabled="disabled" class="toolbar__icon"><use xlink:href='#iconRight'></use></svg>
    <svg data-type="more" class="toolbar__icon"><use xlink:href='#iconMore'></use></svg>
</div>
<div class="fn__loading fn__none">
    <img width="64px" src="/stage/loading-pure.svg"></div>
</div>
<div class="fn__flex-1 fn__none inboxDetails fn__flex-column" style="min-height: auto;background-color: var(--b3-theme-background)"></div>
<div class="fn__flex-1"></div>`;
        /// #else
        this.element.classList.add("fn__flex-column", "file-tree", "sy__inbox", "dockPanel");
        this.element.innerHTML = `<div class="block__icons">
    <div class="block__logo fn__flex-1">
        <svg class="block__logoicon"><use xlink:href="#iconInbox"></use></svg>${window.siyuan.languages.inbox}&nbsp;
        <span class="inboxSelectCount"></span>
    </div>
    <span data-type="selectall" class="block__icon"><svg><use xlink:href="#iconUncheck"></use></svg></span>
    <span class="fn__space"></span>
    <span data-type="previous" class="block__icon ariaLabel" disabled="disabled" data-position="north" aria-label="${window.siyuan.languages.previousLabel}"><svg><use xlink:href="#iconLeft"></use></svg></span>
    <span class="fn__space"></span>
    <span data-type="next" class="block__icon ariaLabel" disabled="disabled" data-position="north" aria-label="${window.siyuan.languages.nextLabel}"><svg><use xlink:href="#iconRight"></use></svg></span>
    <span class="fn__space"></span>
    <span data-type="more" data-menu="true" class="block__icon ariaLabel" data-position="north" aria-label="${window.siyuan.languages.more}"><svg><use xlink:href="#iconMore"></use></svg></span>
    <span class="fn__space"></span>
    <span data-type="min" class="block__icon ariaLabel" data-position="north" aria-label="${window.siyuan.languages.min}${updateHotkeyAfterTip(window.siyuan.config.keymap.general.closeTab.custom)}"><svg><use xlink:href="#iconMin"></use></svg></span>
</div>
<div class="fn__loading fn__none">
    <img width="64px" src="/stage/loading-pure.svg"></div>
</div>
<div class="fn__flex-1 fn__none inboxDetails fn__flex-column" style="min-height: auto;background-color: var(--b3-theme-background)"></div>
<div class="fn__flex-1"></div>`;
        /// #endif
        const countElement = this.element.querySelector(".inboxSelectCount");
        const detailsElement = this.element.querySelector(".inboxDetails");
        const selectAllElement = this.element.firstElementChild.querySelector('[data-type="selectall"]');
        this.element.lastElementChild.addEventListener("contextmenu", (event: MouseEvent) => {
            const itemElement = hasClosestByClassName(event.target as Element, "b3-list-item");
            if (itemElement) {
                this.more(event, itemElement);
            }
        });
        this.element.addEventListener("click", (event: MouseEvent) => {
            /// #if !MOBILE
            setPanelFocus(this.element);
            /// #endif
            let target = event.target as HTMLElement;
            while (target && !target.isEqualNode(this.element)) {
                if (target.tagName === "A") {
                    event.stopPropagation();
                    break;
                }
                const type = target.getAttribute("data-type");
                if (type === "min") {
                    getDockByType("inbox").toggleModel("inbox", false, true);
                    event.preventDefault();
                    break;
                } else if (type === "selectall") {
                    const useElement = target.querySelector("use");
                    if (useElement.getAttribute("xlink:href") === "#iconUncheck") {
                        this.element.lastElementChild.querySelectorAll(".b3-list-item").forEach(item => {
                            item.querySelector("use").setAttribute("xlink:href", "#iconCheck");
                            this.selectIds.push(item.getAttribute("data-id"));
                            this.selectIds = [...new Set(this.selectIds)];
                        });
                        useElement.setAttribute("xlink:href", "#iconCheck");
                    } else {
                        this.element.lastElementChild.querySelectorAll(".b3-list-item").forEach(item => {
                            item.querySelector("use").setAttribute("xlink:href", "#iconUncheck");
                            this.selectIds.splice(this.selectIds.indexOf(item.getAttribute("data-id")), 1);
                        });
                        useElement.setAttribute("xlink:href", "#iconUncheck");
                    }
                    countElement.innerHTML = `${this.selectIds.length.toString()}/${this.pageCount.toString()}`;
                    window.siyuan.menus.menu.remove();
                    event.stopPropagation();
                    break;
                } else if (type === "select") {
                    const useElement = target.querySelector("use");
                    if (useElement.getAttribute("xlink:href") === "#iconUncheck") {
                        this.selectIds.push(target.parentElement.getAttribute("data-id"));
                        this.selectIds = [...new Set(this.selectIds)];
                        useElement.setAttribute("xlink:href", "#iconCheck");
                    } else {
                        this.selectIds.splice(this.selectIds.indexOf(target.parentElement.getAttribute("data-id")), 1);
                        useElement.setAttribute("xlink:href", "#iconUncheck");
                    }
                    countElement.innerHTML = `${this.selectIds.length.toString()}/${this.pageCount.toString()}`;
                    selectAllElement.querySelector("use").setAttribute("xlink:href", this.element.lastElementChild.querySelectorAll('[*|href="#iconCheck"]').length === this.element.lastElementChild.querySelectorAll(".b3-list-item").length ? "#iconCheck" : "#iconUncheck");
                    window.siyuan.menus.menu.remove();
                    event.stopPropagation();
                    break;
                } else if (type === "previous") {
                    if (target.getAttribute("disabled") !== "disabled") {
                        this.currentPage--;
                        this.update();
                    }
                    event.preventDefault();
                    break;
                } else if (type === "next") {
                    if (target.getAttribute("disabled") !== "disabled") {
                        this.currentPage++;
                        this.update();
                    }
                    event.preventDefault();
                    break;
                } else if (type === "back") {
                    this.back();
                    event.preventDefault();
                    break;
                } else if (type === "more") {
                    this.more(event);
                    event.stopPropagation();
                    event.preventDefault();
                    break;
                } else if (target.classList.contains("b3-list-item")) {
                    const data = this.data[target.getAttribute("data-id")];
                    selectAllElement.classList.add("fn__none");
                    this.element.firstElementChild.querySelector('[data-type="previous"]').classList.add("fn__none");
                    this.element.firstElementChild.querySelector('[data-type="next"]').classList.add("fn__none");
                    detailsElement.innerHTML = this.genDetail(data);
                    detailsElement.setAttribute("data-id", data.oId);
                    detailsElement.classList.remove("fn__none");
                    detailsElement.scrollTop = 0;
                    this.element.lastElementChild.classList.add("fn__none");
                    event.preventDefault();
                    break;
                }
                target = target.parentElement;
            }
        });
        this.update();
    }

    private back() {
        this.element.firstElementChild.querySelector('[data-type="selectall"]').classList.remove("fn__none");
        this.element.firstElementChild.querySelector('[data-type="previous"]').classList.remove("fn__none");
        this.element.firstElementChild.querySelector('[data-type="next"]').classList.remove("fn__none");
        this.element.querySelector(".inboxDetails").classList.add("fn__none");
        this.element.lastElementChild.classList.remove("fn__none");
    }

    private genDetail(data: IInbox) {
        let linkHTML = "";
        /// #if MOBILE
        if (data.shorthandURL) {
            linkHTML = `<a href="${data.shorthandURL}" target="_blank">
        <svg class="toolbar__icon" style="float: left"><use xlink:href="#iconLink"></use></svg>
    </a>`;
        }
        return `<div class="toolbar">
    <svg data-type="back" class="toolbar__icon"><use xlink:href="#iconLeft"></use></svg>
    <span data-type="back" class="toolbar__text fn__flex-1">${data.shorthandTitle}</span>
    ${linkHTML}
</div>
<div class="b3-typography b3-typography--default" style="padding: 0 8px 8px">
${data.shorthandContent}
</div>`;
        /// #else
        if (data.shorthandURL) {
            linkHTML = `<span class="fn__space"></span><a href="${data.shorthandURL}" target="_blank" class="block__icon block__icon--show ariaLabel" data-position="north" aria-label="${window.siyuan.languages.link}">
        <svg><use xlink:href="#iconLink"></use></svg>
    </a>`;
        }
        return `<div class="block__icons">
    <div class="block__logo fn__pointer fn__flex-1" data-type="back">
        <svg class="block__logoicon"><use xlink:href="#iconLeft"></use></svg><span class="ft__breakword">${data.shorthandTitle}</span>
    </div>
    ${linkHTML}
</div>
<div class="b3-typography b3-typography--default" style="padding: 0 8px 8px;user-select: text" data-type="textMenu">
${data.shorthandContent}
</div>`;
        /// #endif
    }

    private genItemHTML(item: IInbox) {
        return `<li style="padding-left: 0" data-id="${item.oId}" class="b3-list-item">
    <span data-type="select" class="b3-list-item__action">
        <svg><use xlink:href="#icon${this.selectIds.includes(item.oId) ? "Check" : "Uncheck"}"></use></svg> 
    </span>
    <span class="fn__space--small"></span>
    <span class="b3-list-item__text" title="${item.shorthandTitle}${item.shorthandTitle === item.shorthandDesc ? "" : "\n" + item.shorthandDesc}">${item.shorthandTitle}</span>
    <span class="b3-list-item__meta">${item.hCreated}</span>
</li>`;
    }

    private more(event: MouseEvent, itemElement?: HTMLElement) {
        const detailsElement = this.element.querySelector(".inboxDetails");
        window.siyuan.menus.menu.remove();
        window.siyuan.menus.menu.append(new MenuItem({
            label: window.siyuan.languages.refresh,
            icon: "iconRefresh",
            click: () => {
                this.currentPage = 1;
                this.update();
            }
        }).element);
        const ids: string[] = [];
        if (this.app.plugins) {
            emitOpenMenu({
                plugins: this.app.plugins,
                type: "open-menu-inbox",
                detail: {
                    ids,
                    element: itemElement || detailsElement,
                },
                separatorPosition: "top",
            });
        }
        window.siyuan.menus.menu.popup({x: event.clientX, y: event.clientY + 16});
    }

    private update() {
        const loadingElement = this.element.querySelector(".fn__loading");
        this.element.lastElementChild.innerHTML = `<ul class="b3-list b3-list--background">
    <li class="b3-list--empty">
        ${window.siyuan.languages.inboxTip}
    </li>
</ul>`;
        loadingElement.classList.add("fn__none");
    }
}
