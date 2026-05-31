const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

let browser;
let page;

async function initBrowser() {
    browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
}

app.get('/render', async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).send('URL is required');

    try {
        if (!browser) await initBrowser();
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        const screenshot = await page.screenshot({ type: 'jpeg', quality: 80 });
        res.contentType('image/jpeg');
        res.send(screenshot);
    } catch (error) {
        console.error('Render error:', error);
        res.status(500).send('Failed to render page: ' + error.message);
    }
});

app.post('/interact', async (req, res) => {
    const { action, x, y, key, url } = req.body;
    
    try {
        if (!browser) await initBrowser();
        
        // Ensure we are on the right URL if provided
        if (url && page.url() !== url) {
            await page.goto(url, { waitUntil: 'networkidle2' });
        }

        if (action === 'click') {
            await page.mouse.click(x, y);
        } else if (action === 'scroll') {
            await page.evaluate((y) => window.scrollBy(0, y), y);
        } else if (action === 'type') {
            await page.keyboard.type(key);
        } else if (action === 'press') {
            await page.keyboard.press(key);
        }

        const screenshot = await page.screenshot({ type: 'jpeg', quality: 70 });
        res.contentType('image/jpeg');
        res.send(screenshot);
    } catch (error) {
        res.status(500).send('Interaction failed');
    }
});

app.get('/status', (req, res) => {
    res.json({ status: 'running', browser: !!browser });
});

app.listen(port, () => {
    console.log(`Puppeteer rendering server running at http://localhost:${port}`);
    console.log(`To use the real browser, run 'npm install express puppeteer cors' then 'node server.js'`);
});
