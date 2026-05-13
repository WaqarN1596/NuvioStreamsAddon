const { get4KHDHubStreams } = require('./providers/4khdhub.js');
(async () => {
    // Project Hail Mary: tt12042730
    console.log("Starting test...");
    const streams = await get4KHDHubStreams('tt12042730', 'movie');
    console.log("Final Streams:");
    console.log(JSON.stringify(streams, null, 2));
})();
