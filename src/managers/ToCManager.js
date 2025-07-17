class ToCManager {
    #eventBus;
    #settings;

    // !! TODO: LOOK INTO moving into ScanManager?
    #panel;
    #scanContainers = [];
    #panelListItems = [];

    constructor(eventBus, settingsMap, panelElement) {
        this.#eventBus = eventBus;
        this.#settings = settingsMap;
        this.#panel = panelElement;
    }

    destruct() {
        this.#eventBus.removeEventListener('flashPanel', this.#flashPanel);
        this.#eventBus.removeEventListener('refreshTOC', this.#refreshTOC);
        this.#eventBus.removeEventListener('applyFilter', this.#applyFilter);
        this.#eventBus.removeEventListener(
            'toggleAllSections',
            this.#toggleAllSections
        );
        this.#eventBus.removeEventListener(
            'settingsChanged',
            this.#settingsChanged
        );

        this.#eventBus = null;
    }

    init() {
        this.#bindBusEvents();

        this.#refreshTOC({ detail: false });

        this.#bindUiEvents();
    }

    #bindBusEvents() {
        this.#eventBus.addEventListener('flashPanel', this.#flashPanel);
        this.#eventBus.addEventListener('refreshTOC', this.#refreshTOC);
        this.#eventBus.addEventListener('applyFilter', this.#applyFilter);
        this.#eventBus.addEventListener(
            'toggleAllSections',
            this.#toggleAllSections
        );
        this.#eventBus.addEventListener(
            'mutationObserved',
            this.#mutationObserved
        );
        this.#eventBus.addEventListener(
            'settingsChanged',
            this.#settingsChanged
        );
    }

    #bindUiEvents() {
        this.#panel.addEventListener('click', e => {
            const elem = e.target;
            const classes = elem.classList;
            const isToggle = classes.contains('autotoc-toggle');
            const isHdrJump = classes.contains('autotoc-heading-jumper');

            if (!(isToggle || isHdrJump)) return;

            e.preventDefault();

            const listItem = elem.closest('li.heading-list-item');

            if (isToggle) {
                this.#toggleSection(listItem);
            }

            if (isHdrJump) {
                this.#eventBus.dispatchEvent(
                    new CustomEvent('scrollTo', { detail: listItem })
                );
            }
        });
    }

    #settingsChanged = ({ detail: settingsMap }) => {
        this.#settings = settingsMap;

        this.#refreshTOC({ detail: false });
    };

    #refreshTOC = async ({ detail: flashPanel }) => {
        const rootUl = document.createElement('ul');
        rootUl.classList.add('rootUl');
        const nestLimit = this.#settings['autotoc-panel-nest-limit'];
        let ulStack = [];

        const getCurrentUl = () => ulStack[ulStack.length - 1] ?? rootUl;
        const headingsList = this.#panel.querySelector('.headings-list');

        headingsList.innerHTML = '';
        headingsList.appendChild(rootUl);

        await this.#setupScanContainers();

        const allHeadings = [];

        this.#scanContainers.forEach((container, idxCtr) => {
            const headings = Utils.filterBlacklists(
                [...container.querySelectorAll('h1, h2, h3, h4, h5, h6')],
                this.#settings['autotoc-heading-blacklist-selectors']
            );

            console.log(
                'AutoToC: Headings found in Container:',
                headings.length,
                { container, headings }
            );

            let subUl = null;
            let lastTagLevel = -1;
            let level = 1;
            this.#panelListItems = [];

            headings.forEach((heading, idxHdr) => {
                const tagName = heading.tagName.toLowerCase();
                const tagLevel = Utils.getHeadingLevel(tagName);
                const listItem = document.createElement('li');
                const canSearch = idxHdr < headings.length - 1;
                const nextHeading = canSearch ? headings[idxHdr + 1] : false;
                const nextHeadingLevel = nextHeading
                    ? Utils.getHeadingLevel(nextHeading.tagName)
                    : tagLevel;
                const shouldUnNest = tagLevel < lastTagLevel;
                const shouldReset = level > 1 && lastTagLevel - tagLevel > 1;
                const hasSubHeadings = () => nextHeadingLevel > tagLevel;
                const canToggle = () => hasSubHeadings() && level <= nestLimit;

                allHeadings.push(heading);
                lastTagLevel = lastTagLevel < 0 ? tagLevel : lastTagLevel;
                this.#panelListItems.push(listItem); // cache

                if (shouldReset) {
                    level = 1;
                    ulStack = [rootUl];
                }

                if (shouldUnNest) {
                    level = Math.max(1, level - 1);
                    ulStack.pop();
                }

                const listItemHeader = this.#buildToggleHeader({
                    heading,
                    canToggle: canToggle()
                });

                listItem.dataset.autotocHeadingIdx =
                    heading.dataset.autotocHeadingIdx = idxCtr + idxHdr;
                listItem.appendChild(listItemHeader);

                if (hasSubHeadings()) {
                    subUl = document.createElement('ul');
                    listItem.appendChild(subUl);
                }

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
                    ulStack.push(subUl);
                    subUl = null;
                }

                lastTagLevel = tagLevel;
            });
        });

        if (0 === allHeadings.length) {
            this.#showNoToC(rootUl);
        } else if (true === flashPanel) {
            this.#flashPanel();
        }

        this.#eventBus.dispatchEvent(
            new CustomEvent('tocRefreshed', {
                detail: {
                    numHeadings: allHeadings.length,
                    headings: allHeadings
                }
            })
        );
    };

    #buildToggleHeader({ heading, canToggle }) {
        const listItemHeader = document.createElement('div');
        if (canToggle) {
            const toggle = document.createElement('span');
            toggle.classList.add('autotoc-toggle');
            listItemHeader.appendChild(toggle);
        }

        const textContent = [...heading.childNodes]
            .reduce(
                (acc, child) =>
                    acc + (child.nodeType === 3 ? child.textContent : ''),
                ''
            )
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

    async #setupScanContainers() {
        if (this.#scanContainers.length) return this.#scanContainers;

        const selectorsPri = this.#settings['autotoc-main-container-selectors'];
        const selectorsSec =
            this.#settings['autotoc-secondary-container-selectors'];
        let selectors = selectorsPri;
        let containers = Array.from(document.querySelectorAll(selectors));

        if (!containers.length) {
            console.log('AutoToC: No Primary Containers found...');
            selectors = selectorsSec;
            containers = Array.from(document.querySelectorAll(selectors));

            if (!containers.length) {
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

    #toggleSection = (listItem, forceExpand = null) => {
        const isExpanded = listItem.classList.contains('expanded');
        const shouldExpand = forceExpand !== null ? forceExpand : !isExpanded;
        listItem.classList.toggle('expanded', shouldExpand);
    };

    #toggleAllSections = ({ detail: expand }) => {
        this.#panelListItems.forEach(listItem => {
            if (listItem.classList.contains('can-toggle')) {
                this.#toggleSection(listItem, expand);
            }
        });
    };

    #mutationObserved = event => {
        this.#scanContainers = [];

        this.#refreshTOC(event);
    };

    #traverseListItems(ul, count) {
        ul.querySelectorAll(':scope > li').forEach(listItem => {
            const link = listItem.querySelector('a.autotoc-heading-jumper');
            const childUl = listItem.querySelector(':scope > ul');

            if (!link) return count;

            const isMatch = link.textContent.toLowerCase().includes(query);
            listItem.classList.toggle('visible', isMatch);
            link.innerHTML = link.textContent;

            if (isMatch) {
                const regex = new RegExp(`(${query})`, 'gi');
                link.innerHTML = link.textContent.replace(
                    regex,
                    '<span class="highlight">$1</span>'
                );
                numFound++;
            }

            if (childUl) count += this.#traverseListItems(childUl, count);
        });

        return count;
    }

    #applyFilter(query) {
        query = query.toLowerCase().trim();
        const statsSearch = this.#panel.querySelector('.autotoc-stats--search');

        if (!query) {
            statsSearch.style.display = 'none';
            return this.refreshTOC();
        }

        const rootUl = this.#panel.querySelector('ul.rootUl');
        rootUl
            .querySelectorAll('li.visible')
            .forEach(AutoToC.Utils.displayParentHeirarchy);

        const count = this.#traverseListItems(rootUl, 0);
        statsSearch.textContent = count > 0 ? `Filtered: ${count}` : '';
        statsSearch.style.display = count > 0 ? 'block' : 'none';
    }

    #flashPanel = () => {
        const flashDelay = 20;
        const headings = this.#panel.querySelectorAll(
            '.autotoc-heading-jumper'
        );

        headings.forEach((heading, idx) => {
            heading.style.animationDelay = `${flashDelay * idx}ms`;
            heading.classList.add('flash');
        });

        setTimeout(() => {
            headings.forEach(heading => heading.classList.remove('flash'));
        }, 3000);
    };
}

window.AutoToC = window.AutoToC ?? {};
window.AutoToC.ToCManager = ToCManager;
