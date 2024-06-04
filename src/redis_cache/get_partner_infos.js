const redisClient = require('../config/redis_connection')


const getDbParamsPartner = async (agreementNumber) => {
    let result = ''

    await redisClient.connect()
        .then(async (res) => {
            let partnerInfos = await redisClient.get(agreementNumber)
            // console.log('redisClient.get(B2B - 215274) = ', partnerInfos);
            redisClient.quit();
            result = partnerInfos
        })
        .catch((err) => { console.error('Redis error: ', err); })

    return result
}

module.exports = getDbParamsPartner;
