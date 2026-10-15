import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try {
const p=await b.newPage({viewport:{width:1440,height:1000}});
const user={id:999999,name:'Dropdown fixture',email:'fixture@example.test',role:'admin'};
const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.addInitScript(({user})=>localStorage.setItem('islasafe.session',JSON.stringify({token:'dropdown-fixture',user})),{user});
await p.route('**/api/**',async route=>{
const path=new URL(route.request().url()).pathname;
let body={data:[],current_page:1,last_page:1,total:0};
if(path.endsWith('/auth/me'))body={user};
if(path.endsWith('/setup'))body={data:{places:[{id:1,barangay:'Pitogo',municipality:'President Carlos P. Garcia'}],event:null,events:[],managers:[],assignments:[],genders:['unspecified']}};
await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
});
await p.goto('http://localhost:5173');
await p.getByRole('button',{name:'Hazard Map',exact:true}).click();
const focus=p.getByLabel('Focus area');
assert.equal(await focus.locator('option').count(),24);
await focus.selectOption('Villa Milagrosa');assert.equal(await focus.inputValue(),'Villa Milagrosa');
await focus.selectOption('Poblacion');
await p.getByRole('button',{name:'Residents',exact:true}).click();
const resident=p.getByLabel('Filter by barangay');assert.equal(await resident.locator('option').count(),24);
await resident.selectOption('Poblacion');await p.getByText('Maria Dela Cruz',{exact:true}).waitFor();assert.equal(await p.getByText('Rogelio Ramos',{exact:true}).count(),0);
await resident.selectOption('All barangays');await p.getByText('Rogelio Ramos',{exact:true}).waitFor();
await p.getByRole('button',{name:'Evacuation Centers',exact:true}).click();
await p.getByRole('button',{name:'Add Center',exact:true}).click();
const place=p.getByRole('combobox',{name:'Barangay',exact:true});await place.waitFor();assert.equal(await place.locator('option').count(),24);
await place.selectOption('create:Villa Milagrosa');assert.equal(await place.inputValue(),'create:Villa Milagrosa');
await place.selectOption('1');assert.equal(await place.inputValue(),'1');
await p.screenshot({path:'artifacts/reference-mobile/web-barangay-form.png'});
assert.deepEqual(errors,[]);console.log('PASS: web map, resident filter, center form have all 23 barangays; Pitogo records retained and missing/existing place selections work.');
} finally {await b.close();}
