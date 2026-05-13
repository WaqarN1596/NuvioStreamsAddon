const express = require('express');
const cors = require('cors');
const { getRouter } = require('stremio-addon-sdk');
const addonInterface = require('./addon');

const app = express();
app.use(cors());

// Use the standard Stremio addon router
app.use('/', getRouter(addonInterface));

const PORT = process.env.PORT || 7777;
app.listen(PORT, () => {
    console.log(`Nuvio HDHub Scraper Addon running on http://localhost:${PORT}`);
    console.log(`Manifest URL: http://localhost:${PORT}/manifest.json`);
});