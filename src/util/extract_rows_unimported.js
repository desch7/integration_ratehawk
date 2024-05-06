const rowsUnimported = (importedObject, searchField, searchValueList) => {
    let reservationsUnimported = { rows: [] }
    reservationsUnimported.rows = importedObject.filter((item) => {
        return searchValueList.includes(item[searchField])
    })

    return reservationsUnimported
}

module.exports = rowsUnimported