class UIManager {
    #extension;
    #settings;
    #btnDraggable;
    #panelDraggable;
    #headingsList;
    #eventBus;
    #isVisible;

    constructor(extension, settings, eventBus) {
        this.#extension = extension;
        this.#settings = settings;
        this.#eventBus = eventBus;
    }

    destruct() {
        if (this.#panelDraggable) this.#panelDraggable.element.remove();
        if (this.#btnDraggable) this.#btnDraggable.element.remove();
        this.#btnDraggable = this.#panelDraggable = null;
    }

    init() {
        this.#injectGoogleFont(FONT);
        this.#injectGoogleFont(this.#settings.map['autotoc-panel-font-name']);
        this.#injectFloatingButton();
        this.#injectFloatingPanel();
        this.#bindUiEvents();
    }

    #injectGoogleFont(fontName) {
        const fontLink = document.createElement('link');
        fontLink.href = `https://fonts.googleapis.com/css2?family=${fontName}&display=swap`;
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);
    }

    #injectFloatingButton() {
        if (this.#btnDraggable) return;

        const button = document.createElement('button');
        button.classList.add('autotoc-title', 'drag-handle');
        button.textContent = 'AutoToC';
        button.id = 'autotoc-button';
        document.body.appendChild(button);

        this.#btnDraggable = new AutoToC.Draggable(button);
    }

    #injectFloatingPanel() {
        if (this.#panelDraggable) return;

        const panel = document.createElement('div');
        panel.id = 'autotoc-panel';
        panel.classList.add('hidden');
        panel.innerHTML = AutoToC.TemplatePanelContents;
        this.#headingsList = panel.querySelector('.headings-list');
        document.body.appendChild(panel);

        this.#panelDraggable = new AutoToC.Draggable(panel);
        const _resizable = new AutoToC.Resizable(panel);
    }

    #bindUiEvents() {
        const btn = this.#btnDraggable.element;
        const pnl = this.#panelDraggable.element;

        btn.addEventListener('click', this.#onClickToggleButton);

        // TODO FIXME: Consider moving this to ToC manager?
        // this.#headingsList.addEventListener('click', e => {
        //     const elem = e.target;
        //     const classes = elem.classList;
        //     const isToggle = classes.contains('autotoc-toggle');
        //     const isHdrJump = classes.contains('autotoc-heading-jumper');

        //     if (!(isToggle || isHdrJump)) return;

        //     e.preventDefault();
        //     const listItem = elem.closest('li.heading-list-item');

        //     if (isToggle) {
        //         // TODO: this.#tocManager.toggleSection(listItem); --- old, delete after handled on ToCManager
        //         this.#eventBus.dispatchEvent(
        //             new CustomEvent('toggleSelection', { detail: listItem })
        //         );
        //     }

        //     if (isHdrJump) {
        //         // TODO: this.#tocManager.customScrollTo(listItem); --- old, delete after handled on ToCManager
        //         this.#eventBus.dispatchEvent(
        //             new CustomEvent('customScrollTo', { detail: listItem })
        //         );
        //     }
        // });

        pnl.querySelector('.autotoc-options-cog')?.addEventListener(
            'click',
            this.#onClickOptions
        );

        pnl.querySelector('.autotoc-close')?.addEventListener(
            'click',
            this.#onClickClose
        );

        pnl.querySelector('.autotoc-refresh')?.addEventListener(
            'click',
            async e => {
                e.stopPropagation();
                // TODO: await this.#extension.#tocManager.refreshTOC(); -- delete as well after listened to
                this.#eventBus.dispatchEvent(new Event('refreshTOC'));
                // TODO: NEED - make this an event from after `tocRefreshed` event --- this.#flashPanel();
            }
        );

        pnl.querySelector('.autotoc-collapse')?.addEventListener('click', e => {
            e.stopPropagation();
            // TODO: this.#extension.#tocManager.toggleAllSections(false); -- delete as well after listened to
            this.#eventBus.dispatchEvent(
                new CustomEvent('toggleAllSections', { detail: false })
            );
        });

        pnl.querySelector('.autotoc-expand')?.addEventListener('click', e => {
            e.stopPropagation();
            // TODO: this.#extension.#tocManager.toggleAllSections(true);
            this.#eventBus.dispatchEvent(
                new CustomEvent('toggleAllSections', { detail: true })
            );
        });

        pnl.querySelector('.autotoc-search-input')?.addEventListener(
            'input',
            e => {
                this.#eventBus.dispatchEvent(
                    new CustomEvent('filterHeadings', {
                        detail: e.target.value
                    })
                );
                // TODO:  this.#extension.#tocManager.filterHeadings(); -- delete as well after listened to
            }
        );
    }

    #onClickToggleButton = e => {
        e.preventDefault();
        e.stopPropagation();

        if (!this.#btnDraggable.hasMoved) {
            this.#togglePanel();
        }
    };

    #onClickOptions = e => {
        e.stopPropagation();
        chrome.runtime.sendMessage({ action: 'open_options' });
    };

    #onClickClose = e => {
        e.stopPropagation();
        this.#togglePanel(false);
    };

    async #togglePanel(forceToggle = null) {
        if (!this.#panelDraggable) return;

        const panel = this.#panelDraggable.element;
        this.#isVisible =
            forceToggle !== null ? !forceToggle : !this.#isVisible;

        if (this.#isVisible) {
            panel.classList.remove('visible');
            panel.classList.add('hidden');
        } else {
            // TODO: This should be handled by `visibility-changed` when detail=true in ToCManager
            // await this.#extension.#tocManager.refreshTOC();
            panel.classList.remove('hidden');
            panel.classList.add('visible');
        }

        this.#eventBus.dispatchEvent(
            new CustomEvent('visibility-changed', { detail: this.#isVisible })
        );
    }

    // !! FIXME - this needs to be handled by an event
    #flashPanel() {
        const flashDelay = 20;
        const headings = this.#headingsList.querySelectorAll(
            '.autotoc-heading-jumper'
        );

        headings.forEach((heading, idx) => {
            heading.style.animationDelay = `${flashDelay * idx}ms`;
            heading.classList.add('flash');
        });

        setTimeout(() => {
            headings.forEach(heading => heading.classList.remove('flash'));
        }, 3000);
    }

    #onScrollWindow(headings) {
        // !! FIXME -- This needs some attention!!
        // this.#headingsList
        //     .querySelectorAll('[data-autotoc-heading-idx] .focused')
        //     .forEach(el => el.classList.remove('focused'));
        // if (this.#extension.#tocManager.#isJumping) {
        //     return;
        // }
        // const topHeading = Utilities.getTopHeading(headings);
        // if (!topHeading) {
        //     console.log('AutoToC WARNING: NO HEADING FOUND TO SCROLL TO!');
        //     return;
        // }
        // const parentScrollTopHeading = Utilities.findParentScroll(topHeading);
        // const topHeadingRect = topHeading.getBoundingClientRect();
        // const parentScrollTopHeadingRect =
        //     parentScrollTopHeading.getBoundingClientRect();
        // const topHeadingHeight = topHeadingRect.top + topHeadingRect.height;
        // const parentScrollHeight =
        //     parentScrollTopHeadingRect.top + parentScrollTopHeadingRect.height;
        // const isOnScreen = topHeadingHeight < parentScrollHeight;
        // console.log(
        //     'parentScrollTopHeadingRect.top',
        //     parentScrollTopHeadingRect.top,
        //     'parentScrollTopHeadingRect.height',
        //     parentScrollTopHeadingRect.height,
        //     'topHeadingRect.top',
        //     topHeadingRect.top,
        //     'topHeadingRect.height',
        //     topHeadingRect.height
        // );
        // if (!isOnScreen) {
        //     return;
        // }
        // console.log('on screen!');
        // const idx = topHeading.dataset.autotocHeadingIdx;
        // const foundHeadingJumper = this.#headingsList.querySelector(
        //     `[data-autotoc-heading-idx="${idx}"]`
        // );
        // const parentScrollJumper =
        //     Utilities.findParentScroll(foundHeadingJumper);
        // const rect = foundHeadingJumper.getBoundingClientRect();
        // if (parentScrollJumper) {
        //     const oldMarginTop = foundHeadingJumper.style.scrollMarginTop;
        //     foundHeadingJumper.style.scrollMarginTop = '5px';
        //     foundHeadingJumper.scrollIntoView({ behavior: 'smooth' });
        //     foundHeadingJumper.style.scrollMarginTop = oldMarginTop;
        // }
        // foundHeadingJumper
        //     .querySelector('.autotoc-heading-jumper')
        //     .classList.add('focused');
    }
}

window.AutoToC = window.AutoToC ?? {};
window.AutoToC.UIManager = UIManager;
