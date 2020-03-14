 if(!W['windy-plugin-module-pickerTools']) W.define(

    'windy-plugin-module-pickerTools',
    ['map', 'picker', '$', 'rootScope', 'broadcast'],
    function (map, picker, $, rs, bcast) {

        let pluginVersion='0.0.95';

        /* import map from '@windy/map'
        import picker from '@windy/picker'
        import $ from '@windy/$'
        import rs from '@windy/rootScope'
        import bcast from  '@windy/broadcast'*/

        //load css
        if (!document.getElementById('pickerToolsCSS'))  {
            var head  = document.getElementsByTagName('head')[0];
            var link  = document.createElement('link');
            link.id   = 'pickerToolsLess';
            link.rel  = 'stylesheet';
            link.type = 'text/css';
            link.href = `https://unpkg.com/windyplugin-module-pickertools@${pluginVersion}/dist/pickerTools.css`;
            link.media = 'all';
            head.appendChild(link);
        }



        let pdl=document.createElement("div");
        pdl.id="picker-div-left";
        pdl.style.position="absolute";
        pdl.classList.add(rs.isMobile?"picker-div-mobl":"picker-div-desk");

        let pdr=document.createElement("div");
        pdr.id="picker-div-right";
        pdr.classList.add(rs.isMobile?"picker-div-mobl":"picker-div-desk");

        let pckEl;
        let pt={};

        ////send text to picker div.
        function mobileDiv(d){
            if (W.pickerMobile.popup){
                pckEl=W.pickerMobile.popup;
                if (!pckEl.contains(d)){
                    pckEl.style.position="fixed";
                    let pda=document.createElement("div");
                    pda.classList.add("picker-anchor-mobl");
                    pckEl.appendChild(pda);
                    pda.appendChild(d);
                }
            }
        }

        function addContent(html,el){
            if (html){
                el.style.display="block";
                if (html.nodeName=="DIV"){
                    if (html.innerHTML){
                        for(;el.firstChild;)el.firstChild.remove();
                        el.appendChild(html);
                    }  else el.style.display="none";
                } else el.innerHTML=html;
            } else {
                el.style.display="none";
            }
        }

        pt.fillRightDiv=function(html){
            if(!rs.isMobile){
                if (W.pickerDesktop.popupContent){
                    pckEl=W.pickerDesktop.popupContent;
                    if (!pckEl.contains(pdr)){
                        pckEl.parentNode.style.outlineStyle="none";  //on my tablet long touching picker causes a persistent orange outline.  this stops it.
                        pckEl.appendChild(pdr);
                    }
                }
            } else  mobileDiv(pdr);
            addContent(html,pdr);
        }

        pt.fillLeftDiv=function(html,pickerBckgCol=false){ //pickerBckgCol=false is transparent,  true= "rgba(68,65,65,0.84)"
            if (pickerBckgCol)  pdl.style.backgroundColor="rgba(68,65,65,0.84)";
            else pdl.style.backgroundColor="transparent";  
            if(!rs.isMobile){
                if (W.pickerDesktop.popupContent){
                    pckEl=W.pickerDesktop.popupContent;
                    if (!pckEl.contains(pdl)){
                        pckEl.parentNode.style.outlineStyle="none";
                        let pda=document.createElement("div");
                        pckEl.appendChild(pda);
                        Object.assign(pda.style,{top:"0px",width:"0px",position:"absolute"});
                        pda.appendChild(pdl);
                    }
                }
            } else mobileDiv(pdl);
            addContent(html,pdl);
        }

        pt.hideLeftDiv=function() { pdl.style.display="none"; }
        pt.hideRightDiv=function(){ pdr.style.display="none"; }
        pt.showLeftDiv=function() { pdl.style.display="block"; }
        pt.showRightDiv=function(){ pdr.style.display="block"; }

        pt.removeElements=function() {
            if (pdr.parentNode)pdr.parentNode.removeChild(pdr);
            if (pdl.parentNode)pdl.parentNode.removeChild(pdl);
        }

        pt.isOpen=function(){
            if (W.pickerDesktop && W.pickerDesktop.marker._icon) return "desktop";
            else if (W.pickerMobile && W.pickerMobile.popup) return "mobile";
            else return null;
        }

        //--picker drag listener
        pt.drag=function(cbf, interv=100){          //by default the picker is cbf is requested every 100ms when dragged.
            let tries=0;
            let ready=true;
            let dragStopped=true;
            let mapMovef=e=>{
                dragStopped=false;
                if (ready){
                    let ll=map.containerPointToLatLng([0,180]);
                    ll.lon=ll.lng=map.getCenter().lng;
                    cbf(ll);
                    ready=false;
                    setTimeout(()=>{
                        ready=true;
                        setTimeout(()=>{
                            if (ready && !dragStopped){
                                let ll=map.containerPointToLatLng([0,180]);
                                ll.lon=ll.lng=map.getCenter().lng;
                                cbf(ll);
                            }
                        },interv)
                    },interv);
                }
            }
            let pckrMovef=e=>{
                dragStopped=false;
                if (ready){
                    let ll=e.target._latlng;
                    ll.lon=ll.lng;
                    cbf(ll);
                    ready=false;
                    setTimeout(()=>{
                        ready=true;
                        setTimeout(()=>{
                            if (ready && !dragStopped){
                                let ll=e.target._latlng;
                                ll.lon=ll.lng;
                                cbf(ll);
                            }
                        },interv)
                    },interv);
                }
            }
            let wait4pckr=()=>{
                let open=pt.isOpen();
                if (open=="desktop"){
                    pt.pckr=W.pickerDesktop.marker;
                    pt.pckr.on("drag",pckrMovef);
                    pt.pckr.on("dragstart",()=>{if($("#plugin-rplanner"))$("#plugin-rplanner").style.opacity=0});
                    pt.pckr.on("dragend",()=>{if($("#plugin-rplanner"))$("#plugin-rplanner").style.opacity=1});
                } else if (open=="mobile") { //W.pickerMobile.popup no longer exists of picker closed
                    map.on("move",mapMovef)
                }
            }
            wait4pckr(); //in case picker has already been opened;

            let remListeners=()=>{
                if(rs.isMobile) map.off("move",mapMovef);
                else pt.pckr.off("drag",pckrMovef); ////probably not necessary.
            }
            bcast.on("pluginOpened",e=>{
                setTimeout(wait4pckr,500);
            });
            picker.on("pickerOpened", wait4pckr);
            picker.on("pickerClosed",remListeners);
            picker.on('pickerMoved', ()=>{dragStopped=true});
        }
        return pt;

        //export default  pt;
});
