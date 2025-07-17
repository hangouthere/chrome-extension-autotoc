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
                this.#uiManager.#onScrollWindow([foundHeading]);
            }, 300);
            document.removeEventListener('scrollend', scrollEnded);
        };

        foundHeading.style.scrollMarginTop = '5px';
        foundHeading.scrollIntoView({ behavior: 'smooth' });
        foundHeading.style.scrollMarginTop = oldMarginTop;
        document.addEventListener('scrollend', scrollEnded);
    }


    