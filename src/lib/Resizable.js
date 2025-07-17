/*
 * AutoToC Chrome Extension - Resizable Script
 * Author: CodexHere
 * GitHub: https://github.com/hangouthere/chrome-extension-autotoc
 */

const TemplateResizers = `
    <div data-direction="n" class="resizer"></div>
    <div data-direction="e" class="resizer"></div>
    <div data-direction="s" class="resizer"></div>
    <div data-direction="w" class="resizer"></div>
    <div data-direction="se" class="resizer"></div>
    <div data-direction="ne" class="resizer"></div>
    <div data-direction="nw" class="resizer"></div>
    <div data-direction="sw" class="resizer"></div>
`;

class Resizable {
    hasMoved = false;
    #element = null;

    #_dragStart = null;
    #_dragMove = null;
    #_dragEnd = null;

    get element() {
        return this.#element;
    }

    connect(element) {
        this.#element = element;

        const resizerCtr = document.createElement('div');
        resizerCtr.classList.add('autotoc-resizer-container');
        resizerCtr.innerHTML = TemplateResizers;

        this.#_dragStart = this.#dragStart.bind(this, element);

        element.appendChild(resizerCtr);
        element.addEventListener('mousedown', this.#_dragStart);
    }

    #dragStart(element, e) {
        const dragHandle = e.target;

        if (false === dragHandle.classList.contains('resizer')) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        this.hasMoved = false;

        this.#_dragMove = this.#dragMove.bind(
            this,
            element,
            dragHandle.dataset.direction
        );

        this.#_dragEnd = this.#dragEnd.bind(this, element);
        document.addEventListener('mousemove', this.#_dragMove);
        document.addEventListener('mouseup', this.#_dragEnd);
    }

    #dragMove(element, direction, e) {
        e.preventDefault();
        e.stopPropagation();
        this.hasMoved = true;

        const styles = getComputedStyle(element);
        const minWidth = parseFloat(styles.minWidth) || 0;
        const minHeight = parseFloat(styles.minHeight) || 0;

        const mx = e.clientX;
        const my = e.clientY;

        let rect = {
            x: element.offsetLeft,
            y: element.offsetTop,
            w: element.clientWidth,
            h: element.clientHeight,
            // border
            b: element.offsetWidth - element.clientWidth
        };

        const clampOpts = { rect, minWidth, minHeight };

        switch (direction) {
            case 'n':
                // break early to avoid weird side-effects of other dimensions
                if (0 > my || rect.h - my <= minHeight) {
                    break;
                }
                rect.h += rect.y - my;
                rect = this.clampWindowRect({ ...clampOpts, dir: 'h' });
                rect.y = my;
                rect = this.clampWindowRect({ ...clampOpts, dir: 'y' });
                break;
            case 's':
                rect.h = my - rect.y;
                rect = this.clampWindowRect({ ...clampOpts, dir: 'h' });
                break;
            case 'e':
                rect.w = mx - rect.x;
                rect = this.clampWindowRect({ ...clampOpts, dir: 'w' });
                break;
            case 'w':
                // break early to avoid weird side-effects of other dimensions
                if (rect.w + rect.x - mx < minWidth) {
                    break;
                }
                rect.w += rect.x - mx;
                rect = this.clampWindowRect({ ...clampOpts, dir: 'w' });
                rect.x = mx;
                rect = this.clampWindowRect({ ...clampOpts, dir: 'x' });
                break;
            case 'nw':
                rect.h += rect.y - my;
                rect = this.clampWindowRect({ ...clampOpts, dir: 'h' });
                rect.y = my;
                rect = this.clampWindowRect({ ...clampOpts, dir: 'y' });
                rect.w += rect.x - mx;
                rect = this.clampWindowRect({ ...clampOpts, dir: 'w' });
                rect.x = mx;
                rect = this.clampWindowRect({ ...clampOpts, dir: 'x' });
                break;
            case 'ne':
                rect.h += rect.y - my;
                rect = this.clampWindowRect({ ...clampOpts, dir: 'h' });
                rect.y = my;
                rect = this.clampWindowRect({ ...clampOpts, dir: 'y' });
                rect.w = mx - rect.x;
                rect = this.clampWindowRect({ ...clampOpts, dir: 'w' });
                break;
            case 'sw':
                rect.h = my - rect.y;
                rect = this.clampWindowRect({ ...clampOpts, dir: 'h' });
                rect.w += rect.x - mx;
                rect = this.clampWindowRect({ ...clampOpts, dir: 'w' });
                rect.x = mx;
                rect = this.clampWindowRect({ ...clampOpts, dir: 'x' });
                break;
            case 'se':
                rect.h = my - rect.y;
                rect = this.clampWindowRect({ ...clampOpts, dir: 'h' });
                rect.w = mx - rect.x;
                rect = this.clampWindowRect({ ...clampOpts, dir: 'w' });
                break;
        }

        element.style.left = `${rect.x}px`;
        element.style.top = `${rect.y}px`;
        element.style.width = `${rect.w}px`;
        element.style.height = `${rect.h}px`;
    }

    clampWindowRect({ rect, minWidth, minHeight, dir }) {
        const vh = document.documentElement.clientHeight;
        const vw = document.documentElement.clientWidth;

        switch (dir) {
            case 'x':
                rect.x = Math.max(0, Math.min(rect.x, vw - rect.w));
                break;
            case 'y':
                rect.y = Math.max(0, Math.min(rect.y, vh - rect.h));
                break;
            case 'w':
                rect.w = Math.max(
                    minWidth,
                    Math.min(rect.w, vw - rect.x - rect.b)
                );
                break;
            case 'h':
                rect.h = Math.max(
                    minHeight,
                    Math.min(rect.h, vh - rect.y - rect.b)
                );
                break;
        }

        return rect;
    }

    #dragEnd() {
        document.removeEventListener('mousemove', this.#_dragMove);
        document.removeEventListener('mouseup', this.#_dragEnd);
        this.#_dragMove = this.#_dragEnd = null;
    }
}

window.AutoToC = window.AutoToC ?? {};
window.AutoToC.MARGIN_OFFSET = 40;
window.AutoToC.Resizable = Resizable;
