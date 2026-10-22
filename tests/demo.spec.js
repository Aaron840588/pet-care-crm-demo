import { test, expect } from '@playwright/test';

test('invoice import, save and reset work without runtime errors', async ({page}) => {
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.getByRole('heading',{name:/Good/}).waitFor();
 // Dashboard shortcut also checks sessionStorage handoff into the invoice.
 await page.getByRole('button',{name:'Invoice',exact:true}).first().click();
 await expect(page.getByRole('heading',{name:/Invoice Builder/})).toBeVisible();
 await page.getByRole('button',{name:/Save to Records/}).click();
 await expect(page.getByText(/Invoice saved to records/)).toBeVisible();
 await page.getByRole('button',{name:/Reset/,exact:false}).last().click();
 await expect(page.getByText('Reset Invoice?',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await expect(page.getByText('Reset Invoice?',{exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:/Reset/,exact:false}).last().click();
 await page.getByRole('button',{name:'Reset Invoice',exact:true}).click();
 await expect(page.getByText('Reset Invoice?',{exact:true})).toHaveCount(0);
 expect(errors).toEqual([]);
});

test('demo makes no Firebase requests and shows no repeated time suffix',async({page})=>{
 const cloud=[]; page.on('request',r=>{if(/firestore.googleapis|identitytoolkit.googleapis|securetoken.googleapis/.test(r.url()))cloud.push(r.url());});
 await page.goto('/');
 await page.getByRole('heading',{name:/Good/}).waitFor();
 expect(await page.locator('main').innerText()).not.toMatch(/(?:AM\s+AM|PM\s+PM)/);
 expect(cloud).toEqual([]);
});

async function navigate(page, name, mobile) {
 if(mobile) {
   const primary={Dashboard:'Today',Clients:'Clients',Schedule:'Schedule','Earnings Summary':'Earnings'};
   if(primary[name]) await page.locator('.bottom-nav').getByRole('button',{name:primary[name],exact:true}).click();
   else {
     await page.locator('.bottom-nav button[aria-controls]').click();
     await page.getByRole('dialog',{name:'More sections'}).getByRole('button',{name,exact:true}).click();
   }
 } else await page.locator('.sidebar').getByRole('button',{name,exact:true}).click();
 await expect(page.locator('main h2').first()).toBeVisible();
}

test('all screens render and service changes reset on reload',async({page,isMobile})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await page.getByRole('heading',{name:/Good/}).waitFor();
 for(const name of ['Clients','Errands & Pabili','Schedule','Own Pets','Key Tracker','Invoice Builder','Invoice Records','Earnings Summary','Visit Report Card','Settings & Backup']) {
   await navigate(page,name,isMobile);
   await expect(page.locator('main')).not.toContainText('Something went wrong');
 }
 await page.getByRole('button',{name:'Add Service',exact:true}).click();
 await page.getByPlaceholder('e.g. Overnight Stay').fill('Regression service');
 await page.getByPlaceholder('e.g. 500').fill('555');
 await page.getByRole('button',{name:'Save Service',exact:true}).click();
 await expect(page.getByText('Regression service',{exact:true})).toBeVisible();
 await page.reload();await page.getByRole('heading',{name:/Good/}).waitFor();
 await navigate(page,'Settings & Backup',isMobile);
 await expect(page.getByText('Regression service',{exact:true})).toHaveCount(0);
 expect(errors).toEqual([]);
});
