const axios = require('axios');
const cheerio = require('cheerio');

async function checkPlayer2(imdbId) {
    // 1. Search for movie
    const searchUrl = `https://search.hdhub4u.glass/collections/post/documents/search?q=${imdbId}&query_by=imdb_id`;
    const searchRes = await axios.get(searchUrl);
    
    if (!searchRes.data.hits || searchRes.data.hits.length === 0) return console.log("Not found");
    const movieUrl = searchRes.data.hits[0].document.permalink;
    console.log("Movie URL:", movieUrl);
    
    // 2. Fetch movie page
    const pageRes = await axios.get('https://new1.hdhub4u.limo' + movieUrl);
    const $ = cheerio.load(pageRes.data);
    
    const watchOnlineBtn = $('a:contains("Watch Online")').first();
    if (!watchOnlineBtn.length) return console.log("No Watch Online");
    
    const watchUrl = watchOnlineBtn.attr('href');
    console.log("Watch URL:", watchUrl);
    
    // 3. Fetch players page
    const watchRes = await axios.get(watchUrl);
    const $w = cheerio.load(watchRes.data);
    
    const player2Btn = $w('a:contains("Player 2")').first();
    if (!player2Btn.length) return console.log("No Player 2");
    
    const player2Url = player2Btn.attr('href');
    console.log("Player 2 URL:", player2Url);
    
    // 4. Fetch player 2 embed
    const embedRes = await axios.get(player2Url);
    const $e = cheerio.load(embedRes.data);
    const iframeSrc = $e('iframe').attr('src');
    
    console.log("Player 2 iframe src:", iframeSrc);
}

checkPlayer2('tt6263850');
