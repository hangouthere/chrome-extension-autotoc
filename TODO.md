Panel:
* Clicking on panel jumpers seems broken, need to blacklist fitler
* Disable/disappear after inactivity or no headings found
* Scrolling page should indicate Heading Focus in Panel
* When NestLimit < 3?, indentations are broken
* Need color option for twirl arrows
* Sometimes clicking Headings doesn't fire in time, and the handler is left for the next fire

Options:
* Add Github Workflow publishing:
  * https://jam.dev/blog/automating-chrome-extension-publishing/
* Investigate detecting if the panel is removed/readded from DOM
  * Clean up instances and restart?
* Go through every file, find all `addEventListener` and make sure they're removed at some point
* Add docs to methods