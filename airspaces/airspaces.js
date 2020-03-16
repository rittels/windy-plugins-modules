if(!W['windy-plugin-module-airspaces']) W.define(

    'windy-plugin-module-airspaces',
    ['map', 'interpolator', 'picker', 'utils', '$', 'rootScope', 'broadcast','store' ],
    function (map, interpolator, picker, utils, $,   rs,          bcast,      store ) {

    let pluginVersion='0.0.3';
    /*import $ from '@windy/$';
    import map from '@windy/map';
    import interpolator from '@windy/interpolator';
    import bcast from '@windy/broadcast';
    import store from '@windy/store';
    import picker from '@windy/picker';
    import utils from '@windy/utils';
    import rs from '@windy/rootScope';*/

    if (!document.getElementById('airspacesCSS'))  {
            var head  = document.getElementsByTagName('head')[0];
            var link  = document.createElement('link');
            link.id   = 'pickerToolsLess';
            link.rel  = 'stylesheet';
            link.type = 'text/css';
            link.href = `https://unpkg.com/windyplugin-module-airspaces@${pluginVersion}/dist/airspaces.css`;
            link.media = 'all';
            head.appendChild(link);
    }

    function appendAspListToDiv(divId){
        $("#"+divId).appendChild(plugins_openAIPasp.elements.mainDiv);
    }

    const fetchCountryList=(fetchTries)=>{
        fetch("https://www.openaipgeojson.com/getFile.php?fname=countries.json").then((r)=>r.json()).then(r=>{
            let oaip=plugins_openAIPasp;
            oaip.countries=r;
            let cntdiv=[], cnttxt=[], cntmsg=[], cntremove=[];
            oaip.countries.forEach((e,i)=>{
                cntdiv[i]=document.createElement("div");
                cntdiv[i].className="airspace-div";
                cnttxt[i]=document.createElement("span");
                let s=e.name.slice(0,-3); s=s[0].toUpperCase()+s.slice(1);
                for (let j=0,l=s.length;j<l;j++)if(s[j]=="_")s=s.slice(0,j)+" "+s[j+1].toUpperCase()+s.slice(j+2);
                cnttxt[i].innerHTML=s;
                cnttxt[i].dataset.i=i;
                cnttxt[i].className="airspace-div-txt";
                cnttxt[i].addEventListener("click",n=>{
                    if (!oaip.countries[i].asp)cntmsg[i].style.display="inline-block";
                    Object.assign(cnttxt[i].style,{fontWeight:"bold",fontSize:"14px",opacity:1});
                    oaip.fetchAsp(i);
                });
                cntremove[i]=document.createElement("span");
                cntremove[i].className="closing-x-small";
                cntremove[i].dataset.i=i;
                cntremove[i].addEventListener("click",n=>{
                    map.removeLayer(oaip.countries[i].gjLayer); delete oaip.countries[i].gjLayer;
                    Object.assign(cnttxt[i].style,{fontWeight:"normal", fontSize:"13px", opacity:0.9});
                    cntremove[i].style.display="none";
                });
                cntmsg[i]= document.createElement("span");
                cntmsg[i].style.display="none";
                cntmsg[i].innerHTML="&nbsp;&nbsp;&nbsp;Loading....";
                cntdiv[i].appendChild(cnttxt[i]);
                cntdiv[i].appendChild(cntremove[i]);
                cntdiv[i].appendChild(cntmsg[i]);
                oaip.elements.aipDiv.appendChild(cntdiv[i]);
            });
            Object.assign(plugins_openAIPasp.elements,{cntdiv:cntdiv,cnttxt:cnttxt,cntremove:cntremove,cntmsg:cntmsg});
        }).catch(error=>{
            console.error('Error:', error, 'Attempt',fetchTries);
            if(fetchTries<5){
                setTimeout(fetchCountryList,2000,fetchTries+1);
            }
            else plugins_openAIPasp.elements.aipDiv.innerHTML="Failed to load country list.<br>You can try to reload plugin.";
        });
    }

    //if (!plugins_openAIPasp) {
        plugins_openAIPasp={
            aspOpac:0.4,
            prevLayerAr:[], //previously found lauyers
            elements:{mainDiv:document.createElement("div"),aipDiv:document.createElement("div")},

            fetchAsp:function(i){
                let bnds=this.countries[i].bounds[0];
                map.panTo([(bnds[1][0]-bnds[0][0])/2,(bnds[1][1]-bnds[0][1])/2]);
                map.fitBounds(bnds);
                if (!this.countries[i].fetched){
                    this.countries[i].fetched=true;
                    fetch(`https://www.openaipgeojson.com/getFile.php?fname=${this.countries[i].name}.geojson`).then((r)=>r.json()).then(r=>{
                        this.countries[i].asp=r;
                        this.load(i);
                    }).catch(err=>{
                        this.countries[i].fetched=false;
                        console.log("failed to fetch",err);
                    });
                } else if (!this.countries[i].gjLayer) this.load(i);
            },

            load:function(i){
                this.countries[i].gjLayer=L.geoJSON(this.countries[i].asp,{
                    style: feature=>{return {weight:1, fill:0, opacity:this.aspOpac, color:this.aspColor(feature.properties.CAT)};}
                }).addTo(map);
                this.elements.cntmsg[i].style.display="none"
                this.elements.cntremove[i].style.display="inline-block";
            },

            aspColor:function(n){
                switch (n) {
                    case 'RESTRICTED':  return "lightpink";     break;
                    case 'PROHIBITED':  return "orange";           break;
                    case 'DANGER':      return "orangered";     break;
                    case 'CTR':         return "lightblue";     break;
                    case 'A':           return "aliceblue";     break;
                    case 'C':           return "cyan";     break;
                    case 'D':           return "aqua";     break;
                    case 'E':           return "peachpuff";     break;
                    case 'F':           return "lawngreen";     break;
                    case 'B':           return "lightcyan";          break;
                    case 'G':           return "lightyellow";     break;
                    case 'TMZ':         return "lightgreen";    break;
                    case 'WAVE':        return "mistyrose";     break;
                    case 'RMZ':         return "palegreen";     break;
                    case 'gliding':     return "lightsalmon";     break;
                    case 'FIR':         return "aquamarine";     break;
                    default:            return "white";
                }
            }

        }

        let aipHead=document.createElement("div");
        Object.assign(aipHead.style,{position:"absolute", "font-size":"14px", "font-weight":"bold", height:"20px", margin:"5px 0px 0px 1px"});
        aipHead.innerHTML='<a style="text-decoration:underline" href="http://www.openaip.net" target="_blank">openAIP</a>  airspaces: ';
        plugins_openAIPasp.elements.aipDiv.classList.add("plugin-content","airspace-list");
        let aipFoot=document.createElement("div");
        Object.assign(aipFoot.style,{position:"absolute", "font-size":"9px", bottom:"0px",height:"27px","margin-left":"1px"});
        aipFoot.innerHTML=
                    `Airspaces data from <a style="text-decoration:underline" href="http://www.openaip.net" target="_blank">openAIP</a>
                    airspaces translated to geojson. (Updated 19-01-2020).`;
        let e= plugins_openAIPasp.elements.mainDiv;
        e.appendChild(aipHead); e.appendChild(plugins_openAIPasp.elements.aipDiv); e.appendChild(aipFoot);
        setTimeout(fetchCountryList,100,0);
    //}

    //algorithm from github - substack - point-in-polygon, MITlic
    const checkPoly= function(point, vs) {
        var x = point[0], y = point[1];
        var inside = false;
        for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            var xi = vs[i][0], yi = vs[i][1];
            var xj = vs[j][0], yj = vs[j][1];
            var intersect = ((yi > y) != (yj > y))
             && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    };

    //--find airspace:
    function findAsp(e){

        if (plugins_openAIPasp && plugins_openAIPasp.countries ){

            let oaip=plugins_openAIPasp;

            let c= [e.lon||e.lng,e.lat]; //points obj for geojson
            let cc = [e.lat,e.lon||e.lng];//points obj for leaflet

            let txt="";
            let aspAr=[];
            let layerAr=[]; // found layers

            let cntryBounds=i=>{
                for(let j=0,l=oaip.countries[i].bounds.length;j<l;j++){
                    let bnds=L.bounds(oaip.countries[i].bounds[j]);
                    if (bnds.contains(cc)) return true;
                }
                return false;
            }

            //countries.forEach((cntry,i)=>{
            for (let i=0; i<oaip.countries.length; i++){
                let cntry=oaip.countries[i];
                if (cntry.gjLayer && cntryBounds(i)){
                        cntry.gjLayer.eachLayer(e=>{
                            let b=L.bounds(e.feature.properties.bnd);
                            if (b.contains(cc)){    //airspace bounds stored in properties.
                                if(checkPoly(c,e.feature.geometry.coordinates[0])){
                                    aspAr.push(e.feature.properties );
                                    txt+=
                                    `<div onclick='let d=this.nextElementSibling; if(d.style.display=="none"){d.style.display=""}else{d.style.display="none"}' style='color:${oaip.aspColor(e.feature.properties.CAT)}; cursor:pointer; z-Index:999; word-wrap:normal;'>${e.feature.properties.N}&nbsp;&nbsp;&nbsp;</div>
                                    <div style='display:none'><span style='font-size:10px;'>&nbsp;&nbsp;Cat:&nbsp;${e.feature.properties.CAT}</span>
                                    <br><span style='font-size:10px;'>&nbsp;&nbsp;${e.feature.properties.AB}${e.feature.properties.AB_U}-${e.feature.properties.AT}${e.feature.properties.AT_U}</span></div>`;
                                    layerAr.push(e);
                                    e.setStyle({color:oaip.aspColor(e.feature.properties.CAT),  weight:2, opacity:1});
                                }
                            }
                        });
                }
            };
            oaip.prevLayerAr.forEach(e=>{
                            let id=e._leaflet_id;
                            for(var k=0,ll=layerAr.length;k<ll&&id!=layerAr[k]._leaflet_id;k++);
                            if (k==ll) e.setStyle({color:oaip.aspColor(e.feature.properties.CAT),  weight:1, opacity:oaip.aspOpac});
            });
            oaip.prevLayerAr=layerAr.map(e=>e);

            return {txt,aspAr};
        } else return {txt:"",aspAr:[]}
    };

    function clearAsp(){   //clear all airspaces
        let oaip=plugins_openAIPasp;
        oaip.prevLayerAr.forEach(e=>{
            e.setStyle({color:oaip.aspColor(e.feature.properties.CAT),  weight:1, opacity:0.4});
        });
        oaip.prevLayerAr=[];
    }

    function opac(op){   //change opacity
        let oaip=plugins_openAIPasp;
        oaip.aspOpac=op/100;
        for (let i=0; i<oaip.countries.length; i++){
            let cntry=oaip.countries[i];
            if (cntry.gjLayer){
                cntry.gjLayer.eachLayer(e=>{
                    if (oaip.prevLayerAr.findIndex(pl=> pl._leaflet_id==e._leaflet_id)<0)
                        e.setStyle({color:oaip.aspColor(e.feature.properties.CAT),  weight:1, opacity:oaip.aspOpac});
                });
            }
        };
    }

    //export default {findAsp, clearAsp, opac, appendAspListToDiv};
    return {findAsp, clearAsp, opac, appendAspListToDiv, plugins_openAIPasp};
})