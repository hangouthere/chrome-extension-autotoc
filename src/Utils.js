class Utils {
    static FONT = 'Gugi';

    static getHeadingLevel(tagName) {
        return parseInt(tagName.match(/\d+/)?.[0] || NaN);
    }

    static async updateExtIcon(text, color = '#FFFF00') {
        await chrome.runtime.sendMessage({
            action: 'update_badge',
            text,
            color
        });
    }

    static filterBlacklists(
        headings,
        blacklistSelectors = '.bogus-selector-for-sanity'
    ) {
        return headings.filter(heading => {
            const style = getComputedStyle(heading);
            return (
                !(style.visibility !== 'visible' || style.display === 'none') &&
                !heading.closest('#autotoc-panel') &&
                !heading.closest(blacklistSelectors) &&
                heading.offsetHeight !== 0
            );
        });
    }

    static displayParentHeirarchy = li => {
        const hasParent = li.parentElement.closest('li');

        if (hasParent) {
            hasParent.classList.toggle('visible', true);

            if (hasParent.classList.contains('can-toggle')) {
                hasParent.classList.toggle('expanded', true);
            }

            this.displayParentHeirarchy(hasParent);
        }
    };

    /**
     * @returns {Array<Element>}
     */
    static findParentalScrollAreas(element) {
        const scrollAreas = [];
        let currentElement = element;

        while (currentElement && currentElement !== document.body) {
            if (this.isElementScrollable(currentElement)) {
                scrollAreas.push(currentElement);
            }

            currentElement = currentElement.parentElement;
        }

        scrollAreas.push(document);

        return scrollAreas;
    }

    static isElementScrollable(element) {
        const style = window.getComputedStyle(element);
        const overflow = style.overflow + style.overflowY + style.overflowX;
        return overflow.includes('auto') || overflow.includes('scroll');
    }

    static getRect(element) {
        return element === document
            ? new DOMRect(0, 0, window.innerWidth, window.innerHeight)
            : element.getBoundingClientRect();
    }

    static isElementInScrollArea(element, scrollArea) {
        const elementRect = this.getRect(element);
        const scrollRect = this.getRect(scrollArea);

        return (
            elementRect.top >= scrollRect.top &&
            elementRect.bottom <= scrollRect.bottom &&
            elementRect.left >= scrollRect.left &&
            elementRect.right <= scrollRect.right
        );
    }

    static getElementViewStats(element) {
        const scrollAreas = this.findParentalScrollAreas(element);
        const isInView = scrollAreas.every(scrollArea =>
            this.isElementInScrollArea(element, scrollArea)
        );

        return {
            scrollAreas,
            isInView
        };
    }

    /**
     * @returns {Array<{
     *   element: Element,
     *   scrollAreas: Array<Element>,
     *   isInView: boolean
     * }>}
     */
    static getInViewElements(elements) {
        return elements.reduce((acc, element) => {
            const { scrollAreas, isInView } = this.getElementViewStats(element);

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
}

const log = (...args) => {
    if (
        window.DEBUG &&
        window.DEBUG.toString().toLowerCase().includes('autotoc')
    ) {
        console.log(...args);
    }
};

window.AutoToC = window.AutoToC ?? {};
window.AutoToC.Utils = Utils;
window.AutoToC.Log = log;
