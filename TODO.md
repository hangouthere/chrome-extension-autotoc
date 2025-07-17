Panel:
* Scrolling page should indicate Heading Focus in Panel
* Clicking on Panel should wait until completed scrolling to flash heading
  * https://github.com/FallenMax/smart-toc/blob/19ae553bbfb1a183b14c69c12ae08afa9ac5112d/src/content/lib/scroll.ts#L4
* When NestLimit < 3?, indentations are broken
* Need color option for twirl arrows
* Style changes need to have a transition

Options:
* Consider changing UI to use tabs: https://wpshout.com/snippets/accessible-pure-css-tabs/
All:
* Make a pass at CSS removing as much `px` definitions as possible
  * I think panel/button size might need to stay PX for consistency
* Add Github Workflow publishing:
  * https://jam.dev/blog/automating-chrome-extension-publishing/
* Investigate detecting if the panel is removed/readded from DOM
  * Clean up instances and restart?
* Go through every file, find all `addEventListener` and make sure they're removed at some point
* Replace HEADER to HEADING everywhere!