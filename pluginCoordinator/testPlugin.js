W.loadPlugin(
/* Mounting options */
{
  "name": "windy-plugin-testPlugin",
  "version": "0.0.1",
  "description": "Windy plugin that gives shows sun position on the map and gives details about sunset and sunrise times.",
  "displayName": "Test Plugin",
  "hook": "contextmenu",
  "dependencies": ["http://localhost:8000/pluginCoordinator.js", "http://localhost:8000/pluginCoordinatorNewVersion.js"],
  "className": "plugin-lhpane plugin-mobile-fullscreen",
  "classNameMobile": "plugin-sun-position-mobile",
  "exclusive": "lhpane"
},
/* HTML */
'',
/* Constructor */
function () {}
)
