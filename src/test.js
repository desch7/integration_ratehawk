require('dotenv').config({ path: '../env/.env' });
const token_existance = require('./redis_cache/token_existance')
const http = require('http');

const server = http.createServer((req, res) => {
    let reqBody
    if (req.method === 'POST' && req.url === '/redistest') {
        // Handle potential error
        req.on('error', err => {
            console.error(err.stack);
        });

        // Accumulate the request body
        req.on('data', chunk => {
            reqBody += chunk.toString();
        });

        // Handle incoming webhook data
        req.on('end', async () => {
            let result = await token_existance('d3334025-1ee7-49a2-bd86-e4bd6b9908b2')
            console.log("🚀 ~ req.on ~ result:", result)
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.write(JSON.stringify({ data: 'ok' }));
            res.end();
        })
    }
})
server.listen(3002, () => {
    //console.log(`Server listening on port ${PORT}`);
});
