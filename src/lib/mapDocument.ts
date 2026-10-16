import { maplibreCss, maplibreScript, maplibreWorker } from "./maplibreAssets";
import { basemaps, type BasemapKey } from "./basemaps";
import type { MapCenter } from "./evacuationCenters";
import { dashboardPalettes, type ThemeMode } from "../theme/colors";

export type MapDocumentState = { centers: MapCenter[]; selectedCenterId: number | null; theme: ThemeMode; coordinate: [number, number] | null; locating: boolean };
export type MapCommand = { type: "update"; state: MapDocumentState } | { type: "locate"; latitude: number; longitude: number } | { type: "reload" };
export function mapCommandScript(command: MapCommand) {
  const json = JSON.stringify(command).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  return `window.IslaSafeMap && window.IslaSafeMap.dispatch(${json}); true;`;
}
export function validMapCoordinate(latitude: number, longitude: number) {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
}
export function mapCredit(key: unknown): string | null {
  return typeof key === "string" && Object.hasOwn(basemaps, key) ? basemaps[key as BasemapKey].license : null;
}

/** MapLibre GL JS runs inside Expo Go's bundled WebView. Only tiles use the network. */
export function createMapDocument(theme: ThemeMode) {
  const initial = dashboardPalettes[theme];
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' blob:; worker-src blob:; child-src blob:; style-src 'unsafe-inline'; img-src data: blob: https://tile.openstreetmap.org https://server.arcgisonline.com; connect-src blob: https://tile.openstreetmap.org https://server.arcgisonline.com">
<style>${maplibreCss}
html,body,#map{height:100%;width:100%;margin:0;background:${initial.bg};font-family:system-ui,sans-serif}button{font:600 12px system-ui;cursor:pointer;min-height:40px;border:1px solid var(--border);border-radius:10px;background:var(--card);color:var(--text);padding:0 10px}button:disabled{opacity:.6}.tools{position:absolute;z-index:3;top:10px;left:10px;right:10px;display:flex;gap:5px;pointer-events:none}.tools button{pointer-events:auto}.tools .active{background:var(--tint);color:var(--accent)}#reset{margin-left:auto}.locate{position:absolute;z-index:3;bottom:29px;left:10px}.maplibregl-ctrl-group{background:var(--card)}.maplibregl-ctrl button{width:38px;height:38px}[data-theme="dark"] .maplibregl-ctrl-icon{filter:invert(1)}.maplibregl-ctrl-attrib{font-size:9px;max-width:95%;background:var(--card)!important;color:var(--text)!important}.maplibregl-ctrl-attrib a{color:var(--accent)!important}.center-pin{display:flex;align-items:center;justify-content:center;width:34px;height:38px;border:2px solid white;border-radius:12px 12px 12px 3px;background:#15803d;box-shadow:0 2px 6px #0005;color:white;font-size:23px;padding:0}.center-pin.full{background:#b45309}.center-pin.selected{outline:3px solid #818cf8}.location-pin{width:16px;height:16px;background:#2946d8;border:3px solid white;border-radius:50%;box-shadow:0 0 0 6px #2946d833}#map{touch-action:none}
</style></head><body><div id="map" aria-label="Interactive Pitogo Island map"></div>
<div class="tools"><button id="streets" class="active" aria-label="Map basemap">Map</button><button id="satellite" aria-label="Satellite basemap">Satellite</button><button id="reset" aria-label="Recenter on Pitogo Island"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/></svg></button></div><button id="locate" class="locate" aria-label="Locate me and recenter">Locate me</button>
<script>${maplibreScript.replace(/<\/script/gi, "<\\/script")}</script><script>
(function(){
function send(value){if(window.ReactNativeWebView){window.ReactNativeWebView.postMessage(JSON.stringify(value));}else if(window.parent!==window){window.parent.postMessage({islaSafeMap:value},'*');}}
var providers=${JSON.stringify(basemaps)}, palettes=${JSON.stringify(dashboardPalettes)};
var map=null,basemap='map',pins=[],location=null,lastSelected=null,failed=false;
function style(key){var source=providers[key];return {version:8,sources:{basemap:{type:'raster',tiles:[source.tiles],tileSize:256,maxzoom:19,attribution:source.attribution}},layers:[{id:'basemap',type:'raster',source:'basemap'}]};}
try{maplibregl.setWorkerCount(1);maplibregl.setWorkerUrl(URL.createObjectURL(new Blob([${JSON.stringify(maplibreWorker).replace(/</g, '\\u003c')}],{type:'text/javascript'})));map=new maplibregl.Map({container:'map',style:style('map'),center:[124.562,10.109],zoom:11,minZoom:3,maxZoom:19,attributionControl:{compact:false},renderWorldCopies:false,dragRotate:false,pitchWithRotate:false});map.addControl(new maplibregl.NavigationControl({showCompass:false}),'bottom-right');}
catch(error){send({type:'map-error'});return;}
map.on('error',function(){if(!failed){failed=true;send({type:'tile-error'});}});map.on('idle',function(){if(!failed){send({type:'tiles-ready'});}});
function setBasemap(key){basemap=key;failed=false;map.setStyle(style(key));document.getElementById('streets').className=key==='map'?'active':'';document.getElementById('satellite').className=key==='satellite'?'active':'';}
document.getElementById('streets').onclick=function(){setBasemap('map');};document.getElementById('satellite').onclick=function(){setBasemap('satellite');};
document.getElementById('reset').onclick=function(){map.easeTo({center:[124.562,10.109],zoom:11,duration:250});};document.getElementById('locate').onclick=function(){send({type:'locate'});};
document.addEventListener('click',function(event){var link=event.target.closest('a');if(link){event.preventDefault();send({type:'credit',basemap:basemap});}});
function valid(lat,lng){return Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=90&&Math.abs(lng)<=180;}
window.IslaSafeMap={update:function(state){
var c=palettes[state.theme]||palettes.light;document.documentElement.dataset.theme=state.theme;Object.keys(c).forEach(function(key){document.documentElement.style.setProperty('--'+key,c[key]);});
pins.forEach(function(pin){pin.remove();});pins=[];(state.centers||[]).forEach(function(center){if(!valid(center.latitude,center.longitude)){return;}
var selected=center.id===state.selectedCenterId;var element=document.createElement('button');element.className='center-pin'+(center.available===0?' full':'')+(selected?' selected':'');element.innerHTML='<svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M9 21V12h6v9"/></svg>';element.setAttribute('aria-label',String(center.name));element.title=String(center.name);element.onclick=function(){send({type:'center',id:center.id});};
pins.push(new maplibregl.Marker({element:element,anchor:'bottom'}).setLngLat([center.longitude,center.latitude]).addTo(map));
if(selected&&lastSelected!==state.selectedCenterId){map.easeTo({center:[center.longitude,center.latitude],duration:250});}});lastSelected=state.selectedCenterId;
var button=document.getElementById('locate');button.disabled=state.locating;button.textContent=state.locating?'Locating...':'Locate me';
if(state.coordinate&&valid(state.coordinate[0],state.coordinate[1])){if(!location){var element=document.createElement('div');element.className='location-pin';element.setAttribute('aria-label','Your current location');location=new maplibregl.Marker({element:element}).setLngLat([state.coordinate[1],state.coordinate[0]]).addTo(map);}else{location.setLngLat([state.coordinate[1],state.coordinate[0]]);}}else if(location){location.remove();location=null;}
},locate:function(lat,lng){if(valid(lat,lng)){map.easeTo({center:[lng,lat],zoom:15,duration:300});}},reload:function(){setBasemap(basemap);}};
window.IslaSafeMap.dispatch=function(command){if(command.type==='update'){window.IslaSafeMap.update(command.state);}else if(command.type==='locate'){window.IslaSafeMap.locate(command.latitude,command.longitude);}else if(command.type==='reload'){window.IslaSafeMap.reload();}};
window.addEventListener('message',function(event){if(event.source===window.parent&&event.data&&event.data.islaSafeCommand){window.IslaSafeMap.dispatch(event.data.islaSafeCommand);}});
window.addEventListener('resize',function(){map.resize();});
window.IslaSafeMap.update({theme:${JSON.stringify(theme)},centers:[],selectedCenterId:null,coordinate:null,locating:false});send({type:'ready'});
})();true;
</script></body></html>`;
}
