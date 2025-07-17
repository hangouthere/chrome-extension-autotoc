/*
 * AutoToC Chrome Extension - Options Script
 * Author: CodexHere
 * GitHub: https://github.com/hangouthere/chrome-extension-autotoc
 */

class AutoToCOptions {
    /** @type {SettingsManager} */
    #settings = null;
    /** @type {HTMLDivElement} */
    #notification = null;
    #inputs = {};

    constructor() {
        this.#initialize();
    }

    async #initialize() {
        this.#settings = new AutoToC.SettingsManager(
            document.createElement('div')
        );

        document.addEventListener('DOMContentLoaded', () => {
            this.#loadSettings();
            this.#injectNotification();
            this.#setupEventListeners();
        });
    }

    #injectNotification() {
        const notification = document.createElement('div');
        notification.id = 'autotoc-notification';

        document.body.appendChild(notification);

        this.#notification = notification;
    }

    #showNotification(message, isError = false) {
        const noti = this.#notification;

        noti.textContent = message;
        noti.classList.add(isError ? 'error' : 'success');

        setTimeout(() => {
            noti.classList.remove('error', 'success');
        }, 3000);
    }

    async #loadSettings() {
        await this.#settings.init();

        Object.keys(this.#settings.map).forEach(settingsName => {
            const inputElement = document.getElementById(settingsName);

            if (inputElement) {
                const isCheckbox = 'checkbox' === inputElement.type;
                const value = this.#settings.map[settingsName];

                // Use raw setting value for inputs (i.e., no "px" suffix)
                inputElement[isCheckbox ? 'checked' : 'value'] = value
                    ?.toString()
                    .startsWith('#')
                    ? value.substr(0, 7)
                    : value;
            } else {
                console.warn(`Input element for ${settingsName} not found!`);
            }
        });

        this.#settings.updateStyles();
    }

    #setupEventListeners() {
        const saveButton = document.getElementById('autotoc-save');
        const resetButton = document.getElementById('autotoc-reset');

        saveButton.addEventListener('click', this.#saveSettings.bind(this));
        resetButton.addEventListener('click', this.#resetSettings.bind(this));

        Object.keys(DefaultSettings).forEach(key => {
            const input = document.getElementById(key);
            if (input) {
                input.addEventListener('input', this.#handleInput);
            } else {
                console.warn(`Input element for ${key} not found!`);
            }
        });
    }

    #handleInput = event => {
        const inputElement = event.currentTarget;
        const value =
            'checkbox' === inputElement.type
                ? inputElement.checked
                : inputElement.value;

        this.#inputs[inputElement.id] = value;
        this.#settings.updateStyles();
    };

    async #saveSettings() {
        const result = await this.#settings.saveSettings(this.#inputs);

        if (true !== result) {
            console.error('Error saving settings:', result);
            this.#showNotification(
                'Error saving settings. Please try again.',
                true
            );
        } else {
            this.#showNotification('Settings saved!');
            chrome.runtime.sendMessage({ action: 'update-styles-all-tabs' });
            this.#settings.updateStyles();
        }
    }

    async #resetSettings() {
        const result = await this.#settings.resetSettings();

        if (true !== result) {
            console.error('Error resetting settings:', result);
            this.#showNotification(
                'Error resetting settings. Please try again.',
                true
            );
        } else {
            this.#inputs = {};

            this.#loadSettings();

            this.#settings.updateStyles();
            chrome.runtime.sendMessage({ action: 'update-styles-all-tabs' });

            this.#showNotification('Settings reset to defaults!');
        }
    }
}

new AutoToCOptions();
