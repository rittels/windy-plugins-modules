 if(!W['windy-plugin-module-infobox']) W.define(

    'windy-plugin-module-infobox',
    [ '$', 'rootScope', 'broadcast','store' ],
    function ( $, rs, bcast, store ) {

    let pluginVersion='0.0.6';

    /*import bcast from '@windy/broadcast';
    import rs from '@windy/rootScope';
    import $ from '@windy/$';
    import store from '@windy/store';*/

    function makeInfoBox(content,startId,_this,hideWhenPluginOpens=false){  //startId = provide plug in element id to show or hide plugin, on clicking box

        const hide=()=>{
            Object.assign(info.style,{visibility: 'hidden',opacity: '0', transition: 'visibility 0s 0.5s, opacity 0.5s linear'});
        }
        const show=()=>{
            Object.assign(info.style,{visibility: 'visible', opacity: '1', transition: 'opacity 0.5s linear'});
        }

        let info=document.createElement("div");
        Object.assign(info.style,{
            position:"absolute",
            marginLeft:"11px",
            pointerEvents:"none",
            width:"100%",
            backgroundColor:"transparent",
            padding:"3px",
            lineHeight:"1.1",
            whiteSpace:"nowrap"
        });
        info.innerHTML=content;

        if (rs.isMobile){
            info.style.bottom="140px";
            setTimeout(()=>{  //move down if enough space
                if(info.offsetWidth+20<(window.innerWidth-$("#mobile_box").offsetWidth)/2) info.style.bottom="110px";
            });
        } else if (rs.isTablet){
            info.style.bottom=((store.get('overlay')=="radar")?180:110)+"px";
        } else info.style.bottom=((store.get('overlay')=="radar")?140:70)+"px";

        if (rs.isMobile) $("#mobile-calendar").appendChild(info);
        else{
            $('#bottom').appendChild(info);
            store.on('overlay',e=>{
                info.style.bottom=(rs.isTablet?(e=="radar"?200:110):(e=='radar'?160:70))+"px";
            });
        }

        if (startId){
            Object.assign($("#"+startId).style,{cursor:"pointer",pointerEvents:"auto"});
            $("#"+startId).addEventListener("click",()=>{
                bcast.fire('rqstOpen',_this.ident);
            });
        }

        if (hideWhenPluginOpens){  //do not use _this.onopen=()=>{  -  will overwrite other listeners in main program
            bcast.on("pluginOpened",e=>{if (e==_this.ident)hide()  });
            bcast.on("pluginClosed",e=>{if (e==_this.ident)show()  });
        }

        return info;
	}
    //export default makeInfoBox;
    return makeInfoBox;

})