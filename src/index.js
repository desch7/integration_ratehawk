require("dotenv").config()
const buildJsonForImport = require('./util/json_builder')
const connection = require('./config/pg_db_connection')
const dbErrors = require('./util/extract_errors_infos_db')
const rowsUnimported = require('./util/extract_rows_unimported')
const fs = require('node:fs');
const path = require('path');
const formatAttributes = require('./util/format_data_log')
const fetchBookingPerPage = require('./fecth_data/fetch_reservation')
const getParametersApi = require('./database_traitement/api_call_parameters')
const saveLog = require('./database_traitement/save_log_db')



// mock data
const sampleImport = [{ "line": 38607586, "traveler_name": "Nj Mbia", "channel": "non_gds", "transaction_type": "sales", "adj_type": "", "adjusted_transaction": "", "issuing_date": "2024-04-25T16:05:44", "product_type": "hotel", "pnr": "338395351", "published_fare": 23.99, "penality": 0, "commission_rate": 0, "fop": "nonref", "loyalty_card": "", "id_currency": "USD", "currency_rate": 1, "selling_rate": 1, "id_agent_sign": "INTEG", "description": "", "confirmation_number": "38607586", "adj_number": "", "customer_account": "", "supplier_account": "", "billing_mode": "bill", "hotel_name": "vostok2000", "address": "", "check_in": "2024-05-10", "check_out": "2024-05-25", "room_type": "Other", "number_of_room": 2, "negotiated_fare": 21.59, "adult": 2, "children": 0, "markup": 40.78, "#": "0" }, { "line": 92428350, "traveler_name": "Yvon Test Yvon Test", "channel": "non_gds", "transaction_type": "sales", "adj_type": "", "adjusted_transaction": "", "issuing_date": "2024-04-19T09:55:41", "product_type": "hotel", "pnr": "501483792", "published_fare": 4.5, "penality": 0, "commission_rate": 0, "fop": "nonref", "loyalty_card": "", "id_currency": "USD", "currency_rate": 1, "selling_rate": 1, "id_agent_sign": "INTEG", "description": "", "confirmation_number": "92428350", "adj_number": "", "customer_account": "", "supplier_account": "", "billing_mode": "bill", "hotel_name": "test_hotel_do_not_book", "address": "", "check_in": "2024-05-27", "check_out": "2024-05-28", "room_type": "Other", "number_of_room": 1, "negotiated_fare": 4.5, "adult": 1, "children": 0, "markup": 0, "#": "0" }, { "line": 308178257, "traveler_name": "Haris Ndogmo", "channel": "non_gds", "transaction_type": "sales", "adj_type": "", "adjusted_transaction": "", "issuing_date": "2024-04-25T10:58:57", "product_type": "hotel", "pnr": "867625517", "published_fare": 6.5, "penality": 0, "commission_rate": 0, "fop": "nonref", "loyalty_card": "", "id_currency": "USD", "currency_rate": 1, "selling_rate": 1, "id_agent_sign": "INTEG", "description": "", "confirmation_number": "308178257", "adj_number": "", "customer_account": "", "supplier_account": "", "billing_mode": "bill", "hotel_name": "test_hotel_do_not_book", "address": "", "check_in": "2024-05-30", "check_out": "2024-05-31", "room_type": "Other", "number_of_room": 1, "negotiated_fare": 6.5, "adult": 2, "children": 0, "markup": 0, "#": "0" }]
const sampleImportObject = JSON.parse(JSON.stringify(sampleImport))

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
    }
}

let importJson = []
let apiParam = {}
const fecthAllBooking = () => {
    // paramters for ratehawk api call 
    getParametersApi().then((apiParamRes) => {
        apiParam = apiParamRes
        fetchBookingPerPage(postParam, apiParam).then(apiCallRes => {
            let res = apiCallRes
            if (!res.error) {
                let response = res.data
                if (response.status === 'ok') {
                    // Constructio du json
                    importJson = importJson.concat(buildJsonForImport(response.data.orders))
                    // while (response.data.total_pages > currentPage) {
                    //     currentPage++
                    //     postParam.pagination.page_number = String(currentPage)
                    //     fetchBookingPerPage(postParam, apiParam).then(apiCallRes2 => {
                    //         res = apiCallRes2
                    //         if (!res.error) {
                    //             response = res.data
                    //             if (response.status === 'ok') {
                    //                 // Constructio du json
                    //                 console.log('next building\n');
                    //                 importJson = importJson.concat(buildJsonForImport(response.data.orders))
                    //             }
                    //         } else {
                    //             saveLog('KO_API', 'https://api.worldota.net/api/b2b/v3/hotel/order/info/', { error: res.error })
                    //                 .then((res) => {
                    //                     console.log('Log successfully save =>' + res);
                    //                 }).catch(err => {
                    //                     console.log('saveLog error => ' + err);
                    //                 });
                    //             return res.error
                    //         }
                    //     }).catch(err => { })

                    // }
                    //console.log('JSON to transfer => ' + JSON.stringify(importJson) + '\n');
                    const dataImport = JSON.stringify(importJson)
                    let insertionReport = {}

                    // call of the db function to begin importation
                    connection.query(`select ab_ratehawk_import_item('${dataImport}', 'travel_item')`, (err, result) => {
                        //console.log('result => ' + JSON.stringify(result.rows));
                        //const sampleImportJson = JSON.stringify(sampleImport)
                        //connection.query(`select ab_import_item('${sampleImportJson}', 'travel_item')`, (err, result) => {
                        // handle result of insertion or update
                        insertionReport = dbErrors(String(result.rows[0].ab_ratehawk_import_item), 'line')
                        connection.end;
                        console.log('insertionReport in query execurion=> ' + JSON.stringify(insertionReport) + '\n');
                        // build list of unimported line
                        let lineUnimported = []
                        insertionReport.errorList.map((item) => {
                            lineUnimported.push(Number(item.line))
                        })
                        if (insertionReport.error) {
                            // list of unimported rows
                            let reservationsUnimported = rowsUnimported(importJson, 'line', lineUnimported)
                            // sauvegarde de l'erreur en bd dans la table api_log
                            saveLog('KO_AB', 'select ab_ratehawk_import_item(json, travel_item)', { error: JSON.parse(JSON.stringify(insertionReport)).errorList, dataUnimported: JSON.parse(JSON.stringify(reservationsUnimported)).rows })
                                .then((res) => {
                                    console.log('Log successfully save =>' + res);
                                }).catch(err => {
                                    console.log('saveLog error => ' + err);
                                });
                            //let reservationsUnimported = rowsUnimported(sampleImportObject, 'line', lineUnimported)
                            console.log('unimported rows=> ' + JSON.stringify(reservationsUnimported) + '\n');
                            // write in log file
                            // let insertionReportForamtted = formatAttributes(JSON.parse(JSON.stringify(insertionReport)))
                            // let reservationsUnimportedForamtted = formatAttributes(JSON.parse(JSON.stringify(reservationsUnimported)))
                            // const contentLog = '############### LOG FOR UNIMPORTED ROWS ###############\n\n\n\n' + 'List of error \n' + insertionReportForamtted + '\n' + 'List of rows unimported \n' + reservationsUnimportedForamtted + '\n';
                            // const d = new Date();
                            // let year = d.getFullYear();
                            // let month = d.getMonth() + 1;
                            // let day = d.getDate();
                            // let hour = d.getHours();
                            // let minute = d.getMinutes();
                            // let second = d.getSeconds();
                            // let millisecond = d.getMilliseconds();
                            // let directoryFile = path.join(__dirname, 'logs', 'unimported_rows_' + year + '_' + month + '_' + day + '_' + hour + '_' + minute + '_' + second + '_' + millisecond + '.txt');
                            // fs.appendFile(directoryFile, contentLog, err => {
                            //     if (err) {
                            //         console.error('error during creating file=> ' + err);
                            //     } else {
                            //         console.error('file written successfully');
                            //     }
                            // });
                        } else {
                            // sauvegarde du log de reussite en bd dans la table api_log
                            saveLog('OK_ALL', 'select ab_ratehawk_import_item(json, travel_item)', null)
                                .then((res) => {
                                    console.log('Log successfully save =>' + res);
                                }).catch(err => {
                                    console.log('saveLog error => ' + err);
                                });
                        }
                    })
                }
            } else {
                // sauvegarde de l'erreur en bd dans la table api_log
                saveLog('KO_API', 'https://api.worldota.net/api/b2b/v3/hotel/order/info/', { error: res.error })
                    .then((res) => {
                        console.log('Log successfully save =>' + res);
                    }).catch(err => {
                        console.log('saveLog error => ' + err);
                    });
                return res.error
            }
        }).catch(err => {
            console.log('{ error: err.error } ' + err);
        });
    }).catch((error) => {
        console.log(' error connection db ' + error.db_connectionErr);
    })

}

// Launch importation
fecthAllBooking()

