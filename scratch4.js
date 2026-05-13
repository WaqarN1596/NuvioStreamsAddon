const axios = require('axios');
const { VM } = require('vm2');
(async () => {
    try {
        const url = 'https://hdstream4u.com/file/qzez8e1quukv';
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const html = res.data;
        
        let startIdx = html.indexOf('eval(function(p,a,c,k,e,d)');
        if (startIdx !== -1) {
            let scriptBlock = html.substring(startIdx);
            let endIdx = scriptBlock.indexOf('</script>');
            if (endIdx !== -1) {
                scriptBlock = scriptBlock.substring(0, endIdx).trim();
                
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
                
                try {
                    vm.run(scriptBlock);
                    if (capturedUnpacked) {
                        console.log("SUCCESS! Unpacked script length:", capturedUnpacked.length);
                        const m3u8Match = capturedUnpacked.match(/(https:\/\/[^"'\s]*?master\.m3u8)/);
                        if (m3u8Match) {
                            console.log("FOUND URL:", m3u8Match[1]);
                        } else {
                            console.log("No URL found in unpacked script.");
                        }
                    } else {
                        console.log("vm2 ran without error, but eval was not intercepted.");
                    }
                } catch (err) {
                    console.log("VM Error:", err.message);
                }
            }
        } else {
            console.log("No match");
        }
    } catch (e) {
        console.error(e.message);
    }
})();
