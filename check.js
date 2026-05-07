const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('PAGE ERROR:', msg.text());
            msg.location() && console.log('Location:', msg.location());
        } else {
            console.log('PAGE LOG:', msg.text());
        }
    });

    page.on('pageerror', err => {
        console.log('RUNTIME ERROR:', err.toString());
    });

    try {
        await page.goto('http://localhost:5173', { waitUntil: 'load' });
    } catch (e) {
        console.log('FAILED TO LOAD:', e.message);
    }
    
    await browser.close();
})();
