const axios = require('axios');
const cheerio = require('cheerio');
const levenshtein = require('fast-levenshtein');

const BASE_URL = 'https://new1.hdhub4u.limo';

// Helper to fetch text content
async function fetchText(url, options = {}) {
    try {
        console.log(`[4KHDHub] Fetching: ${url}`);
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            ...options.headers
        };
        if (global.CLIENT_IP) {
            headers['X-Forwarded-For'] = global.CLIENT_IP;
        }
        
        const response = await axios.get(url, {
            headers: headers,
            timeout: 15000
        });
        return response.data;
    } catch (error) {
        console.error(`[4KHDHub] Request failed for ${url}: ${error.message}`);
        return null;
    }
}

// Fetch meta from Cinemeta
async function getCinemetaDetails(imdbId, type) {
    try {
        const url = `https://v3-cinemeta.strem.io/meta/${type}/${imdbId}.json`;
        console.log(`[4KHDHub] Fetching Cinemeta details from: ${url}`);
        const response = await axios.get(url);
        if (response.data && response.data.meta) {
            const meta = response.data.meta;
            return {
                title: meta.name,
                year: meta.year ? parseInt(meta.year.split('-')[0]) : parseInt(meta.releaseInfo)
            };
        }
    } catch (error) {
        console.error(`[4KHDHub] Cinemeta request failed: ${error.message}`);
    }
    return null;
}

// FourKHDHub Logic
async function fetchPageUrl(name, year, isSeries) {
    try {
        const searchUrl = `https://search.hdhub4u.glass/collections/post/documents/search?q=${encodeURIComponent(name)}&query_by=post_title,imdb_id&sort_by=sort_by_date:desc&limit=15`;
        console.log(`[4KHDHub] Searching via API: ${searchUrl}`);
        
        const headers = {
            'User-Agent': 'Mozilla/5.0',
            'Origin': 'https://new1.hdhub4u.limo',
            'Referer': 'https://new1.hdhub4u.limo/'
        };
        if (global.CLIENT_IP) {
            headers['X-Forwarded-For'] = global.CLIENT_IP;
        }

        const response = await axios.get(searchUrl, {
            headers: headers,
            timeout: 10000
        });

        if (response.data && response.data.hits && response.data.hits.length > 0) {
            for (const hit of response.data.hits) {
                const doc = hit.document;
                if (!doc) continue;
                
                // Match year if possible
                const docTitle = doc.post_title || '';
                const hasYear = docTitle.includes(year.toString()) || docTitle.includes((year-1).toString()) || docTitle.includes((year+1).toString());
                
                // Check if series/movie match (rudimentary via category)
                const isDocSeries = doc.category && (doc.category.includes('Web Series') || doc.category.includes('Series'));
                if (isSeries && !isDocSeries && doc.category) continue;
                
                if (hasYear) {
                    let permalink = doc.permalink;
                    if (permalink && !permalink.startsWith('http')) {
                        permalink = BASE_URL + (permalink.startsWith('/') ? '' : '/') + permalink;
                    }
                    return permalink;
                }
            }
            
            // Fallback to first hit if year strict match fails
            let permalink = response.data.hits[0].document.permalink;
            if (permalink && !permalink.startsWith('http')) {
                permalink = BASE_URL + (permalink.startsWith('/') ? '' : '/') + permalink;
            }
            return permalink;
        }
    } catch (e) {
        console.error(`[4KHDHub] API Search failed: ${e.message}`);
    }
    return null;
}

async function get4KHDHubStreams(imdbId, type, season = null, episode = null) {
    const details = await getCinemetaDetails(imdbId, type);
    if (!details) return [];

    const { title, year } = details;
    console.log(`[4KHDHub] Search: ${title} (${year})`);

    const isSeries = type === 'series' || type === 'tv';
    const pageUrl = await fetchPageUrl(title, year, isSeries);
    if (!pageUrl) {
        console.log(`[4KHDHub] Page not found`);
        return [];
    }
    console.log(`[4KHDHub] Found page: ${pageUrl}`);

    const html = await fetchText(pageUrl);
    if (!html) return [];
    
    // We are looking for the Player 1 link, which points to hdstream4u.com
    const $ = cheerio.load(html);
    let player1Url = null;
    
    $('a').each((_i, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('hdstream4u.com/file/')) {
            player1Url = href;
        }
    });

    if (!player1Url) {
        console.log(`[4KHDHub] Player 1 link not found on page.`);
        return [];
    }

    console.log(`[4KHDHub] Found Player 1 link: ${player1Url}`);

    // Fetch Player 1 page
    const playerHtml = await fetchText(player1Url, { headers: { Referer: pageUrl } });
    if (!playerHtml) return [];

    // The player HTML has obfuscated JS. E.g., eval(function(p,a,c,k,e,d)...
    let masterM3u8Url = null;
    let startIdx = playerHtml.indexOf('eval(function(p,a,c,k,e,d)');

    if (startIdx !== -1) {
        let scriptBlock = playerHtml.substring(startIdx);
        let endIdx = scriptBlock.indexOf('</script>');
        if (endIdx !== -1) {
            scriptBlock = scriptBlock.substring(0, endIdx).trim();
            
            try {
                console.log(`[4KHDHub] Found packed JS, attempting to unpack using vm2...`);
                const { VM } = require('vm2');
                
                // Override eval to capture the unpacked string instead of executing it
                let capturedUnpacked = null;
                const vm = new VM({
                    sandbox: {
                        eval: (str) => {
                            capturedUnpacked = str;
                            return str;
                        },
                        document: { getElementById: () => ({}) },
                        window: {}
                    }
                });
                
                // Execute the eval function in sandbox
                vm.run(scriptBlock);
                
                if (capturedUnpacked) {
                    console.log(`[4KHDHub] Successfully unpacked JS.`);
                    // Find the master.m3u8 URL in the unpacked string
                    const m3u8Match = capturedUnpacked.match(/(https:\/\/[^"'\s]*?master\.m3u8)/);
                    if (m3u8Match) {
                        masterM3u8Url = m3u8Match[1];
                    } else {
                        console.log(`[4KHDHub] master.m3u8 not found in unpacked JS.`);
                    }
                } else {
                    console.log(`[4KHDHub] vm2 failed to capture unpacked JS.`);
                }
            } catch (e) {
                console.error(`[4KHDHub] Failed to unpack JS: ${e.message}`);
            }
        }
    } else {
        // Try direct match if not packed
        const directMatch = playerHtml.match(/(https:\/\/[^"'\s]*?master\.m3u8)/);
        if (directMatch) {
            masterM3u8Url = directMatch[1];
        }
    }

    if (!masterM3u8Url) {
        console.log(`[4KHDHub] Could not extract master.m3u8 URL.`);
        return [];
    }

    console.log(`[4KHDHub] Success! Extracted URL: ${masterM3u8Url}`);

    const streams = [];
    streams.push({
        name: `4KHDHub\nPlayer 1`,
        title: `Player 1 (HLS/AAC)\n${title} (${year})`,
        url: masterM3u8Url,
        behaviorHints: {
            bingeGroup: `4khdhub-player1`,
            notWebReady: true // It's HLS, Stremio Web handles it, Roku Video node handles it natively!
        }
    });

    return streams;
}

module.exports = { get4KHDHubStreams };