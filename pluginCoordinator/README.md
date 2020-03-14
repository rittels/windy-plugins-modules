pluginCoordinator module
========================

- When the plugins pane is Opened,  this module checks to see which plugins have been loaded (are present in W.plugins), then deactivates the "Load" buttons and changes them to "loaded",   and changes the "Open" buttons to open,  not load *and* open.
- When a plugin is **Loaded**,  it deactivates the Load button and change the Open button to just open.
- For a the last opened windy-plugin (plugin that has focus):   Sets lastOpened property of the opened windy-plugin to true,  all the others to false,  this allows switching off listeners in the inactive plugins.  (Especially the weather picker).
- Also for the plugin that looses focus (was lastOpened):
	- Calls the onOtherPluginOpened( the ident of the plugin being opened is sent as parameter  ) method if it exists, in all the plugins that are not lastOpened.  The lastOpened property is set to false *after* this function is called.
	- Sets the lastOpened property to false.
	- Closes the plugin, if it was open.
	- Sets the infobox div style to "none", if it exists.  (W.plugins.windy-plugin-xxx.refs.infobox)  I created this box to open the left pane,  or add info.  I use it in most of my plugins.
	- Clears the weather picker content.
- The pluginCoordinator also checks if a mobile or tablet is used, and adds a button on the context menu to open the plugins-plugin.


- The module is published here:  https://www.npmjs.com/package/windyplugin-module-plugin-coordinator
- Include it as an external dependency in the config file:

        dependencies: ['https://unpkg.com/windyplugin-module-plugin-coordinator@x.x.x/dist/pluginCoordinator.js', .....]

- Make sure the version is correct,  if left out, the browser will use the cached version.
- It is defined and required once loaded,  and does not export anything,  thus does not have to be imported.


