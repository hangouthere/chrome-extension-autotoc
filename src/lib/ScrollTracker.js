class ScrollTracker {
    #elements;
    #scrollAreas;

    /**
     * @param {Array<Element>} elements
     */
    constructor(elements) {
        this.#elements = elements;
    }

    destruct() {
        this.#scrollAreas.forEach(scrollArea => {
            scrollArea.removeEventListener('scroll', this.#handleScroll);
        });
    }

    init() {
        let scrollAreas = [];
        this.#elements.forEach(element => {
            const parentScrolls = this.#findParentScrolls(element);
            scrollAreas = [...scrollAreas, ...parentScrolls];
        });

        // Ensure we're only storing *unique* scroll areas
        this.#scrollAreas = new Set(scrollAreas);

        this.#scrollAreas.forEach(scrollArea => {
            scrollArea.addEventListener('scroll', this.#handleScroll);
        });
    }

    #findParentScrolls(element) {
        const scrollAreas = [];
        let currentElement = element;

        while (currentElement && currentElement !== document.body) {
            if (this.#isScrollable(currentElement)) {
                scrollAreas.push(currentElement);
            }

            currentElement = currentElement.parentElement;
        }

        scrollAreas.push(document);

        return scrollAreas;
    }

    #isScrollable(element) {
        const style = window.getComputedStyle(element);
        const overflow = style.overflow + style.overflowY + style.overflowX;
        return overflow.includes('auto') || overflow.includes('scroll');
    }

    #getRect(element) {
        return element === document
            ? new DOMRect(0, 0, window.innerWidth, window.innerHeight)
            : element.getBoundingClientRect();
    }

    #isElementInScrollView(element, scrollArea) {
        const elementRect = this.#getRect(element);
        const scrollRect = this.#getRect(scrollArea);

        return (
            elementRect.top >= scrollRect.top &&
            elementRect.bottom <= scrollRect.bottom &&
            elementRect.left >= scrollRect.left &&
            elementRect.right <= scrollRect.right
        );
    }

    #scanScrollAreas() {
        return this.#elements.reduce((acc, element) => {
            const scrollAreas = this.#findParentScrolls(element);
            const isInView = scrollAreas.every(scrollArea =>
                this.#isElementInScrollView(element, scrollArea)
            );

            if (isInView) {
                acc.push({
                    element,
                    scrollAreas,
                    isInView
                });
            }

            return acc;
        }, []);
    }

    #handleScroll = () => {
        const inViewItems = this.#scanScrollAreas();

        const topItem = inViewItems.reduce((item, itemData) => {
            const elementRect = this.#getRect(itemData.element);
            if (item) {
                const itemRect = this.#getRect(item);
                if (elementRect.top < itemRect.top) {
                    item = itemData.element;
                }
            } else {
                item = itemData.element;
            }

            return item;
        }, null);

        // console.log(inViewItems);
        console.log(topItem);
    };
}

window.AutoToC = window.AutoToC ?? {};
window.AutoToC.ScrollTracker = ScrollTracker;
