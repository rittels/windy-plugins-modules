
if(!W['windy-plugin-module-rplannerWrapper']) W.define(

    'windy-plugin-module-rplannerWrapper',
    ['map',  'picker',  '$', 'rootScope', 'broadcast' ],
    function (map,  picker,  $,   rs,  bcast ) {


        let pluginVersion="0.0.99";

        if (!document.getElementById('rplannerWrapperCSS'))  {
                var head  = document.getElementsByTagName('head')[0];
                var link  = document.createElement('link');
                link.id   = 'pickerToolsLess';
                link.rel  = 'stylesheet';
                link.type = 'text/css';
                link.href = `https://unpkg.com/windyplugin-module-rplanner-wrapper@${pluginVersion}/dist/rplannerWrapper.css`;
                link.media = 'all';
                head.appendChild(link);
         }


/*
import map from '@windy/map';
import $ from '@windy/$';
import bcast from  '@windy/broadcast';
import picker from  '@windy/picker';
import rs from '@windy/rootScope';
*/

    let rplan=W.plugins.rplanner;
    let calendarDiv=$("#calendar")?$("#calendar").innerHTML:"";
    let scrollpos=0;
    let xpos=0;
    let mapclickAr;
    let allowSendPosition=true;
    let scrolling=false;
    let scrollTO;       let sendposTO;
    let mustHideDot=true;
    let overCanvas=false;
    let elevBut, boatBut, vfrBut, ifrBut, airgramBut, carBut;
    let openPluginBtn, toggleDist;
    let lastOpen, lhPane;
    //let waiting4EL=false;     //waiting for elev and labels svg

    window.addEventListener("beforeunload",e=>{   //when overscrolling to the right,  the page wants to reload.
        if (overCanvas){
            e.preventDefault(); e.returnValue='';  return false;
        }
    });

    let resizeTO;
    document.body.onresize=()=>{
        console.log("resize");
        clearTimeout(resizeTO);
        resizeTO=setTimeout(rp.setLeft, 500, rp.myPlugin.isOpen?rp.left:0);
    }

    let rp={
        canvasw:0,
        mrgn:0,
        isOpen:false,
        myPlugin:"",
        helpText:"",
        openPluginText:"",
        left:0,
        //attached2lhp:true,
        interactive:false,
        pathsDisplay:"none",
        distanceDisplay:"none",
        dotOpacity:0.3,
        pickerActive:false,
        fr:"",
        altAr:[],    //altAr is set in options.
        pathAr:[],   //pathAr is calculated based on elev data,  used to calculate svg path depending on canvas width,  height and margin

        loadRP:(
            fp,  //[ { coords: {lat: lat, lng: lng},  altit: altitude in meter }, ... ]
            options,
            sendPosition,     //sendPosition is callback function to which position as ratio 0-1 along route is sent.
            onCloseCbf
        )=>{
            if (rs.isMobile || rs.isTablet){
                console.log("Not available in mobile or tablet");
                return "Not available in mobile or tablet";
            } else if (fp.length<2){
                console.log("Not enough waypoints");
                return "Not enough waypoints";
            }else  {

                //remove last svg child (which is waypoint svg),  detect when redrawn,  allows recalc of waypoint x values etc
                if (rplan.refs && rplan.refs.svg && rplan.refs.svg.lastElementChild){rplan.refs.svg.lastElementChild.remove();}

                rp.fp=fp;
                for(let p in options) if (rp.hasOwnProperty(p))rp[p]=options[p];
                rp.sendPosition=sendPosition;
                rp.onCloseCbf=onCloseCbf;
                rp.elevs=false;
                rp.wpx=[];
                rp.pathAr=[];
                rp.myPlugin=W.plugins[rp.myPlugin];
                rp.canvasw=0; rp.mrgn=0;

                let routestr="";
                for (let i=0; i<fp.length; i++){ routestr+=fp[i].coords.lat+","+fp[i].coords.lng+"; "}
                routestr=routestr.slice(0,-2);
                rplan.open(routestr);

                W.http.get("/rplanner/v1/elevation/" +routestr).then((res,rej)=>{
                    rp.elevs=res;
                });

                wait4elevAndLabels(()=>{
                    rp.recalc();
                    setOptions();
                    rp.makeAltAr();
                    rp.selectFr(rp.fr);
                });

                return true;
            }
        },

        selectFr:fr=>{
            if(fr=="ifr")ifrBut.click(); else vfrBut.click();
            //clicking button - change route canvas and also makeAltPath.
        } ,

        setLeft:lft=>{
            if (rplan.isOpen){
                rplan.element.style.left=(lft?lft+2:0)+"px";
                rplan.element.style.width= `calc(100% - ${lft}px)`;
                let click2redraw=()=>{
                    if (elevBut && ifrBut && vfrBut && openPluginBtn){
                        if (lft==0 && openPluginBtn.innerHTML){
                            //let lo=W['windy-plugin-module-pluginCoordinator'].lastOpened;
                            //if (!lo) lo=rp.myPlugin.ident;
                            //if ((W.plugins[lo].className && W.plugins[lo].className.indexOf("plugin-lhpane"))>=0){
                                //openPluginBtn.innerHTML=W.plugins[lo].title;
                            openPluginBtn.style.display="block";
                           // }
                        } else openPluginBtn.style.display="none";
                        elevBut.click();
                        if (rplan.refs && rplan.refs.svg && rplan.refs.svg.lastElementChild)rplan.refs.svg.lastElementChild.remove();
                        rp.selectFr(rp.fr);
                        wait4elevAndLabels(()=>{
                            rp.recalc(true)
                        });
                    } else setTimeout(click2redraw,20);
                }; click2redraw();
            }
        },

        recalc:makePth=>{   //Obtain canvas width,  margin,  then offset in pixels for each waypoint and store as wpx.
                            //if makePth==true:  make altitude path.
            rp.canvasw=rplan.refs.canvas.offsetWidth;
            let col=rplan.refs.svg.children;  //col=htmlcollection
            for (let i=0; i<col.length;i++){
                if (col[i].classList.contains("labels-waypoint")){
                    let e=col[i].children;
                    rp.wpx=[];
                    for(let j=0;j<e.length;j++){
                            if (e[j].nodeName=="circle")rp.wpx.push(
                                e[j].cx.baseVal.value
                                //e[j].getAttribute("cx");
                            );
                        }
                }
                if (col[i].classList.contains("labels-distance"))  rp.mrgn=col[i].children[0].x.baseVal[0].value;
            }
            rp.wpx.splice(0,0,rp.mrgn);
            rp.wpx.push(rp.canvasw-rp.mrgn); //last wp
            if (makePth){
                rp.makeAltPath(rp.fr);
            }
        },

        makeAltAr:(usefp=false)=>{
            if (rp.altAr.length || rp.fp[0].hasOwnProperty("altit")){

                let mx=-Infinity;
                const {fp,wpx,mrgn}=rp;
                let d=rp.elevs.data.distances;
                let elev=rp.elevs.data.elevations;

                if (!rp.altAr.length || usefp){  //from fp,  use step method
                    rp.altAr=[];
                    for (let i=0;i<wpx.length;i++){
                        rp.altAr.push({x:(wpx[i]-mrgn)/(rp.canvasw-2*mrgn) , altit:rp.fp[i].altit});
                        if (i<wpx.length-1) rp.altAr.push({x:(wpx[i+1]-mrgn-1)/(rp.canvasw-2*mrgn), altit:rp.fp[i].altit});
                    }
                }
                //console.log(rp.altAr);

                let dtot=d[d.length-1];
                let xi=0;//1;

                let add2pathAr=(x,y,el)=>{
                    if (el>y)y=el;  rp.pathAr.push([x,y]);
                    if(y>mx)mx=y;
                };

                rp.pathAr=[[0,elev[0]]];
                for (let j=0;j<elev.length;j++){
                    let xd=d[j]/dtot;
                    for(; xi<rp.altAr.length-1 && rp.altAr[xi+1].x<xd; xi++){
                        add2pathAr(rp.altAr[xi+1].x,rp.altAr[xi+1].altit,elev[j]);
                    }
                    if (xi<rp.altAr.length-1){
                        let xrtio=(xd-rp.altAr[xi].x) / (rp.altAr[xi+1].x-rp.altAr[xi].x);
                        let yy= rp.altAr[xi].altit + xrtio*(rp.altAr[xi+1].altit-rp.altAr[xi].altit);
                        add2pathAr(xd,yy,elev[j]);
                    }
                }
                add2pathAr(1,0,elev[elev.length-1]);
                rp.fr= (mx>12000/3.28084)?"ifr":"vfr";
            }
        },

        makeAltPath:fr=>{ //fr=flight rules
            if (rp.pathAr.length){
                const {mrgn}=rp;
                let w=rp.canvasw-mrgn*2;
                let h=fr=="vfr"?150:242;
                let ypx=fr=="vfr"?3.28084*h/12000:1/61.5;  //meter to pixels
                let pth=``;
                for (let i=0;i<rp.pathAr.length;i++){
                    let x=rp.pathAr[i][0], y= rp.pathAr[i][1];
                    pth+=(i==0?"M":"L")+`${(x*w)+mrgn} ${(h-y*ypx)} `;
                }

                //console.log(rp.pathAr,pth) ;
                let vb=`0 0 ${rp.canvasw} ${h}`;
                rp.altSvg.style.width=rp.canvasw+"px";
                rp.altSvg.style.height=h+"px";
                rp.altSvg.setAttributeNS(null, "viewBox", vb);
                rp.altPath.setAttributeNS(null, 'd', pth);
                return pth;
            }
        },

        getDistanceIcons:()=>{
            rp.distanceIcons=[];
            map.eachLayer(l=>{
                if(l.options && l.options.icon && l.options.icon.options.className=="distance-icon"){
                    rp.distanceIcons.push(l._icon);
                }
            });
        },

        getPaths:()=>{
            rp.paths=[];
            map.eachLayer(l=>{
                if(l._container && l._container.nodeName=="svg"){
                    let c=l._container.children;
                    for (let k=0;k<c.length;k++){
                        if (c[k].id=="segment-labels"){rp.distLabels=l._container.children[k];}
                        else{
                            let pths=c[0].children;
                            for (let i=0;i<pths.length;i++){
                                let strk=pths[i].attributes["stroke"].nodeValue;
                                let strkw=pths[i].attributes["stroke-width"].nodeValue;
                                let strko=pths[i].attributes["stroke-opacity"].nodeValue;
                                if(strk=="white"&&strkw=="4"&&strko=="0.8")rp.paths.push(pths[i]);
                            }
                        }
                    }
                }
            });
        },

        setInteractive:interact=>{
            setTimeout(()=>{
                rp.getDistanceIcons();
                if (interact){
                    rp.distanceIcons.forEach(e=>{
                        e.style.pointerEvents="auto";
                        e.style.opacity=1;
                    });
                    restoreMapClicks();
                    rp.interactive=true;
                } else {
                    rp.distanceIcons.forEach(e=>{
                        e.style.pointerEvents="none";
                        e.style.opacity=0.7;
                    });
                    stopMapClicks();
                    rp.interactive=false;
                }
            },200);
        },

        setPathsDisplay:(val="initial")=>{
            if(val===true)val="initial"; else if (val===false)val="none";
            rp.pathsDisplay=val;
            setTimeout(()=>{
                rp.getPaths();
                rp.paths.forEach(e=>e.style.display=val);
            },200);
        },

        setDistanceDisplay:(val="initial")=>{
            if(val===true)val="initial"; else if (val===false)val="none";
            toggleDist.innerHTML=val=="initial"?"Hide Dist":"Show Dist";
            rp.distanceDisplay=val;
            setTimeout(()=>{
                rp.getPaths();
                rp.distLabels.style.display=val;
            },200);
        },

        opacityFlashingDot:op=>{
            setTimeout(()=>{
                map.eachLayer(l=>{
                    if(l.options&&l.options.icon&&l.options.icon.options.className=="icon-dot") l._icon.style.opacity=op;
                });
            },100);
        },

        removeFlashingDots:()=>{
            map.eachLayer(l=>{
                    if(l.options&&l.options.icon&&l.options.icon.options.className=="icon-dot") l.remove();
            });
        },

        moveSliderLine:v=>{
             if (rplan.isOpen){
                xpos= rp.mrgn+(rp.canvasw-rp.mrgn*2)*v;
                let visible=rplan.element.offsetWidth-rplan.refs.distance.offsetWidth;
                if (xpos>scrollpos+visible-40){scrollpos=xpos-visible+40}
                else if (xpos<scrollpos+20){scrollpos=xpos-20}
                rplan.refs.dataTable.scrollLeft= scrollpos;
                rplan.refs.canvas.onmousemove({offsetX:xpos});
                if (mustHideDot) {
                    rp.opacityFlashingDot(rp.dotOpacity);
                    mustHideDot=false;
                }
            }
        },

        close:e=>{rplan.close()}

    }

    function setOptions(){
        rp.setInteractive(rp.interactive);
        rp.setPathsDisplay(rp.pathsDisplay);
        rp.setDistanceDisplay(rp.distanceDisplay);
        //if(rp.fr=="vfr")vfrBut.click();else ifrBut.click();
    }
    function stopMapClicks(){ //stop anon functions (which is the windy mapclick fxs),  reattach named functions
        map.off("click");
        mapclickAr.forEach(fn=>{
            if (fn.name){map.on("click",fn)}
        })
        //attach rqstopen
        if (rp.pickerActive) map.on("click",e=>{bcast.fire('rqstOpen','picker',{lat:e.latlng.lat,lon:e.latlng.lng})});
    }
    function restoreMapClicks(){ //restore all click functions stored in mapclickAr
        map.off("click");
        mapclickAr.forEach(fn=>map.on("click",fn));
    }
    function wait4elevAndLabels(cb){
        let c=0;
        let f=()=>{
            if (rplan.refs  && rplan.refs.svg &&  rplan.refs.svg.lastElementChild && rplan.refs.svg.lastElementChild.classList.contains("labels-waypoint") && rp.elevs){
                setTimeout(cb,500);
            }
            else {
                if(c<100){setTimeout(f,100)}
                else console.log("LOADING TIMED OUT");
            }
        };  f();
    }
    function getLhpName(){
        let o=W.plugins;
        for (let p in o){
            if (o[p].isOpen && o[p].className && o[p].className.indexOf("plugin-lhpane")>=0){
                return p;
            }
        }
        return null;
    }


    bcast.on("pluginClosed",e=>{
        if (e=="rplanner"){
            restoreMapClicks();
            rp.isOpen=false;
            allowSendPosition=true;
            mustHideDot=true;
            overCanvas=false;
            scrollpos=0;
            rp.removeFlashingDots();
            if(typeof rp.onCloseCbf ==="function")    rp.onCloseCbf();
        }
        else if (W.plugins[e] && W.plugins[e].className && W.plugins[e].className.indexOf("plugin-lhpane")>=0)      {
            rp.setLeft(0);
        }
    })

    bcast.on("pluginOpened",e=>{

        if (e==lastOpen){
            if (rp.isOpen){
                rp.setLeft(lastOpen && openPluginBtn.innerHTML? W.plugins[lastOpen].element.offsetWidth:0);
            }
        } else if (lhPane=getLhpName()){
            rp.setLeft(W.plugins[lhPane].element.offsetWidth);
        }
        if (e=="rplanner") {   //////creates DOM elements and sets listeners when first opened.
            bcast.fire("rqstClose",picker);
            //grab mapclick fxs
            mapclickAr=map._events.click.map(e=>e.fn);

            rp.isOpen=rplan.isOpen;
            rp.canvasw=0;
            if(!rplan.refs.calendar.innerHTML) rplan.refs.calendar.innerHTML=calendarDiv;  //calender div in the rplanner not filled when resizing,  pick up when main plugin loaded.

            rplan.refs.canvas.style.cursor="crosshair";
            rplan.refs.canvas.addEventListener("mouseenter", e=> {
                xpos=e.offsetX;
                overCanvas=true;
                rp.opacityFlashingDot(rp.dotOpacity);
                mustHideDot=false;
            });

            rplan.refs.canvas.addEventListener("mouseout", ()=>{
                overCanvas=false;
                mustHideDot=true;
            });

            rplan.refs.canvas.addEventListener("mousemove",e=>{
                if (!scrolling){
                    xpos=e.offsetX;
                    if(allowSendPosition && rplan.refs.dataTable.scrollLeft==scrollpos){
                        rp.ratio=(xpos-rp.mrgn)/(rp.canvasw-rp.mrgn*2);
                        rp.sendPosition(rp.ratio);
                        allowSendPosition=false;
                        clearTimeout(sendposTO);
                        sendposTO=setTimeout(()=>{
                            allowSendPosition=true;
                        },50);
                    }
                }
            });

            rplan.refs.dataTable.addEventListener("scroll",e=>{  //when reloading canvas after timestamp changed,  scrollLeft is set to 0:   eventlistener to detect this and set scrollLeft to previous scrollpos
                scrolling=true;

                clearTimeout(scrollTO);  scrollTO=setTimeout(()=>scrolling=false, 75);
                if(rplan.refs.dataTable.scrollLeft>0 || Math.abs(rplan.refs.dataTable.scrollLeft-scrollpos)<40){
                    scrollpos=rplan.refs.dataTable.scrollLeft;

                } else {

                    rplan.refs.dataTable.scrollLeft=scrollpos;
                }
            });

            rplan.element.style.transition="left 0.4s, opacity 0.4s";

            let btnsAnchor=document.createElement("div");
            Object.assign(btnsAnchor.style,{padding:"0px",border:"0px",top:"-47px",left:"2px",position:"absolute"});
            rplan.element.appendChild(btnsAnchor);

            let leftBtns=document.createElement("div");
            Object.assign(leftBtns.style,{margin:"0px",display:"inline-block"});
            let rightBtns=document.createElement("div");
            Object.assign(rightBtns.style,{margin:"0px",display:"inline-block"});
            btnsAnchor.appendChild(leftBtns);
            btnsAnchor.appendChild(rightBtns);

            let closingX=rplan.element.querySelector(".closing-x");
            closingX.classList.add("rplanner-wrapper-closing-x");
            closingX.style.fontSize="22px";
            closingX.addEventListener("click",rp.close);
            leftBtns.appendChild(closingX);

            openPluginBtn=document.createElement("div");
            openPluginBtn.innerHTML=rp.openPluginText;
            openPluginBtn.classList.add("rplanner-wrapper-button");
            openPluginBtn.innerHTML="";
            let pco=W['windy-plugin-module-pluginCoordinator'];
            lastOpen=(pco && pco.lastOpened)? pco.lastOpened:rp.myPlugin.ident;
            let w=0;
            if ((lastOpen && W.plugins[lastOpen].className && W.plugins[lastOpen].className.indexOf("plugin-lhpane"))>=0){
                openPluginBtn.innerHTML=W.plugins[lastOpen].title;
                openPluginBtn.addEventListener("click",()=>{
                    W.plugins[lastOpen].open();
                    //plugin.open() does not trigger rqstOpen?? if rqstOpen is used the plugin will close.  .open() does not.
                });
                let w=W.plugins[lastOpen].element.offsetWidth;
            }
            if (w==0){
                if (lhPane=getLhpName()) w=W.plugins[lhPane].element.offsetWidth;
            }
            setTimeout(rp.setLeft,1000,w);

            rightBtns.appendChild(openPluginBtn);

            toggleDist=document.createElement("div");
            toggleDist.innerHTML="Hide Dist";
            toggleDist.classList.add("rplanner-wrapper-button");
            toggleDist.addEventListener("click",(e)=>{
                let tx=e.target.innerHTML;
                if (tx=="Hide Dist"){
                    rp.setDistanceDisplay(false);
                } else {
                    rp.setDistanceDisplay(true);
                }
            });
            rightBtns.appendChild(toggleDist);

            let infoBut=document.createElement("div");
                infoBut.innerHTML="?";
                infoBut.classList.add("rplanner-wrapper-button");
                infoBut.style.width="24px";
                infoBut.style.fontWeight="bold";
                infoBut.onclick=()=>helpBox.style.display=helpBox.style.display=="none"?"block":"none";
            leftBtns.appendChild(infoBut);

            let helpBox=document.createElement("div");
                helpBox.classList.add("rplanner-wrapper-help-box");
                helpBox.style.display="none";
                helpBox.innerHTML=rp.helpText+
                `<div onclick="this.parentElement.style.display='none'" class="rplanner-wrapper-button" style="position:relative; width:30px; left:calc(100% - 40px);">OK</div>`;
            rplan.element.appendChild(helpBox);

            let xmlns = "http://www.w3.org/2000/svg";
            rp.altSvg = document.createElementNS(xmlns, "svg");
            rp.altSvg.setAttributeNS(null, 'preserveAspectRatio', "none");

            rp.altSvg.style.display="none";
            rp.altSvg.style.pointerEvents="none";
            rp.altSvg.style.position="absolute";

            rp.altPath = document.createElementNS(xmlns, "path");
            rp.altPath.setAttributeNS(null, 'stroke', "magenta");
            rp.altPath.setAttributeNS(null, 'stroke-width', 1);
            rp.altPath.setAttributeNS(null, 'stroke-linejoin', "round");
            rp.altPath.setAttributeNS(null, 'd', "");
            rp.altPath.setAttributeNS(null, 'fill', "none");
            rp.altPath.setAttributeNS(null, 'opacity', 1.0);
            rp.altSvg.appendChild(rp.altPath);

            rplan.refs.dataTable.appendChild(rp.altSvg);

            boatBut=$("[data-do='set,boat']");
            elevBut= $("[data-do='set,elevation']");
            vfrBut=$("[data-do='set,vfr']");
            carBut=$("[data-do='set,car']");
            airgramBut=$("[data-do='set,airgram']");
            ifrBut=$("[data-do='set,ifr']");
            vfrBut.addEventListener("click", ()=>{
                rp.fr="vfr";
                rp.makeAltPath(rp.fr);
                rp.altSvg.style.display="block";
            });
            ifrBut.addEventListener("click", ()=>{
                rp.fr="ifr";
                rp.makeAltPath(rp.fr);
                rp.altSvg.style.display="block";});
            boatBut.addEventListener("click", ()=>{   rp.altSvg.style.display="none";});
            carBut.addEventListener("click", ()=>{    rp.altSvg.style.display="none";});
            elevBut.addEventListener("click", ()=>{   rp.altSvg.style.display="none";});
            airgramBut.addEventListener("click", ()=>{rp.altSvg.style.display="none";});
        }
    });

    return rp;
})

//export default rp;

