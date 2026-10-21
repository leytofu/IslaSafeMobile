import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium} = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const browser = await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
const output='artifacts/auth-ui'; await fs.mkdir(output,{recursive:true});
const errors=[], results=[];
for (const theme of ['light','dark']) {
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const page=await context.newPage(); page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(theme=>localStorage.setItem('islasafe.theme',theme),theme);
  let registrations=0, loginCount=0, recoveryCount=0;
  const registrationBodies=[];
  await page.route('**/api/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    const json=(status,body)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
    if (path.endsWith('/auth/register')) {
      registrations++; registrationBodies.push(route.request().postDataJSON());
      await new Promise(resolve=>setTimeout(resolve,700));
      if(registrations===1) return json(503,{message:'Account creation is temporarily unavailable. Please retry.'});
      if(registrations===2) return json(422,{message:'The email has already been taken.',errors:{email:['The email has already been taken.']}});
      return json(200,{token:'ui-test-token',user:{id:991001,name:'Test Resident',email:'new@example.test',role:'residents',profile_complete:false}});
    }
    if(path.endsWith('/auth/login')) {loginCount++; return json(422,{message:'These credentials do not match our records.'});}
    if(path.endsWith('/forgot-password')) {recoveryCount++;return json(200,{message:'Verification code sent.',data:{challenge_id:'test-challenge',resend_available_in:0}});}
    if(path.endsWith('/auth/me')) return json(200,{user:{id:991001,name:'Test Resident',email:'new@example.test',role:'residents',profile_complete:false}});
    return json(200,{data:[]});
  });
  await page.goto('http://localhost:8081/welcome',{waitUntil:'domcontentloaded',timeout:120000});
  await page.getByRole('button',{name:'Resident. Sign in or create an account',exact:true}).click();
  const remember=page.getByRole('checkbox',{name:'Remember me',exact:true});
  for (const [width,height] of [[390,844],[320,640],[430,932],[768,1024]]) {
    await page.setViewportSize({width,height});
    await remember.waitFor();
    const [r,f,p,s]=await Promise.all([remember.boundingBox(),page.getByRole('button',{name:'Forgot password?',exact:true}).boundingBox(),page.getByLabel('Password',{exact:true}).boundingBox(),page.getByRole('button',{name:'Sign in',exact:true}).boundingBox()]);
    assert(Math.abs(r.y-f.y)<3,'Remember and Forgot share a row'); assert(p.y+p.height<=r.y+2,'Options follow password'); assert(s.y>=r.y+r.height,'Sign in follows options');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
    await page.screenshot({path:`${output}/${theme}-signin-${width}.png`});
    results.push({theme,width,height,optionsAligned:true});
  }
  await page.setViewportSize({width:390,height:844});
  assert.equal(await remember.getAttribute('aria-checked'),'true'); await remember.click();assert.equal(await remember.getAttribute('aria-checked'),'false');
  await page.getByLabel('Email address',{exact:true}).fill('resident@example.test');
  await page.getByLabel('Password',{exact:true}).fill('password123');
  await page.getByRole('button',{name:'Show password',exact:true}).click(); assert.equal(await page.getByLabel('Password',{exact:true}).evaluate(input=>input.type),'text');
  await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByText('These credentials do not match our records.',{exact:true}).waitFor();assert.equal(loginCount,1);
  await page.getByRole('button',{name:'Forgot password?',exact:true}).click();
  await page.getByRole('button',{name:'Send verification code',exact:true}).click();await page.getByLabel('Verification code',{exact:true}).waitFor();assert.equal(recoveryCount,1);
  await page.goto('http://localhost:8081/welcome');
  await page.getByRole('button',{name:'Resident. Sign in or create an account',exact:true}).click();
  await page.getByRole('button',{name:'Create new account',exact:true}).click();
  await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByText('Enter your full name.',{exact:true}).waitFor();assert.equal(registrations,0);
  await page.getByLabel('Full name',{exact:true}).fill('Test Resident'); await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByLabel('Email address',{exact:true}).fill('invalid'); await page.getByRole('button',{name:'Continue',exact:true}).click(); await page.getByText('Enter a valid email address.',{exact:true}).waitFor();
  await page.getByLabel('Email address',{exact:true}).fill('resident@example.test'); await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByLabel('Password',{exact:true}).fill('password123');await page.getByLabel('Confirm password',{exact:true}).fill('mismatch');
  await page.getByRole('button',{name:'Create account',exact:true}).click(); await page.getByRole('alert').waitFor();assert.equal(registrations,0);
  await page.getByLabel('Confirm password',{exact:true}).fill('password123');
  assert.equal(await page.getByRole('button',{name:/^Edit /}).count(),0);
  assert.equal(await page.getByText('Step 3 of 3',{exact:true}).count(),1);
  await page.screenshot({path:`${output}/${theme}-password.png`});
  await page.setViewportSize({width:390,height:420});await page.getByLabel('Confirm password',{exact:true}).focus();await page.getByRole('button',{name:'Create account',exact:true}).scrollIntoViewIfNeeded();
  await page.screenshot({path:`${output}/${theme}-short-viewport.png`});await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Create account',exact:true}).evaluate(button=>{button.click();button.click();});
  await page.getByText('Creating your account...',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Create account',exact:true}).isDisabled(),true);
  await page.getByText('Account creation is temporarily unavailable. Please retry.',{exact:true}).waitFor();assert.equal(registrations,1);
  assert.equal(await page.getByLabel('Password',{exact:true}).inputValue(),'password123');assert.equal(await page.getByLabel('Confirm password',{exact:true}).inputValue(),'password123');
  await page.getByRole('button',{name:'Create account',exact:true}).click();await page.getByLabel('Email address',{exact:true}).waitFor();await page.getByText('The email has already been taken.',{exact:true}).waitFor();
  assert.equal(await page.getByLabel('Email address',{exact:true}).inputValue(),'resident@example.test');
  await page.getByLabel('Email address',{exact:true}).fill('new@example.test');await page.getByRole('button',{name:'Continue',exact:true}).click();
  assert.equal(await page.getByLabel('Password',{exact:true}).inputValue(),'password123');
  await page.getByRole('button',{name:'Create account',exact:true}).click();await page.waitForURL('**/complete-profile');assert.equal(registrations,3);
  assert.deepEqual(Object.keys(registrationBodies[2]).sort(),['email','name','password','password_confirmation']);
  await context.close();
}
assert.deepEqual(errors,[]);
await fs.writeFile(`${output}/report.json`,JSON.stringify({results,errors,registration:'Mocked requests; no real account was created',validation:true,duplicateTaps:true,retryPreservesInputs:true,serverFieldCorrection:true,successNavigation:true,rememberMe:true,recovery:true},null,2));
console.log(JSON.stringify({layouts:results.length,errors,registrationFlows:2,duplicateTaps:true,retry:true,successNavigation:true}));
await browser.close();
