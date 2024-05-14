const buildJsonForImport = require('../util/json_builder')
const connection = require('../config/pg_db_connection')
const dbErrors = require('../util/extract_errors_infos_db')
const rowsUnimported = require('../util/extract_rows_unimported')
const fetchBookingPerPage = require('../fecth_data/fetch_reservation')
const saveLog = require('../database_traitement/save_log_db')




const importationOrders = (apiParam, webEvent, partnerOrderIds) => {
    const nbrMaxOrdersPerPage = 50
    let currentPage = 1
    let postParam = {
        ordering: {
            ordering_type: "asc",
            ordering_by: "checkin_at"
        },
        pagination: {
            page_size: String(nbrMaxOrdersPerPage),
            page_number: String(currentPage)
        },
        search: {
            partner_order_ids: partnerOrderIds
        }
    }

    let importJson = []

    // paramters for ratehawk api call 
    fetchBookingPerPage(postParam, apiParam).then(apiCallRes => {
        let res = apiCallRes
        if (!res.error) {
            let response = res.data
            if (response.status === 'ok') {
                // Constructio du json
                importJson = importJson.concat(buildJsonForImport(response.data.orders))
                const dataImport = JSON.stringify(importJson)
                let insertionReport = {}

                // call of the db function to begin importation
                connection.query(`select ab_ratehawk_import_item('${dataImport}', 'travel_item')`, (err, result) => {
                    // handle result of insertion or update
                    insertionReport = dbErrors(String(result.rows[0].ab_ratehawk_import_item), 'line')
                    connection.end;
                    console.log(webEvent + ' insertionReport in query execurion=> ' + JSON.stringify(insertionReport) + '\n');
                    // build list of unimported line
                    let lineUnimported = []
                    insertionReport.errorList.map((item) => {
                        lineUnimported.push(Number(item.line))
                    })
                    if (insertionReport.error) {
                        // list of unimported rows
                        let reservationsUnimported = rowsUnimported(importJson, 'line', lineUnimported)
                        // sauvegarde de l'erreur en bd dans la table api_log
                        saveLog('KO_AB', webEvent + ' select ab_ratehawk_import_item(json, travel_item)', { error: JSON.parse(JSON.stringify(insertionReport)).errorList, dataUnimported: JSON.parse(JSON.stringify(reservationsUnimported)).rows })
                            .then((res) => {
                                console.log(webEvent + ' Log successfully save =>' + res);
                            }).catch(err => {
                                console.log(webEvent + ' saveLog error => ' + err);
                            });
                    } else {
                        // sauvegarde du log de reussite en bd dans la table api_log
                        saveLog('OK_ALL', webEvent + ' select ab_ratehawk_import_item(json, travel_item)', null)
                            .then((res) => {
                                console.log(webEvent + ' Log successfully save =>' + res);
                            }).catch(err => {
                                console.log(webEvent + ' saveLog error => ' + err);
                            });
                    }
                })
            }
        } else {
            // sauvegarde de l'erreur en bd dans la table api_log
            saveLog('KO_API', 'https://api.worldota.net/api/b2b/v3/hotel/order/info/', { error: res.error })
                .then((res) => {
                    console.log(webEvent + ' Log successfully save =>' + res);
                }).catch(err => {
                    console.log(webEvent + ' saveLog error => ' + err);
                });
            return res.error
        }
    }).catch(err => {
        console.log('{ error: err.error } ' + err);
    });


}

module.exports = importationOrders

