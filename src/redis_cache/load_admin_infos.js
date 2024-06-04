const redisClient = require('../config/redis_connection')

const loadAdminInfos = async (adminInfosList) => {
    let result = ''

    await redisClient.connect()
        .then(async (res) => {
            await adminInfosList.map(async (item) => {
                await redisClient.set(item.agreementNumber, JSON.stringify(item))
            })
            await redisClient.quit();
            result = 'ok'
        })
        .catch((err) => { console.error('Redis error: ', err); })

    return result
}

module.exports = loadAdminInfos;
