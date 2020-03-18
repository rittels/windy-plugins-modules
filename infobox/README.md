infobox module
==============

Box at the bottom left of the screen, hooked to the #bottom (desktop) or #mobile-calendar (mobile).

called with method:

        makeInfoBox(
		    content, //string to be added
		    startId,  //id of the button/div to open the left pane
		    _this,  //reference to the plugin calling the fx.
		    hideWhenPluginOpens=false
        )

Returns reference to this div.  In my plugins I reference it to this.refs.infobox.  The pluginCoordinator plugin can then set its style.display="none",  if another plugin opens.

in config.js:

        Load as dependency from:  'https://unpkg.com/windyplugin-module-infobox@x.x.x/dist/infobox.js'

in plugin:

        import xxx from '@windy/windy-plugin-module-infobox'

