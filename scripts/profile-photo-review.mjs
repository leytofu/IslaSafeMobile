import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {build} from 'esbuild';

const bundle=await build({
  stdin:{contents:`
    import React,{useState} from 'react'; import {createRoot} from 'react-dom/client';
    import {SafeAreaProvider} from 'react-native-safe-area-context';
    import {AppTestContext} from './state/AppState'; import {palettes} from './theme/colors';
    import {ProfilePhotoEditor} from './components/ProfilePhotoEditor';
    import {ResidentUserBar} from './components/ResidentUserBar'; import {avatarProfileForm} from './lib/profile-photo';
    const canvas=document.createElement('canvas');canvas.width=canvas.height=200;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#4163ed';ctx.fillRect(0,0,200,200);ctx.fillStyle='#ffccaa';ctx.beginPath();ctx.arc(100,80,40,0,Math.PI*2);ctx.fill();ctx.fillStyle='#142442';ctx.fillRect(40,125,120,75);
    window.photoFixture=canvas.toDataURL('image/jpeg');
    function Harness(){
      const [theme,setTheme]=useState('dark'),[busy,setBusy]=useState(false),[verified,setVerified]=useState(false),[user,setUser]=useState({id:1,role:'residents',name:'Photo Resident',email:'photo@example.test'});
      window.setReviewTheme=setTheme;
      return <AppTestContext.Provider value={{theme,colors:palettes[theme]}}><SafeAreaProvider><ProfilePhotoEditor user={user} theme={theme} disabled={busy} canSave={verified} onVerify={()=>setVerified(true)} onBusyChange={setBusy} onSave={async photo=>{
        const response=await fetch('/upload',{method:'POST',body:await avatarProfileForm(user,photo,'web')});const body=await response.json();if(!response.ok)throw new Error(body.message);setUser(body.user);
      }}/><ResidentUserBar theme={theme} user={user}/></SafeAreaProvider></AppTestContext.Provider>;
    }createRoot(document.getElementById('root')).render(<Harness/>);
  `,loader:'tsx',resolveDir:fileURLToPath(new URL('../src/',import.meta.url))},
  bundle:true,write:false,platform:'browser',jsx:'automatic',alias:{'react-native':'react-native-web'},
  resolveExtensions:['.web.tsx','.web.ts','.web.js','.tsx','.ts','.js','.json'],
  define:{'process.env.NODE_ENV':'"development"','process.env.EXPO_PUBLIC_API_BASE_URL':'"/api"',__DEV__:'true'},
  plugins:[{name:'photo-fixtures',setup(b){
    const mocks=[
      [/state\/AppState$/,'context',`import {createContext,useContext} from 'react';export const AppTestContext=createContext(null);export const useApp=()=>useContext(AppTestContext);`],
      [/lib\/select-profile-photo$/,'picker',`export const selectProfilePhoto=async()=>window.cancelPick?null:{uri:window.photoFixture,width:200,height:200};`],
      [/^expo-router$/,'router',`export const router={};export const useFocusEffect=()=>{};`],
      [/lib\/sos$/,'records',`export const listSos=async()=>[];`],
      [/\.\/ResidentMenu$/,'menu',`export const ResidentMenuButton=()=>null;`],
      [/^@expo\/vector-icons$/,'icons',`export const Feather=()=>null;`],
    ];for(const [filter,path,contents] of mocks){b.onResolve({filter},()=>({path,namespace:path}));b.onLoad({filter:/.*/,namespace:path},()=>({contents,resolveDir:process.cwd()}));}
  }}],
});
let uploads=0,fail=true,saved;
const server=createServer(async(req,res)=>{
  if(req.url==='/bundle.js'){res.setHeader('Content-Type','text/javascript');return res.end(bundle.outputFiles[0].text);}
  if(req.url==='/saved.jpg'){res.setHeader('Content-Type','image/jpeg');return res.end(saved);}
  if(req.url==='/upload'){
    uploads++;const data=await new Request('http://localhost/upload',{method:'POST',headers:req.headers,body:req,duplex:'half'}).formData();
    assert.equal(data.get('_method'),'PATCH');assert.equal(data.get('name'),'Photo Resident');assert.equal(data.get('email'),'photo@example.test');
    const file=data.get('avatar');assert.equal(file.name,'profile.jpg');assert.equal(file.type,'image/jpeg');
    res.setHeader('Content-Type','application/json');if(fail){res.statusCode=422;fail=false;return res.end(JSON.stringify({message:'Photo could not be saved. Try again.'}));}
    saved=Buffer.from(await file.arrayBuffer());return res.end(JSON.stringify({user:{id:1,role:'residents',name:'Photo Resident',email:'photo@example.test',avatar_url:'/saved.jpg'}}));
  }
  res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><style>html,body,#root{margin:0;min-height:100%;background:#080d17}#root{padding:16px;box-sizing:border-box}</style><div id="root"></div><script src="/bundle.js"></script>');
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
  const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.getByRole('button',{name:'Add image',exact:true}).waitFor();
  await page.evaluate(()=>window.cancelPick=true);await page.getByRole('button',{name:'Add image',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Save profile photo',exact:true}).count(),0);
  await page.evaluate(()=>window.cancelPick=false);await page.getByRole('button',{name:'Add profile image',exact:true}).click();
  await page.getByRole('button',{name:'Verify session to save photo',exact:true}).waitFor();
  assert(await page.getByRole('button',{name:'Save profile photo',exact:true}).isDisabled());
  await page.getByRole('button',{name:'Verify session to save photo',exact:true}).click();
  await page.getByRole('button',{name:'Discard selected photo',exact:true}).click();assert.equal(uploads,0);
  await page.getByRole('button',{name:'Add image',exact:true}).click();await page.getByRole('button',{name:'Save profile photo',exact:true}).click();
  await page.getByText('Photo could not be saved. Try again.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Save profile photo',exact:true}).click();await page.getByText('Profile photo saved.',{exact:true}).waitFor();
  assert.equal(uploads,2);assert.equal(await page.getByRole('img',{name:"Photo Resident's profile photo",exact:true}).count(),2);
  await page.getByRole('button',{name:'Edit image',exact:true}).waitFor();
  await page.getByRole('button',{name:'Edit profile image',exact:true}).click();
  await page.getByRole('button',{name:'Discard selected photo',exact:true}).click();
  assert.equal(uploads,2,'Editing is only uploaded after explicit save');
  await mkdir('artifacts/profile-photo',{recursive:true});await page.screenshot({path:'artifacts/profile-photo/dark.png',fullPage:true});
  await page.evaluate(()=>window.setReviewTheme('light'));await page.waitForFunction(()=>document.querySelectorAll('img[src="/saved.jpg"]').length===2);
  await page.screenshot({path:'artifacts/profile-photo/light.png',fullPage:true});assert.deepEqual(errors,[]);
  console.log('PASS: preview, cancellation/discard without upload, retained preview after failure, multipart upload retry, saved profile/account-bar images and light/dark layout.');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
