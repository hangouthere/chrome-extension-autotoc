class ScrollObserver {
    #focusedCallback;
    #lastItem;
    #elements;
    #scrollAreas;
    #tty;
    #lastChecked;

    /**
     * @param {Array<Element>} elements
     * @param {Function} focusedCallback
     */
    constructor(elements, focusedCallback, tty = 150) {
        this.#elements = elements;
        this.#focusedCallback = focusedCallback;
        this.#tty = tty;
    }

    destruct() {
        this.#scrollAreas.forEach(scrollArea => {
            scrollArea.removeEventListener('scroll', this.#handleScroll);
        });

        this.#handleScroll = null;

        this.#lastItem = this.#focusedCallback = null;
    }

    init() {
        let scrollAreas = [];

        this.#elements.forEach(element => {
            const parentScrolls =
                AutoToC.Utils.findParentalScrollAreas(element);
            scrollAreas = [...scrollAreas, ...parentScrolls];
        });

        // Ensure we're only storing *unique* scroll areas
        this.#scrollAreas = new Set(scrollAreas);

        this.#scrollAreas.forEach(scrollArea => {
            scrollArea.addEventListener('scroll', this.#handleScroll);
        });
    }

    #handleScroll = () => {
        // Reduce DOM hits/over processing
        const now = new Date().getTime();
        if (now - this.#lastChecked <= this.#tty) {
            return;
        }

        const inViewItems = AutoToC.Utils.getInViewElements(this.#elements);

        const topItem = inViewItems.reduce((item, itemData) => {
            const elementRect = AutoToC.Utils.getRect(itemData.element);
            if (item) {
                const itemRect = AutoToC.Utils.getRect(item);
                if (elementRect.top < itemRect.top) {
                    item = itemData.element;
                }
            } else {
                item = itemData.element;
            }

            return item;
        }, null);

        if (topItem && topItem != this.#lastItem) {
            this.#lastItem = topItem;
            this.#focusedCallback(topItem);
        }

        this.#lastChecked = now;
    };
}

window.AutoToC = window.AutoToC ?? {};
window.AutoToC.ScrollObserver = ScrollObserver;
