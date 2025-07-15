/*
 * AutoToC Chrome Extension - Draggable Script
 * Author: CodexHere
 * GitHub: https://github.com/hangouthere/chrome-extension-autotoc
 */

class Draggable {
    hasMoved = false;
    #element = null;
    #startDragPos = { x: 0, y: 0 };

    #_dragStart = null;
    #_dragMove = null;
    #_dragEnd = null;

    get element() {
        return this.#element;
    }

    constructor(element) {
        const dragHandle = element.querySelector('.drag-handle') ?? element;

        this.#element = element;
        this.#_dragStart = this.#dragStart.bind(this, element);
        dragHandle.addEventListener('mousedown', this.#_dragStart);
    }

    #dragStart(element, e) {
        e.preventDefault();
        e.stopPropagation();

        this.hasMoved = false;

        this.#startDragPos = {
            x: e.clientX - element.offsetLeft,
            y: e.clientY - element.offsetTop
        };

        this.#_dragMove = this.#dragMove.bind(this, element);
        this.#_dragEnd = this.#dragEnd.bind(this, element);
        document.addEventListener('mousemove', this.#_dragMove);
        document.addEventListener('mouseup', this.#_dragEnd);
    }

    #dragMove(element, e) {
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
        newTop = Math.max(0, Math.min(newTop, vh - element.offsetHeight));
        newLeft = Math.max(0, Math.min(newLeft, vw - element.offsetWidth));

        element.style.top = `${newTop}px`;
        element.style.left = `${newLeft}px`;
    }

    #dragEnd() {
        document.removeEventListener('mousemove', this.#_dragMove);
        document.removeEventListener('mouseup', this.#_dragEnd);
        this.#_dragMove = this.#_dragEnd = null;
    }
}

window.AutoToC = window.AutoToC ?? {};
window.AutoToC.Draggable = Draggable;
