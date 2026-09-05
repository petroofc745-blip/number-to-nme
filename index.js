const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/lookup', async (req, res) => {
    const phone = req.query.number || '9876543210';
    const targetUrl = `https://kaise.page.gd/public.php?phone=${phone}`;

    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        
        // Go to the target URL and wait for JavaScript/slowAES challenge to resolve
        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        // Extract the page content (which will be valid JSON after challenge execution)
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
