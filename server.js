const express = require('express');
const cors = require('cors');
const { getRouter } = require('stremio-addon-sdk');
const addonInterface = require('./addon');

const app = express();
app.use(cors());

app.use(express.json());
app.use(express.text());

app.use((req, res, next) => {
    let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (clientIp && clientIp.includes(',')) {
        clientIp = clientIp.split(',')[0].trim();
    }
    global.CLIENT_IP = clientIp;
    next();
});

// Endpoint for Roku to unpack JS
app.post('/unpack', (req, res) => {
    const code = req.body;
    if (!code) return res.status(400).send("No code provided");

    try {
        const { VM } = require('vm2');
        let unpacked = "";
        const vm = new VM({
            timeout: 1000,
            sandbox: {
                eval: (str) => { unpacked = str; return str; },
                document: { getElementById: () => ({}) },
                window: {}
            }
        });
        vm.run(code);
        res.send(unpacked);
    } catch (e) {
        res.status(500).send(e.message);
    }
});

// Use the standard Stremio addon router
app.use('/', getRouter(addonInterface));

const PORT = process.env.PORT || 7777;
app.listen(PORT, () => {
    console.log(`Nuvio HDHub Scraper Addon running on http://localhost:${PORT}`);
    console.log(`Manifest URL: http://localhost:${PORT}/manifest.json`);
});