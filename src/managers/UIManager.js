const TTY_TIMEOUT = 10000;
const DESTROY_TIMEOUT = 30000;

class UiManager {
    #settings;
    /** @type {Draggable} */
    #btnDraggable;
    /** @type {Draggable} */
    #panelDraggable;
    /** @type {HTMLElement} */
    #eventBus;
    /** @type {boolean} */
    #isVisible = true; // hack for toggle state

    #idleTimer;

    constructor(eventBus, settingsMap) {
        this.#eventBus = eventBus;
        this.#settings = settingsMap;
    }

    destruct() {
        if (this.#panelDraggable) {
            this.#panelDraggable.element.remove();
            this.#panelDraggable.destruct();
        }

        if (this.#btnDraggable) {
            this.#btnDraggable.element.remove();
            this.#btnDraggable.destruct();
        }

        this.#btnDraggable = this.#panelDraggable = null;
        this.#eventBus = null;
    }

    init() {
        this.#bindBusEvents();
        this.#buildUi();
    }

    #bindBusEvents() {
        this.#eventBus.addEventListener('tocRefreshed', this.#tocRefreshed);
    }

    #tocRefreshed = ({ detail: { numHeadings } }) => {
        const headingsMissing = 0 >= numHeadings;

        const statsFound = this.#panelDraggable.element.querySelector(
            '.autotoc-stats--found'
        );

        statsFound.textContent = headingsMissing
            ? 'No Headings Found'
            : `Found: ${numHeadings}`;

        if (headingsMissing) {
            this.#idleTimeout();
        }
    };

    #buildUi = () => {
        this.#injectGoogleFont(AutoToC.Utils.FONT);
        this.#injectGoogleFont(this.#settings['autotoc-panel-font-name']);
        this.#injectFloatingButton();
        this.#injectFloatingPanel();
        this.#bindUiEvents();

        this.#eventBus.dispatchEvent(
            new CustomEvent('uiReady', { detail: this.#panelDraggable.element })
        );
    };

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
        document.body.appendChild(panel);

        this.#panelDraggable = new AutoToC.Draggable(panel);
        const _resizable = new AutoToC.Resizable(panel);
    }

    #bindUiEvents() {
        const btn = this.#btnDraggable.element;
        const pnl = this.#panelDraggable.element;

        btn.addEventListener('mouseover', this.#onMouseToggleButton);
        btn.addEventListener('click', this.#onClickToggleButton);

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
            this.#onClickRefresh
        );

        pnl.querySelector('.autotoc-collapse')?.addEventListener(
            'click',
            this.#onClickCollapseAll
        );

        pnl.querySelector('.autotoc-expand')?.addEventListener(
            'click',
            this.#onClickExpandAll
        );

        pnl.querySelector('.autotoc-search-input')?.addEventListener(
            'input',
            this.#onSearch
        );
    }

    #onMouseToggleButton = e => {
        clearTimeout(this.#idleTimer);
        this.#idleTimer = setTimeout(this.#idleTimeout, TTY_TIMEOUT);
        this.#btnDraggable.element.classList.remove('inactive');
    };

    #idleTimeout = () => {
        this.#btnDraggable.element.classList.add('inactive');
    };

    #onClickToggleButton = e => {
        e.preventDefault();
        e.stopPropagation();
        if (!this.#btnDraggable.hasMoved) {
            this.#togglePanel();
        }
    };

    #onClickCollapseAll = e => {
        e.stopPropagation();
        this.#eventBus.dispatchEvent(
            new CustomEvent('toggleAllSections', { detail: false })
        );
    };

    #onClickExpandAll = e => {
        e.stopPropagation();
        this.#eventBus.dispatchEvent(
            new CustomEvent('toggleAllSections', { detail: true })
        );
    };

    #onClickRefresh = async e => {
        e.stopPropagation();
        this.#eventBus.dispatchEvent(
            new CustomEvent('refreshTOC', { detail: true })
        );
    };

    #onClickOptions = e => {
        e.stopPropagation();
        chrome.runtime.sendMessage({ action: 'open_options' });
    };

    #onClickClose = e => {
        e.stopPropagation();
        this.#togglePanel(false);
    };

    #onSearch = e => {
        this.#eventBus.dispatchEvent(
            new CustomEvent('applyFilter', {
                detail: e.target.value
            })
        );
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
            panel.classList.remove('hidden');
            panel.classList.add('visible');
            this.#eventBus.dispatchEvent(
                new CustomEvent('refreshTOC', { detail: false })
            );
        }
    }
}

window.AutoToC = window.AutoToC ?? {};
window.AutoToC.UiManager = UiManager;
