class ScrollTracker {
  #headings; // Private array of headings

  constructor(headings) {
    this.#headings = headings;
  }

  // Find all scrollable parent elements up to the body
  findParentScrolls(element) {
    const scrollAreas = [];
    let currentElement = element;

    while (currentElement && currentElement !== document.body) {
      if (this.#isScrollable(currentElement)) {
        scrollAreas.push(currentElement);
      }
      currentElement = currentElement.parentElement;
    }

    // Include body as the final scroll area
    if (document.body && this.#isScrollable(document.body)) {
      scrollAreas.push(document.body);
    }

    return scrollAreas;
  }

  // Check if an element is scrollable
  #isScrollable(element) {
    const style = window.getComputedStyle(element);
    const overflow = style.overflow + style.overflowY + style.overflowX;
    return overflow.includes('auto') || overflow.includes('scroll');
  }

  // Check if an element is fully in view within all its scrollable parents
  isElementInView(element) {
    const scrollAreas = this.findParentScrolls(element);
    return scrollAreas.every(scrollArea => this.#isElementInScrollView(element, scrollArea));
  }

  // Check if an element is in view within a specific scroll area
  #isElementInScrollView(element, scrollArea) {
    const elementRect = element.getBoundingClientRect();
    const scrollRect = scrollArea === document.body 
      ? new DOMRect(0, 0, window.innerWidth, window.innerHeight)
      : scrollArea.getBoundingClientRect();

    return (
      elementRect.top >= scrollRect.top &&
      elementRect.bottom <= scrollRect.bottom &&
      elementRect.left >= scrollRect.left &&
      elementRect.right <= scrollRect.right
    );
  }

  // Scan all headings and their scroll areas
  scanScrollAreas() {
    return this.#headings.map(heading => ({
      heading,
      scrollAreas: this.findParentScrolls(heading),
      isInView: this.isElementInView(heading)
    }));
  }

  // Add scroll event listeners to all scroll areas for real-time tracking
  trackScrolls() {
    const uniqueScrollAreas = new Set();
    
    // Collect all unique scroll areas from all headings
    this.#headings.forEach(heading => {
      const scrollAreas = this.findParentScrolls(heading);
      scrollAreas.forEach(area => uniqueScrollAreas.add(area));
    });

    // Add scroll event listeners
    uniqueScrollAreas.forEach(scrollArea => {
      scrollArea.addEventListener('scroll', () => {
        this.#handleScroll();
      });
    });
  }

  // Handle scroll events
  #handleScroll() {
    const results = this.scanScrollAreas();
    // Process results (e.g., update UI, trigger events, etc.)
    console.log(results); // Replace with actual handling logic
  }
}

// Usage example
const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
const tracker = new ScrollTracker(headings);
tracker.trackScrolls();