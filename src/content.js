/*
 * AutoToC Chrome Extension - Content Script
 * Author: CodexHere
 * GitHub: https://github.com/hangouthere/chrome-extension-autotoc
 */

class AutoToCExtension {
    /** @type {Draggable} */
    #btnDraggable = null;
    /** @type {Draggable} */
    #panelDraggable = null;
    /** @type {HTMLDivElement} */
    #headingsList = null;
    /** @type {Settings} */
    #settings = null;
    /** @type {ScrollTracker} */
    #scrollTracker = null;

    #isVisible = false;
    #isDeleted = false;
    #mutationObserver = null;
    #scanContainers = [];
    #numHeadings = 0;
    #isJumping = false;
    #headings = [];

    constructor() {
        this.#init();
    }

    async #init() {
        this.#settings = new AutoToC.Settings();

        await this.#settings.init();
        this.#settings.updateStyles();

        const customFont = this.#settings.map['autotoc-panel-font-name'];

        this.#bindChromeMessages();

        this.#injectGoogleFont(FONT);
        this.#injectGoogleFont(customFont);
        this.#injectFloatingButton();
        this.#injectFloatingPanel();

        this.#bindUiEvents();

        updateExtIcon('?');

        await this.refreshTOC();

        this.#reconnectScrollTracking();
    }

    #bindChromeMessages() {
        chrome.runtime.onMessage.addListener(async message => {
            switch (message.action) {
                case 'toggle-panel':
                    this.togglePanel();
                    break;
                case 'refresh-panel':
                    await this.refreshTOC();
                    break;
                case 'delete-panel':
                    this.deletePanel();
                    break;
                case 'update-styles':
                    console.log(
                        'AutoToC: Settings changed, updating styles...'
                    );
                    await this.#settings.updateStyles();
                    await this.refreshTOC();
                    break;
            }
        });
    }

    #updateIconState() {
        // TODO: Success/Warning colors instead of hardcoded
        updateExtIcon(
            this.#numHeadings,
            this.#numHeadings > 0 ? '#ffffff' : '#ce1717'
        );
    }

    #injectGoogleFont(fontName) {
        const fontLink = document.createElement('link');
        fontLink.href = `https://fonts.googleapis.com/css2?family=${fontName}&display=swap`;
        fontLink.rel = 'stylesheet';
        document.head.appendChild(fontLink);
    }

    #injectFloatingButton() {
        if (this.#btnDraggable || this.#isDeleted) return;

        const button = document.createElement('button');
        button.classList.add('autotoc-title', 'drag-handle');
        button.textContent = 'AutoToC';
        button.id = 'autotoc-button';

        document.body.appendChild(button);

        this.#btnDraggable = new AutoToC.Draggable();
        this.#btnDraggable.connect(button);
    }

    #injectFloatingPanel() {
        if (this.#panelDraggable || this.#isDeleted) return;

        const panel = document.createElement('div');
        panel.id = 'autotoc-panel';
        panel.classList.add('hidden');
        panel.innerHTML = TemplatePanelContents;

        this.#headingsList = panel.querySelector('.headings-list');

        document.body.appendChild(panel);

        this.#panelDraggable = new AutoToC.Draggable();
        this.#panelDraggable.connect(panel);

        const resizable = new AutoToC.Resizable();
        resizable.connect(panel);
    }

    #bindUiEvents() {
        const btn = this.#btnDraggable.element;
        const pnl = this.#panelDraggable.element;

        // Toggle Panel
        btn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();

            if (false === this.#btnDraggable.hasMoved) {
                this.togglePanel();
            }
        });

        // Handle Header List click events for Jumps and Toggles
        this.#headingsList.addEventListener('click', e => {
            const elem = e.target;
            const classes = elem.classList;
            const isToggle = classes.contains('autotoc-toggle');
            const isHdrJump = classes.contains('autotoc-heading-jumper');

            if (false === (isToggle || isHdrJump)) {
                return;
            }

            e.preventDefault();
            const listItem = elem.closest('li.heading-list-item');

            if (isToggle) {
                this.toggleSection(listItem);
            }

            if (isHdrJump) {
                this.customScrollTo(listItem, -50);
                // this.updateFocusedHeading(listItem);
            }
        });

        // Clicked: Options
        pnl.querySelector('.autotoc-options-cog')?.addEventListener(
            'click',
            e => {
                e.stopPropagation();
                chrome.runtime.sendMessage({ action: 'open_options' });
            }
        );

        // Clicked: Close
        pnl.querySelector('.autotoc-close')?.addEventListener('click', e => {
            e.stopPropagation();
            this.togglePanel(false);
        });

        // Clicked: Refresh
        pnl.querySelector('.autotoc-refresh')?.addEventListener(
            'click',
            async e => {
                e.stopPropagation();
                await this.refreshTOC();
                this.#flashPanel();
            }
        );

        // Clicked: Collapse All
        pnl.querySelector('.autotoc-collapse')?.addEventListener('click', e => {
            e.stopPropagation();
            this.toggleAllSections(false);
        });

        // Clicked: Expand All
        pnl.querySelector('.autotoc-expand')?.addEventListener('click', e => {
            e.stopPropagation();
            this.toggleAllSections(true);
        });

        // Search Entered
        pnl.querySelector('.autotoc-search-input')?.addEventListener(
            'input',
            e => {
                this.filterHeadings(e.target.value);
            }
        );
    }

    #setupScanContainers() {
        if (this.#scanContainers.length) {
            return this.#scanContainers;
        }

        const selectorsPri =
            this.#settings.map['autotoc-main-container-selectors'];
        const selectorsSec =
            this.#settings.map['autotoc-secondary-container-selectors'];
        let selectors = selectorsPri;

        let containers = Array.from(document.querySelectorAll(selectors));

        if (0 === containers.length) {
            console.log('AutoToC: No Primary Containers found...');
            selectors = selectorsSec;
            containers = Array.from(document.querySelectorAll(selectors));

            if (0 === containers.length) {
                console.log(
                    'AutoToC: No Secondary Containers found, defaulting to <body>'
                );
                containers = [document.body];
            }
        }

        console.log('AutoToC: Main Containers found:', containers.length, {
            selectors,
            containers
        });

        this.#scanContainers = containers;

        return containers;
    }

    #flashPanel() {
        const flashDelay = 20;
        const headings = this.#headingsList.querySelectorAll(
            '.autotoc-heading-jumper'
        );

        headings.forEach((heading, idx) => {
            heading.style.animationDelay = `${flashDelay * idx}ms`;
            heading.classList.add('flash');
        });

        setTimeout(() => {
            const headings = this.#headingsList.querySelectorAll(
                '.autotoc-heading-jumper.flash'
            );

            headings.forEach(heading => {
                heading.classList.remove('flash');
            });
        }, 5000);
    }

    async refreshTOC() {
        if (!this.#panelDraggable || this.#isDeleted) return;

        const rootUl = document.createElement('ul');
        const nestLimit = this.#settings.map['autotoc-panel-nest-limit'];
        // Semaphore for Empty message output if necesary
        let hasHeadings = false;
        let ulStack = [];

        this.#headingsList.innerHTML = '';
        this.#headingsList.appendChild(rootUl);

        await this.#setupScanContainers();

        const getCurrentUl = () => ulStack[ulStack.length - 1] ?? rootUl;

        this.#scanContainers.forEach((container, idxCtr) => {
            // Get all the headings, but only if they aren't in specific containers to avoid aggressive
            // detections. User can override/add through Extension Options.
            const headings = filterBlacklists(
                [...container.querySelectorAll('h1, h2, h3, h4, h5, h6')],
                this.#settings.map['autotoc-header-blacklist-selectors']
            );

            console.log(
                'AutoToC: Headings found in Container:',
                headings.length,
                { container, headings }
            );

            let subUl = null;
            let lastTagLevel = -1;
            let level = 1;
            this.#numHeadings = headings.length;
            this.#headings = [];

            headings.forEach((heading, idxHdr) => {
                const tagName = heading.tagName.toLowerCase();
                const tagLevel = getHeadingLevel(tagName);
                const listItem = document.createElement('li');
                const canSearch = idxHdr < headings.length - 1;
                const nextHeading = canSearch ? headings[idxHdr + 1] : false;
                const nextHeadingLevel =
                    (nextHeading && getHeadingLevel(nextHeading.tagName)) ??
                    tagLevel;
                const shouldUnNest = tagLevel < lastTagLevel;
                const shouldReset = level > 1 && lastTagLevel - tagLevel > 1;
                const hasSubHeadings = () => nextHeadingLevel > tagLevel;
                const canToggle = () => hasSubHeadings() && level <= nestLimit;

                this.#headings.push(heading);

                // Start the very first eval of lastTagLevel to the first taglevel
                lastTagLevel = lastTagLevel < 0 ? tagLevel : lastTagLevel;
                hasHeadings = true;

                if (shouldReset) {
                    level = 1;
                    ulStack = [rootUl];
                }

                // Modify Heirarchy as needed
                if (shouldUnNest) {
                    // Go up back up a level!
                    level = Math.max(1, level - 1);
                    ulStack.pop();
                }

                const listItemHeader = this.#buildToggleHeader({
                    canToggle: canToggle(),
                    heading,
                    level
                });

                // Append listItemHeader to listItem so it's before any possible sub-<UL>
                listItem.appendChild(listItemHeader);
                // Pair the idx to heading.dataset.headingId with the listItem.dataset
                listItem.dataset.autotocHeadingIdx =
                    heading.dataset.autotocHeadingIdx = idxCtr + idxHdr;

                // Nest if we have subHeadings, or if we're nested in the last tag
                if (hasSubHeadings()) {
                    subUl = document.createElement('ul');
                    listItem.appendChild(subUl);
                }

                // Give class for the calculated level for CSS
                listItem.classList.add(
                    `heading-level-${level}`,
                    'heading-list-item',
                    'expanded',
                    'visible',
                    canToggle() ? 'can-toggle' : 'no-toggle',
                    hasSubHeadings() ? 'has-subs' : 'no-subs'
                );

                getCurrentUl().appendChild(listItem);

                if (hasSubHeadings()) {
                    level++;
                    // Update "heirarchy"
                    ulStack.push(subUl);
                    subUl = null;
                }

                lastTagLevel = tagLevel;
            });
        });

        const statsFound = this.#panelDraggable.element.querySelector(
            '.autotoc-stats--found'
        );

        if (false === hasHeadings) {
            this.#showNoToC(rootUl);
            statsFound.textContent = 'No Headings Found';
        } else {
            statsFound.textContent = `Found: ${this.#numHeadings}`;
        }

        this.#updateIconState();
    }

    #buildToggleHeader({ heading, canToggle }) {
        const listItemHeader = document.createElement('div');

        // Build Toggle Button
        if (canToggle) {
            const toggle = document.createElement('span');
            toggle.classList.add('autotoc-toggle');
            listItemHeader.appendChild(toggle);
        }

        const textContent = [...heading.childNodes]
            .reduce((acc, child) => {
                return acc + (child.nodeType === 3 ? child.textContent : '');
            }, '')
            .trim();

        const anchor = document.createElement('a');
        anchor.classList.add('autotoc-heading-jumper');
        anchor.textContent = textContent || heading.firstChild.textContent;
        listItemHeader.appendChild(anchor);

        return listItemHeader;
    }

    #showNoToC(rootUl) {
        const listItem = document.createElement('li');
        listItem.textContent = 'No headings found in any container';
        listItem.classList.add('expanded', 'no-toc');

        rootUl.innerHTML = '';
        rootUl.appendChild(listItem);

        console.log('AutoToC: No Headings detected in any Container');
    }

    customScrollTo(listItem, offset) {
        const listIdx = listItem.dataset.autotocHeadingIdx;

        const foundHeading = document.querySelector(
            `[data-autotoc-heading-idx="${listIdx}"]`
        );

        if (!foundHeading) {
            console.log(
                'AutoToC: Unable to find paired Header for ',
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
                this.#onScrollWindow([foundHeading]);
            }, 300);
            document.removeEventListener('scrollend', scrollEnded);
        };

        foundHeading.style.scrollMarginTop = '5px';
        foundHeading.scrollIntoView({ behavior: 'smooth' });
        foundHeading.style.scrollMarginTop = oldMarginTop;
        document.addEventListener('scrollend', scrollEnded);
    }

    toggleSection(listItem, forceExpand = null) {
        const isExpanded = true === listItem.classList.contains('expanded');
        const shouldExpand = forceExpand != null ? forceExpand : !isExpanded;

        listItem.classList.toggle('expanded', shouldExpand);
    }

    toggleAllSections(expand) {
        const headings = this.#headingsList.querySelectorAll('li');

        headings.forEach(listItem => {
            const canExpand = listItem.classList.contains('can-toggle');

            if (canExpand) {
                this.toggleSection(listItem, expand);
            }
        });
    }

    filterHeadings(query) {
        query = query.toLowerCase().trim();

        const statsSearch = this.#panelDraggable.element.querySelector(
            '.autotoc-stats--search'
        );

        // Empty query should just redraw the ToC
        if (!query) {
            statsSearch.style.display = 'none';
            return this.refreshTOC();
        }

        let numFound = 0;

        const traverseListItems = ul => {
            ul.querySelectorAll(':scope > li').forEach(listItem => {
                const link = listItem.querySelector('a.autotoc-heading-jumper');
                const childUl = listItem.querySelector(':scope > ul');

                if (!link) {
                    return;
                }

                // Quick check to see if content is included
                const isMatch = link.textContent.toLowerCase().includes(query);
                listItem.classList.toggle('visible', isMatch);
                link.innerHTML = link.textContent;

                // Full replace with RegExp (expensive-ish)
                if (isMatch) {
                    const regex = new RegExp(`(${query})`, 'gi');
                    link.innerHTML = link.textContent.replace(
                        regex,
                        '<span class="highlight">$1</span>'
                    );

                    numFound++;
                }

                // We need to make entire heirarchy visible, so we recurse
                if (childUl) {
                    traverseListItems(childUl);
                }
            });

            const hasFoundAny = query && numFound > 0;
            statsSearch.textContent = hasFoundAny
                ? `Filtered: ${numFound}`
                : '';

            statsSearch.style.display = hasFoundAny ? 'block' : 'none';
        };

        const displayParent = li => {
            const hasParent = li.parentElement.closest('li');

            if (!hasParent) {
                return;
            }

            hasParent.classList.toggle('visible', true);

            displayParent(hasParent);
        };

        const rootUl = this.#headingsList.querySelector('ul');

        traverseListItems(rootUl);
        rootUl.querySelectorAll('li.visible').forEach(displayParent);
    }

    async togglePanel(forceToggle = null) {
        if (!this.#panelDraggable || this.#isDeleted) return;

        const panel = this.#panelDraggable.element;

        if (null !== forceToggle) {
            this.#isVisible = !forceToggle;
        }

        if (this.#isVisible) {
            panel.classList.remove('visible');
            panel.classList.add('hidden');
            this.#isVisible = false;
        } else {
            // Keep UI updated!
            this.#scanContainers = await this.#setupScanContainers();

            await this.#setupMutationObserver();
            await this.refreshTOC();

            panel.classList.remove('hidden');
            panel.classList.add('visible');
            this.#isVisible = true;
        }
    }

    deletePanel() {
        if (this.#panelDraggable) this.#panelDraggable.element.remove();
        if (this.#btnDraggable) this.#btnDraggable.element.remove();
        if (this.#mutationObserver) this.#mutationObserver.disconnect();

        this.#isDeleted = true;
        this.#mutationObserver =
            this.#panelDraggable =
            this.#btnDraggable =
                null;
    }

    async #setupMutationObserver() {
        if (this.#mutationObserver) this.#mutationObserver.disconnect();

        if (this.#scanContainers.length) {
            this.#mutationObserver = new MutationObserver(async mutations => {
                const shouldRefresh = mutations.some(
                    mutation =>
                        mutation.type === 'childList' &&
                        Array.from(mutation.addedNodes).some(
                            node =>
                                // Only consider Nodes that are h1-h6, or containing them
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
                    this.#flashPanel();
                    this.#reconnectScrollTracking();
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

    #reconnectScrollTracking() {
        if (this.#scrollTracker) {
            this.#scrollTracker.disconnect();
        }
        this.#scrollTracker = new AutoToC.ScrollTracker();
        this.#scrollTracker.connect(this.#headings);
    }

    #onScrollWindow(headings) {
        // TODO: Might toss this idea, it's a LOT of work
        // TODO: Might need to scan scroll areas up to the body
        //       then as scrolls happen in each of the areas,
        //       we'll need to recurse up the tree to find if every
        //       nested heirarchy is actually within view.
        //       ie, Header -> Nested Scroll -> Large Parent -> .... -> Body Scroll
        //  See: TODO_scroll.js
        this.#headingsList
            .querySelectorAll('[data-autotoc-heading-idx] .focused')
            .forEach(el => el.classList.remove('focused'));

        if (true === this.#isJumping) {
            return;
        }

        const topHeading = getTopHeading(headings);

        if (!topHeading) {
            console.log('AutoToC WARNING: NO HEADING FOUND TO SCROLL TO!');
            return;
        }

        const parentScrollTopHeading = findParentScroll(topHeading);
        const topHeadingRect = topHeading.getBoundingClientRect();
        const topHeadingParentRect =
            topHeading.parentNode.getBoundingClientRect();
        const topHeadingHeight = topHeadingRect.top + topHeadingRect.height;
        const parentScrollHeight =
            parentScrollTopHeadingRect.top + parentScrollTopHeadingRect.height;
        const isOnScreen = topHeadingHeight < parentScrollHeight;

        console.log(
            'parentScrollTopHeadingRect.top',
            parentScrollTopHeadingRect.top,
            'parentScrollTopHeadingRect.height',
            parentScrollTopHeadingRect.height,
            'topHeadingRect.top',
            topHeadingRect.top,
            'topHeadingRect.height',
            topHeadingRect.height
        );

        if (false === isOnScreen) {
            return;
        }

        console.log('on screen!');

        const idx = topHeading.dataset.autotocHeadingIdx;
        const foundHeadingJumper = this.#headingsList.querySelector(
            `[data-autotoc-heading-idx="${idx}"]`
        );

        const parentScrollJumper = findParentScroll(foundHeadingJumper);
        const rect = foundHeadingJumper.getBoundingClientRect();

        if (parentScrollJumper) {
            if (true) {
                // TODO: Reveal parent heirarchy if closed... Need to turn into a function
                const oldMarginTop = foundHeadingJumper.style.scrollMarginTop;

                foundHeadingJumper.style.scrollMarginTop = '5px';
                foundHeadingJumper.scrollIntoView({ behavior: 'smooth' });
                foundHeadingJumper.style.scrollMarginTop = oldMarginTop;
            }
        }

        foundHeadingJumper
            .querySelector('.autotoc-heading-jumper')
            .classList.add('focused');
    }
}

const FONT = 'Gugi';

const getHeadingLevel = tagName => parseInt(tagName.match(/\d+/)?.[0] || NaN);

const updateExtIcon = async (text, color = '#FFFF00') => {
    await chrome.runtime.sendMessage({
        action: 'update_badge',
        text,
        color
    });
};

const filterBlacklists = (headings, blacklistSelectors) =>
    headings.filter(heading => {
        const style = getComputedStyle(heading);
        // Skip the following...
        return (
            // Hidden elements
            !(style.visibility != 'visible' || style.display == 'none') &&
            // Elements found within our own panel
            !heading.closest('#autotoc-panel') &&
            // Elements found within user-defined blacklist selectors
            !heading.closest(blacklistSelectors) &&
            heading.offsetHeight != 0
        );
    });

const getTopHeading = headings => {
    let top = null;
    let minTop = Infinity;

    const verticalScrollOffset = window.scrollY || window.pageYOffset;

    headings.forEach(heading => {
        // Check if the h1 is within the viewport and close to the top
        if (
            heading.offsetTop >= verticalScrollOffset &&
            heading.offsetTop < minTop
        ) {
            top = heading;
            minTop = heading.offsetTop;
        }
    });

    return top;
};

const findParentScroll = element => {
    if (!element || document.body === element) {
        return document.body;
    }

    const styles = getComputedStyle(element);
    const hasOverflowY = styles.overflowY == 'auto';

    if (true === hasOverflowY) {
        return element;
    }

    return findParentScroll(element.parentElement);
};

new AutoToCExtension();
