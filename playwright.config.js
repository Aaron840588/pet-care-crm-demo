import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
 testDir: './tests', use: {baseURL:'http://127.0.0.1:3200'},
 webServer:{command:'npm run preview -- --host 127.0.0.1 --port 3200',url:'http://127.0.0.1:3200',reuseExistingServer:false},
 projects:[{name:'desktop',use:{...devices['Desktop Chrome']}},{name:'mobile',use:{...devices['Pixel 7']}}]
});
