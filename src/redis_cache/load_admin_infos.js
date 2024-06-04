const redisClient = require('../config/redis_connection')

const loadAdminInfos = async (adminInfosList) => {
    let result = ''

    await redisClient.connect()
        .then(async (res) => {
            await adminInfosList.map(async (item) => {
                await redisClient.set(item.agreementNumber, JSON.stringify(item))
            })
            result = 'ok'
            redisClient.quit();
        })
        .catch((err) => { console.error('Redis error: ', err); })

    return result
}

module.exports = loadAdminInfos;
