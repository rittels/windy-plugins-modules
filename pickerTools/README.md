pickerTools module
==================

Can be added as an external dependency to fill and style the picker.  

It has the following methods:


- fillLeftDiv(string || div element  [, pickerBckgrCol])  //pickerBckgrCol true,  will fill the right div,  false is transparent.
- fillRightDiv(string || div element)
- drag(callbackfun when picker is dragged [, milliseconds]) //millisecond interval when callback will be called,  default=100
- removeElements()
- isOpen() returns "desktop" or "mobile" if the picker is currently open,  or false if closed.
- showLeftDiv()
- hideLeftDiv()
- showRightDiv()
- hideRightDiv()



  