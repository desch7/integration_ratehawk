require("dotenv").config();
const getDbParamsPartner = require('./database_traitement/admin/db_partner_params')


const test = () => {
    getDbParamsPartner('B2B-215274')
        .then(res => { console.log('res => ' + JSON.stringify(res)); })
        .catch(err => { })

}

test();