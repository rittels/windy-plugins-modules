version_ = '0.0.63'
numericVesion_ = 63;

reloadPluginCoordinator = false;

if(W['pluginCoordinator']){
    if(W['pluginCoordinator'].numericVersion<numericVesion_) {
        console.log('Disabling old plugin coordinator version ', W['pluginCoordinator'].version, '.');
        console.warn('Different versions of the plugin coordinator used by different plugins. Using newest version. If errors occur, let the developers of the first installed plugin know!')
        W['pluginCoordinator'].disableListeners(); // disable listeners of old plugin coordinator (use function saved with that version)
        reloadPluginCoordinator = true;
    } else if (W['pluginCoordinator'].numericVersion>numericVesion_) {
        console.warn('Different versions of the plugin coordinator used by different plugins. Using newest version. If errors occur, let the developers of the last installed plugin know!')
    }
} else {
  reloadPluginCoordinator = true;
}

if (reloadPluginCoordinator){
    console.log('loading plugin coordinator version ', version_, '.')
    W['pluginCoordinator'] = {} // define plugin coordinator and remove potential old version

    W['pluginCoordinator'].version = version_;
    W['pluginCoordinator'].numericVersion = numericVesion_;
    W['pluginCoordinator'].changePluginsPluginButtons = function(loadedPlugin){
        let pluginsDiv=document.querySelector("#plugins-svelte-entrypoint");
        if (pluginsDiv && pluginsDiv.firstElementChild.children.length>2){
            if (W.rootScope.isMobile || W.rootScope.isTablet) document.getElementById("plugin-plugins").style.zIndex=1000;
            let c=pluginsDiv.firstElementChild.children;
            for(let i=2;i<c.length;i++){
                let linkNode=c[i].querySelector("a[href*='windy-plugin']");
                let hr=linkNode.href;
                console.log(hr);
                let pluginName=hr.slice(hr.lastIndexOf("/")+1);
                if (loadedPlugin==pluginName || (!loadedPlugin && W.plugins.hasOwnProperty(pluginName))){//if loadedPlugin not defined, then check each W.plugins
                    let but1=linkNode.nextElementSibling;
                    let but2=but1.nextElementSibling;
                    let newbut1=but1.cloneNode(true);
                    let newbut2=but2.cloneNode(true);
                    newbut1.innerHTML="Loaded";
                    Object.assign(newbut1.style,{opacity:0.5,cursor:"default"});
                    but1.parentNode.replaceChild(newbut1,but1);
                    newbut2.onclick=()=>{
                        W.plugins[pluginName].open();
                        W.plugins.plugins.close();
                    }
                    newbut2.classList.remove("disabled");
                    but2.parentNode.replaceChild(newbut2,but2);
                }
            }
            return true;
        } else return false;
    }
    W['pluginCoordinator'].externalPluginLoadedListener = function(e){
        setTimeout(W['pluginCoordinator'].changePluginsPluginButtons,500,e);
    }
    W['pluginCoordinator'].pluginOpenedListener = function(e){
        console.debug('Using plugin coordinator version ', W['pluginCoordinator'].version, '.');
        //listen for when plugins plugin is opened and then deactivate load button for this plugin and change open button to only open
        if (e=="plugins"){
            const changebutton=(attempt)=>{
                if (!W['pluginCoordinator'].changePluginsPluginButtons()) if (attempt<10) setTimeout(changebutton, 200,attempt+1);
            }
            changebutton(0);
        }

        //if mobile add button to open plugin button to context menu.  Only do once,  set mobileMenuPluginButton true.
        else if (e=="contextmenu"){
            if (!W['pluginCoordinator'].mobileMenuPluginButton  &&  (W.rootScope.isMobile || W.rootScope.isTablet)){
                W['pluginCoordinator'].mobileMenuPluginButton=true;
                let newbutton=document.createElement("a");
                newbutton.innerHTML="Load other plugin";
                newbutton.dataset.icon=String.fromCharCode(57406);
                newbutton.onclick=()=>W.broadcast.fire("rqstOpen","plugins");
                W.plugins.contextmenu.refs.menu.insertBefore(newbutton,W.plugins.contextmenu.refs.menu.lastElementChild);
            }
        }

        // if a windy-plugin plugin is opened,  set lastOpened for opened plugin true,  remove infobox if exists,  clear picker content if exists,  close plugin pane is isOpen
        else if (e.indexOf("windy-plugin")>=0){
            W.plugins[e].lastOpened=true;
            W['pluginCoordinator'].lastOpened=e;
            if (W.plugins[e].refs.infobox) W.plugins[e].refs.infobox.style.display="block"; //should not be necessary

        }
    }
    W['pluginCoordinator'].rqstOpenListener = function(e){
        //if another windy-plugin is requested open:  remove picker divs,  infobox display set to none, call onOtherPluginOpened if exists.  Set lastOpened false.
        if (e.indexOf("windy-plugin")>=0){
            let pluginsAvail=Object.keys(W.plugins).filter(e2=>e2.indexOf("windy-plugin")>=0);
            pluginsAvail.forEach(p=>{
                if (p!=e){
                    if (W.plugins[p].onOtherPluginOpened) W.plugins[p].onOtherPluginOpened(e);
                    if (W.plugins[p].lastOpened){
                        if (W.plugins[p].isOpen) W.plugins[p].close();
                        if (W.plugins[p].refs.infobox) W.plugins[p].refs.infobox.style.display="none";
                        if (W['windy-plugin-module-pickerTools'])  W['windy-plugin-module-pickerTools'].removeElements();
                        if (W[p+"/pickerTools"] && W[p+"/pickerTools"].removeElements )  W[p+"/pickerTools"].removeElements();//not really necessary
                    }
                    W.plugins[p].lastOpened=false;
                }
            });
        }
    }
    W['pluginCoordinator'].disableListeners = function(){
        W.broadcast.off("externalPluginLoaded",W['pluginCoordinator'].externalPluginLoadedListener);
        W.broadcast.off("pluginOpened",W['pluginCoordinator'].pluginOpenedListener);
        W.broadcast.off("rqstOpen",W['pluginCoordinator'].rqstOpenListener);
    }

    W.broadcast.on("externalPluginLoaded",W['pluginCoordinator'].externalPluginLoadedListener);
    W.broadcast.on("pluginOpened",W['pluginCoordinator'].pluginOpenedListener);
    W.broadcast.on("rqstOpen",W['pluginCoordinator'].rqstOpenListener);

}
