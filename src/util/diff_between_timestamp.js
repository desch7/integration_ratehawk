const getDifferenceBetweenTimestamp = (timestamp1, timestamp2, typeResult) => {
    let difference
    // Convert timestamps to Date objects
    const date1 = new Date(timestamp1);
    const date2 = new Date(timestamp2);

    // Calculate the difference in milliseconds
    const differenceMilliseconds = Math.abs(date2 - date1);
    switch (typeResult) {
        case 'days':
            // Convert milliseconds to days
            difference = Math.floor(differenceMilliseconds / (1000 * 60 * 60 * 24));

            break;
        case 'minutes':
            // Convert milliseconds to minutes
            difference = Math.floor(differenceMilliseconds / (1000 * 60));

            break;
    }

    return difference;
}

module.exports = getDifferenceBetweenTimestamp;