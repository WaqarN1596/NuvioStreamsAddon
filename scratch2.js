const axios = require('axios');
const cheerio = require('cheerio');
(async () => {
    const url = 'https://new1.hdhub4u.limo/?s=' + encodeURIComponent('Project Hail Mary');
    console.log("Fetching:", url);
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(res.data);
    
    console.log("Movie cards found:", $('.movie-card').length);
    $('.movie-card').each((i, el) => {
        console.log("Card", i, ":", $(el).find('.movie-card-title').text().trim());
        console.log("Link:", $(el).attr('href'));
    });
})();
