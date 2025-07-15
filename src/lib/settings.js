/*
 * AutoToC Chrome Extension - Settings Script
 * Author: CodexHere
 * GitHub: https://github.com/hangouthere/chrome-extension-autotoc
 */

const MainContainerSelectors =
    'article, #main, [role="main"], div.elementor-widget-theme-post-content, div.page-content, div.post-content';

const SecondaryContainerSelectors =
    'main, div.main, div.content, section.content, div.container';

const HeaderBlacklistSelectors =
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

    'autotoc-add-transparency': 1,
    'autotoc-flash-color': '#f28c38',
    'autotoc-main-container-selectors': MainContainerSelectors,
    'autotoc-secondary-container-selectors': SecondaryContainerSelectors,
    'autotoc-header-blacklist-selectors': HeaderBlacklistSelectors
};

class Settings {
    map = {};

    async init() {
        const savedSettings = await chrome.storage.sync.get(
            Object.keys(DefaultSettings)
        );
        this.map = Object.assign({}, DefaultSettings, savedSettings);
    }

    async updateStyles() {
        await this.init();

        const settingsNames = Object.keys(this.map);

        settingsNames.forEach(settingName => {
            document.documentElement.style.setProperty(
                `--${settingName}`,
                this.map[settingName]
            );
        });

        document.body.classList.toggle(
            'autotoc-has-transparency',
            this.map['autotoc-add-transparency']
        );
    }

    async saveSettings(newSettings) {
        const finalSettings = Object.assign({}, this.map, newSettings);
        await chrome.storage.sync.set(finalSettings);
        return chrome.runtime.lastError ? chrome.runtime.lastError : true;
    }

    async resetSettings() {
        await chrome.storage.sync.clear();
        return chrome.runtime.lastError ? chrome.runtime.lastError : true;
    }
}

window.AutoToC = window.AutoToC ?? {};
window.AutoToC.Settings = Settings;
