const axios = require('axios');
const { VM } = require('vm2');

async function analyzeUnpacking(fileUrl) {
    console.log("Fetching:", fileUrl);
    const res = await axios.get(fileUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });
    
    const html = res.data;
    const packedMatch = html.match(/eval\(function\(p,a,c,k,e,d\).+?\}\('(.+?)',(\d+),(\d+),'(.+?)'\.split\('\|'\)\)\)/);
    
    if (packedMatch) {
        console.log("Found packed JS.");
        const vm = new VM({
            timeout: 1000,
            sandbox: {}
        });
        
        // Override eval to capture the result
        let unpackedCode = "";
        vm.freeze(console, 'console');
        const script = `
            let result = "";
            const originalEval = eval;
            function p(p,a,c,k,e,d){e=function(c){return(c<a?'':p(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)d[e(c)]=k[c]||e(c);k=[function(e){return d[e]}];e=function(){return'\\\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\\\b'+e(c)+'\\\\b','g'),k[c]);return p};
            result = p('${packedMatch[1]}', ${packedMatch[2]}, ${packedMatch[3]}, '${packedMatch[4]}'.split('|'), 0, {});
            result;
        `;
        
        unpackedCode = vm.run(script);
        console.log("--- UNPACKED CODE ---");
        console.log(unpackedCode);
        console.log("--- END UNPACKED CODE ---");
    } else {
        console.log("No packed JS found.");
    }
}

analyzeUnpacking('https://hdstream4u.com/file/qzez8e1quukv');
