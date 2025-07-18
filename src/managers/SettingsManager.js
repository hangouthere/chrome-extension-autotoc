/*
 * AutoToC Chrome Extension - Settings Script
 * Author: CodexHere
 * GitHub: https://github.com/hangouthere/chrome-extension-autotoc
 */

const MainContainerSelectors =
    'article, #main, [role="main"], div.elementor-widget-theme-post-content, div.page-content, div.post-content';

const SecondaryContainerSelectors =
    'main, div.main, div.content, section.content, div.container';

const HeadingBlacklistSelectors =
    '.hidden, header, footer, aside, [role="navigation"]';

const DefaultSettings = {
    'autotoc-button-bg': '#007bff',
    'autotoc-button-hover': '#0056b3',
    'autotoc-button-outline-width': 2,
    'autotoc-button-outline': '#a8d2ff',
    'autotoc-button-text': '#ffffff',
    'autotoc-button-width': 80,

    'autotoc-panel-bg': '#333333',
    'autotoc-panel-border-radius': 10,
    'autotoc-panel-heading-hover': '#ffaa5c',
    'autotoc-panel-heading': '#f28c38',
    'autotoc-panel-highlight': '#55195d',
    'autotoc-panel-outline-width': 2,
    'autotoc-panel-outline': '#f28c38',
    'autotoc-panel-text': '#e0e0e0',
    'autotoc-panel-nest-limit': 3,
    'autotoc-panel-font-name': 'Roboto',
    'autotoc-panel-font-size': 18,
    'autotoc-panel-toggle': '#ffc35c',

    'autotoc-add-transparency': 1,
    'autotoc-flash-color': '#f28c38',
    'autotoc-main-container-selectors': MainContainerSelectors,
    'autotoc-secondary-container-selectors': SecondaryContainerSelectors,
    'autotoc-heading-blacklist-selectors': HeadingBlacklistSelectors
};

class SettingsManager {
    #map = {};

    /** @type {HTMLElement} */
    #eventBus;

    get map() {
        return this.#map;
    }

    constructor(eventBus) {
        this.#eventBus = eventBus;
    }

    async init() {
        await this.#getSettings();
        await this.updateStyles();
    }

    destruct() {
        this.#map = null;
    }

    async saveSettings(newSettings) {
        const finalSettings = Object.assign({}, this.#map, newSettings);
        await chrome.storage.sync.set(finalSettings);
        return chrome.runtime.lastError ? chrome.runtime.lastError : true;
    }

    async resetSettings() {
        await chrome.storage.sync.clear();
        return chrome.runtime.lastError ? chrome.runtime.lastError : true;
    }

    async updateStyles(overrides = {}) {
        await this.#getSettings();

        const settingsNames = Object.keys(this.#map);

        settingsNames.forEach(settingName => {
            document.documentElement.style.setProperty(
                `--${settingName}`,
                overrides[settingName] ?? this.#map[settingName]
            );
        });

        document.body.classList.toggle(
            'autotoc-has-transparency',
            this.#map['autotoc-add-transparency']
        );
    }

    async #getSettings() {
        const savedSettings = await chrome.storage.sync.get(
            Object.keys(DefaultSettings)
        );

        this.#map = Object.assign({}, DefaultSettings, savedSettings);

        this.#eventBus.dispatchEvent(
            new CustomEvent('settingsChanged', { detail: this.#map })
        );
    }
}

window.AutoToC = window.AutoToC ?? {};
window.AutoToC.SettingsManager = SettingsManager;
