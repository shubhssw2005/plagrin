require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fetch = require('node-fetch');
const FormData = require('form-data');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

app.use(cors({ origin: '*', credentials: true }));
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.get('/api/health', (req, res) => {
    res.json({ ok: true });
});

// Proxy to Sightengine for image analysis
app.post('/api/check-image', upload.single('media'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }
        const apiUser = process.env.SIGHTENGINE_API_USER;
        const apiSecret = process.env.SIGHTENGINE_API_SECRET;
    // Use only the supported Sightengine model for text moderation
    const models = 'text-content';
        if (!apiUser || !apiSecret) {
            return res.status(500).json({ error: 'Server not configured: missing Sightengine credentials' });
        }

        const form = new FormData();
        form.append('media', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype || 'application/octet-stream' });
        form.append('models', models);
        form.append('api_user', apiUser);
        form.append('api_secret', apiSecret);

        const seResp = await fetch('https://api.sightengine.com/1.0/check.json', {
            method: 'POST',
            body: form
        });
        const text = await seResp.text();
        // Try JSON first, else forward as text
        try {
            const data = JSON.parse(text);
            res.status(seResp.status).json(data);
        } catch (_) {
            res.status(seResp.status).send(text);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Sightengine proxy error' });
    }
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
    console.log(`ai-detector backend running on http://localhost:${port}`);
});


