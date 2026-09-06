const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/lookup', async (req, res) => {
    const phone = req.query.number || '9605544131';
    const targetUrl = `https://kaise.page.gd/public.php?phone=${phone}`;

    let browser = null;
    try {
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

        const page = await browser.newPage();

        // ചിത്രങ്ങൾ, സ്റ്റൈലുകൾ, ഫ്രെയിമുകൾ എന്നിവ ഒഴിവാക്കി ലോഡിംഗ് വേഗത്തിലാക്കുന്നു
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const resource = req.resourceType();
            if (['image', 'stylesheet', 'font', 'media'].includes(resource)) {
                req.abort();
            } else {
                req.continue();
            }
        });

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

        // networkidle2-ന് പകരം domcontentloaded ഉപയോഗിക്കുന്നു (ടൈംഔട്ട്: 8000ms / 8 സെക്കൻഡ്)
        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 8000 });
        
        const content = await page.evaluate(() => document.body.innerText);

        let parsedData;
        try {
            parsedData = JSON.parse(content);
        } catch (e) {
            parsedData = { raw_output: content };
        }

        await browser.close();

        return res.json({
            status: "success",
            developer: "@fameneedsme",
            queried_number: phone,
            data: parsedData
        });

    } catch (error) {
        if (browser) await browser.close();
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
