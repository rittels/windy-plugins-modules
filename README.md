# windy-plugins-modules

Modules for common windy-plugin actions.  

The modules can be loaded as external dependencies from npm,  by adding them to the config.js file:

        dependencies: [
            'https://unpkg.com/windyplugin-module-plugin-coordinator@0.0.70/dist/pluginCoordinator.js',
            'https://unpkg.com/windyplugin-module-pickertools@0.0.96/dist/pickerTools.js',
            'https://unpkg.com/windyplugin-module-infobox@0.0.7/dist/infobox.js',
            'https://unpkg.com/windyplugin-module-airspaces@0.0.3/dist/airspaces.js',
            'https://unpkg.com/windyplugin-module-rplanner-wrapper@0.0.99/dist/rplannerWrapper.js'
        ],
        
      
Then imported into the plugin:  

        import pickerT from '@windy/windy-plugin-module-pickerTools';
        import ib from '@windy/windy-plugin-module-infobox';
        import asp from '@windy/windy-plugin-module-airspaces';
        import rp from '@windy/windy-plugin-module-rplannerWrapper';
      
The pluginCoordinator does not have to be imported into the plugin.  It is required (executed) when loaded.  
