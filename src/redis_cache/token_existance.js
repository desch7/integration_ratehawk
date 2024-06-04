const redisClient = require('../config/redis_connection')

// verify : if token already exist in redis cache 
const tokenExistance = async (newToken) => {
    let cachedToken = ''
    let result = ''

    // scan if the token already exist
    const scanAllTokens = async () => {
        for await (const ke of redisClient.scanIterator()) {
            let tokenInLoop = await redisClient.get(ke);
            cachedToken = tokenInLoop === newToken ? tokenInLoop : ''
            if (cachedToken) {
                return 'ok'
            }
        }
    }

    await redisClient.connect()
        .then(async (res) => {
            let tokenExist = await scanAllTokens()
            if (tokenExist !== 'ok') {
                await redisClient.quit();
                result = 'ok'
            } else {
                await redisClient.quit();
                result = 'ko'
            }
        })
        .catch((err) => { console.error('Redis error: ', err); })

    return result
}

module.exports = tokenExistance;
