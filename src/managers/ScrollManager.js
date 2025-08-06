class ScrollManager {
    /** @type {HTMLElement} */
    #eventBus;
    /** @type {HTMLElement} */
    #panel;
    /** @type {ScrollObserver} */
    #scrollObserver;
    /** @type {boolean} */
    #isJumping;
    /** @type {Function} */
    #scrollEnded_handler;

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
        const headingTarget = AutoToC.Utils.filterBlacklists([
            ...document.body.querySelectorAll(
                `[data-autotoc-heading-idx="${headingIdx}"]`
            )
        ])?.[0];

        if (!headingJumper || !headingTarget) {
            console.log(
                'AutoToC: Unable to find paired Heading for ',
                listItem.textContent
            );
            return;
        }

        this.#isJumping = true;
        const oldMarginTop = headingTarget.style.scrollMarginTop;

        const { isInView } = AutoToC.Utils.getElementViewStats(headingTarget);

        this.#scrollEnded_handler = this.#scrollEnded.bind(
            this,
            headingJumper,
            headingTarget
        );

        if (true === isInView) {
            this.#scrollEnded_handler();
            this.#onHeadingFocused(headingJumper);
            return;
        }

        headingTarget.style.scrollMarginTop = '10px';
        headingTarget.scrollIntoView({ behavior: 'smooth' });
        headingTarget.style.scrollMarginTop = oldMarginTop;

        document.addEventListener('scrollend', this.#scrollEnded_handler);
    };

    #scrollEnded(headingJumper, headingTarget) {
        document
            .querySelectorAll('[data-autotoc-heading-idx].flash')
            .forEach(e => e.classList.remove('flash'));

        headingTarget.classList.add('flash');

        setTimeout(() => {
            this.#isJumping = false;
            headingTarget.classList.remove('flash');
            this.#onHeadingFocused(headingJumper);
        }, 300);

        document.removeEventListener('scrollend', this.#scrollEnded_handler);
    }

    #tocRefreshed = ({ detail: { headings } }) => {
        if (this.#scrollObserver) {
            this.#scrollObserver.destruct();
        }

        this.#scrollObserver = new AutoToC.ScrollObserver(
            headings,
            this.#onHeadingFocused,
            50
        );
        this.#scrollObserver.init();
    };

    #onHeadingFocused = heading => {
        if (true === this.#isJumping) {
            return;
        }

        const headingIdx = heading.dataset.autotocHeadingIdx;

        // Clear focused item(s)
        this.#panel
            .querySelectorAll(`li.heading-list-item.focused`)
            .forEach(e => e.classList.remove('focused'));

        const headingJumper = this.#panel.querySelector(
            `[data-autotoc-heading-idx="${headingIdx}"]`
        );

        const focusParentHeirarchy = li => {
            const hasParent = li.parentElement.closest('li');

            if (!hasParent) {
                return li.classList.toggle('focused', true);
            }

            focusParentHeirarchy(hasParent);
        };

        if (!headingJumper) {
            AutoToC.Log(
                `AutoToC: Unable to find paired Heading for (${headingIdx}) ${listItem.textContent}`
            );

            return;
        }

        headingJumper.classList.add('focused');
        focusParentHeirarchy(headingJumper);

        const { isInView } = AutoToC.Utils.getElementViewStats(headingJumper);

        if (false === isInView) {
            headingJumper.scrollIntoView({ behavior: 'smooth' });
        }
    };
}

window.AutoToC = window.AutoToC ?? {};
window.AutoToC.ScrollManager = ScrollManager;
