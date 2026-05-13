const { get4KHDHubStreams } = require('./providers/4khdhub.js');

(async () => {
    // Get IMDb ID from command line arguments, or use a default one
    const imdbId = process.argv[2] || 'tt6263850'; // Default: Deadpool & Wolverine
    const type = process.argv[3] || 'movie';

    console.log(`Starting test for IMDb ID: ${imdbId} (${type})...`);
    
    try {
        const streams = await get4KHDHubStreams(imdbId, type);
        console.log("\n================ RESULT ================");
        console.log(JSON.stringify(streams, null, 2));
        console.log("========================================");
        
        if (streams.length > 0 && streams[0].url) {
            console.log("\n✅ SUCCESS! Copy and paste the URL below into your browser or VLC to test playback:");
            console.log(`\n    ${streams[0].url}\n`);
        } else {
            console.log("\n❌ No streams found for this movie.");
        }
    } catch (e) {
        console.error("Test failed:", e);
    }
})();
