const express = require('express');
const cors = require('cors');
const { getRouter } = require('stremio-addon-sdk');
const addonInterface = require('./addon');

const app = express();
app.use(cors());

app.use((req, res, next) => {
    let clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (clientIp && clientIp.includes(',')) {
        clientIp = clientIp.split(',')[0].trim();
    }
    global.CLIENT_IP = clientIp;
    next();
});

// Use the standard Stremio addon router
app.use('/', getRouter(addonInterface));

const PORT = process.env.PORT || 7777;
app.listen(PORT, () => {
    console.log(`Nuvio HDHub Scraper Addon running on http://localhost:${PORT}`);
    console.log(`Manifest URL: http://localhost:${PORT}/manifest.json`);
});