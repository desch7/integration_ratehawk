const formatAttributes = (data) => {
    let formattedData = '{\n';
    for (let key in data) {
        if (Array.isArray(data[key])) {
            formattedData += `\t"${key}": [\n`;
            data[key].forEach(item => {
                formattedData += '\t\t{\n';
                for (let itemKey in item) {
                    formattedData += `\t\t\t"${itemKey}": "${item[itemKey]}",\n`;
                }
                formattedData += '\t\t},\n';
            });
            formattedData += '\t],\n';
        } else {
            formattedData += `\t"${key}": "${data[key]}",\n`;
        }
    }
    formattedData += '}\n';
    return formattedData;
}

module.exports = formatAttributes;