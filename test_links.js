const axios = require('axios');
const cheerio = require('cheerio');

async function checkAllLinks(imdbId) {
    const searchUrl = `https://search.hdhub4u.glass/collections/post/documents/search?q=${imdbId}&query_by=imdb_id`;
    const searchRes = await axios.get(searchUrl);
    
    if (!searchRes.data.hits || searchRes.data.hits.length === 0) return console.log("Not found");
    const movieUrl = 'https://new1.hdhub4u.limo' + searchRes.data.hits[0].document.permalink;
    console.log("Movie URL:", movieUrl);
    
    const pageRes = await axios.get(movieUrl);
    const $ = cheerio.load(pageRes.data);
    
    console.log("--- ALL LINKS ON PAGE ---");
    $('a').each((i, el) => {
        const text = $(el).text().trim();
        const href = $(el).attr('href');
        if (text && href && href.startsWith('http')) {
            console.log(`[${text}] -> ${href}`);
        }
    });
}

checkAllLinks('tt6263850');
