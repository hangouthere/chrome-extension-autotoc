Panel:
* When NestLimit < 3?, indentations are broken
  * Same for `focus` selection
* Disable/disappear after inactivity or no headings found
* Need color option for twirl arrows

Options:
* Investigate detecting if the panel is removed/readded from DOM
  * Clean up instances and restart?
* Go through every file, find all `addEventListener` and make sure they're removed at some point
* Add docs to methods

Notes:
* Add Option for Auto Start on Pages
  * When Button is destroyed/not-created, clicking the Icon should create it?
    * Looked into determining if the Options page was opened, then it would check if the button was in DOM. However, this became increasingly complicated and painful when the options were opened in a Tab vs in the Popup. In turn, I decided to shelve this idea until I had enough patience or desire to accomplish this task.
* ~~Add Github Workflow publishing:~~
  * https://jam.dev/blog/automating-chrome-extension-publishing/
  * Turns out Google wants $5 to register your account, and i don't want to register my accounts like that.