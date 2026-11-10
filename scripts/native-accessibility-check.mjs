import { _electron as electron } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const directory=path.resolve('tmp/native-keyboard-'+Date.now());
await mkdir(directory,{recursive:true});
const env={...process.env,ROYESH_DATA_DIR:directory};delete env.ELECTRON_RUN_AS_NODE;delete env.ROYESH_DEV_URL;
const app=await electron.launch({executablePath:process.env.ROYESH_TEST_EXE || require('electron'),args:process.env.ROYESH_TEST_EXE?[]:['.'],env});
try{
  const page=await app.firstWindow();
  const start=page.getByRole('button',{name:'شروع مسیر'});await start.focus();await page.keyboard.press('Enter');
  const record=page.getByRole('button',{name:'ثبت امروز',exact:true});await record.waitFor();
  await page.evaluate(()=>window.roy.dispatch({type:'settings',patch:{reminderEnabled:false}}));
  await record.focus();await page.keyboard.press('Enter');
  await page.getByRole('heading',{name:'امروز، کدام دنیا؟'}).waitFor();
  const forest=page.getByRole('button',{name:'جنگلم یک درخت تازه'});await forest.focus();await page.keyboard.press('Enter');
  await page.getByRole('heading',{name:'دنیای کوچک تو'}).waitFor();
  await page.getByRole('button',{name:'امروز',exact:true}).click();
  const today=page.locator('.cell.today');await today.focus();await page.keyboard.press('Enter');
  await page.locator('dialog').waitFor();
  for(let i=0;i<12;i++){await page.keyboard.press('Tab');assert(await page.evaluate(()=>!!document.activeElement.closest('dialog')),'Dialog traps keyboard focus');}
  await page.keyboard.press('Escape');await page.locator('dialog').waitFor({state:'hidden'});
  assert(await today.evaluate(el=>el===document.activeElement),'Focus returns to the triggering day');
  await writeFile('docs/keyboard-check.json',JSON.stringify({passed:true,checks:['Keyboard onboarding','Keyboard daily success and growth choice','Heatmap keyboard activation','Dialog focus containment','Escape dismissal and focus restoration']},null,2));
  console.log('Native keyboard checks passed.');
}finally{await app.close();}
