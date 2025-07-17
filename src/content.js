/*
 * AutoToC Chrome Extension - Content Script
 * Author: CodexHere
 * GitHub: https://github.com/hangouthere/chrome-extension-autotoc
 */

class AutoToCExtension {
    /** @type {UIManager} */
    #uiManager;
    /** @type {ToCManager} */
    #tocManager;
    /** @type {Settings} */
    #settings;
    /** @type {ScrollTracker} */
    #scrollTracker;
    /** @type {HTMLElement} */
    #eventBus;
    /** @type {boolean} */
    #isDeleted;

    constructor() {
        this.#init();
    }

    async #init() {
        this.#eventBus = document.createElement('div'); // cheesy hack
        this.#settings = new Settings();
        await this.#settings.init();

        this.#settings.updateStyles();

        this.#uiManager = new UIManager(this, this.#settings, this.#eventBus);

        this.#tocManager = new ToCManager(
            this,
            this.#settings,
            this.#uiManager
        );
        this.#bindChromeMessages();
        this.#uiManager.injectUI();
        await this.#tocManager.refreshTOC();
        this.#reconnectScrollTracking();
    }

    #bindChromeMessages() {
        chrome.runtime.onMessage.addListener(async message => {
            if (this.#isDeleted) return;
            
            switch (message.action) {
                case 'toggle-panel':
                    this.#uiManager.togglePanel();
                    break;
                case 'refresh-panel':
                    await this.#tocManager.refreshTOC();
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
                    await this.#tocManager.refreshTOC();
                    break;
            }
        });
    }

    #reconnectScrollTracking() {
        if (this.#scrollTracker) {
            this.#scrollTracker.disconnect();
        }
        this.#scrollTracker = new ScrollTracker(
            this.#tocManager.getHeadings(),
            this.#uiManager
        );
        this.#scrollTracker.connect();
    }
}

new AutoToCExtension();
