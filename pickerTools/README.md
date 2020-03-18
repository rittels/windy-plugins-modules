pickerTools module
==================

Can be added as an external dependency to fill and style the picker.  

It has the following methods:


- fillLeftDiv(string || div element  [, pickerBckgrCol])  //pickerBckgrCol true,  will set the backgroundColor the same as the weather picker,  false is transparent.
- fillRightDiv(string || div element) //this div is inside the picker div,  so backgroundColor is not set.
- drag(callbackfun when picker is dragged [, milliseconds]) //millisecond interval when callback will be called,  default=100
- removeElements()
- isOpen() returns "desktop" or "mobile" if the picker is currently open,  or false if closed.
- showLeftDiv()
- hideLeftDiv()
- showRightDiv()
- hideRightDiv()

in config.js:

        Load as dependency from:  'https://unpkg.com/windyplugin-module-pickertools@x.x.x/dist/pickerTools.js'

in plugin:

        import xxx from '@windy/windy-plugin-module-pickerTools'
