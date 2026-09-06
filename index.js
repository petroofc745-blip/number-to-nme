const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

let browser;

// സെർവർ സ്റ്റാർട്ട് ചെയ്യുമ്പോൾ ബ്രൗസർ ഒരു തവണ മാത്രം ലോഞ്ച് ചെയ്യുന്നു
(async () => {
    browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--blink-settings=imagesEnabled=false',
            '--no-first-run',
            '--no-zygote'
        ]
    });
    console.log("Browser ready");
})();

app.get('/api/lookup', async (req, res) => {
    const phone = req.query.number || '9605544131';
    const targetUrl = `https://kaise.page.gd/public.php?phone=${phone}`;

    let page = null;
    try {
        page = await browser.newPage();

        // CSS, Images, Fonts എന്നിവ ബ്ലോക്ക് ചെയ്ത് വേഗത കൂട്ടുന്നു
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // ടൈംഔട്ട് 4000ms (4 സെക്കൻഡ്) ആക്കി കുറച്ചു
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 4000 });
        
        const content = await page.evaluate(() => document.body.innerText);

        let parsedData;
        try {
            parsedData = JSON.parse(content);
        } catch (e) {
            parsedData = { raw_output: content };
        }

        await page.close();

        return res.json({
            status: "success",
            developer: "@fameneedsme",
            queried_number: phone,
            data: parsedData
        });

    } catch (error) {
        if (page) await page.close();
        return res.status(500).json({
            status: "error",
            developer: "@fameneedsme",
            message: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
