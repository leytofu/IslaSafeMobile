import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try {
const page=await browser.newPage({viewport:{width:390,height:844}});page.setDefaultTimeout(60000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));
// Accelerate only the 20-second poll to exercise request cancellation without a long test.
await page.addInitScript(()=>{const original=window.setInterval.bind(window);window.setInterval=(fn,ms,...args)=>original(fn,ms===20000?100:ms,...args);});
const user={id:999999,name:'Manager fixture',email:'manager@example.test',role:'campmanager',profile_complete:true};
const place={id:1,barangay:'Pitogo',municipality:'President Carlos P. Garcia'};
const center={id:1,name:'Slow response test center',place,capacity:100,current:0,registered:0,first_time:0,returning:0,available:100,occupancy_percent:0,status:'Operational',event:{id:1,name:'Test event',status:'active'},demographics:{age:{},gender:{},places:[],puroks:[]}};
let reads=0;
await page.route('**/api/**',async route=>{const path=new URL(route.request().url()).pathname;let body={data:[]};if(path.endsWith('/auth/login'))body={token:'poll-fixture',user};if(path.endsWith('/auth/me'))body={user};if(path.endsWith('/camp/context')){reads++;await new Promise(r=>setTimeout(r,450));body={data:{center,event:center.event,places:[place],genders:['male','female'],recent:[]}};}try{await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});}catch{} });
await page.goto(process.env.MOBILE_WEB_URL || 'http://localhost:8084',{waitUntil:'domcontentloaded',timeout:120000});
await page.getByRole('button',{name:/Camp Manager.*center/}).click({timeout:120000});
await page.getByLabel('Email address',{exact:true}).fill(user.email);await page.getByLabel('Password',{exact:true}).fill('fixture-password');await page.getByRole('button',{name:'Sign in',exact:true}).click();
let completed=true;try{await page.getByText(center.name,{exact:true}).first().waitFor({timeout:4000});}catch{completed=false;}
console.log(JSON.stringify({completed,reads,errors}));
assert.equal(completed,true,'A slow center response must finish before the next poll');
assert.deepEqual(errors, [], 'Camp dashboard must not produce runtime errors');
} finally{await browser.close();}


