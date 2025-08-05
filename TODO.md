Panel:
* Disable/disappear after inactivity or no headings found
* Scrolling page should indicate Heading Focus in Panel
* When NestLimit < 3?, indentations are broken
  * Same for `focus` selection
* Need color option for twirl arrows
* Sometimes clicking Headings doesn't fire in time, and the handler is left for the next fire

Options:
* Investigate detecting if the panel is removed/readded from DOM
  * Clean up instances and restart?
* Go through every file, find all `addEventListener` and make sure they're removed at some point
* Add docs to methods

All:
* Add Option for Auto Start on Pages
  * When Button is destroyed/not-created, clicking the Icon should create it?
  * https://developer.chrome.com/docs/extensions/reference/api/action
* ~~Add Github Workflow publishing:~~
  * https://jam.dev/blog/automating-chrome-extension-publishing/
  * Turns out Google wants $5 to register your account, and i don't want to register my accounts like that.