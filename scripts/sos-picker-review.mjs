import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

// Exercise the real picker through React Native Web without sending an SOS.
const bundle = await build({
  stdin: { contents: `
    import React, {useState} from 'react';
    import {createRoot} from 'react-dom/client';
    import {SafeAreaProvider} from 'react-native-safe-area-context';
    import {SosEmergencyPicker} from './components/SosEmergencyPicker';
    import {Screen} from './components/ui';
    import {AppTestContext} from './state/AppState';
    import {palettes} from './theme/colors';
    function Harness() {
      const [open,setOpen]=useState(true);
      const [theme,setTheme]=useState('dark');
      window.setReviewTheme=setTheme;
      return <AppTestContext.Provider value={{theme,colors:palettes[theme],online:true,verified:false,user:null,setTheme:async value=>setTheme(value)}}><SafeAreaProvider><Screen title="Emergency SOS" subtitle="Review your location and contact details"><button onClick={()=>setOpen(true)}>Open SOS</button><div style={{height:1200}}>Emergency screen content</div><div>End of screen</div></Screen>{open && <SosEmergencyPicker theme={theme} initialType="" initialDetails="" onClose={()=>setOpen(false)} onContinue={(type,details)=>{window.selection={type,details};setOpen(false);}}/>}</SafeAreaProvider></AppTestContext.Provider>;
    }
    createRoot(document.getElementById('root')).render(<Harness/>);
  `, resolveDir: fileURLToPath(new URL('../src/', import.meta.url)), loader: 'tsx' },
  bundle: true, write: false, platform: 'browser', jsx: 'automatic', alias: {'react-native':'react-native-web'},
  resolveExtensions: ['.web.tsx','.web.ts','.web.js','.tsx','.ts','.js','.json'],
  define: {'process.env.NODE_ENV':'"development"',__DEV__:'true'},
  plugins: [{name:'review-icons',setup(builder){
    builder.onResolve({filter:/^expo-router$/},()=>({path:'router',namespace:'fixture-router'}));
    builder.onLoad({filter:/.*/,namespace:'fixture-router'},()=>({contents:`import {useEffect} from 'react'; export const useFocusEffect=effect=>useEffect(effect,[effect]); export const router={canGoBack:()=>!!window.hasHistory,back:()=>window.backResult='history',replace:href=>window.backResult=href};`,resolveDir:process.cwd()}));
    builder.onResolve({filter:/state\/AppState$/},()=>({path:'context',namespace:'fixture-context'}));
    builder.onLoad({filter:/.*/,namespace:'fixture-context'},()=>({contents:`import {createContext,useContext} from 'react'; export const AppTestContext=createContext(null); export const useApp=()=>useContext(AppTestContext);`,resolveDir:process.cwd()}));
    builder.onResolve({filter:/lib\/sos$/},()=>({path:'records',namespace:'fixture-records'}));
    builder.onLoad({filter:/.*/,namespace:'fixture-records'},()=>({contents:'export const listSos=async()=>[];'}));
    builder.onResolve({filter:/\.\/ResidentMenu$/},()=>({path:'menu',namespace:'fixture-menu'}));
    builder.onLoad({filter:/.*/,namespace:'fixture-menu'},()=>({contents:'export const ResidentMenuButton=()=>null;'}));
    builder.onResolve({filter:/^@expo\/vector-icons$/},()=>({path:'icons',namespace:'fixture'}));
    builder.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:'export const Feather=()=>null;'}));
  }}],
});
const server=createServer((request,response)=>{
  if(request.url==='/bundle.js'){response.setHeader('Content-Type','text/javascript');return response.end(bundle.outputFiles[0].text);}
  response.setHeader('Content-Type','text/html');
  response.end('<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><style>html,body,#root{margin:0;height:100%;background:#080d17}body{overflow:hidden}#root{display:flex;flex-direction:column}</style><div id="root"></div><script src="/bundle.js"></script>');
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try {
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.getByRole('heading',{name:"What's the Emergency?"}).waitFor();
  assert.equal(await page.getByRole('radio').count(),6);
  assert(await page.getByRole('button',{name:'Select a type to continue'}).isDisabled());
  await mkdir('artifacts/sos-picker',{recursive:true});
  await page.screenshot({path:'artifacts/sos-picker/initial.png'});
  for(const label of ['Medical Emergency','Trapped / Rescue','Need Evacuation','Stranded Family','Missing Person','Other']){
    await page.getByRole('radio',{name:label,exact:true}).click();
    await page.getByRole('radio',{name:label,exact:true,checked:true}).waitFor();
    assert.equal(await page.getByRole('radio',{checked:true}).count(),1);
    await page.getByRole('button',{name:`Continue — ${label}`,exact:true}).waitFor();
    assert(await page.getByRole('button',{name:`Continue — ${label}`,exact:true}).isEnabled());
  }
  await page.getByRole('radio',{name:'Trapped / Rescue',exact:true}).click();
  await page.getByLabel('Additional emergency details',{exact:true}).fill('3 people near the barangay hall');
  await mkdir('artifacts/sos-picker',{recursive:true});
  await page.screenshot({path:'artifacts/sos-picker/dark.png'});
  await page.evaluate(()=>window.setReviewTheme('light'));
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('[role="heading"]')).every(node=>getComputedStyle(node).color==='rgb(16, 29, 53)'));
  await page.screenshot({path:'artifacts/sos-picker/light.png'});
  await page.setViewportSize({width:320,height:568});
  const next=page.getByRole('button',{name:'Continue — Trapped / Rescue',exact:true});
  const modalBackBefore=await page.getByRole('button',{name:'Back to SOS',exact:true}).boundingBox();
  await next.scrollIntoViewIfNeeded();
  const modalBackAfter=await page.getByRole('button',{name:'Back to SOS',exact:true}).boundingBox();
  assert.equal(modalBackAfter.y,modalBackBefore.y,'Modal back remains visible while scrolling');
  await page.screenshot({path:'artifacts/sos-picker/small-screen.png'});
  await next.click();
  await page.waitForFunction(()=>!!window.selection);
  assert.deepEqual(await page.evaluate(()=>window.selection),{type:'Trapped / Rescue',details:'3 people near the barangay hall'});
  await page.getByRole('button',{name:'Open SOS',exact:true}).click();
  assert(await page.getByRole('button',{name:'Select a type to continue'}).isDisabled());
  await page.getByRole('button',{name:'Back to SOS',exact:true}).click();
  await page.getByRole('heading',{name:"What's the Emergency?"}).waitFor({state:'detached'});
  const back=page.getByRole('button',{name:'Back',exact:true});
  const before=await back.boundingBox();
  await page.getByText('End of screen',{exact:true}).scrollIntoViewIfNeeded();
  const after=await back.boundingBox();
  assert.equal(after.y,before.y,'Back remains visible when the screen scrolls');
  await page.screenshot({path:'artifacts/sos-picker/screen-header-back.png'});
  await back.click();
  assert.equal(await page.evaluate(()=>window.backResult),'/welcome');
  await page.evaluate(()=>window.hasHistory=true);
  await back.click();
  assert.equal(await page.evaluate(()=>window.backResult),'history');
  assert.deepEqual(errors,[]);
  console.log('PASS: SOS selection, details handoff, back from modal, sticky screen back, navigation history/fallback, light/dark and 320px layout. No SOS submitted.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
