class MutationManager {
    /** @type {HTMLElement} */
    #eventBus;
    /** @type {MutationObserver} */
    #mutationObserver;

    constructor(eventBus) {
        this.#eventBus = eventBus;
    }

    destruct() {
        if (this.#mutationObserver) this.#mutationObserver.disconnect();
        this.#eventBus = null;
    }

    init() {
        if (this.#mutationObserver) this.#mutationObserver.disconnect();

        this.#mutationObserver = new MutationObserver(this.#onMutated);
        this.#mutationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    #onMutated = async mutations => {
        const shouldRefresh = mutations.some(
            mutation =>
                mutation.type === 'childList' &&
                Array.from(mutation.addedNodes).some(
                    node =>
                        node.nodeType === Node.ELEMENT_NODE &&
                        (node.matches('h1, h2, h3, h4, h5, h6') ||
                            node.querySelector('h1, h2, h3, h4, h5, h6'))
                )
        );

        if (shouldRefresh) {
            console.log(
                'AutoToC: DOM Mutation detected, refreshing headings...'
            );

            this.#eventBus.dispatchEvent(
                new CustomEvent('mutationObserved', { detail: true })
            );
        }
    };
}

window.AutoToC = window.AutoToC ?? {};
window.AutoToC.MutationManager = MutationManager;
