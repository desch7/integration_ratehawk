const connection = require('../config/pg_db_connection')
const dbErrors = require('../util/extract_errors_infos_db')
const saveLog = require('../database_traitement/save_log_db')



const cancelledOrder = (orderToDelete) => {


    // call of the db function to begin importation
    connection.query(`select ab_ratehawk_delete_item('${orderToDelete}', 'travel_item')`, (err, result) => {
        // handle result of deletion
        deletionReport = dbErrors(String(result.rows[0].ab_ratehawk_delete_item), 'pnr')
        connection.end;
        console.log('deletionReport in query execution=> ' + JSON.stringify(deletionReport) + '\n');

        if (deletionReport.error) {
            // sauvegarde de l'erreur en bd dans la table api_log
            saveLog('KO_AB', 'select ab_ratehawk_delete_item(json, travel_item)', { error: JSON.parse(JSON.stringify(deletionReport)).errorList })
                .then((res) => {
                    console.log('KO_AB Deletion Log successfully save =>' + res);
                }).catch(err => {
                    console.log('KO_AB Deletion log error => ' + err);
                });
        } else {
            // sauvegarde du log de reussite en bd dans la table api_log
            saveLog('OK_ALL', 'select ab_ratehawk_delete_item(json, travel_item)', null)
                .then((res) => {
                    console.log('OK_ALL Deletion Log successfully save =>' + res);
                }).catch(err => {
                    console.log('OK_ALL Deletion log error => ' + err);
                });
        }
    })
}

module.exports = cancelledOrder;

