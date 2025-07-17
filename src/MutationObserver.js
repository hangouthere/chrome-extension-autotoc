async #setupMutationObserver() {
        if (this.#mutationObserver) this.#mutationObserver.disconnect();

        if (this.#scanContainers.length) {
            this.#mutationObserver = new MutationObserver(async mutations => {
                const shouldRefresh = mutations.some(
                    mutation =>
                        mutation.type === 'childList' &&
                        Array.from(mutation.addedNodes).some(
                            node =>
                                node.nodeType === Node.ELEMENT_NODE &&
                                (node.matches('h1, h2, h3, h4, h5, h6') ||
                                    node.querySelector(
                                        'h1, h2, h3, h4, h5, h6'
                                    ))
                        )
                );

                if (shouldRefresh) {
                    console.log(
                        'AutoToC: DOM Mutation detected, refreshing headings...'
                    );
                    await this.refreshTOC();
                    this.#uiManager.#flashPanel();
                    this.#extension.#reconnectScrollTracking();
                }
            });

            this.#scanContainers.forEach(container => {
                this.#mutationObserver.observe(container, {
                    childList: true,
                    subtree: true
                });
            });
        }
    }