const axios = require('axios');
const cheerio = require('cheerio');
(async () => {
    try {
        const url = 'https://new1.hdhub4u.limo/search.html?q=' + encodeURIComponent('Project Hail Mary');
        console.log("Fetching:", url);
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(res.data);
        const links = [];
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('project-hail')) {
                links.push(href);
            }
        });
        console.log("Links found:", links);
    } catch (e) {
        console.error(e.message);
    }
})();
