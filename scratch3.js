const axios = require('axios');
(async () => {
    try {
        const url = 'https://hdstream4u.com/file/qzez8e1quukv';
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html = res.data;
        const match = html.match(/eval\(function\(p,a,c,k,e,d\).*?\)\)/);
        if (match) {
            console.log("Matched script (first 150 chars):", match[0].substring(0, 150));
            console.log("Matched script (last 150 chars):", match[0].substring(match[0].length - 150));
        } else {
            console.log("No match");
        }
    } catch (e) {
        console.error(e.message);
    }
})();
