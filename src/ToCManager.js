class ToCManager {
    #extension;
    #settings;
    #uiManager;
    #scanContainers = [];
    #numHeadings = 0;
    #headings = [];
    #mutationObserver;
    #isJumping = false;

    constructor(extension, settings, uiManager) {
        this.#extension = extension;
        this.#settings = settings;
        this.#uiManager = uiManager;
    }

    async refreshTOC() {
        if (!this.#uiManager.#panelDraggable) return;

        const rootUl = document.createElement('ul');
        const nestLimit = this.#settings.map['autotoc-panel-nest-limit'];
        let hasHeadings = false;
        let ulStack = [];
        const headingsList = this.#uiManager.#headingsList;
        headingsList.innerHTML = '';
        headingsList.appendChild(rootUl);

        await this.#setupScanContainers();
        await this.#setupMutationObserver();

        const getCurrentUl = () => ulStack[ulStack.length - 1] ?? rootUl;

        this.#scanContainers.forEach((container, idxCtr) => {
            const headings = Utilities.filterBlacklists(
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
                const tagLevel = Utilities.getHeadingLevel(tagName);
                const listItem = document.createElement('li');
                const canSearch = idxHdr < headings.length - 1;
                const nextHeading = canSearch ? headings[idxHdr + 1] : false;
                const nextHeadingLevel = nextHeading
                    ? Utilities.getHeadingLevel(nextHeading.tagName)
                    : tagLevel;
                const shouldUnNest = tagLevel < lastTagLevel;
                const shouldReset = level > 1 && lastTagLevel - tagLevel > 1;
                const hasSubHeadings = () => nextHeadingLevel > tagLevel;
                const canToggle = () => hasSubHeadings() && level <= nestLimit;

                this.#headings.push(heading);
                lastTagLevel = lastTagLevel < 0 ? tagLevel : lastTagLevel;
                hasHeadings = true;

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
                listItem.appendChild(listItemHeader);
                listItem.dataset.autotocHeadingIdx =
                    heading.dataset.autotocHeadingIdx = idxCtr + idxHdr;

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

        const statsFound =
            this.#uiManager.#panelDraggable.element.querySelector(
                '.autotoc-stats--found'
            );
        if (!hasHeadings) {
            this.#showNoToC(rootUl);
            statsFound.textContent = 'No Headings Found';
        } else {
            statsFound.textContent = `Found: ${this.#numHeadings}`;
        }

        this.#updateIconState();
    }

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

    #updateIconState() {
        Utilities.updateExtIcon(
            this.#numHeadings,
            this.#numHeadings > 0 ? '#ffffff' : '#ce1717'
        );
    }

    async #setupScanContainers() {
        if (this.#scanContainers.length) return this.#scanContainers;

        const selectorsPri =
            this.#settings.map['autotoc-main-container-selectors'];
        const selectorsSec =
            this.#settings.map['autotoc-secondary-container-selectors'];
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

    toggleSection(listItem, forceExpand = null) {
        const isExpanded = listItem.classList.contains('expanded');
        const shouldExpand = forceExpand !== null ? forceExpand : !isExpanded;
        listItem.classList.toggle('expanded', shouldExpand);
    }

    toggleAllSections(expand) {
        const headings = this.#uiManager.#headingsList.querySelectorAll('li');
        headings.forEach(listItem => {
            if (listItem.classList.contains('can-toggle')) {
                this.toggleSection(listItem, expand);
            }
        });
    }

    filterHeadings(query) {
        query = query.toLowerCase().trim();
        const statsSearch =
            this.#uiManager.#panelDraggable.element.querySelector(
                '.autotoc-stats--search'
            );

        if (!query) {
            statsSearch.style.display = 'none';
            return this.refreshTOC();
        }

        let numFound = 0;

        const traverseListItems = ul => {
            ul.querySelectorAll(':scope > li').forEach(listItem => {
                const link = listItem.querySelector('a.autotoc-heading-jumper');
                const childUl = listItem.querySelector(':scope > ul');

                if (!link) return;

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

                if (childUl) traverseListItems(childUl);
            });

            statsSearch.textContent =
                numFound > 0 ? `Filtered: ${numFound}` : '';
            statsSearch.style.display = numFound > 0 ? 'block' : 'none';
        };

        const displayParent = li => {
            const hasParent = li.parentElement.closest('li');
            if (hasParent) {
                hasParent.classList.toggle('visible', true);
                displayParent(hasParent);
            }
        };

        const rootUl = this.#uiManager.#headingsList.querySelector('ul');
        traverseListItems(rootUl);
        rootUl.querySelectorAll('li.visible').forEach(displayParent);
    }

    getHeadings() {
        return this.#headings;
    }
}

window.AutoToC = window.AutoToC ?? {};
window.AutoToC.ToCManager = ToCManager;
