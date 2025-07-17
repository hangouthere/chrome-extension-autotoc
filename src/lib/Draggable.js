/*
 * AutoToC Chrome Extension - Draggable Script
 * Author: CodexHere
 * GitHub: https://github.com/hangouthere/chrome-extension-autotoc
 */

class Draggable {
    hasMoved = false;
    #element = null;
    #startDragPos = { x: 0, y: 0 };

    get element() {
        return this.#element;
    }

    constructor(element) {
        this.#element = element;
        element.addEventListener('mousedown', this.#dragStart);
    }

    destruct() {
        this.#element.querySelector('.drag-handle') ?? element;
        this.#element.removeEventListener('mousedown', this.#dragStart);
        this.#dragEnd();
    }

    #dragStart = e => {
        const dragHandle = e.target;

        if (false === dragHandle.classList.contains('drag-handle')) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        this.hasMoved = false;

        this.#startDragPos = {
            x: e.clientX - this.#element.offsetLeft,
            y: e.clientY - this.#element.offsetTop
        };

        document.addEventListener('mousemove', this.#dragMove);
        document.addEventListener('mouseup', this.#dragEnd);
    };

    #dragMove = e => {
        e.preventDefault();
        e.stopPropagation();
        this.hasMoved = true;

        const mx = e.clientX;
        const my = e.clientY;

        let newTop = my - this.#startDragPos.y;
        let newLeft = mx - this.#startDragPos.x;

        const vw = document.documentElement.clientWidth;
        const vh = document.documentElement.clientHeight;

        // Clamp to viewport
        newTop = Math.max(0, Math.min(newTop, vh - this.#element.offsetHeight));
        newLeft = Math.max(
            0,
            Math.min(newLeft, vw - this.#element.offsetWidth)
        );

        this.#element.style.top = `${newTop}px`;
        this.#element.style.left = `${newLeft}px`;
    };

    #dragEnd = () => {
        document.removeEventListener('mousemove', this.#dragMove);
        document.removeEventListener('mouseup', this.#dragEnd);
    };
}

window.AutoToC = window.AutoToC ?? {};
window.AutoToC.Draggable = Draggable;
