const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/lookup', async (req, res) => {
    const phone = req.query.number || '9605544131';
    const targetUrl = `https://kaise.page.gd/public.php?phone=${phone}`;

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        });

        const text = await response.text();
        let parsedData;

        try {
            parsedData = JSON.parse(text);
        } catch (e) {
            parsedData = { raw_output: text };
        }

        return res.json({
            status: "success",
            developer: "@fameneedsme",
            queried_number: phone,
            data: parsedData
        });

    } catch (error) {
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
