const { addonBuilder } = require("stremio-addon-sdk");
const { get4KHDHubStreams } = require("./providers/4khdhub.js");

// Minimal manifest for 4KHDHub scraper
const manifest = {
    id: "org.nuvio.hdhubscraper",
    version: "1.0.0",
    name: "Nuvio HDHub Scraper",
    description: "Scrapes HLS streams from HDHub4u web players.",
    resources: ["stream"],
    types: ["movie", "series"],
    idPrefixes: ["tt"],
    catalogs: []
};

const builder = new addonBuilder(manifest);

builder.defineStreamHandler(async (args) => {
    console.log(`[Addon] Received stream request for: ${args.type} ${args.id}`);
    
    // args.id is like "tt12042730" for movies, or "tt0903747:1:1" for series
    const idParts = args.id.split(":");
    const tmdbId = idParts[0]; // Stremio sends IMDB IDs (tt...) or TMDB IDs. We'll pass it to getTmdbDetails which handles it.
    const season = idParts.length > 1 ? parseInt(idParts[1]) : null;
    const episode = idParts.length > 2 ? parseInt(idParts[2]) : null;

    try {
        const streams = await get4KHDHubStreams(tmdbId, args.type, season, episode);
        return { streams: streams || [] };
    } catch (error) {
        console.error(`[Addon] Error fetching streams: ${error.message}`);
        return { streams: [] };
    }
});

module.exports = builder.getInterface();