/*
 * AutoToC Chrome Extension - Content Script
 * Author: CodexHere
 * GitHub: https://github.com/hangouthere/chrome-extension-autotoc
 */

class AutoToCExtension {
    /** @type {SettingsManager} */
    #settings;
    /** @type {MutationManager} */
    #mutManager;
    /** @type {UiManager} */
    #uiManager;
    /** @type {ToCManager} */
    #tocManager;
    /** @type {ScrollManager} */
    #scrollManager;

    /** @type {HTMLElement} */
    #eventBus;
    /** @type {boolean} */
    #isDeleted;

    constructor() {
        this.#init();
    }

    async #init() {
        this.#eventBus = document.createElement('div'); // cheesy hack, but isolated

        // this.#uiManager = new AutoToC.UiManager(this.#eventBus);
        // this.#scrollManager = new AutoToC.ScrollManager(this.#eventBus);

        // this.#uiManager.init();
        // this.#scrollManager.init();

        this.#bindBusEvents();
        this.#bindChromeMessages();

        this.#settings = new AutoToC.SettingsManager(this.#eventBus);
        this.#settings.init();
    }

    #bindBusEvents() {
        this.#eventBus.addEventListener(
            'settingsChanged',
            this.#settingsChanged
        );

        this.#eventBus.addEventListener('uiReady', this.#uiReady);
        this.#eventBus.addEventListener('tocRefreshed', this.#tocRefreshed);
    }

    #settingsChanged = ({ detail: settingsMap }) => {
        this.#eventBus.removeEventListener(
            'settingsChanged',
            this.#settingsChanged
        );

        this.#uiManager = new AutoToC.UiManager(this.#eventBus, settingsMap);
        this.#mutManager = new AutoToC.MutationManager(
            this.#eventBus,
            settingsMap
        );

        this.#uiManager.init();
        this.#mutManager.init();
    };

    #uiReady = ({ detail: panelElement }) => {
        this.#scrollManager = new AutoToC.ScrollManager(this.#eventBus);
        this.#tocManager = new AutoToC.ToCManager(
            this.#eventBus,
            this.#settings.map,
            panelElement
        );

        this.#tocManager.init();
        this.#scrollManager.init();
    };

    #tocRefreshed = ({ detail: { numHeadings } }) => {
        AutoToC.Utils.updateExtIcon(
            numHeadings,
            numHeadings > 0 ? '#ffffff' : '#ce1717'
        );
    };

    #bindChromeMessages() {
        chrome.runtime.onMessage.addListener(async message => {
            if (this.#isDeleted) return;

            switch (message.action) {
                case 'toggle-panel':
                    this.#uiManager.togglePanel();
                    break;
                case 'refresh-panel':
                    this.#eventBus.dispatchEvent(
                        new CustomEvent('refreshTOC', {
                            detail: true
                        })
                    );
                    break;
                case 'delete-panel':
                    this.#uiManager.deletePanel();
                    this.#isDeleted = true;
                    break;
                case 'update-styles':
                    console.log(
                        'AutoToC: Settings changed, updating styles...'
                    );
                    await this.#settings.updateStyles();

                    this.#eventBus.dispatchEvent(
                        new CustomEvent('refreshTOC', {
                            detail: false
                        })
                    );

                    break;
            }
        });
    }
}

new AutoToCExtension();
