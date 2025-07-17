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

    static filterBlacklists(headings, blacklistSelectors) {
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

    static getTopHeading(headings) {
        let top = null;
        let minTop = Infinity;
        const verticalScrollOffset = window.scrollY || window.pageYOffset;

        headings.forEach(heading => {
            if (
                heading.offsetTop >= verticalScrollOffset &&
                heading.offsetTop < minTop
            ) {
                top = heading;
                minTop = heading.offsetTop;
            }
        });

        return top;
    }

    static findParentScroll(element) {
        if (!element || document.body === element) {
            return document.body;
        }

        const styles = getComputedStyle(element);
        if (styles.overflowY === 'auto') {
            return element;
        }

        return Utils.findParentScroll(element.parentElement);
    }

    static displayParentHeirarchy(li) {
        const hasParent = li.parentElement.closest('li');

        if (hasParent) {
            hasParent.classList.toggle('visible', true);
            displayParentHeirarchy(hasParent);
        }
    }
}

window.AutoToC = window.AutoToC ?? {};
window.AutoToC.Utils = Utils;
