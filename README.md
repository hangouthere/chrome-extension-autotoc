# AutoToC Chrome Extension

A Chrome extension that automatically generates a table of contents (TOC) for web pages based on headings (h1-h6).

## Features
- Automatically detects and lists all headings (h1-h6) on a webpage
- Customizable button and panel styles via the options page
- Search functionality to filter headings across all levels
- Scroll tracking to highlight the current heading in view
- Toggleable sections for collapsible hierarchy (h1-h3)
- Responsive design with adjustable max width and height
- Tooltips for panel control icons
- Modern ES6 class-based architecture for improved maintainability

## Installation
1. Clone or download the repository
2. Load the extension in Chrome via `chrome://extensions/` by enabling "Developer mode" and selecting "Load unpacked", then pointing to the extension directory
3. The AutoToC button will appear on webpages where it can generate a TOC

## Usage
- Click the AutoToC button (bottom right) to toggle the panel
- Use the options page (accessed via the cog icon) to customize appearance and behavior
- Search headings using the input at the bottom of the panel
- Scroll to navigate; the focused heading is highlighted

## Development
The extension is built using modern JavaScript ES6 classes for better code organization and maintainability. Key components include:

- `AutoToC` class: Main class handling all core functionality
- Organized methods for panel creation, event handling, and styling
- Private class fields for state management
- Modular event handling and DOM manipulation

## Contributing
Contributions are welcome! Please fork the repository and submit pull requests.

## License
MIT License - See LICENSE file for details.