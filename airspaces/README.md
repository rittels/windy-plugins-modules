Airspaces module
================

Module load openAIP airspaces and displays it in a div that you provide.

It returns an object with:

Methods:

        findAsp({lat:x,lon:x}) returns {txt:text for innerHTML,  aspAr:[airspaces found])
        clearAsp() // clears all the layers highlighted
        appendAspListToDiv(id of the div where the airspace list should be appended)
        opac(0-1) //sets the opacity of the airspace polygons

Property:

        plugins_openAIPasp object with references to the data,  DOM elements and leaflet layers.

in config.js:

        Load as dependency from:  'https://unpkg.com/windyplugin-module-airspaces@x.x.x/dist/airspaces.js'

in plugin:

        import xxx as from '@windy/windy-plugin-module-airspaces'





