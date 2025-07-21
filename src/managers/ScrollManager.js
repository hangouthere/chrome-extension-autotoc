class ScrollManager {
    /** @type {HTMLElement} */
    #eventBus;
    /** @type {HTMLElement} */
    #panel;
    /** @type {ScrollObserver} */
    #scrollObserver;
    // !!FIXME: This needs to be finished out...
    /** @type {boolean} */
    #isJumping;

    constructor(eventBus, panel) {
        this.#eventBus = eventBus;
        this.#panel = panel;
    }

    destruct() {
        this.#eventBus.removeEventListener('tocRefreshed', this.#tocRefreshed);
        this.#eventBus.removeEventListener('scrollTo', this.#scrollTo);

        this.#eventBus = null;

        if (this.#scrollObserver) {
            this.#scrollObserver.destruct();
            this.#scrollObserver = null;
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
        const headingIdx = listItem.dataset.autotocHeadingIdx;
        const headingJumper = this.#panel.querySelector(
            `[data-autotoc-heading-idx="${headingIdx}"]`
        );

        if (!headingJumper) {
            console.log(
                'AutoToC: Unable to find paired Heading for ',
                listItem.textContent
            );
            return;
        }

        this.#isJumping = true;
        const oldMarginTop = headingJumper.style.scrollMarginTop;

        const scrollEnded = () => {
            headingJumper.classList.add('flash');
            setTimeout(() => {
                this.#isJumping = false;
                headingJumper.classList.remove('flash');
                // !! FIXME: This needs to select the focused item?
                // I'm thinking this should actually work itself out with the tracking
                // system i partially built out... need to finish that, then re-eval this.
                // this.#uiManager.#onScrollWindow([headingJumper]);
            }, 300);
            document.removeEventListener('scrollend', scrollEnded);
        };

        headingJumper.style.scrollMarginTop = '10px';
        headingJumper.scrollIntoView({ behavior: 'smooth' });
        headingJumper.style.scrollMarginTop = oldMarginTop;
        document.addEventListener('scrollend', scrollEnded);
    };

    #tocRefreshed = ({ detail: { headings } }) => {
        if (this.#scrollObserver) {
            this.#scrollObserver.destruct();
        }

        this.#scrollObserver = new AutoToC.ScrollObserver(
            headings,
            this.#onHeadingFocused
        );
        this.#scrollObserver.init();
    };

    #onHeadingFocused = heading => {
        const headingIdx = heading.dataset.autotocHeadingIdx;

        // Clear focused item(s)
        this.#panel
            .querySelectorAll(`li.heading-list-item.focused`)
            .forEach(e => e.classList.remove('focused'));

        const headingJumper = this.#panel.querySelector(
            `[data-autotoc-heading-idx="${headingIdx}"]`
        );

        if (!headingJumper) {
            AutoToC.Log(
                `AutoToC: Unable to find paired Heading for (${headingIdx}) ${listItem.textContent}`
            );

            return;
        }

        headingJumper.classList.add('focused');

        const { isInView } = AutoToC.Utils.getElementViewStats(headingJumper);

        if (false === isInView) {
            headingJumper.scrollIntoView({ smooth: true });
        }
    };
}

window.AutoToC = window.AutoToC ?? {};
window.AutoToC.ScrollManager = ScrollManager;
