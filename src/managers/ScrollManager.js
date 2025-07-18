class ScrollManager {
    /** @type {HTMLElement} */
    #eventBus;
    /** @type {ScrollTracker} */
    #scrollTracker;
    /** @type {boolean} */
    #isJumping;

    constructor(eventBus) {
        this.#eventBus = eventBus;
    }

    destruct() {
        this.#eventBus = null;

        if (this.#scrollTracker) {
            this.#scrollTracker.destruct();
            this.#scrollTracker = null;
        }
    }

    init() {
        this.#bindBusEvents();
    }

    #bindBusEvents() {
        this.#eventBus.addEventListener('tocRefreshed', this.#tocRefreshed);
        this.#eventBus.addEventListener('scrollTo', this.#scrollTo);
    }

    #scrollTo = ({ detail: listItem }) => {
        const listIdx = listItem.dataset.autotocHeadingIdx;
        const foundHeading = document.querySelector(
            `[data-autotoc-heading-idx="${listIdx}"]`
        );

        if (!foundHeading) {
            console.log(
                'AutoToC: Unable to find paired Heading for ',
                listItem.textContent
            );
            return;
        }

        this.#isJumping = true;
        const oldMarginTop = foundHeading.style.scrollMarginTop;

        const scrollEnded = () => {
            foundHeading.classList.add('flash');
            setTimeout(() => {
                this.#isJumping = false;
                foundHeading.classList.remove('flash');
                // !! FIXME: This needs to select the focused item?
                // I'm thinking this should actually work itself out with the tracking
                // system i partially built out... need to finish that, then re-eval this.
                // this.#uiManager.#onScrollWindow([foundHeading]);
            }, 300);
            document.removeEventListener('scrollend', scrollEnded);
        };

        foundHeading.style.scrollMarginTop = '10px';
        foundHeading.scrollIntoView({ behavior: 'smooth' });
        foundHeading.style.scrollMarginTop = oldMarginTop;
        document.addEventListener('scrollend', scrollEnded);
    };

    #tocRefreshed = ({ detail: { headings } }) => {
        if (this.#scrollTracker) {
            this.#scrollTracker.destruct();
        }

        this.#scrollTracker = new AutoToC.ScrollTracker(headings);
        this.#scrollTracker.init();
    };
}

window.AutoToC = window.AutoToC ?? {};
window.AutoToC.ScrollManager = ScrollManager;

// #onScrollWindow(headings) {
// !! FIXME -- This needs some attention!!
// this.#headingsList
//     .querySelectorAll('[data-autotoc-heading-idx] .focused')
//     .forEach(el => el.classList.remove('focused'));
// if (this.#extension.#tocManager.#isJumping) {
//     return;
// }
// const topHeading = Utils.getTopHeading(headings);
// if (!topHeading) {
//     console.log('AutoToC WARNING: NO HEADING FOUND TO SCROLL TO!');
//     return;
// }
// const parentScrollTopHeading = Utils.findParentScroll(topHeading);
// const topHeadingRect = topHeading.getBoundingClientRect();
// const parentScrollTopHeadingRect =
//     parentScrollTopHeading.getBoundingClientRect();
// const topHeadingHeight = topHeadingRect.top + topHeadingRect.height;
// const parentScrollHeight =
//     parentScrollTopHeadingRect.top + parentScrollTopHeadingRect.height;
// const isOnScreen = topHeadingHeight < parentScrollHeight;
// console.log(
//     'parentScrollTopHeadingRect.top',
//     parentScrollTopHeadingRect.top,
//     'parentScrollTopHeadingRect.height',
//     parentScrollTopHeadingRect.height,
//     'topHeadingRect.top',
//     topHeadingRect.top,
//     'topHeadingRect.height',
//     topHeadingRect.height
// );
// if (!isOnScreen) {
//     return;
// }
// console.log('on screen!');
// const idx = topHeading.dataset.autotocHeadingIdx;
// const foundHeadingJumper = this.#headingsList.querySelector(
//     `[data-autotoc-heading-idx="${idx}"]`
// );
// const parentScrollJumper =
//     Utils.findParentScroll(foundHeadingJumper);
// const rect = foundHeadingJumper.getBoundingClientRect();
// if (parentScrollJumper) {
//     const oldMarginTop = foundHeadingJumper.style.scrollMarginTop;
//     foundHeadingJumper.style.scrollMarginTop = '5px';
//     foundHeadingJumper.scrollIntoView({ behavior: 'smooth' });
//     foundHeadingJumper.style.scrollMarginTop = oldMarginTop;
// }
// foundHeadingJumper
//     .querySelector('.autotoc-heading-jumper')
//     .classList.add('focused');
// }
