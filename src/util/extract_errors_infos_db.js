const dbErrors = (resultMessage) => {
    let insertionReport = { errorList: [], error: true }
    // show the number of errors during insertion
    let numberErrors = Number(resultMessage.split('Line')[0].split('Errors')[1].split('-')[0].split(':')[1].trim())
    if (numberErrors > 0) {
        let errorToLog = resultMessage.split('Line')
        // build the error object
        for (let index = 1; index < errorToLog.length; index++) {
            let errorObject = { line: '', errorMessage: '' }
            errorObject.line = errorToLog[index].split(':')[0].trim()
            errorObject.errorMessage = errorToLog[index].split(':')[1]
            insertionReport.errorList.push(errorObject);

        }
        return insertionReport
    } else {
        insertionReport.error = false;
        return insertionReport
    }

}

module.exports = dbErrors;