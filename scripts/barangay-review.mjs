import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try {
const p=await b.newPage({viewport:{width:390,height:844}});
const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto('http://localhost:8083/dashboard-preview');
await p.getByRole('button',{name:'Open resident menu'}).click();
await p.getByRole('button',{name:'Hazard Map',exact:true}).click();
await p.waitForTimeout(900);
for(const theme of ['dark','light']) {
await p.getByRole('button',{name:'Focus area',exact:true}).click();
await p.waitForTimeout(500);
assert.equal(await p.getByRole('radio').count(),24);
await p.getByLabel('Search barangays',{exact:true}).fill('villa');
assert.equal(await p.getByRole('radio').count(),1);
await p.getByRole('radio',{name:'Villa Milagrosa',exact:true}).click();
await p.waitForTimeout(500);
await p.getByRole('button',{name:'Focus area',exact:true}).getByText('Villa Milagrosa').waitFor();
await p.getByRole('button',{name:'Focus area',exact:true}).click();
await p.waitForTimeout(500);
await p.getByLabel('Search barangays',{exact:true}).fill('pitogo');
await p.getByRole('radio',{name:'Poblacion (Pitogo)',exact:true}).click();
await p.waitForTimeout(500);
await p.screenshot({path:'artifacts/reference-mobile/'+theme+'-barangay-selected.png'});
if(theme==='dark')await p.getByRole('button',{name:'Switch to light theme'}).click();
}
assert.deepEqual(errors,[]);console.log('PASS: all 23 barangays + all areas, search, selection, Pitogo label and both mobile themes.');
} finally {await b.close();}
