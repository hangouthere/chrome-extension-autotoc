/*
 * AutoToC Chrome Extension - Background Script
 * Author: CodexHere
 * GitHub: https://github.com/hangouthere/chrome-extension-autotoc
 */

class AutoToCBackground {
    constructor() {
        this.#bindChromeEvents();
    }

    async #getCurrentTab() {
        const queryOptions = { active: true, lastFocusedWindow: true };
        const [tab] = await chrome.tabs.query(queryOptions);
        return tab;
    }

    async #updateBadge(message) {
        const tab = await this.#getCurrentTab();
        if (!tab) return;

        const { color, text } = message;
        await chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color });
        await chrome.action.setBadgeText({ tabId: tab.id, text: String(text) });
    }

    async #updateStylesAllTabs() {
        const url = ['file://*/*', 'http://*/*', 'https://*/*'];

        const sendMessage = async tab => {
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    action: 'update-styles'
                });
            } catch (error) {
                console.log(
                    `AutoToC: Error sending message to ${tab.title} -`,
                    error.message
                );
            }
        };

        const tabs = await chrome.tabs.query({ url });
        return Promise.all(tabs.map(sendMessage));
    }

    #onCommand = command => {
        // proxy command to the current window
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { action: command });
            }
        });
    };

    #onMessage = async message => {
        if (message.action === 'update_badge') {
            await this.#updateBadge(message);
        } else if (message.action === 'open_options') {
            await chrome.runtime.openOptionsPage();
        } else if (message.action === 'update-styles-all-tabs') {
            await this.#updateStylesAllTabs();
        }
    };

    #bindChromeEvents() {
        chrome.runtime.onMessage.addListener(this.#onMessage);
        // Commands are Chrome Keybind executions
        chrome.commands.onCommand.addListener(this.#onCommand);
    }
}

// Instantiate the background handler
new AutoToCBackground();
